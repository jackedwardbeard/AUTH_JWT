import React, { useState, useContext } from 'react'
import './index.css'
import { Link } from 'react-router-dom'
import { UserContext } from '../../Context/User'
import { useHistory } from 'react-router-dom'
import Button from '@material-ui/core/Button'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import { login } from '../../Requests/Auth/login'

const Login = () => {

    // used to redirect to home page upon successful login
    const history = useHistory();

    // state for tracking login form input
    const [loginEmail, setLoginEmail] = useState('')
    const [loginPassword, setLoginPassword] = useState('')

    const [user, setUser] = useContext(UserContext);

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

        // if user's email has been confirmed, redirect to login
        if (resStatus === 200) {
            history.push('/');
            setOpen(false);
        }
        else {
            setOpen(false);
        }

    }

    // log user in (create session)
    const handleLogin = () => {
        login({loginEmail, loginPassword, user, setUser, setResStatus, setDialogText, handleOpen});
    }
    
    return (

    <div className='pageContainer'>
        <form className='form'> 
            <p className='title'>
                Login
            </p>
            <input 
                className='inputBox' 
                type='text' 
                placeholder='Email'
                onChange={e => setLoginEmail(e.target.value)}
            />
            <input 
                className='inputBox' 
                type='password' 
                placeholder='Password'
                onChange={e => setLoginPassword(e.target.value)}
            />
            <Button variant='contained' onClick={handleLogin} style={{margin: '30px'}}>Login</Button>
            <Link className='link' to='/register' style={{margin: '5px'}}>Not a member? Register now.</Link>
            <Link className='link' to='/sendPasswordResetEmail' style={{margin: '5px'}}>Forgot your password?</Link>
        </form>
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

export default Login
