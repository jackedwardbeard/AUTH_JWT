const User = require('../../user') // db schema for a user
const { sendPasswordResetEmail } = require('../../Utils/Emails/sendEmail'); // different templates for sending emails
const { generateAccessTokenEmail } = require('../../Utils/Tokens/tokens');

const handleSendPasswordResetEmail = (req, res) => {

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

};

module.exports = { handleSendPasswordResetEmail };