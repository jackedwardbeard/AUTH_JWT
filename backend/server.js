require('dotenv').config(); // enables .env files

const mongoose = require('mongoose'); // for db operations
const User = require('./user') // db schema for a user
const express = require('express'); // creates our server
const jwt = require('jsonwebtoken'); // lets us use JWT's
const cors = require('cors'); // cross-origin resource sharing
const bcrypt = require('bcryptjs'); // hashing/salting passwords
const cookieParser = require('cookie-parser'); // lets our server use httpOnly cookies (res.cookie)
const { sendConfirmationEmail, sendPasswordResetEmail } = require('./sendEmail'); // different templates for sending emails

// initialise server
const app = express();

// lets us get json data from req.body - middleware (i.e. gets access to (req, res) before the route does). app.use means its applied to all routes
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

// sets up cross origin resource sharing - middleware (i.e. gets access to (req, res) before the route does). app.use means its applied to all routes
app.use(cors({
    origin: process.env.CLIENT_URL, // allows CORS from 'origin' - change to '*' to allow access from anywhere
    credentials: true,
    allowedHeaders: ['Authorization', 'content-type'] // allows 'Authorization' headers (allowing access tokens to be sent to server), and content-type (type of data to be sent to server when it's a request header, otherwise, type of data to be sent to the client in a response header)
}))

// lets us easily access incoming cookies from the client (found in headers->cookie) through req.cookies - middleware (i.e. gets access to (req, res) before the route does). app.use means its applied to all routes
app.use(cookieParser());

// maintains a list of all active refreshTokens (e.g, potentially multiple users)
// in production, we'd store these in a database, since it'll reset here everytime we restart the server
let refreshTokens = [];

// takes an incoming token and determines if it's valid (i.e. hasn't expired if access, hasn't been removed if refresh)
const verifyToken = (req, res, next) => {

    // the accessToken is stored in the auth header of the incoming request
    const authHeader = req.headers.authorization;
    console.log('Incoming headers to verifyToken:', req.headers)
    // if this header exists in the incoming request
    if (authHeader) {
      const accessToken = authHeader.split(' ')[1];
      // gets the user who owns the token by 'decoding' the token with the same secret used to 'encode' it
      jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, user) => {
        // accessToken is no longer valid
        if (err) {
            return res.status(403).json('Access token is not valid!');
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
        expiresIn: process.env.JWT_ACCESS_EXPIRY
    }
    // signed/'encoded' with our JWT_ACCESS_SECRET - gives us expiresIn before accessToken expires
    // otherwise a new accessToken + refreshToken will need to be obtained through the /refresh endpoint
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, expiresIn);

};

// generate access token for making password reset and email confirmation emails expire along with the token
const generateAccessTokenEmail = (userIDpayload) => {

    const expiresIn = {
        expiresIn: process.env.JWT_EMAIL_ACCESS_EXPIRY
    }
    // generateAccessTokenEmail is only called if there's an account linked to the email requested for password reset, so we just need to create an access token for the id linked to that email
    return jwt.sign(userIDpayload, process.env.JWT_ACCESS_SECRET, expiresIn);

};

// creates a new refreshToken, signed with the uuid of the user
const generateRefreshToken = (user) => {

    const payload = {
        _id: user._id,
    }
    // signed/'encoded' with our JWT_REFRESH_SECRET - we don't set expiries on refresh tokens, since we want to manage them ourselves
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET);

};

// used to get a new accessToken and refreshToken if a user's accessToken expires
// a /refreshEnabled endpoint will be able to read our refreshToken cookie, no other endpoints can
app.get('/refreshEnabled/refresh', (req, res) => {

    // get the refresh token from the request's cookie header (cookie-parser lets us easily access the header through req.cookies)
    const incomingCookies = req.cookies;
    const refreshToken = incomingCookies.refreshToken;
    console.log('Got incoming refreshToken:', refreshToken);
    console.log('List of current valid refreshTokens:', refreshTokens)
    // if no refreshToken, they're not logged in
    if (!refreshToken) {
        return res.status(401).json('You are not authenticated!');
    }
    // if the refresh token they've provided isn't in our server-maintained list, it's not valid
    if (!refreshTokens.includes(refreshToken)) {
        return res.status(403).json('Refresh token is not valid!');
    }
    // otherwise, it is a valid refreshToken
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
        if (err) {
            // valid, but expired
            return res.status(403).json('Refresh token is invalid.')
        };
        // if we get here, the refreshToken is still valid, and not expired
        // create a new accessToken for the requesting user
        const newAccessToken = generateAccessToken(user);
        // send the new accessToken to the client
        res.status(200).json({
            accessToken: newAccessToken
        });
    });

});


