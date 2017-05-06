const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = mongoose.model('User');
const Challenge = mongoose.model('Challenge');
const Promise = require('bluebird');
const TeamNotification = mongoose.model('TeamNotification');
const CompetitionNotification = mongoose.model('CompetitionNotification');
const oneVersusOneNotification = mongoose.model('UserChallengeNotification');

router.post('/createNew', (req, res, next) => {
  Promise.coroutine(function* () {
    const dataObject = req.body;

    let notification;
    if (dataObject.type === 'team') notification = new TeamNotification(dataObject);
    else if (dataObject.type === 'competition') notification = new CompetitionNotification(dataObject);
    else if (dataObject.type === '1v1') notification = new oneVersusOneNotification(dataObject);

    const notificationSave = yield notification.save();

    return res.json(notificationSave);
  })(req, res, next);
});

router.delete('/remove/:type/:id', (req, res, next) => {
  Promise.coroutine(function* () {
    let notification;

    if (req.params.type === 'team') notification = yield TeamNotification.findOne({_id: req.params.id});
    else if (req.params.type === 'competition') notification = yield CompetitionNotification.findOne({_id: req.params.id});
    else if(req.params.type === '1v1') notification = yield oneVersusOneNotification.findOne({_id: req.params.id});

    if (notification) {
      notification.deleted = true;
      const notificationSave = yield notification.save();
      return res.json(notificationSave);
    } else return res.json({message: "Could not find notification to delete."});

  })(req, res, next);
});

router.get('/getAll/:email', (req, res, next) => {
  Promise.coroutine(function* () {
    const teamNotifications = yield TeamNotification.find({email: req.params.email, deleted: false})
                                      .populate('link')
                                      .exec();
    const competitionNotifications = yield CompetitionNotification.find({email: req.params.email, deleted: false})
                                              .populate('competition')
                                              .populate('team')
                                              .exec();
    const oneVersusOneNotifications = yield oneVersusOneNotification.find({email: req.params.email, deleted: false})
                                              .populate('link')
                                              .exec();

    return res.json({
      teamNotifications,
      competitionNotifications,
      oneVersusOneNotifications,
    });
  })(req, res, next);
});

router.post('/createMultiple', (req, res, next) => {
  if (req.body.notifications[0].type === 'team') {
    TeamNotification.insertMany(req.body.notifications)
      .then(notifications => res.json(notifications))
      .catch(next);
  } else if (req.body.notifications[0].type === 'competition') {
    CompetitionNotification.insertMany(req.body.notifications)
      .then(notifications => res.json(notifications))
      .catch(next);
  } else next();
});

module.exports = router;
