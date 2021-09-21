import axios from 'axios'

export const accessUnprotectedRoute = async({setDialogText, handleOpen}) => {

    await axios.get('http://localhost:5000/unprotected')
    .then((res) => {
        console.log(res);
        setDialogText('Successfully accessed unprotected resource! The retrieved content is: ' + res.data);
        handleOpen();
    })
    .catch((err) => {
        console.log(err.response);
        setDialogText(err.response.data);
        handleOpen();
    })
    
};