import axios from 'axios'
import { logout } from '../Auth/logout'

export const accessProtectedRoute = async(e, {setUser, setDialogText, handleOpen}) => {

    // get access token from localStorage
    const accessTokenNotJSON = localStorage.getItem('accessToken');
    const accessToken = JSON.parse(accessTokenNotJSON);
    // allows us to send an access token
    const options = {
        withCredentials: true,
        headers: {
            Authorization: 'Bearer ' + accessToken
        }
    }
    await axios.get('http://localhost:5000/protected',  options)
    .then((res) => {
        console.log(res);
        setDialogText('Successfully accessed protected resource! The retrieved content is: ' + res.data);
        handleOpen();
    })
    .catch(async(err) => {
        // access token has expired, attempt to refresh it automatically
        if (err.response.status === 403) {
            const options = {
                withCredentials: true
            }
            await axios.get('http://localhost:5000/refreshEnabled/refresh', options)
            .then((res) => {
                // get the newly refreshed access token
                const newAccessToken = res.data.accessToken;
                // update localStorage with the refreshed token
                localStorage.setItem('accessToken', JSON.stringify(newAccessToken));
                setDialogText('Access token expired. Automatically refreshed your access token... Try accessing the protected resource before it expires again.');
                handleOpen();
            })
            .catch((err) => {
                // if we get here, we couldn't refresh our access token (invalid refresh token or no refresh token)
                console.log(err.response);
                // logout
                logout(e, {setUser, setDialogText, handleOpen});
                setDialogText('Could not refresh access token (refresh token invalid).');
                handleOpen();
            })
        }
        // access token is not valid, console log it
        console.log(err.response);
    })
    
};