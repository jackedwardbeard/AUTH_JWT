# AUTH_JWT - MERN stack
A MERN stack which uses JWT (JSON Web Tokens) for local authentication.

# To make it work
You need to create a backend .env file containing values for:
* MONGO_URL=yourMongoDBConnectionStringHere
* CLIENT_URL=http://localhost:3000
* EMAIL_USER=yourGmailAddress
* EMAIL_PASS=yourGmailPassword
* JWT_ACCESS_EXPIRY=expiryTimeOfRegularAccessTokens
* JWT_EMAIL_ACCESS_EXPIRY=expiryTimeOfEmailAccessTokens
* JWT_ACCESS_SECRET=yourJWTAccessTokenSecret
* JWT_REFRESH_SECRET=yourJWTRefreshTokenSecret

# Authentication Technique
* JWT
* User logs in. This is successful only if their details are found in the DB. Passwords are compared using bcrypt.js, and stored in the DB by using bcrypt's in-built hash and salt function.
* Upon successful login, they are sent a refresh token and an access token. 
* The refresh token is sent as an httpOnly cookie (to reduce the likelihood of, but not mitigate completely, XSS attacks).
* The access token is sent as part of the response body, and is stored in localStorage (since it's short lived).
* The cookie containing the refresh token works ONLY on routes that are prefixed with /refreshEnabled. This is because when the cookie is made, we specify its route as '/refreshEnabled'. Basically, its path dictates which routes can 'see' the refreshToken cookie in req.cookies (cookie-parser). It lasts until the user logs out(the user will then keep that refresh token cookie until next time they log in, but it won't work since it'll be removed from the server when the user logs out), or until the server restarts (as its array of valid refresh tokens will reset - ideally we'd want to store this list in a database so this doesn't happen).
* The access token is sent with an Authorization header (e.g, Authorization: 'Bearer ' + accessToken) and can be sent to any protected route. It is short-lived, and will expire fairly quickly. It is refreshed automatically for the example protected route (e.g, if the access token is invalid and a user tries to access the protected route, they will get rejected, but the server will automatically try to refresh their access token, and then they can try again (if) it is successful in refreshing their token).

# Emails
* Register/email confirmation email: this is sent when a user first registers. They have been changed to expire after JWT_EMAIL_ACCESS_EXPIRY time. If you try to visit an expired email confirmation link and click the button, it will tell you one of two things. 1) if the account is already confirmed, you will have no issue, it will just tell you 'email is already confirmed!'. 2) if the account is NOT already confirmed, the unconfirmed account will be deleted from the database. This is a security measure, to stop anybody being able to sign up with someone elses email address, and confirm their email by guessing the 'localhost:3000/confirm/:token/:userid' link. If you create an account, but for legitimate reasons fail to confirm your account within the expiry time of the email, you can simply attempt to login, and you will receive another email confirmation email.

* Password reset email: with this email, we obviously don't want people to be able to guess a random 'localhost:3000/passwordChange/:aValidUserID' link and reset a user's password without their knowledge. So, like with email confirmations, we create a new access token that will expire in process.env.JWT_EMAIL_ACCESS_EXPIRY time. We then send this access token in the email in the form of a parameter URL (e.g. the email will link to 'localhost:3000/passwordReset/:token/:userid'). This way, even if an 'imposter' guesses this link (somehow), the password reset link will only have been valid for 60 seconds after the user originally requested the password reset. The 'imposter' also can't keep refreshing this link in hopes that the user sends a new password reset request, since the :token parameter of the link will change to something completely different every time the password reset is requested (despite the :userid parameter staying the same each time).

