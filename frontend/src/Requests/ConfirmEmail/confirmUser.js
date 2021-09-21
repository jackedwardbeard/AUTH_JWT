import axios from 'axios'

export const confirmUser = async({userID, setResStatus, setDialogText, handleOpen}) => {

    await axios.post('http://localhost:5000/confirmEmail', userID)
    .then((res) => {
        console.log(res);
        setResStatus(200);
        setDialogText('Email successfully confirmed!');
        handleOpen();
    })
    .catch((err) => {
        console.log(err.response);
        setDialogText(err.response.data);
        handleOpen();
    })
    
};