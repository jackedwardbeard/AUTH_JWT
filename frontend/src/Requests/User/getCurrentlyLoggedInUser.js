import axios from 'axios'

export const getCurrentlyLoggedInUser = async({setUser}) => {

    // attempt to get access token from local storage
    const accessTokenNotJSON = localStorage.getItem('accessToken');
    // if it can be found, attempt to hit /getUser endpoint using it
    if (accessTokenNotJSON) {
      const accessToken = JSON.parse(accessTokenNotJSON);
      const options = {
        withCredentials: true,
        headers: {
            Authorization: 'Bearer ' + accessToken
        }
      }
      console.log('Access token before first getUser:', accessToken)
      await axios.get('http://localhost:5000/getUser', options)
      // access token was valid, user details retrieved
      .then((res) => {
        console.log('Without needing to refresh (access token present and valid), got user details:', res);
        // store user details into user context (global state)
        setUser(res.data);
      })
      // access token was not valid
      .catch(async(err) => {
        const options = {
          withCredentials: true
        }
        // access token not valid
        if (err.response.status === 403) {
          console.log('Access token not valid, attempting to refresh it for you...', err.response)
          // attempt to refresh a new access token
          await axios.get('http://localhost:5000/refreshEnabled/refresh', options)
          // if refresh was successful
          .then(async(res) => {
            const newAccessToken = res.data.accessToken;
            console.log('Successfully refreshed access token...');
            console.log('New access token after refresh:', newAccessToken);
            console.log('Setting accessToken in localStorage as this new token...')
            localStorage.setItem('accessToken', JSON.stringify(newAccessToken));
            console.log('Attempting to getUser again after having refreshed your access token...');
            const options = {
              withCredentials: true,
              headers: {
                  Authorization: 'Bearer ' + newAccessToken
              }
            }
            // attempt to hit /getUser with this newly refreshed access token
            await axios.get('http://localhost:5000/getUser', options) // getUser with new refreshed accessToken
            .then((res) => {
              console.log('After refreshing your access token and GETting getUser again, successfully got user details:', res.data);
              setUser(res.data);
            })
            .catch((err) => {
              console.log('After refreshing your access token and GETting getUser again, got err:', err);
            })
          })
          // refresh was not successful - refresh token invalid or absent from browser's cookies
          .catch(async(err) => {
            console.log('Could not refresh access token (refreshToken is invalid or absent from your browser). So I will force log you out here... got this err when trying to refresh:', err.response);
            const options = {
              withCredentials: true,
            }
            // force log the user out, as they don't have a valid access token and they either don't have a refresh token or they do but it's invalid
            await axios.get('http://localhost:5000/refreshEnabled/logout', options)
            .then((res) => {
                console.log('Successfully logged out!');
                setUser(null); 
                localStorage.clear();
            })
            .catch(async(err) => {
                console.log(err.response);
            })
          })
        }
        // 400 - access token found and valid, but there was an error when hitting /getUser with the id taken from the access token
        else {
          console.log('Access token valid, but could not find a user with the ID attached to it:', err.response);
        }
      })
    }
    // no access token found in local storage
    else {
      const options = {
        withCredentials: true
      }
      // attempt to refresh a new access token
      await axios.get('http://localhost:5000/refreshEnabled/refresh', options)
      // refresh successful
      .then(async(res) => {
        console.log('No access token was found, but refresh token exists and is valid, so refreshing you a new access token and storing it in local storage...', res);
        const newAccessToken = res.data.accessToken;
        localStorage.setItem('accessToken', JSON.stringify(newAccessToken));
        const options = {
          withCredentials: true,
          headers: {
              Authorization: 'Bearer ' + newAccessToken
          }
        }
        // hit /getUser again with the newly refreshed access token
        await axios.get('http://localhost:5000/getUser', options)
        .then((res) => {
          console.log('After refreshing your access token (after not having one at all) and GETting getUser again, successfully got user details:', res.data);
          setUser(res.data);
        })
        .catch((err) => {
          console.log('After refreshing your access token (after not having one at all) and GETting getUser again, got err:', err.response);
        })
      })
      // refresh was unsuccessful
      .catch(async(err) => {
        // refresh was unsucessful because the no refresh token was found
        if (err.response.status === 401) {
          console.log('No access token was found, and no refresh token was found, so I will force log you out here... got this err when trying to refresh:', err.response);
          const options = {
            withCredentials: true,
          }
          // force log the user out, as they don't have an access token or a refresh token
          await axios.get('http://localhost:5000/refreshEnabled/logout', options)
          .then((res) => {
              console.log('Successfully logged out!');
              setUser(null);
              localStorage.clear();
          })
          .catch(async(err) => {
              console.log(err.response);
          })
        }
        // refresh was unsuccessful because refresh token was found, but not valid
        else {
          console.log('No access token was found. A refresh token was found, but it is invalid, so I will force log you out here... got this err when trying to refresh using the found refresh token:', err.response);
          const options = {
              withCredentials: true,
          }
          // force log the user out, as they don't have an access token or a valid refresh token
          await axios.get('http://localhost:5000/refreshEnabled/logout', options)
          .then((res) => {
              console.log('Successfully logged out!');
              setUser(null);
              localStorage.clear();
          })
          .catch(async(err) => {
              console.log(err.response);
          })
        }
      })
    }

  };