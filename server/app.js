const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const Cookie = require('./middleware/cookieParser');
const Auth = require('./middleware/auth');
const models = require('./models');
const app = express();


/******************************************************/
//          Initialization of Express
/******************************************************/

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(Cookie);
app.use(Auth.createSession);


//https://stackoverflow.com/questions/31928417/chaining-multiple-pieces-of-middleware-for-specific-route-in-expressjs
app.get('/', Auth.verifySession, (req, res) => {
  res.render('index');
});

app.get('/create', Auth.verifySession, (req, res) => {
  res.render('index');
});


app.get('/links', Auth.verifySession, (req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.post('/links', Auth.verifySession,
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/

/* Add routes to your Express server to process incoming POST requests. These routes should enable a user to register for a new account and for users to log in to your application. Take a look at the login.ejs and signup.ejs templates in the views directory to determine which routes you need to add. */

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', (req, res, next) => {
//check for user
  //if exists, redirect to /signup
//Create a user
//Upgrade session / addosciate with user
//Redirect to / route
  models.Users.get({username: req.body.username})
    .then ((user) => {
      if (user) {
        throw user;
      }
      return models.Users.create({username: req.body.username, password: req.body.password});
    })
    .then (results => {
      return models.Sessions.update({ hash: req.session.hash }, { userId: results.insertId });
    })
    .then(user => {
      res.redirect('/');
    })
    .catch(user => {
      res.redirect('/signup');
    });
});

app.post('/login', (req, res, next) => {
  //find user by username
  //if !found or !valid password
  //redirect to /login
  //otherwise
  //redirecto to /

  models.Users.get({username: req.body.username})
    .then((user)=> {
      if (!user || !models.Users.compare(req.body.password, user.password, user.salt)) {
        throw user;
      }
      return models.Sessions.update({hash: req.session.hash}, {userId: user.insertId});
    })
    .then(() => {
      res.redirect('/');
    })
    .catch(() => {
      res.redirect('/login');
    });

});


app.get('/logout', (req, res, next) => {
  return models.Sessions.delete({hash: req.session.hash})
    .then(() => {
      res.clearCookie('shortlyid');
      res.redirect('/login');
    })
    .catch((err) => {
      console.log('Can\'t log out    ', err);
      res.status(500).send(err);
    });
});


/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
