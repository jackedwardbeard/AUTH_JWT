require('dotenv').config();

const mongoose = require('mongoose'); // for db operations
const User = require('./user') // db schema for a user
const express = require('express'); // creates our server
const jwt = require('jsonwebtoken'); // lets us use JWT's
const cors = require('cors'); // cross-origin resource sharing
const bcrypt = require('bcryptjs'); // hashing/salting passwords
const { sendConfirmationEmail, sendPasswordResetEmail } = require('./sendEmail'); // different templates for sending emails

// initialise server
const app = express();

// lets us get json data from req.body
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

// sets up cross origin resource sharing
app.use(cors({
    origin: process.env.CLIENT_URL, // allows CORS from 'origin' - change to '*' to allow access from anywhere
    credentials: true
}))

// takes an incoming accessToken and determines if it's valid (i.e. hasn't expired)
const verifyToken = (req, res, next) => {

    // the accessToken is stored in the auth header of the incoming request
    const authHeader = req.headers.authorization;

    // if this header exists in the incoming request
    if (authHeader) {
      const accessToken = authHeader.split(' ')[1];
  
      // gets the user who owns the token by 'decoding' the token with the same secret used to 'encode' it
      jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
        
        // accessToken is no longer valid
        if (err) {
            console.log('got here')
            return res.status(403).json('Token is not valid!');
        }
  
        // if a user is returned, we 'decoded' the incoming accessToken and got the user behind it
        // so we add this user information to the incoming request data (since this is a middleware function, we pass req to the actual route once complete)
        req.user = user;
        next();
      });
    } 
    
    // accessToken doesn't exist - user isn't logged in
    else {
        res.status(401).json('You are not authenticated!');
    }
};

// creates a new accessToken, signed with the uuid of the user
const generateAccessToken = (user) => {

    const payload = {
        _id: user._id,
    }

    const expiresIn = {
        expiresIn: '30s'
    }

    // signed/'encoded' with our JWT_SECRET - gives us expiresIn before accessToken expires
    // otherwise a new accessToken + refreshToken will need to be obtained through the /refresh endpoint
    return jwt.sign(payload, process.env.JWT_SECRET, expiresIn);
};

// generate access token for password reset email
const generateAccessTokenEmail = (userIDpayload) => {

    const expiresIn = {
        expiresIn: '60s'
    }

    // generateAccessTokenEmail is only called if there's an account linked to the email requested for password reset, so we just need to create an access token for the id linked to that email
    return jwt.sign(userIDpayload, process.env.JWT_SECRET, expiresIn);
    
};

// creates a new refreshToken, signed with the uuid of the user
const generateRefreshToken = (user) => {

    const payload = {
        _id: user._id,
    }

    // signed/'encoded' with our JWT_REFRESH_SECRET - we don't set expiries on refresh tokens, since we want to manage them ourselves
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET);
};

// maintains a list of all active refreshTokens (e.g, potentially multiple users)
// in production, we'd store these in a database, since it'll reset here everytime we restart the server
let refreshTokens = [];

// used to get a new accessToken and refreshToken if a user's accessToken expires
app.post('/refresh', (req, res) => {

    
  // take the refresh token from the user
  const refreshToken = req.body.token;
  console.log('got incoming refreshToken:', refreshToken);
  console.log('list of current valid refreshTokens:', refreshTokens)

  // if no refreshToken, they're not logged in
  if (!refreshToken) {
      return res.status(401).json('You are not authenticated!');
  }

  // if the refresh token they've provided isn't in our server-maintained list, it's not valid
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json('Refresh token is not valid!');
  }

  // otherwise, it is a valid refreshToken
  // so we verify the refreshToken
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    
    if (err) {
        return res.status(403).json('Refresh token is invalid.')
    };

    // if we get here, the refreshToken is still valid
    // create a new accessToken for the requesting user
    const newAccessToken = generateAccessToken(user);

    // send the new accessToken to the client
    res.status(200).json({
      accessToken: newAccessToken
    });
  });

});

app.post('/register', (req, res) => {

    // check if a user with the given email already exists
    User.findOne({ email: req.body.email }, async(err, returnedUser) => {

        if (err) {
            res.status(400).refreshTokenssend(err);
        };

        // if user already exists, don't register
        if (returnedUser) {
            res.status(400).send('A user already exists with that email!');
        }

        // if user doesn't exist, register a new user
        if (!returnedUser) {
            const pword = req.body.password;
            const pwordConfirm = req.body.confirmPassword;
            // encrypt the password the user gives, so it is not stored as plaintext in the DB
            const hashedPword = await bcrypt.hash(req.body.password, 10);

            // if passwords in the register form match and there is no existing email in the DB, create a new user
            if (pword === pwordConfirm) {
                const newUser = new User({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    password: hashedPword,
                    confirmedEmail: false
                });

                // save new user into DB
                const savedNewUser = await newUser.save();

                // send confirmation email
                sendConfirmationEmail(req.body.email, savedNewUser._id);

                res.status(200).send('Registered into DB successfully!');
            }
            
            else {
                res.status(400).send('Passwords mismatch! Could not register.')
            }
        }
    });
})

