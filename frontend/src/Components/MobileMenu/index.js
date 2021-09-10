import React, { useContext, useState } from 'react'
import './index.css'
import { Link } from 'react-router-dom';
import axios from 'axios'
import { UserContext } from '../../Context/User'
import Button from '@material-ui/core/Button'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import { Drawer, List, ListItem } from '@material-ui/core';
import Divider from '@material-ui/core/Divider';

const MobileMenu = ({clicked, reverseState}) => {

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
                setDialogText(err.response.data);
                handleOpen();
            })

    }
    
    return (

        <div onClick={reverseState}>
            <Drawer open={clicked} variant='temporary'>
                <List>
                    {
                        // if user is logged in, show home and logout links
                        user ?
                        <>
                        <ListItem>
                            <Link className='mobileLink' to='/' onClick={reverseState}>Home</Link>
                        </ListItem>
                        <Divider/>
                        <ListItem>
                            <Link className='mobileLink' onClick={logout}>Logout</Link>
                        </ListItem>
                        <Divider/>
                        </>
                        :
                        // otherwise show home, register and login links
                        <>
                        <ListItem>
                            <Link className='mobileLink' to='/' onClick={reverseState}>Home</Link>  
                        </ListItem>
                        <Divider/>
                        <ListItem>
                            <Link className='mobileLink' to='/register' onClick={reverseState}>Register</Link>
                        </ListItem>
                        <Divider/>
                        <ListItem>
                            <Link className='mobileLink' to='/login' onClick={reverseState}>Login</Link>
                        </ListItem>
                        <Divider/>
                        </>
                    }
                </List>
            </Drawer>
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
