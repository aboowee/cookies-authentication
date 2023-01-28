const models = require('../models');
const Promise = require('bluebird');

// In middleware/auth.js, write a createSession middleware function that accesses the parsed cookies on the request, looks up the user data related to that session, and assigns an object to a session property on the request that contains relevant user information. (Ask yourself: what information about the user would you want to keep in this session object?)

// An incoming request with no cookies should generate a session with a unique hash and store it the sessions database. The middleware function should use this unique hash to set a cookie in the response headers. (Ask yourself: How do I set cookies using Express?).

// If an incoming request has a cookie, the middleware should verify that the cookie is valid (i.e., it is a session that is stored in your database).

// If an incoming cookie is not valid, what do you think you should do with that session and cookie?



module.exports.createSession = (req, res, next) => {
  let createNewSession = () => {
    models.Sessions.create() //creates a new hash in session table
      .then((data) => {
        models.Sessions.get({id: data.insertId})
          .then((data) => {
            req.session = {hash: data.hash};
            res.cookie('shortlyid', data.hash);
            //TEST SUITE
            models.Users.get({username: req.body.username})
              .then((data) => {
                if ((data !== undefined) && data.id) { //if username exists
                  models.Sessions.update({hash: req.session.hash}, {userId: data.id}) //update the sessions table
                    .then ((data)=>{
                      //now that the sessions table and users table have a matching username id, the user is def logged in
                      //now we should put that username in req.session.user = req.body.username
                      req.session.user = true;
                      next();
                    })
                    .catch((error) => {
                      console.log('Could not update sessions table  ', error);
                      next();
                    });
                } else {
                  console.log('username was not found');
                  next();
                }
              }) //TEST SUITE
              .catch((error) => {
                console.log('could not check if username exists ', error);
              });
          })
          .catch((error) => {
            console.log('Could not get data from sessions table:  ', error);
            next();
          });
      });
  };

  if ((req.cookies === undefined) || !Object.keys(req.cookies).length) {
    createNewSession();
  } else {
    //if there are cookies already
    const hashValue = req.cookies.shortlyid;
    models.Sessions.get({hash: hashValue})
      .then ((data) => {
        if (!data) {
          createNewSession();
        } else {
          req.session = data;
          next();
        }
      })
      .catch ((error) => {
        console.log('Could not get data from sessions table:  ', error);
        req.session = {hash: ''};
        next();
      });
  }

};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

/* module.exports.createSession = (req, res, next) => {
  console.log('the name is: ', req.body.username);

  let createNewSession = () => {
    models.Sessions.create() //creates a new hash in session table
      .then((data) => {
        console.log('entered new session with ', req.body.username);
        models.Sessions.get({id: data.insertId})
          .then((data) => {
            req.session = {hash: data.hash};
            res.cookie('shortlyid', data.hash);

            //TEST SUITE
            models.Users.get({username: req.body.username}) //vivian got no home here somehow
              .then((data) => {
                console.log('here is the data: ', data);
                if ((data !== undefined) && data.id) { //if username exists
                  console.log('the username before updating sessions is', req.body.username);
                  models.Sessions.update({hash: req.session.hash}, {userId: data.id}) //update the sessions table
                    .then ((data)=>{
                      console.log('just updated sessions, returned: ', data);
                      next();
                    })
                    .catch((error) => {
                      console.log('Could not update sessions table  ', error);
                      next();
                    });
                } else {
                  console.log('username was not found');
                  next();
                }
              }) //TEST SUITE
              .catch((error) => {
                console.log('could not check if username exists ', error);
              });
          })
          .catch((error) => {
            console.log('Could not get data from sessions table:  ', error);
            next();
          });
      });
  };

  if ((req.cookies === undefined) || !Object.keys(req.cookies).length) {
    createNewSession();
  } else {
    //if there are cookies already
    const hashValue = req.cookies.shortlyid;
    models.Sessions.get({hash: hashValue})
      .then ((data) => {
        if (!data) {
          createNewSession();
        } else {
          req.session = data;
          console.log('the username is ', req.body.username);
          next();
        }
      })
      .catch ((error) => {
        console.log('Could not get data from sessions table:  ', error);
        req.session = {hash: ''};
        next();
      });
  }

}; */