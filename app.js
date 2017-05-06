const database = require('./mongodb/mongo');

database.init();

// Getting mongoose models
require('./mongodb/schemas/user.schema');
require('./mongodb/schemas/reset_password.schema');

const express = require('express'),
  path = require('path'),
  logger = require('morgan'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  session = require('express-session'),
  passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Promise = require('bluebird'),
  comparePassword = Promise.promisify(require('bcrypt').compare),
  mongoose = require('mongoose'),
  users = require('./routes/users'),
  methodOverride = require('method-override'),
  app = express();

// View rendering, you can rip this out if your creating an API
app.use(methodOverride('_method'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'build')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// setup sessions
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
}));

// setup passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy((username, password, next) => {
  // look up the user by their username (email)
  const User = mongoose.model('User');
  User.findOne({ email: username })
    .then(user => {
      if (!user) {
        next();
      } else {
        // we have user
        // compare the user.password (hash) to the plain text password
        comparePassword(password, user.password)
          .then(result => {
            if (result) {
              next(null, user);
            } else {
              next();
            }
          })
          .catch(next);
      }
    })
    .catch(next);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use('/users', users);
app.listen(3000, () => {
  console.info(`Server up and running at http://localhost:${process.env.PORT || 3000}`);
});
