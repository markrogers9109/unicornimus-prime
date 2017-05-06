const mongoose = require('mongoose');

module.exports = {
  init: () => {
    mongoose.connect(process.env.MONGO_URL.replace('\r', ''));

    const db = mongoose.connection;

    db.on('open', () => console.info('Database connected.'));
    mongoose.Promise = require('bluebird');
  },
};
