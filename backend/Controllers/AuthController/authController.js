const User = require('../../user') // db schema for a user
const bcrypt = require('bcryptjs'); // hashing/salting passwords
const jwt = require('jsonwebtoken'); // lets us use JWT's
const { generateAccessToken, generateAccessTokenEmail, generateRefreshToken } = require('../../Utils/Tokens/tokens');
const { sendConfirmationEmail } = require('../../Utils/Emails/sendEmail'); // different templates for sending emails

const handleRegister = async(req, res) => {

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

};

// refreshTokens parameter is the array from the main server which holds all valid refreshTokens
const handleLogin = (req, res, refreshTokens) => {

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
                    .send({accessToken: accessToken}) // just send an accessToken to the user - this will be used to fetch their details from the DB (it has their id inside it, once decoded with jwt.verify)
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

};

const handleLogout = (req, res, refreshTokens) => {

    // extract the user's refresh token from the incoming cookie header
    const incomingCookies = req.cookies;
    const refreshToken = incomingCookies.refreshToken;
    // remove incoming refreshToken from our server-maintained list of refreshTokens on logout
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    console.log('Valid refresh tokens after logout:', refreshTokens)
    res.status(200).send('You logged out successfully.');

};

const handleRefresh = (req, res, refreshTokens) => {

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

};

module.exports = { handleRegister, handleLogin, handleLogout, handleRefresh };