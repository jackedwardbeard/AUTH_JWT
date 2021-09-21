import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import './index.css'
import logo from '../../Images/smiley.png'
import { FaBars } from 'react-icons/fa' // mobile menu icon
import { UserContext } from '../../Context/User'
import Button from '@material-ui/core/Button'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import { logout } from '../../Requests/Auth/logout'

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
    const handleLogout = () => {
        logout({setUser, setDialogText, handleOpen});
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
                            <Link className='nav_link' onClick={handleLogout}>Logout</Link>
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
