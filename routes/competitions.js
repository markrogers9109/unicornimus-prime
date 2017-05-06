const express = require('express');
const mongoose = require('mongoose');
const shortId = require('shortid');
const Promise = require('bluebird');

const Competition = mongoose.model('Competition');
const router = express.Router();
const Team = mongoose.model('Team');
const User = mongoose.model('User');

router.post('/', (req, res, next) => {
  Promise.coroutine(function* () {
    const comp = {
      name: req.body.compName,
      code: shortId.generate(),
      startTime: req.body.startDate,
      endTime: req.body.endDate,
      goal: req.body.goal,
    };
    const newComp = new Competition(comp);

    const team = yield Team.findOne({ name: req.body.team.name });
    let compSave = yield newComp.save();

    team.competitions.push(compSave._id);
    compSave.teams.push(team._id);
    compSave.admin.push(team.admin);

    const teamSave = yield team.save();
    compSave = yield newComp.save();

    return res.json({
      competition: compSave,
      team: teamSave,
    });
  })(req, res, next);
});

router.post('/singleComp', (req, res, next) => {
  const comp = {
    name: req.body.compName,
    code: shortId.generate(),
    startTime: req.body.startDate,
    endTime: req.body.endDate,
    goal: req.body.goal,
    description: req.body.description,
    organization: req.body.organization,
  };

  const newComp = new Competition(comp);
  const myUser = User.findOne({ email: req.body.user });
  const userTeam = Team.findOne({ name: req.body.teamName });
  const compSave = newComp.save();

  Promise.all([userTeam, compSave, myUser])
    .then(results => {
      results[0].competitions.push(compSave._id);
      results[1].admin.push(results[2]._id);
      results[1].teams.push(results[0]._id);

      const teamSave = results[0].save();
      const competitionSave = results[1].save();

      Promise.all([teamSave, competitionSave])
        .then(data => {
          res.json(data);
        })
        .catch(next);
    })
    .catch(next);
});

router.get('/', (req, res, next) => {
  Competition.find({})
    .populate('teams')
    .exec((err, competitions) => res.json(competitions))
    .catch(next);
});


router.get('/:id', (req, res, next) => {
  Competition.findOne({ _id: req.params.id })
    .populate('teams')
    .populate('admin')
    .exec((err, competition) => res.json(competition))
    .catch(next);
});

router.get('/userComps/:userName', (req, res, next) => {
  Promise.coroutine(function* () {
    const user = yield User.findOne({username: req.params.userName})
                        .populate('teams')
                        .exec();

    const competitionArray = [];

    user.teams.forEach(team => {
      team.competitions.forEach(competition => competitionArray.push(competition));
    });

    const competitions = yield Competition.find({_id: {$in: competitionArray}})
                                .populate('teams')
                                .exec();

    return res.json(competitions);
  })(req, res, next);
});

router.get('/bycode/:code', (req, res, next) => {
  Competition.findOne({code: req.params.code})
                        .populate('teams')
                        .populate('admin')
                        .exec()
    .then(competition => res.json(competition))
    .catch(next);
});


router.put('/create_new', (req, res, next) => {
  const challengerPromise = User.find({ admin: { $in: req.body.users } });
  const challengedPromise = Team.find({ admin: { $in: req.body.teams } });
  const compTeamsPromise = [challengerPromise, challengedPromise];
  const teamMembersPromise = User.find({ users: { $in: req.body.teams.users } });

  Promise.all([compTeamsPromise, teamMembersPromise])
    .then(results => results)
    .catch(next);
});

router.put('/accept', (req, res, next) => {
  Promise.coroutine(function* () {
    const findComp = yield Competition.findOne({ name: req.body.competition });
    const findTeam = yield Team.findOne({ _id: req.body.team });

    findComp.validation = true;
    findComp.teams.push(findTeam._id);
    findComp.admin.push(findTeam.admin);
    findTeam.competitions.push(findComp._id);

    const teamSave = yield findTeam.save();
    const compSave = yield findComp.save();

    return res.json({
      competition: compSave,
      team: teamSave,
    });
  })(req, res, next);
});

router.delete('/decline/:name', (req, res, next) => {
  Competition.findOne({ name: req.params.name })
    .then(comp => {
      comp.deleted = true;
      comp.save()
        .then(result => {
          res.json(result);
        })
        .catch(next);
    })
    .catch(next);
});

router.put('/bycode', (req, res, next) => {
  Promise.coroutine(function* () {
    const compPromise = yield Competition.findOne({ code: req.body.comp });
    const teamPromise = yield Team.findOne({ _id: req.body.team });

    if(compPromise && teamPromise){
      compPromise.teams.push( teamPromise._id );
      teamPromise.competitions.push( compPromise._id );

      const compSave = yield compPromise.save();
      const teamSave = yield teamPromise.save();

      return res.json({
        team: teamSave,
        competition: compSave,
      });
    } else return res.send("Error adding your team to the competition");

  })(req, res, next);
});

module.exports = router;
