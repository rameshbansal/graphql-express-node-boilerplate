const mongoose = require('mongoose');
const { mongo, env } = require('./vars');
const gridfs = require('gridfs-stream');
// set mongoose Promise to Bluebird
mongoose.Promise = Promise;
gridfs.mongo = mongoose.mongo;

// Exit application on error
mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err}`);
  process.exit(-1);
});

mongoose.connection.once('open', () => {
  global.gfs = gridfs(mongoose.connection.db);
});

// print mongoose logs in dev env
if (env === 'development') {
  mongoose.set('debug', true);
}

/**
* Connect to mongo db
*
* @returns {object} Mongoose connection
* @public
*/
exports.connect = () => {
  mongoose.connect(mongo.uri, {
    keepAlive: 1,
  });
  return mongoose.connection;
};
