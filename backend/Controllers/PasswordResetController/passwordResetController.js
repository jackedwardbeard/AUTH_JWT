const User = require('../../user') // db schema for a user
const jwt = require('jsonwebtoken'); // lets us use JWT's
const bcrypt = require('bcryptjs'); // hashing/salting passwords

const handlePasswordReset = async(req, res) => {

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

};

module.exports = { handlePasswordReset };