// accepts a first name, last name, email, password and confirmed password - registers the given details into the DB, if the email isn't taken
// e.g. data = {
//          'firstName': example,
//          'lastName': example,
//          'email': example,
//          'password': example,
//          'confirmPassword': example
//          }
app.post('/register', (req, res) => {

    const incomingEmail = req.body.email;
    // check if a user with the given email already exists
    User.findOne({ email: incomingEmail }, async(err, returnedUser) => {
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
                    email: incomingEmail,
                    password: hashedPword,
                    confirmedEmail: false
                });
                // save new user into DB
                const savedNewUser = await newUser.save();
                // id only, e.g. 68384242223
                const userID = savedNewUser._id;
                // of form { _id: 68384242223 }, to create an access token linked to this id
                const userIDpayload = { _id: savedNewUser._id };
                // create access token which expires in JWT_EMAIL_ACCESS_EXPIRY seconds
                const newEmailAccessToken = generateAccessTokenEmail(userIDpayload);
                console.log('Generated an access token to attach to this email confirmation email that will last X seconds until it expires!');
                // send confirmation email
                sendConfirmationEmail(incomingEmail, newEmailAccessToken, userID);
                res.status(200).send('Registered into DB successfully! You have JWT_EMAIL_ACCESS_EXPIRY time to confirm your account before the confirmation link expires. If you take longer, your account will be deleted upon trying to confirm it, and you will need to register again.');
            }
            else {
                res.status(400).send('Passwords mismatch! Could not register.')
            }
        }
    });

})

// accepts an email and a password - logs the user in & sends them their user details + access token, and a cookie containing a refresh token
// e.g. data = {
//    'email': 'email@example.com',
//    'password': example
//     }
app.post('/login', (req, res) => {

    const incomingEmail = req.body.email;
    const incomingPassword = req.body.password;
    console.log('Got incoming headers to login:', req.headers)
    User.findOne({ email: incomingEmail }, async(err, returnedUser) => { 
        if (err) {
            console.log(err);
            return [returnedUser, match];
        }
        // only allow login if the email for the given account is confirmed (to prevent imposters)
        if (returnedUser) {
            // get returned user object and password match (true/false)
            const user = returnedUser;
            const match = await bcrypt.compare(incomingPassword, user.password);
            // if password is correct, check to see if their email is already confirmed or not
            if (match === true) {
                // if user is confirmed, allow login
                if (returnedUser.confirmedEmail === true) {
                    // generate a new JWT and a JWT_Refresh token on login
                    const accessToken = generateAccessToken(user);
                    const refreshToken = generateRefreshToken(user);
                    // push refresh token to refreshToken list (for us to maintain)
                    refreshTokens.push(refreshToken);
                    console.log('Valid refresh tokens after login:', refreshTokens);
                    // auth success
                    res.status(200)
                    .cookie('refreshToken', refreshToken, { // send our refresh token as an httpOnly cookie
                        httpOnly: true, // means javascript can't access the cookie (i.e., our refresh token will be safe from XSS attacks)
                        overwrite: true, // overwrites any previous cookie with the same name
                        path: '/refreshEnabled', // ensures cookies containing the refresh token are only ever allowed to be sent to routes beginning with /refreshEnabled
                        secure: process.env.NODE_ENV !== 'development' // use httpOnly in production
                    })
                    .send({ // send our user details and access token as JSON (to store in the browser's localStorage)
                        userid: user._id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        confirmedEmail: user.confirmedEmail,
                        accessToken: accessToken,
                        })
                }
                // if user is unconfirmed, send another confirmation email
                else {
                    // id only, e.g. 68384242223
                    const userID = user._id;
                    // of form { _id: 68384242223 }, to create an access token linked to this id
                    const userIDpayload = { _id: user._id };
                    // create access token which expires in JWT_EMAIL_ACCESS_EXPIRY seconds
                    const newEmailAccessToken = generateAccessTokenEmail(userIDpayload);
                    console.log('Generated an access token to attach to this email confirmation email that will last X seconds until it expires!');
                    // send confirmation email
                    sendConfirmationEmail(incomingEmail, newEmailAccessToken, userID);
                    res.status(400).send('Your email is unconfirmed. Please check your inbox for a new confirmation email.');
                }
                
            }
            // email correct, password incorrect
            else {
                res.status(400).send('Your password is incorrect.');
            } 
        }
        // email not registered
        else if (!returnedUser) {
            res.status(400).send('Your email is incorrect.');
        }
    });

});

// a /refreshEnabled endpoint will be able to read our refreshToken cookie, no other endpoints can
app.get('/refreshEnabled/logout', (req, res) => {
    
    // extract the user's refresh token from the incoming cookie header
    const incomingCookies = req.cookies;
    const refreshToken = incomingCookies.refreshToken;
    // remove incoming refreshToken from our server-maintained list of refreshTokens on logout
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    console.log('Valid refresh tokens after logout:', refreshTokens)
    res.status(200).send('You logged out successfully.');

});

