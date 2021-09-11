# AUTH_JWT - MERN stack
A MERN stack which uses JWT (JSON Web Tokens) for local authentication.

# To make it work
You need to create a backend .env file containing values for:
* MONGO_URL=yourMongoDBConnectionStringHere
* CLIENT_URL=http://localhost:3000
* EMAIL_USER=yourGmailAddress
* EMAIL_PASS=yourGmailPassword
* JWT_ACCESS_EXPIRY=expiryTimeOfRegularAccessTokens
* JWT_ACCESS_EXPIRY=expiryTimeOfEmailAccessTokens
* JWT_SECRET=yourJWTAccessTokenSecret
* JWT_REFRESH_SECRET=yourJWTRefreshTokenSecret

# Authentication Technique
* JWT
* User logs in. This is successful only if their details are found in the DB. Passwords are compared using bcrypt.js, and stored in the DB by using bcrypt's in-built hash and salt function.
* Upon successful login, they are sent a refresh token and an access token. 
* The refresh token is sent as an httpOnly cookie (to reduce the likelihood of, but not mitigate completely, XSS attacks).
* The access token is sent as part of the response body, and is stored in localStorage (since it's short lived).
* The cookie containing the refresh token works ONLY on routes that are prefixed with /refreshEnabled. This is because when the cookie is made, we specify its route as '/refreshEnabled'. It lasts until the user logs out (the user will then keep that refresh token cookie until next time they log in, but it won't work since it'll be removed from the server when the user logs out).
* The access token is sent with an Authorization header (e.g, Authorization: 'Bearer ' + accessToken) and can be sent to any protected route. It is short-lived, and will expire fairly quickly. It is refreshed automatically for the example protected route (e.g, if the access token is invalid and a user tries to access the protected route, they will get rejected, but the server will automatically try to refresh their access token, and then they can try again (if) it is successful in refreshing their token).

# Emails
* Register/email confirmation email: this is sent when a user first registers. It will never expire, so could technically be guessed by typing 'localhost:3000/confirm/:aValidUserID', but this is okay, since 1) it's extremely unlikely to happen, and 2) even if it does happen, all the 'imposter' would be doing is helping out the person who forgot to verify their email, by verifying it for them. This could be changed to expire, but currently there's no frontend mechanism for requesting another confirmation email should the first one they receive expire, so it doesn't seem worth it, given the lack of risk mentioned earlier.
* Password reset email: with this email, we obviously don't want people to be able to guess a random 'localhost:3000/passwordChange/:aValidUserID' link and reset a user's password without their knowledge. So, before sending this email, we create a new access token that will expire in process.env.JWT_EMAIL_ACCESS_EXPIRY time. We then send this access token in the email in the form of a parameter URL (e.g. the email will link to 'localhost:3000/passwordChange/:token/:userid'). This way, even if an 'imposter' guesses this link (somehow), the password reset link will only have been valid for 60 seconds after the user originally requested the password reset. The 'imposter' also can't keep refreshing this link in hopes that the user sends a new password reset request, since the :token parameter of the link will change to something completely different every time the password reset is requested (despite the :userid parameter staying the same each time).

# To make a route protected
* Simply add the 'verifyToken' middleware function as the second parameter to the route.
* E.g. app.post('/unprotected', (req, res) => ...
* E.g. app.post('/protected', verifyToken, (req, res) => ...
* This ensures that the verifyToken function has access to the incoming request before the route itself does, and so can perform checks to see if the incoming access token is valid or not. If it's not, it responds on behalf of the route, and if it is valid, it can pass the information contained in the access token (e.g, the ID of the user who made the request), to the route.

# What it does so far
* Allows local register
* Upon successful register (successful if provided email isn't taken/found in DB), send a confirmation email to the given email address
* Following the link in the confirmation email brings you to a confirmation page, where you can click a button to confirm your email
* Successfully confirmation of your email will redirect you to the login page, whilst an unsucessful confirmation (i.e., already confirmed, or no user found for given ID) will leave you on the confirmation page
* Allows local login (successful if email/password combination is found in DB)
* Allows persistent login (e.g, if you refresh the page after logging in, you will still be logged in, until your browser's localStorage has been cleared).
* On login page, offers a 'forgot password?' option, which takes you to a page where you can enter an email to send a password reset email to. Following the link will take you to a page where you can reset your password (if the new password and confirmed new password match).
* Allows logout (deletes refresh token from server (invalidating it), and removes localStorage/user global state data which contains user details & access token).
* Has a protected route ('/protected') that requires an active access token - will automatically refresh your access token if it expires and your refresh token is still valid.
* Has an unprotected route ('/unprotected') that does not require an access token.

# To-Dos / Improvements
- Add input validation (not the focus of this repo, so I probably won't implement this). Currently you can enter anything into the any input fields.

# Weaknesses
* Access tokens are stored in localStorage. They are therefore vulnerable to XSS, but this is unlikely to occur, since they are so short lived.
* Refresh tokens are stored in httpOnly cookies. This is slightly more secure, as scripts cannot read the cookie directly (reducing the chance of XSS attacks), but it is still possible, as is as CSRF.
* Along with access tokens, user details (not passwords, just things like UUID, first name, last name, and email) are also stored in local storage. This is just for ease of access, persistent login, and to avoid having to make a DB call to get these details with the UUID of that user. In an actual application, I'd likely only store the access token and user ID in local storage, and then make a DB call for the rest of the user details when necessary.
* The idea of storing the access token and refresh token in different mediums is to minimise the odds of both being exposed in the case that an attack does happen (e.g., rather than storing both in httpCookies, as they could both be retrieved in the same attack that way). This still has its limitations though, and is far from attack-prone.

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
