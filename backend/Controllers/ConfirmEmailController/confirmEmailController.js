const jwt = require('jsonwebtoken'); // lets us use JWT's
const User = require('../../user') // db schema for a user

const handleConfirmEmail = (req, res) => {

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

};

module.exports = { handleConfirmEmail };