app.post('/login', (req, res) => {

    const incomingEmail = req.body.email;
    const incomingPassword = req.body.password;

    User.findOne({ email: incomingEmail }, async(err, returnedUser) => { 

        if (err) {
            console.log(err);
            return [returnedUser, match];
        }

        if (returnedUser) {
        
            // get returned user object and password match (true/false)
            const user = returnedUser;
            const match = await bcrypt.compare(incomingPassword, user.password);

            // if password is correct
            if (match === true) {

                // generate a new JWT and a JWT_Refresh token on login
                const accessToken = generateAccessToken(user);
                const refreshToken = generateRefreshToken(user);

                // push refresh token to refreshToken list (for us to maintain)
                refreshTokens.push(refreshToken);
                console.log('valid refresh tokens after login:', refreshTokens);

                // auth success - send the authenticated user's object
                res.status(200).json({
                userid: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                confirmedEmail: user.confirmedEmail,
                accessToken: accessToken,
                refreshToken: refreshToken,
                })
            }

            // password incorrect
            else {
                res.status(400).send('Invalid email or password.');
            }
            
        }
        
        // email incorrect
        else {
            res.status(400).send('Invalid email or password.');
        }
    });
    
});

// parameters are (route, middleware, callback)
// including our 'verifyToken' function (or any function for that matter) as a route's middleware means that the
// middleware function will run with access to (req, res) before we actually get to the third (req, res)/callback
// this is perfect for authorising certain routes - in this case we pass in a middleware function that verifies the token
// coming in 'req', and only allows the route to complete if the token is valid/not expired
app.post('/logout', verifyToken, (req, res) => {
    
    const refreshToken = req.body.token;

    // remove incoming refreshToken from our server-maintained list of refreshTokens on logout
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    
    console.log('valid refresh tokens after logout:', refreshTokens)
    res.status(200).send('You logged out successfully.');
});

// once the button for email confirmation is clicked, update the DB to mark the user's email as confirmed
// accepts a userid
// e.g. data = {
//      'userid': userid
//    }
app.post('/confirmEmail', (req, res) => {

    const userID = req.body.userid;

    console.log('got incoming id:', req.body);

    // if email hasn't been confirmed
    User.findById(userID, (err, result) => {

        if (err) {
            res.status(400).send(err);
        }

        else {
            
            if (result) {
                // bool that says whether found user has confirmed their email or not
                const confirmedEmail = result.confirmedEmail;

                // only update if email isn't already confirmed
                if (confirmedEmail === false) {

                    User.findByIdAndUpdate(
                        { _id: userID },
                        { confirmedEmail: true },
                        (err, returnedUser) => {

                        // some other error occurred
                        if (err) {
                            console.log(err);
                            res.status(400).send(err);
                        } 
                        // if the user hasn't confirmed their email
                        else {
                            console.log(returnedUser);
                            res.status(200).send('Email successfully confirmed!');
                        }

                        }
                    );
                }
            
                // if it has been confirmed already
                else {
                    res.status(400).send('Email already confirmed!');
                }
            }
            
            // no result, no user found
            else {
                res.status(400).send('No user found with that ID.')
            }  
        }
    });  
})

// accepts an email
// e.g. data = {
//      'email': email 
//   }
app.post('/sendResetEmail', (req, res) => {
    
    const email = req.body.email;

    // look for an existing user with the email input from the send reset email page
    User.find({email: email}, (err, returnedUser) => {
        
        if (err) {
            res.status(400).send('An error occured.');
        }

        else {

            // if user was found
            if (returnedUser && returnedUser.length > 0) {

                // id only, e.g. 68384242223
                const userID = returnedUser[0]._id;

                // of form { _id: 68384242223 }, to create an access token linked to this id
                const userIDpayload = { _id: returnedUser[0]._id };

                // create access token which expires in 60 seconds
                const newAccessToken = generateAccessTokenEmail(userIDpayload);
                console.log('generated an access token to attach to this password reset email that will last 60 second until it expires!');
        
                // send a password reset email with the new 60 second access token as the URL parameter (this email will expire/not work when the access token attached to it expires)
                sendPasswordResetEmail(email, newAccessToken, userID);
                
                res.status(200).send('An email containing instructions on how to reset your password has been sent.');
            }

            else {
                // if no user was found
                res.status(400).send('No account was found linked to that email.');
            }   
        }
    })
});

// accepts a userID and a new password
// e.g. data = {
//    'userid': userid,
//    'newPassword': newPassword
//    }
app.post('/passwordChange', async(req, res) => {
    
    const accessToken = req.body.token;
    const userID = req.body.userid;
    // hash and salt new password with bcrypt
    const newPasswordHashed = await bcrypt.hash(req.body.newPassword, 10);

    // only attempt to reset password if the attached access token is valid (so password reset links expire alongside the access token)
    const validAccessToken = jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {

        if (err) {
            return false;
        }

        else {
            return true;
        }
    })

    if (validAccessToken === true) {
        // find user associated with userid, update password
        User.findOneAndUpdate({_id: userID}, {$set: {password: newPasswordHashed}}, (err, returnedUser) => {

            if (err) {
                console.status(400).log('An error occurred.');
            }
        
            else {
            
                // if user found
                if (returnedUser) {
                    res.status(200).send('Password successfully updated!');
                }

                // no user could be found with the given req userID
                else {
                    res.status(404).send('Invalid userID provided.');
                }
            }
            
        });
    } 

    // attached access token is invalid, therefore this password reset link is also invalid
    else {
        res.status(400).send('This link has expired!');
    }

});

// make the server listen to a specific port (5000 in this case)
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(5000, () => console.log('Server Running on Port 5000, Connected to DB')))
  .catch((error) => console.log(`${error} did not connect`));

// lets us use certain 'deprecated' mongoose operations
mongoose.set('useFindAndModify', false);
