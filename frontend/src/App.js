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
  SendResetEmail,
  PasswordChange
} from './Pages/PageExports'
import {
  Navbar,
  MobileMenu
} from './Components/ComponentExports'
import React, { useState, useEffect } from 'react'
import { UserContext } from './Context/User'

const App = () => {

  // store details of logged-in user - pass into context to act as global state
  const [user, setUser] = useState(null);

  // open/close mobile menu
  const [clicked, setClicked] = useState(false)
  const reverseState = () => { setClicked(!clicked) }

  // for every time the app loads
  // 1. get user object saved in localStorage (after logging in)
  // 2. store this object into useContext/global state
  // 3. we can now persist login and use this user useContext/global state anywhere in the app (we can also use localStorage)
  useEffect(() => {
      const storageUser = localStorage.getItem('user');
      if (storageUser) {
        const loggedinUser = JSON.parse(storageUser);
        console.log('Landing user:', loggedinUser)
        // if app is refreshed/closed, we lose access to state
        // so we use localStorage (which is browser storage) to reset our user context/global state every time
        // this localStorage is wiped clean when we logout using /logout
        setUser(loggedinUser); 
      }
      else {
        console.log('No user is logged in.')
      }
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
        <Route path='/confirm/:userid' component={ConfirmEmail}/>
        <Route path='/sendResetEmail' component={SendResetEmail}/>
        <Route path='/passwordChange/:userid' component={PasswordChange}/>
        <Route path='/' component={Landing}/>
      </Switch>
    </Router>
    </UserContext.Provider>
    </>
  );
}

export default App;
