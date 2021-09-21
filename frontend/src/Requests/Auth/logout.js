import axios from 'axios'

export const logout = async({setUser, setDialogText, handleOpen}) => {

    // lets us send the refreshToken cookie in req.cookies
    const options = {
        withCredentials: true,
    }
    await axios.get('http://localhost:5000/refreshEnabled/logout', options)
    .then((res) => {
        console.log('Successfully logged out!');
        setUser(null);
        localStorage.clear();
        setDialogText('Successfully logged out!');
        handleOpen();
    })
    .catch(async(err) => {
        console.log(err.response);
        setDialogText(err.response.data);
        handleOpen();
    })

};