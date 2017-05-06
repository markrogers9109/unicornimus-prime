'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');
const bcrypt = Promise.promisifyAll(require('bcrypt'));
const _ = require('lodash');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  phone: String,
  email: {
    type: String,
    required: true,
    validate: {
      validator: (value, callback) => {
        callback(/[a-zA-Z0-9]+@[a-zA-Z]+\.[a-zA-Z]+/.test(value));
      },
      message: '{VALUE} is not a valid email.',
    },
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  organization: String,
  code: { type: String },
  points: { type: Number, default: 0 },
  teams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
  messages: [],
  challenges: [{ type: Schema.Types.ObjectId, ref: 'Challenge' }],
  team_notifications: [{ type: Schema.Types.ObjectId, ref: 'Notification' }],
  competition_notifications: [{ type: Schema.Types.ObjectId, ref: 'Notification' }],
  deleted: { type: Boolean, default: false },
});

UserSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    next();
  } else {
    bcrypt.genSaltAsync(10)
      .then(salt => {
        bcrypt.hashAsync(this.password, salt)
          .then(hash => {
            this.password = hash;
            next();
          })
          .catch(next);
      })
      .catch(next);
  }
});

UserSchema.methods.toJSON = function () {
  return _.omit(this.toObject(), ['password', '__v']);
};

mongoose.model('User', UserSchema);
