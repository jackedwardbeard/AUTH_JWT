import './App.css'
import { 
  BrowserRouter as Router, 
  Route, 
  Switch 
} from 'react-router-dom'
import {
  Landing,
  Login,
  Register,
  ConfirmEmail,
  SendPasswordResetEmail,
  PasswordReset
} from './Pages/PageExports'
import {
  Navbar,
  MobileMenu
} from './Components/ComponentExports'
import React, { useState, useEffect } from 'react'
import { UserContext } from './Context/User'
import { getCurrentlyLoggedInUser } from './Requests/User/getCurrentlyLoggedInUser'

const App = () => {

  // store details of logged-in user - pass into context to act as global state
  const [user, setUser] = useState(null);

  // open/close mobile menu
  const [clicked, setClicked] = useState(false)
  const reverseState = () => { setClicked(!clicked) }

  // for every time the app loads:
  // 1. check browser local storage for access token
  // 1.1. if it's not there, attempt to refresh a new access token, then repeat steps (2.2.1) to (2.2.3)
  // 2. if it is there, try to get the details of the user attached to it (through the /getUser endpoint - which has middleware that will check validity of access token)
  // 2.1. if the accessToken is valid, user details are returned and stored into 'user' context
  // 2.2. if the access token is there, but not valid (i.e., expired), attempt to refresh access token
  // 2.2.1. if refresh token is present in cookies and is valid, refresh access token, getUser details again, store them into 'user' context
  // 2.2.2. if refresh token is present in cookies but NOT valid, force log the user out (set user context to null and clear localStorage of accessTokens)
  // 2.2.3. if refresh token is not present in cookies, force log the user out (set user context to null and clear localStorage of accessTokens)
  useEffect(() => {

      getCurrentlyLoggedInUser({setUser});
      
  }, []);

  return (

    <>
    <UserContext.Provider value={[user, setUser]}>
    <Router>
      <MobileMenu clicked={clicked} reverseState={reverseState}></MobileMenu>
      <Navbar reverseState={reverseState}/>
      <Switch>
        <Route path='/login' component={Login}/>
        <Route path='/register' component={Register}/>
        <Route path='/confirm/:token/:userid' component={ConfirmEmail}/>
        <Route path='/sendPasswordResetEmail' component={SendPasswordResetEmail}/>
        <Route path='/passwordReset/:token/:userid' component={PasswordReset}/>
        <Route path='/' component={Landing}/>
      </Switch>
    </Router>
    </UserContext.Provider>
    </>
    
  );
}

export default App;
