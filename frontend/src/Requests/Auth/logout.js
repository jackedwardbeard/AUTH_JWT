import axios from 'axios'

export const logout = async(e, {setUser, setDialogText, handleOpen}) => {

    e.preventDefault();    
    // lets us send the refreshToken cookie in req.cookies
    const options = {
        withCredentials: true,
    }
    await axios.get('http://localhost:5000/refreshEnabled/logout', options)
    .then((res) => {
        console.log(res.data);
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