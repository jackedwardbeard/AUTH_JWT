import axios from 'axios'

export const passwordReset = async({
        accessToken, 
        userID, 
        newPassword, 
        confirmNewPassword, 
        setResStatus, 
        setDialogText, 
        handleOpen
    }) => {

    const data = {
        token: accessToken,
        userid: userID,
        newPassword: newPassword
    }
    // if passwords match
    if (newPassword === confirmNewPassword) {
        await axios.post('http://localhost:5000/passwordReset', data)
        .then((res) => {
            console.log(res);
            setResStatus(200);
            setDialogText('Password successfully updated!');
            handleOpen();
        })
        .catch((err) => {
            console.log(err.response);
            setDialogText(err.response.data);
            handleOpen();
        })
    }
    // passwords mismatch
    else {
        setDialogText('Passwords mismatch!');
        handleOpen();
    }

};