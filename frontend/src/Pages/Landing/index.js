import React, { useContext, useState } from 'react'
import { UserContext } from '../../Context/User'
import Button from '@material-ui/core/Button'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import './index.css'
import { accessProtectedRoute } from '../../Requests/ProtectedRoute/accessProtectedRoute'
import { accessUnprotectedRoute } from '../../Requests/UnprotectedRoute/accessUnprotectedRoute'

const Landing = () => {

    // fetch user details from global 'useContext' state
    const [user, setUser] = useContext(UserContext);

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
    }

    // this backend route expects a valid access token, otherwise access will be denied
    const handleAccessProtectedRoute = () => {
        accessProtectedRoute({setDialogText, handleOpen});
    }

    // no access token is needed to access this resource
    const handleAccessUnprotectedRoute = () => {
        accessUnprotectedRoute({setDialogText, handleOpen});
    }

    return (

        <div className='pageContainer'>
            <div className='landingRow1'>
                {
                    user ?
                    <>
                        <p className='landingTitle'>
                        Welcome back, {user.email}!
                        </p>
                        <div className='userDetailsContainer'>
                            <p className='landingSubTitle'>Current User Details</p>
                            <p className='landingSubText'>First Name: {user.firstName}</p>
                            <p className='landingSubText'>Last Name: {user.lastName}</p>
                            <p className='landingSubText'>Email: {user.email}</p>
                            <p className='landingSubText'>Confirmed Email: {JSON.stringify(user.confirmedEmail)}</p>
                        </div>
                    </>
                    :
                    <p className='landingTitle'>
                        Nobody is logged in!
                    </p>
                }
            </div>
            
            <div className='landingRow2'>
                {
                    user ? 
                    <>
                    <p className='landingSubTextRoutes'>To access this resource, your access token needs to be valid (i.e, not expired). If expired, a dialog will pop-up notifying you of this, and the server will automatically get you a new one (assuming your refresh token is valid). If you don't get a new one, you'll have to login again to get a new refresh and access token.</p>
                    <Button onClick={handleAccessProtectedRoute} variant='contained' style={{margin: 'max(30px, 3vh) 0', fontWeight: 'bold'}}>
                        Access Protected Route
                    </Button>
                    <p className='landingSubTextRoutes'>This resource is unprotected, so you can access it without a valid access token.</p>
                    <Button onClick={handleAccessUnprotectedRoute} variant='contained' style={{marginTop: 'max(30px, 3vh)', fontWeight: 'bold'}}>
                        Access Unprotected Route
                    </Button>
                    </>
                    :
                    <>
                    </>
                }
                    
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
};

export default Landing
