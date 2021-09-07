import React, { useContext, useState } from 'react'
import './index.css'
import { Link, useHistory } from 'react-router-dom';
import axios from 'axios'
import { UserContext } from '../../Context/User'
import Button from '@material-ui/core/Button'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';

const MobileMenu = ({clicked, reverseState}) => {

    const history = useHistory();

    // fetch user details from global 'useContext' state
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
        setOpen(false);
    }

    // log user out (end session)
    const logout = async(e) => {
        
        e.preventDefault()

        // send our refreshToken so it can be deleted when logout is successful
        const data = {
            token: user.refreshToken
        }

        // authorisation headers need to be included for verifyToken to work
        const headers = {
            withCredentials: true,
            headers: { 'Authorization': 'Bearer ' + user.accessToken }
        }

        await axios.post('http://localhost:5000/logout', data, headers)
            .then(res => {

                console.log('Successfully logged out!');
                
                // clear global state and localStorage of logged-in user details
                setUser(null);
                localStorage.clear();

            })
            .catch(async(err) => {

                console.log(err.response);
                
                const errorStatus = err.response.status;

                if (errorStatus === 403) {
                    
                    console.log('Access token expired, attempting to use your refresh token to get you a new one!');

                    const data = {
                        token: user.refreshToken
                    }

                    await axios.post('http://localhost:5000/refresh', data)
                        .then((res) => {
                            
                            const newAccessToken = res.data.accessToken;

                            // update localStorage with the refreshed accessToken
                            const loggedinUser = JSON.parse(localStorage.getItem('user'));
                            loggedinUser.accessToken = newAccessToken;
                            localStorage.setItem('user', JSON.stringify(loggedinUser));

                            // update user global state with the refreshed accessToken
                            setUser(loggedinUser);

                            console.log('user after updating user state to loggedinUser', loggedinUser);

                            setDialogText('Successfully refreshed accessToken.');
                            handleOpen();
                        })
                        .catch((err) => {
                            console.log(err.response);
                            setDialogText('Could not refresh access token (refresh token invalid).');
                            handleOpen();
                        })
                }

                else if (errorStatus === 401) {
                    setDialogText('You have no refresh token! Log in first.');
                    handleOpen();
                    return console.log('No refresh token detected')
                }

                else {
                    setDialogText('An error occurred.');
                    handleOpen();
                    return console.log('An error occurred.')
                }
            })
    }
    
    return (
        <div clicked={clicked} onClick={reverseState}>
            {
                clicked ? 
                <div className='mobileMenuContainerClicked'>
                    <ul className='mobileMenu'>
                        {
                            // if user is logged in, show home and logout links
                            user ?
                            <>
                                <Link className='mobileLink' to='/' onClick={reverseState}>Home</Link>
                                <Link className='mobileLink' onClick={logout}>Logout</Link>
                            </>
                            :
                            // otherwise show home, register and login links
                            <>
                                <Link className='mobileLink' to='/' onClick={reverseState}>Home</Link>
                                <Link className='mobileLink' to='/register' onClick={reverseState}>Register</Link>
                                <Link className='mobileLink' to='/login' onClick={reverseState}>Login</Link>
                            </>
                        }
                    </ul>
                </div>
                :
                <div className='mobileMenuContainerNotClicked'>
                </div>
            }
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

export default MobileMenu