// accepts a userid and an access token (to determine if the link is valid anymore) - marks a user's confirmedEmail field as 'true'
// e.g. data = {
//      'userid': userid,
//      'token': accessToken
//    }
app.post('/confirmEmail', (req, res) => {

    const incomingUserID = req.body.userid;
    const incomingAccessToken = req.body.token;
    const validAccessToken = jwt.verify(incomingAccessToken, process.env.JWT_ACCESS_SECRET, (err, user) => {
        if (err) {
            return false; // access token not valid/has expired, so link is not valid
        }
        else {
            return true; // access token is valid/has not expired, so link is valid
        }
    })
    console.log('Got incoming ID for email confirmation:', req.body);
    // find user with incomingID
    User.findById(incomingUserID, (err, result) => {
        if (err) {
            res.status(400).send(err);
        }
        else {
            if (result) {
                // if access token is still valid, link is valid, confirm their email
                if (validAccessToken === true) {
                    const confirmedEmail = result.confirmedEmail;
                    // only update if email isn't already confirmed
                    if (confirmedEmail === false ) {
                        User.findByIdAndUpdate(
                            { _id: incomingUserID },
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
                // if access token is not valid (link has expired) and email is not confirmed yet, delete this unconfirmed account from DB (to stop imposters signing up and guessing confirmation links of random emails)
                else if (validAccessToken === false) {
                    const confirmedEmail = result.confirmedEmail;
                    // if email isn't confirmed, and access token has expired, delete the existing unconfirmed account
                    if (confirmedEmail === false ) {
                        User.findOneAndDelete(
                            { _id: incomingUserID },
                            (err, returnedUser) => {
                            // some other error occurred
                            if (err) {
                                console.log(err);
                                res.status(400).send(err);
                            } 
                            // if the user hasn't confirmed their email
                            else {
                                console.log(returnedUser);
                                res.status(400).send('Link has expired and account is unconfirmed, deleting the account for security purposes... If this is your email, you can register again. Just make sure to confirm your email before the link expires!');
                            }
                            }
                        );
                    }
                    // if it has been confirmed already and the link is invalid, it's all good, just tell them they've already confirmed their email
                    else {
                        res.status(400).send('Email already confirmed!');
                    }
                }
                
            }
            // no result, no user found
            else {
                res.status(400).send('No user found with that ID.')
            }  
        }
    });  

})

// accepts an email - sends a password reset email
// e.g. data = {
//      'email': email 
//   }
app.post('/sendPasswordResetEmail', (req, res) => {
    
    const incomingEmail = req.body.email;
    // look for an existing user with this email
    User.findOne({email: incomingEmail}, (err, returnedUser) => {
        if (err) {
            res.status(400).send('An error occured.');
        }
        else {
            // if user was found
            if (returnedUser) {
                // id only, e.g. 68384242223
                const userID = returnedUser._id;
                // of form { _id: 68384242223 }, to create an access token linked to this id
                const userIDpayload = { _id: returnedUser._id };
                // create access token which expires in JWT_EMAIL_ACCESS_EXPIRY seconds
                const newEmailAccessToken = generateAccessTokenEmail(userIDpayload);
                console.log('Generated an access token to attach to this password reset email that will last X seconds until it expires!');
                // send a password reset email with the new JWT_EMAIL_ACCESS_EXPIRY access token as the URL parameter (this email will expire/not work when the access token attached to it expires)
                sendPasswordResetEmail(incomingEmail, newEmailAccessToken, userID);
                res.status(200).send('An email containing instructions on how to reset your password has been sent.');
            }
            // if no user was found
            else {
                res.status(400).send('No account was found linked to that email.');
            }   
        }
    })

});

// accepts a userID and a new password - changes the password of that user
// e.g. data = {
//    'userid': userid,
//    'newPassword': newPassword
//    }
app.post('/passwordReset', async(req, res) => {
    
    const accessToken = req.body.token;
    const userID = req.body.userid;
    // hash and salt new password with bcrypt
    const newPasswordHashed = await bcrypt.hash(req.body.newPassword, 10);
    // only attempt to reset password if the attached access token is valid (so password reset links expire alongside the access token)
    const validAccessToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, user) => {
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

// an example route that is protected - i.e, middleware 'verifyToken' checks the incoming (req), which has the access token
// if this token is valid, access to the route is given. If not, an error is returned and the route cannot be accessed until the token is refreshed
app.get('/protected', verifyToken, (req, res) => {

    res.send('Your access token is valid. Hence, you can access this resource. The user requesting this was:' + JSON.stringify(req.user) + '.'); 

})

// an example of an unprotected route - i.e, no middleware function - no access token required
app.get('/unprotected', (req, res) => {

    res.send('This is an unprotected resource.'); 

})

// make the server listen to a specific port (5000 in this case)
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(5000, () => console.log('Server Running on Port 5000, Connected to DB.')))
  .catch((error) => console.log(`${error} - did not connect.`));

// lets us use certain 'deprecated' mongoose operations (e.g, findOneAndModify)
mongoose.set('useFindAndModify', false);
