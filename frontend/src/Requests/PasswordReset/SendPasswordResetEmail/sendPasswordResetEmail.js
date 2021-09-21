import axios from 'axios'

export const sendPasswordResetEmail = async({email, setResStatus, setDialogText, handleOpen}) => {

    const data = {
        email: email
    }
    // take email entered into input box
    await axios.post('http://localhost:5000/sendPasswordResetEmail', data)
    .then((res) => {
        console.log(res);
        setResStatus(200);
        setDialogText('An email containing instructions on how to reset your password has been sent.');
        handleOpen();
    })
    .catch((err) => {
        console.log(err.response);
        setDialogText(err.response.data);
        handleOpen();
    })
    
};