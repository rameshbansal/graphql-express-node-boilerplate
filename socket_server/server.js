const express = require('express');
const http = require('http');

const app = express();
const PORT = 7900;

const server = http.Server(app);
const graphqlRealTimeUpdates = require('./index');

graphqlRealTimeUpdates.configure(server, app);

server.listen(PORT, (() => {
  console.log(`socket server is running on port [${  PORT  }]`);
}));

