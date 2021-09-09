import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import './index.css'
import logo from '../../Images/smiley.png'
import { FaBars } from 'react-icons/fa' // mobile menu icon
import axios from 'axios'
import { UserContext } from '../../Context/User'
import Button from '@material-ui/core/Button'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';

const Navbar = ({reverseState}) => {

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

    // log user out (end session)
    const logout = async(e) => {

        e.preventDefault()
        // send our accessToken so our verifyToken middleware can check if we can access the route or not (if its valid, expired, or non-existent)
        const accessToken = user.accessToken;
        console.log('access token before logout:', accessToken);
        // auth header allows our accessToken to be received by the server in our verifyToken function
        const options = {
            withCredentials: true,
            headers: {
                Authorization: 'Bearer ' + accessToken
            }
        }
        await axios.get('http://localhost:5000/refreshEnabled/logout', options)
            .then((res) => {
                console.log('Successfully logged out!');
                setUser(null);
                localStorage.clear();
                setDialogText('Successfully logged out!');
                handleOpen();
            })
            .catch(async(err) => {
                console.log(err.response);
                console.log('got hereeeee')
                const errorStatus = err.response.status;
                if (errorStatus === 403) {
                    console.log('Access token expired, attempting to use your refresh token to get you a new one!');
                    const options = {
                        withCredentials: true
                    }
                    await axios.get('http://localhost:5000/refreshEnabled/refresh', options)
                        .then((res) => {
                            // get the newly refreshed access token
                            const newAccessToken = res.data.accessToken;
                            // update localStorage with the refreshed token
                            const loggedinUser = JSON.parse(localStorage.getItem('user'));
                            loggedinUser.accessToken = newAccessToken;
                            localStorage.setItem('user', JSON.stringify(loggedinUser));
                            // update user global state with the refreshed token
                            setUser(loggedinUser);
                            setDialogText('Successfully refreshed access token.');
                            handleOpen();
                        })
                        .catch((err) => {
                            console.log('got here 3')
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

        <div className='navContainer'>
            <Link className='logo_link' to='/'>
                <img className='logo' src={logo}></img>
            </Link>
            <div className='mobileIcon' onClick={reverseState}>
                <FaBars/>
            </div>
            <ul className='links'>
                {
                    // if user is logged in, show home and logout links
                    user ?
                    <>
                        <li>
                            <Link className='nav_link' to='/'>Home</Link>
                        </li>
                        <li>
                            <Link className='nav_link' onClick={logout}>Logout</Link>
                        </li>
                    </>
                    :
                    // otherwise, show home, register and login links
                    <>
                        <li>
                            <Link className='nav_link' to='/'>Home</Link>
                        </li>
                        <li>
                            <Link className='nav_link' to='/register'>Register</Link>
                        </li>
                        <li>
                            <Link className='nav_link' to='/login'>Login</Link>
                        </li>
                    </>
                }
                
            </ul>
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

export default Navbar
