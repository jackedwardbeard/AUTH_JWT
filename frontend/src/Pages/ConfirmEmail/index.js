import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import Button from '@material-ui/core/Button'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import './index.css'
import { confirmUser } from '../../Requests/ConfirmEmail/confirmUser'

const ConfirmEmail = (props) => {

    // for determining whether to redirect after closing the dialog pop-up or not
    const history = useHistory();

    // get user ID ( {userid: 'example-id-here'} ) passed as parameter to this page
    const userID = props.match.params;

    // determine whether to redirect after closing dialog pop-up or not
    const [resStatus, setResStatus] = useState(null);

    // for dialog pop-ups
    const [open, setOpen] = useState(false);
    const [dialogText, setDialogText] = useState('');

    // open dialog pop-up
    const handleOpen = () => {
        setOpen(true);
    }

    // close dialog pop-up
    const handleClose = () => {

        setOpen(false);

        // if user's email has been confirmed, redirect to login
        if (resStatus === 200) {
            history.push('/login');
        }
        
    }

    // confirm the given user ID's email upon button click
    const handleConfirmUser = () => {
        confirmUser({userID, setResStatus, setDialogText, handleOpen});
    }

    return (

        <div className='pageContainer'>
            <div className='confirmEmailRow1'>
                <p className='title'>Email Confirmation</p>
                <p className='confirmEmailText'>To finalise your registeration, click the button below.</p>
                <div className='confirmEmailButtonContainer'>
                    <Button variant='contained' onClick={handleConfirmUser} style={{margin: '30px'}}>Confirm Email</Button>
                </div>
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

    )
}

export default ConfirmEmail
