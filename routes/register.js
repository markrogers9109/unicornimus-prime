const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const User = mongoose.model('User');

router.post('/', (req, res, next) => {
  const user = {
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    username: req.body.username,
    email: req.body.email,
    phone: req.body.phone,
    organization: req.body.organization,
    password: req.body.password,
    code: 0 || req.body.code,
    points: 0,
  };
  const newUser = new User(user);

  newUser.save((err, user) => {
    if (err) {
      res.send(err);
    } else {
      res.json(user);
    }
  })
  .catch(next);
});

module.exports = router;
