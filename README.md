# AUTH_JWT - MERN stack
A MERN stack which uses JWT (JSON Web Tokens) for local authentication.

# Note
If you restart the server whilst logged in, the list of valid refresh tokens maintained by the server will be lost, so you will automatically have an invalid refresh token. Since /logout is a protected route as an example in this demo, if you're logged in and restart the server, you'll need to remove 'verifyToken' from the /logout route, restart the server, proceed to logout (as it will now be unprotected), restart the server again, and then put 'verifyToken' back into the /logout route. Otherwise you'll be stuck being logged in, and won't be able to logout (since the server doesn't have your refresh token anymore). This is only an issue as /logout is being demonstrated as a protected route. Normally, logout wouldn't be protected, and some valuable resources would. So if your refresh token expired from the server being restarted, it normally wouldn't matter, since you'd be able to logout and log back in to get a new refresh and access token. You just can't here since I decided to make /logout protected, and there isn't any other implemented routes to demonstrate an access token failing on.

# To make it work
You need to create a backend .env file containing values for:
* MONGO_URL=yourMongoDBConnectionStringHere
* CLIENT_URL=http://localhost:3000
* EMAIL_USER=YourGmailAddress
* EMAIL_PASS=YourGmailPassword
* JWT_SECRET=YourJWTAccessTokenSecret
* JWT_REFRESH_SECRET=YourJWTRefreshTokenSecret

# Authentication Technique
* JWT
* Upon login, an access token and a refresh token are given to the client. The access token currently lasts for 30 seconds until it expires, in which case the client needs to hit the /refresh endpoint to get a new access token. For demonstration purposes, the only route that requires an access token is /logout. So if you login, and attempt to logout within 30 seconds, you'll see it works. However, if you wait until after 30 seconds, trying to logout will result in your access token being invalid, and logout won't work. I made this route so that if your access token is expired and you try to log out, the /refresh endpoint will automatically be hit, and you will get another access token, giving you another 30 seconds to log out, and so on. Your refresh token never expires (it could be made to do so, though). Instead, when you log out, your refresh token is deleted from the server (the server maintains a list of all currently-valid refresh tokens). In reality, these should be stored on a database. Or if we don't want to store them at all, we could just set an expiry on refresh tokens too, and force log out the user when their refresh token expires (either that, or we could leave them logged in,but add a check for every api route to make sure the refresh token hasn't expired. This would require them to login again to get a new access token and refresh token. The current implementation means that a user's session will persist until they logout, or their browser localStorage is cleared somehow.

# Emails
* Register/email confirmation email: this is sent when a user first registers. It will never expire, so could technically be guessed by typing 'localhost:3000/confirm/:aValidUserID', but this is okay, since 1) it's extremely unlikely to happen, and 2) even if it does happen, all the 'imposter' would be doing is helping out the person who forgot to verify their email, by verifying it for them.
* Password reset email: with this email, we obviously don't want people to be able to guess a random 'localhost:3000/passwordChange/:aValidUserID' link and reset a user's password without their knowledge. So, before sending this email, we create a new access token that will expire in 60 seconds. We then send this access token in the email in the form of a parameter URL (e.g. the email will link to 'localhost:3000/passwordChange/:token/:userid'). This way, even if an 'imposter' guesses this link (somehow), the password reset link will only have been valid for 60 seconds after the user originally requested the password reset. The 'imposter' also can't keep refreshing this link in hopes that the user sends a new password reset request, since the :token parameter of the link will change to something completely different every time the password reset is requested (despite the :userid parameter staying the same each time).

# To make a route protected
* Simply add the 'verifyToken' middleware function as the second parameter to the route.
* E.g. app.post('/unprotected', (req, res) => ...
* E.g. app.post('/protected', verifyToken, (req, res) => ...
* This ensures that the verifyToken function has access to the incoming request before the route itself does, and so can perform checks to see if the incoming request access token is valid or not.

# What it does so far
* Allows local register
* Upon successful register (successful if provided email isn't taken/found in DB), send a confirmation email to the given email address
* Following the link in the confirmation email brings you to a confirmation page, where you can click a button to confirm your email
* Successfully confirmation of your email will redirect you to the login page, whilst an unsucessful confirmation (i.e., already confirmed, or no user found for given ID) will leave you on the confirmation page
* Allows local login (successful if email/password combination is found in DB)
* Allows persistent login (e.g, if you refresh the page after logging in, you will still be logged in, until your browser's localStorage has been cleared).
* On login page, offers a 'forgot password?' option, which takes you to a page where you can enter an email to send a password reset email to. Following the link will take you to a page where you can reset your password (if the new password and confirmed new password match).
* Allows logout (deletes refresh token and removes localStorage/user global state data)

# To-Dos / Improvements
- Somehow use JWT's instead of uuid of user for email link parameters (to stop the very small chance of being able to randomly guess a link with a user's valid uuid as the parameter).
- Add input validation (not the focus of this repo, so I probably won't implement this). Currently you can enter anything into the any input fields.

# To start frontend
```bash
cd frontend
npm install
npm start
```

# To start backend (with nodemon)
```bash
cd backend
npm install
npm start
```

# Description

I was working on authentication for another project, and decided it would be helpful to encapsulate this authentication stack into a little package for learning purposes.


# The stack
```bash
React (frontend)
Node/Express (backend)
MongoDB (database)
```
