const express = require('express');
const mongoose = require('mongoose');
const shortId = require('shortid');
const mailgun = require('mailgun-js')({
  apiKey: process.env.MAILGUN_API,
  domain: process.env.MAILGUN_URL
});
const passport = require('passport');

const router = express.Router();
const User = mongoose.model('User');
const Reset = mongoose.model('ResetSchema');
const Promise = require('bluebird');

router.post('/login',
  passport.authenticate('local' ,
  {
    successRedirect: '/users/loggedIn',
    failureRedirect: '/users/loginError'
  }));

router.get('/loggedIn', (req, res, next) => {
  res.sendStatus(200);
});

router.get('/loginError', (req, res, next) => {
  res.json({message: 'Invalid email / password'})
});

router.get('/logout', (req, res, next) => {
  req.session.destroy();
  res.redirect('/#!/login');
});

router.get('/details', (req, res, next) => {
  if (req.session.passport) {
    let myUser = req.session.passport;
    User.findOne({ _id: myUser.user._id })
      .populate('teams')
      .populate('challenges')
      .exec((err, user) => res.json(user))
      .catch(next);
  } else {
    res.sendStatus(401);
  }
});

router.get('/details/:id', (req, res, next) => {
  User.findOne({ _id: req.params.id })
    .then(user => {
      res.json(user);
    })
    .catch(next);
});

router.get('/search/:username', (req, res, next) => {
  User.find({username: {'$regex': req.params.username, '$options': 'ix'}})
    .then( users => {
      res.json(users);
    })
    .catch(next);
});

router.get('/details/user/:username', (req, res, next) => {
  User.findOne({ username: req.params.username })
    .then(user => {
      res.json(user);
    })
    .catch(next);
});

router.post('/contact', (req, res, next) => {
  mailgun.messages().send(req.body, error => { // TODO: do something with this errorp
    res.sendStatus(200);
  })
  .catch(next);
});

// router.post('/teamInvite', (req, res, next) => {
//   let configureList = '';
//
//   req.body.emailList.forEach( (email, index) => {
//     if(index === req.body.emailList.length - 1) configureList += email;
//     else configureList += email + ',';
//   });
//
//   mailgun.messages().send({
//     from: req.body.user.email,
//     to: configureList,
//     subject: `Join me in helping Fresno save water!`,
//     html: `<p>Hey! We would love for you to join us in saving water! Looks like a friend wants you on their team, click <a href="http://localhost:3000/#!/profile">here!</a> to join them!</p>`,
//   }, error => {
//     res.sendStatus(200);
//   })
//   .catch(next);
// });

// router.post('/registerInvite', (req, res, next) => {
//   let configureList = '';
// 
//   req.body.emailList.forEach( (email, index) => {
//     if(index === req.body.emailList.length - 1) configureList += email;
//     else configureList += email + ',';
//   });
//
//   mailgun.messages().send({
//     from: req.body.user.email,
//     to: configureList,
//     subject: `Join me in helping Fresno save water!`,
//     html: `<p>Hey! We would love for you to join us in saving water! It looks like you might not be signed up yet. If you want to register you can click <a href="http://localhost:3000/#!/register">here!</a>, once your done registering login and go to your profile page to accept the team invitation!`,
//   }, error => {
//     res.sendStatus(200);
//   })
//   .catch(next);
// });

router.post('/getAllById', (req, res, next) => {
  User.find({_id: {$in: req.body.users}})
    .then(users => res.json(users))
    .catch(next);
});

router.post('/getAllByEmail', (req, res, next) => {
  const emailList = [];

  for(const key in req.body){
    emailList.push(req.body[key]);
  }

  User.find({email: {$in: emailList }})
    .then(users => {
      res.json(users);
    })
    .catch(next);
});

router.post('/resetPasswordRequest', (req, res, next) => {
    User.findOne({email: req.body.userEmail})
        .then(user => {
            const reset = new Reset({
                user,
                code: shortId.generate(),
            })
            reset.save()
            .then(reset => {
                mailgun.messages().send({
                  from: 'fab5.no.reply@gmail.com',
                  to: reset.user.email,
                  subject: `Fab5 Password Reset`,
                  html: `<p>Click <a href="http://localhost:3000/#!/resetPassword/${reset.code}">here</a> to reset your password</p><p>If you did not request to reset your password, please ignore this email.</p>`,
                }, error => {
                  res.sendStatus(200);
                })
                .catch(next);
            })
            .catch(next);
        })
        .catch(next);
});

router.post('/createChallenge', (req, res, next) => {
  const newChallenge = req.body;
  Promise.coroutine(function* () {
    let challengedUser = yield User.findOne({username: req.body.user.username});
    let challenger = yield User.findOne({username: req.body.challenger.username});

    const challenge = {
      name: req.body.name,
      users: [challenger._id, challengedUser._id],
      startTime: req.body.startDate,
      endTime: req.body.endDate,
      goal: req.body.goal,
      description: req.body.description,
    }

    let newChallenge = new Challenge(challenge);

    let challengeSave = yield newChallenge.save();

    challengedUser.challenges.push(challengeSave._id);

    yield challengedUser.save();

    return res.json(challengeSave);
  })(req, res, next);
});

router.put('/resetPassword', (req, res, next) => {
    Reset.findOne({code: req.body.code})
        .populate('user')
        .exec()
        .then(resetObject => {
            const user = resetObject.user;
            user.password = req.body.newPassword;
            user.save()
                .then(updatedUser => res.json(updatedUser))
                .catch(next);
        })
        .catch(next);
});

router.put('/validateTeam', (req, res, next) => {
  Promise.coroutine(function* () {
    let team = yield Team.findOne({ _id: req.body._id });
    let member = yield User.findOne({ username: req.body.user.username });

    member.teams.push( req.body._id );
    team.validation = true;

    let memberSave = yield member.save();
    let teamSave = yield team.save();

    return res.json(teamSave);
  })(req, res, next);
});

router.put('/validateChallenge', (req, res, next) => {
  Promise.coroutine(function* () {
    let challenge = yield Challenge.findOne({ _id: req.body._id });
    let challenger = yield User.findOne({ _id: req.body.users[0] });

    challenger.challenges.push( req.body._id );
    challenge.validation = true;

    let userSave = yield challenger.save();
    let challengeSave = yield challenge.save();

    return res.json(challengeSave);
  })(req, res, next);
});

router.delete('/declineChallenge/:id', (req, res, next) => {
  Promise.coroutine(function* () {
    let challenge = yield Challenge.findOne({ _id: req.params.id });
    let user = yield User.findOne({ _id: challenge.users[1] });

    user.challenges.remove( challenge._id );
    challenge.remove( challenge._id );

    let userSave = yield user.save();

    return res.json(userSave);
  })(req, res, next);
});

module.exports = router;
