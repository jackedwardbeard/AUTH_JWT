import axios from 'axios'

export const login = async({
        loginEmail, 
        loginPassword, 
        user, 
        setUser, 
        setResStatus, 
        setDialogText, 
        handleOpen
    }) => {

    console.log('got inc params:', loginEmail, loginPassword)
    const data = {
        email: loginEmail,
        password: loginPassword
    }
    // only allow login if a user isn't already logged in
    if (!user) {
        const options = {
            withCredentials: true,
        }
        await axios.post('http://localhost:5000/login', data, options)
        .then(async(res) => {
            console.log(res);
            const newAccessToken = res.data.accessToken;
            // save access token into localStorage, our refresh token is received back from the server as a httpOnly cookie
            localStorage.setItem('accessToken', JSON.stringify(newAccessToken));
            // get user details based on user ID in access token, and store into user context
            const options = {
                withCredentials: true,
                headers: {
                    Authorization: 'Bearer ' + newAccessToken
                }
            }
            await axios.get('http://localhost:5000/getUser', options)
            .then((res) => {
                console.log('After logging in and GETting getUser, successfully got user details:', res.data);
                // store user details into user context (global state)
                setUser(res.data);
            })
            .catch((err) => {
                console.log('After logging in and GETting getUser, got err:', err.response);
            })
            setResStatus(200);
            setDialogText('Successfully logged in!');
            handleOpen();
        })
        .catch((err) => {
            console.log('got here on logon')
            console.log(err);
            setDialogText(err.response.data);
            handleOpen();
        })
    }
    else {
        setDialogText('Log out before attempting to log in!');
        handleOpen();
    }

};