const jwt = require('jsonwebtoken'); // lets us use JWT's

// middleware function that takes an incoming token and determines if it's valid (i.e. hasn't expired - so only for access tokens at the moment)
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

module.exports = { verifyToken, generateAccessToken, generateAccessTokenEmail, generateRefreshToken };