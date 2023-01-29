const models = require('../models');
const Promise = require('bluebird');


//Check for session cookie
//If cookie doesn't exist, make new session
//If cookie exist, attempt to load session from DB
//If session doesnt exist, create a new session
//Else if cookies and session exist, set session on req object

module.exports.createSession = (req, res, next) => {
  //This converts anything from string or promise to a promise chain
  Promise.resolve(req.cookies.shortlyid)
    .then ((hash) => {
      if (!hash) {
        throw hash;
      }
      return models.Sessions.get ({hash});
    })
    .then ((session) => {
      if (!session) {
        throw session;
      }
      return session;
    })
    .catch (() => {
      return models.Sessions.create()
        .then(results => {
          return models.Sessions.get({id: results.insertId});
        })
        .then(session => {
          res.cookie('shortlyid', session.hash);
          return session;
        });
    })
    .then ((session) => {
      req.session = session;
      next();
    });


};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/


module.exports.verifySession = function (req, res, next) {
  if (models.Sessions.isLoggedIn(req.session)) {
    next();
  } else {
    res.redirect('/login');
  }
};

// let createNewSession = () => {
//   models.Sessions.create() //creates a new hash in session table
//     .then((data) => {
//       models.Sessions.get({id: data.insertId})
//         .then((data) => {
//           req.session = {hash: data.hash};
//           res.cookie('shortlyid', data.hash);
//           //TEST SUITE
//           models.Users.get({username: req.body.username})
//             .then((data) => {
//               if ((data !== undefined) && data.id) { //if username exists
//                 models.Sessions.update({hash: req.session.hash}, {userId: data.id}) //update the sessions table
//                   .then ((data)=>{
//                     //now that the sessions table and users table have a matching username id, the user is def logged in
//                     //now we should put that username in req.session.user = req.body.username
//                     req.session.user = true;
//                     next();
//                   })
//                   .catch((error) => {
//                     console.log('Could not update sessions table  ', error);
//                     next();
//                   });
//               } else {
//                 console.log('username was not found');
//                 next();
//               }
//             }) //TEST SUITE
//             .catch((error) => {
//               console.log('could not check if username exists ', error);
//             });
//         })
//         .catch((error) => {
//           console.log('Could not get data from sessions table:  ', error);
//           next();
//         });
//     });
// };

// if ((req.cookies === undefined) || !Object.keys(req.cookies).length) {
//   createNewSession();
// } else {
//   //if there are cookies already
//   const hashValue = req.cookies.shortlyid;
//   models.Sessions.get({hash: hashValue})
//     .then ((data) => {
//       if (!data) {
//         createNewSession();
//       } else {
//         req.session = data;
//         next();
//       }
//     })
//     .catch ((error) => {
//       console.log('Could not get data from sessions table:  ', error);
//       req.session = {hash: ''};
//       next();
//     });
// }