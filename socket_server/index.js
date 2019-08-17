let Utility = require('./src/Utility');
let Socket = require('./src/socket');

module.exports = {
  getRequestParams: Utility.getRequestParams,
  configure: Socket.configure,
  emitGroupUpdates: Socket.emitGroupUpdates,
};
