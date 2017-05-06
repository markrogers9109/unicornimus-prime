'use strict';

const express = require('express');
const mongoose = require('mongoose');
const shortId = require('shortid');
const Promise = require('bluebird');

const router = express.Router();
const Team = mongoose.model('Team');
const User = mongoose.model('User');

/**
 * Disallow access if not logged in.
 */
router.use((req, res, next) => {
  if (!req.user) {
    res.redirect('/#!/login');
  } else {
    next();
  }
});

router.get('/', (req, res, next) => {
  Team.find({})
    .populate('users')
    .populate('admin')
    .populate('competitions')
    .exec((err, teams) => {
      res.json(teams);
    })
    .catch(next);
});

router.post('/', (req, res, next) => {
  Promise.coroutine(function* () {
    const user = yield User.findOne({ email: req.body.user.email });

    const team = {
      admin: user._id,
      name: req.body.name,
      description: req.body.description,
      users: user._id,
      code: shortId.generate(),
      lock: req.body.lock,
      gauge: req.body.gauge,
      points: req.body.points,
    };

    const newTeam = new Team(team);

    const teamSave = yield newTeam.save();

    user.teams.push(teamSave._id);

    const userSave = yield user.save();

    res.json(teamSave);
  })(req, res, next);
});

router.get('/:team', (req, res, next) => {
  Team.findOne({ _id: req.params.team })
    .populate('users')
    .populate('admin')
    .populate('competitions')
    .exec((err, team) => {
      res.json(team);
    })
    .catch(next);
});

router.post('/all', (req, res, next) => {
  Team.find({ _id: { $in: req.body.teams }})
    .populate('users')
    .exec((err, teams) => {
      res.json(teams);
    })
  .catch(next);
});

router.get('/byname/:name', (req, res, next) => {
  Team.findOne({ name: req.params.name })
    .populate('users')
    .populate('admin')
    .populate('competitions')
    .exec((err, team) => {
      res.json(team);
    })
    .catch(next);
});

router.put('/change-admin', (req, res, next) => {
  const userPromise = User.findOne({ _id: req.body.user });
  const teamPromise = Team.findOne({ _id: req.body.team });

  Promise.all([userPromise, teamPromise])
    .then(results => {
      const user = results[0];
      const team = results[1];

      team.admin = user._id;

      team.save()
        .then(result => res.json(result))
        .catch(next);
    })
    .catch(next);
});

router.put('/add-user', (req, res, next) => {
  const userPromise = User.findOne({ username: req.body.username });
  const teamPromise = Team.findOne({ name: req.body.name });

  Promise.all([userPromise, teamPromise])
    .then(results => {
      const user = results[0];
      const team = results[1];

      team.users.push(user._id);
      user.teams.push(team._id);

      const userSave = user.save();
      const teamSave = team.save();

      Promise.all([userSave, teamSave])
        .then(result => res.json(result))
        .catch(next);
    })
    .catch(next);
});

router.put('/remove-user', (req, res, next) => {
  const userPromise = User.findOne({ username: req.body.username });
  const teamPromise = Team.findOne({ name: req.body.name });

  Promise.all([userPromise, teamPromise])
    .then(results => {
      const user = results[0];
      const team = results[1];
      team.users.remove(user._id);
      user.teams.remove(team._id);
      const userSave = user.save();
      const teamSave = team.save();
      Promise.all([userSave, teamSave])
        .then(result => res.json(result))
        .catch(next);
    })
    .catch(next);
});

router.put('/join-team', (req, res, next) => {
  const userPromise = User.findOne({ _id: req.body.user, deleted: false });
  const teamPromise = Team.findOne({ name: req.body.teamName, deleted: false });

  Promise.all([userPromise, teamPromise])
    .then(results => {
      const user = results[0];
      const team = results[1];

      team.users.push(user._id);
      user.teams.push(team._id);

      const userSave = user.save();
      const teamSave = team.save();

      Promise.all([userSave, teamSave])
        .then(result => res.json({
          user: userSave,
          team: teamSave
        }))
        .catch(next);
    })
    .catch(next);
});

router.put('/bycode', (req, res, next) => {
  const userPromise = User.findOne({ email: req.body.user });
  const teamPromise = Team.findOne({ code: req.body.code });

  Promise.all([userPromise, teamPromise])
    .then(results => {
      const user = results[0];
      const team = results[1];

      team.users.push(user._id);
      user.teams.push(team._id);

      const userSave = user.save();
      const teamSave = team.save();

      Promise.all([userSave, teamSave])
        .then(result => res.json(result))
        .catch(next);
    })
    .catch(next);
});

router.put('/edit-team', (req, res, next) => {
  Promise.coroutine(function* () {
    const teamPromise = yield Team.findOne({ name: req.body.teamName });
    teamPromise.name = req.body.name;
    teamPromise.description = req.body.description;
    const editedTeam = yield teamPromise.save();

    return res.json(editedTeam);
  })(req, res, next);
});


module.exports = router;
