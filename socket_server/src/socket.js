const Utility = require('./Utility');
const socket = require('socket.io');

let io = void 0;
const configure = function (server, app) {
  io = socket(server);
  io.on('connection', (socket) => {
    console.log(`connection created ::::${socket.id}`);

    // console.log("socket.id",socket.id);
    socket.emit('subscription_id', socket.id);

    socket.on('subscribe', (groups) => {
      joinGroup(socket.id, groups);
    });

    socket.on('unsubscribe', (groups) => {
      leaveGroup(socket.id, groups);
    });
  });


  app.all('/rest/notifyGroup', (req, res) => {
    try {
      const requestParams = Utility.getRequestParams(req);
      const groupId = parseJSON(requestParams.groupid);
      const data = parseJSON(requestParams.data);
      const options = parseJSON(requestParams.options);
      emitGroupUpdates(groupId, data, options);
      res.send({ status: 200, message: 'Update Successfully' });
    } catch (error) {
      res.send({ status: 400, message: error.message });
    }
  });
};
const parseJSON = (data) => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (err) {
      return data;
    }
  } else {
    return data;
  }
};

const emitGroupUpdates = (groups, update, options) => {
  options = options || {};
  if (groups instanceof Array) {
    groups.forEach((group) => {
      io.to(group).emit('updateInRow', { group, data: update, options });
    });
  } else {
    io.to(groups).emit('updateInRow', { group: groups, data: update, options });
  }
};


const joinGroup = (socketId, groups) => {
  const socket = io.sockets.sockets[socketId];
  if (socket) {
    if (groups instanceof Array) {
      groups.forEach((group) => {
        socket.join(group);
      });
    } else {
      socket.join(groups);
    }
  }
};

const leaveGroup = (socketId, groups) => {
  const socket = io.sockets.sockets[socketId];
  if (socket) {
    if (groups instanceof Array) {
      groups.forEach((group) => {
        socket.leave(group);
      });
    } else {
      socket.leave(groups);
    }
  }
};


module.exports = {
  configure,
  emitGroupUpdates,

};
