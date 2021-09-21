require('dotenv').config(); // enables .env files

const mongoose = require('mongoose'); // for db operations
const express = require('express'); // creates our server
const cors = require('cors'); // cross-origin resource sharing
const cookieParser = require('cookie-parser'); // lets our server use httpOnly cookies (res.cookie)
const { handleRegister, handleLogin, handleLogout, handleRefresh } = require('./Controllers/AuthController/authController');
const { handleConfirmEmail } = require('./Controllers/ConfirmEmailController/confirmEmailController');
const { handleSendPasswordResetEmail } = require('./Controllers/PasswordResetController/sendPasswordResetEmailController');
const { handlePasswordReset } = require('./Controllers/PasswordResetController/passwordResetController');
const { handleGetUser } = require('./Controllers/UserController/userController');
const { verifyToken } = require('./Utils/Tokens/tokens');

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

// used to get a new accessToken and refreshToken if a user's accessToken expires
// a /refreshEnabled endpoint will be able to read our refreshToken cookie, no other endpoints can
app.get('/refreshEnabled/refresh', (req, res) => {
    handleRefresh(req, res, refreshTokens);
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
    handleRegister(req, res);
})

// accepts an email and a password - logs the user in & sends them their user details + access token, and a cookie containing a refresh token
// e.g. data = {
//    'email': 'email@example.com',
//    'password': example
//     }
app.post('/login', (req, res) => {
    handleLogin(req, res, refreshTokens);
});

// a /refreshEnabled endpoint will be able to read our refreshToken cookie, no other endpoints can
app.get('/refreshEnabled/logout', (req, res) => {
    handleLogout(req, res, refreshTokens);
});

// accepts a userid and an access token (to determine if the link is valid anymore) - marks a user's confirmedEmail field as 'true'
// e.g. data = {
//      'userid': userid,
//      'token': accessToken
//    }
app.post('/confirmEmail', (req, res) => {
    handleConfirmEmail(req, res);
})

// accepts an email - sends a password reset email
// e.g. data = {
//      'email': email 
//   }
app.post('/sendPasswordResetEmail', (req, res) => {
    handleSendPasswordResetEmail(req, res);
});

// accepts a userID and a new password - changes the password of that user
// e.g. data = {
//    'userid': userid,
//    'newPassword': newPassword
//    }
app.post('/passwordReset', (req, res) => {
    handlePasswordReset(req, res);
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

app.get('/getUser', verifyToken, (req, res) => {
    handleGetUser(req, res);
})

// make the server listen to a specific port (5000 in this case)
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(5000, () => console.log('Server Running on Port 5000, Connected to DB.')))
  .catch((error) => console.log(`${error} - did not connect.`));

// lets us use certain 'deprecated' mongoose operations (e.g, findOneAndModify)
mongoose.set('useFindAndModify', false);
