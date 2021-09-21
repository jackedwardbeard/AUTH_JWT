const User = require('../../user') // db schema for a user

const handleGetUser = (req, res) => {

    // req.user is set in our 'verifyToken' middleware function once jwt.verify has run on the access token (it will return something like { _id: '61499e533db6755f00bc55cb', iat: 1632221068, exp: 1632221088 })
    const incomingUser = req.user; 

    // if incoming access token to this endpoint exists and hasn't expired, return details of that user
    if (incomingUser) {
        console.log('Decoded the following information from the incoming access token:', incomingUser);
        const incomingUserID = incomingUser._id;
        User.findOne({ _id: incomingUserID }, async(err, returnedUser) => { 
            if (err) {
                res.status(400).send('Error when trying to find user with that ID.');
            }
            if (returnedUser) {
                const userDetailsMinusThePassword = {
                    firstName: returnedUser.firstName,
                    lastName: returnedUser.lastName,
                    email: returnedUser.email,
                    confirmedEmail: returnedUser.confirmedEmail
                }
                res.status(200).send(userDetailsMinusThePassword); // send the object of the user
            }
            else {
                res.status(400).send('Could not find that user.')
            }
        })
    }
    // otherwise, there is no access token in the incoming request (e.g., manually deleted from local storage)
    else {
        console.log('No incoming access token detected!')
        res.status(403).send()
    }

};

module.exports = { handleGetUser };