# To make a route protected
* Simply add the 'verifyToken' middleware function as the second parameter to the route.
* E.g. app.post('/unprotected', (req, res) => ...
* E.g. app.post('/protected', verifyToken, (req, res) => ...
* This ensures that the verifyToken function has access to the incoming request before the route itself does, and so can perform checks to see if the incoming access token is valid or not. If it's not, it responds on behalf of the route, and if it is valid, it can pass the information contained in the access token (e.g, the ID of the user who made the request), to the route.

# Login Persistence

Every time the app loads:
* 1) check browser local storage for access token
* 1.1) if it's not there, attempt to refresh a new access token, then repeat steps (2.2.3) to (2.2.5)
* 2) if it is there, try to get the details of the user attached to it (through the /getUser endpoint - which has middleware that will check validity of access token)
* 2.1) if the accessToken is valid, user details are returned and stored into 'user' context
* 2.2) if the access token is there, but not valid (i.e., expired), attempt to refresh access token
* 2.2.3) if refresh token is present in cookies and is valid, refresh access token, getUser details again, store them into 'user' context
* 2.2.4) if refresh token is present in cookies but NOT valid, force log the user out (set user context to null and clear localStorage of accessTokens)
* 2.2.5) if refresh token is not present in cookies, force log the user out (set user context to null and clear localStorage of accessTokens)

# What it does so far
* Allows local register
* Upon successful register (successful if provided email isn't taken/found in DB), send a confirmation email to the given email address
* Following the link in the confirmation email brings you to a confirmation page, where you can click a button to confirm your email
* Successfully confirmation of your email will redirect you to the login page, whilst an unsucessful confirmation (i.e., already confirmed, or no user found for given ID) will leave you on the confirmation page. Attempting to confirm your email with an expired link (and unconfirmed account), will delete the account from the DB for security purposes.
* If your account is deleted in this manner, you can simply register again if you're the legitimate owner of the email. It is merely to stop random people from signing up and confirming your account with a guessed confirmation URL.
* If you realise you haven't confirmed your account in time, and haven't attempted to use an old confirmation link, you can just attempt to login with the appropriate email (assuming you know your password), and a new confirmation link will be sent to you.
* Allows local login (successful if email/password combination is found in DB).
* Allows persistent login (e.g, if you refresh the page after logging in, you will still be logged in, until you logout or your refreshToken becomes invalid from the server restarting and losing its list of valid refreshTokens (this would be mitigated if we stored refreshTokens in a database instead of an array on the server)).
* On login page, offers a 'forgot password?' option, which takes you to a page where you can enter an email to send a password reset email to. Following the link will take you to a page where you can reset your password (if the new password and confirmed new password match, and the link is still valid).
* Allows logout (deletes refresh token from server (invalidating it), and removes localStorage/user global state data which contains user details & access token).
* Has a protected route ('/protected') that requires an active access token - will automatically refresh your access token if it expires and your refresh token is still valid.
* Has an unprotected route ('/unprotected') that does not require an access token.

# To-Dos / Improvements
- Move backend login into controller files, and import it in to each route.
- Add input validation (not the focus of this repo, so I probably won't implement this). Currently you can enter anything into any input field.

# Weaknesses
* Access tokens are stored in localStorage. They are therefore vulnerable to XSS, but this is unlikely to occur, since they are so short lived.
* Refresh tokens are stored in httpOnly cookies. This is slightly more secure, as scripts cannot read the cookie directly (reducing the chance of XSS attacks), but it is still possible, as is CSRF.
* The idea of storing the access token and refresh token in different mediums is to minimise the odds of both being exposed in the case that an attack does happen (e.g., rather than storing both in httpCookies, as they could both be retrieved in the same attack that way). This still has its limitations though, and is far from attack-prone.
* Email confirmation and password reset email links can technically be guessed (by guessing 'localhost:3000/confirm/:token/:userid' or 'localhost:3000/passwordReset/:token/:userid' respectively). However, since each of these links only last a short amount of time before they expire, the chances of an imposter being able to guess one of these links when active is now extremely low - if not impossible. This is especially true since the link's access token (:token) changes with every single new email link created. One weakness is that an imposter could spam new confirmation links (by attempting to login to an unconfirmed account), thus increasing their probability of guessing a link, but it is still almost impossible, given that each link has a new access token and each link only lasts a short amount of time. In the case they do manage to guess a link, it's still not a big deal - the owner of the email (after getting emails they didn't ask for), would eventually reach out and ask to have the account removed, or in the case that they wanted to sign up themselves, they could simply click 'forgot your password?', and reset their password, gaining their account back from the person who signed them up and luckily confirmed their account in the first place.

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
MongoDB Atlas (database)
```
