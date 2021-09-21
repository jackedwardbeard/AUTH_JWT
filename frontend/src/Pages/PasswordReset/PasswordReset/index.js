import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import Button from '@material-ui/core/Button'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import './index.css'
import { passwordReset } from '../../../Requests/PasswordReset/PasswordReset/passwordReset'

const PasswordReset = (props) => {

    // get the access token and userID, passed as parameter to this page
    const accessToken = props.match.params.token;
    const userID = props.match.params.userid;

    const history = useHistory();

    // for dialog pop-ups
    const [open, setOpen] = useState(false);
    const [dialogText, setDialogText] = useState('');

    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [resStatus, setResStatus] = useState(null);

    // open dialog pop-up
    const handleOpen = () => {
        setOpen(true);
    }

    // close dialog pop-up
    const handleClose = () => {

        setOpen(false);

        // if password change was successful, redirect to login page
        if (resStatus === 200) {
            history.push('/login')
        }

    }

    // take input and reset the user's password to the new input
    const handlePasswordReset = () => {

        passwordReset({
            accessToken, 
            userID, 
            newPassword, 
            confirmNewPassword, 
            setResStatus, 
            setDialogText, 
            handleOpen
        });

    }

    return (

        <div>
            <div className='pageContainer'>
            <div className='passwordResetRow1'>
                <p className='title'>Change Password</p>
                <p className='passwordResetText'>Enter a new password.</p>
                <input 
                    className='inputBox' 
                    type='password' 
                    placeholder='New Password'
                    onChange={e => setNewPassword(e.target.value)}
                />
                <input 
                    className='inputBox' 
                    type='password' 
                    placeholder='Confirm New Password'
                    onChange={e => setConfirmNewPassword(e.target.value)}
                />
                <Button variant='contained' onClick={handlePasswordReset} style={{margin: '30px'}}>Change Password</Button>
            </div>
            <Dialog
                open={open}
                onClose={handleClose}
            >
                <DialogTitle> </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            { dialogText }
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose} color='primary'>
                            Okay
                        </Button>
                    </DialogActions>
            </Dialog>
            </div>
        </div>

    )
}

export default PasswordReset
