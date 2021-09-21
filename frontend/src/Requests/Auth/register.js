import axios from 'axios'

export const register = async({
        registerFirstName, 
        registerLastName, 
        registerEmail, 
        registerPassword, 
        registerConfirmPassword,
        setResStatus,
        setDialogText,
        handleOpen
    }) => {

    const data = {
        firstName: registerFirstName,
        lastName: registerLastName,
        email: registerEmail,
        password: registerPassword,
        confirmPassword: registerConfirmPassword
    };
    await axios.post('http://localhost:5000/register', data, { withCredentials: true })
    .then((res) => {
        console.log(res);
        setResStatus(200);
        setDialogText('User successfully registered! Check your inbox to finalise the process.');
        handleOpen();
    })
    .catch((err) => {
        console.log(err.response);
        setDialogText(err.response.data);
        handleOpen();
    })

};