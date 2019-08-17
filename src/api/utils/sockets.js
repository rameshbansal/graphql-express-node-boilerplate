const { socket } = require('../../config/vars');

const _extends = Object.assign || function (target) { for (let i = 1; i < arguments.length; i++) { const source = arguments[i]; for (const key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const notifyGroupsOnSocket = function notifyGroupsOnSocket(groupIds, data) {
  const options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  console.log('socket', socket);
  if (!socket || !socket.host || !socket.port) {
    throw new Error('Socket info not found in config to notify groups');
  }
  if (Array.isArray(groupIds)) {
    groupIds = JSON.stringify(groupIds);
  }
  const path = `/rest/notifyGroup?groupid=${groupIds}&data=${encodeURIComponent(JSON.stringify(data))}&options=${encodeURIComponent(JSON.stringify(options))}`;
  const service = {
    hostname: socket.host,
    port: socket.port,
    path,
    method: 'GET',
  };
  executeService(service);
};

const executeService = function executeService(service, params, options) {
  return new Promise(((resolve, reject) => {
    try {
      options = options || {};
      if (options && options.requestModule) {
        if (service && service.hostname) {
          const requestOptions = {
            headers: { 'user-agent': 'node.js' },
            rejectUnauthorized: false,
          };
          service.hostname = service.hostname.indexOf('http') === 0 ? service.hostname : `http://${service.hostname}`;
          const request = require('request');
          request(service.hostname, requestOptions, (error, response, body) => {
            if (!error && response.statusCode == 200) {
              resolve(body);
            } else {
              let errorInfo = error;
              if (!errorInfo && body) {
                try {
                  body = JSON.parse(body);
                  if (body.error && body.error.message) {
                    errorInfo = body.error.message;
                  }
                } catch (e) {
                  errorInfo = `Error in parsing json [${body}]`;
                }
              }
              reject(errorInfo);
            }
          });
        } else {
          reject(new Error(`hostname not found in service>>>>>>${JSON.stringify(service)}`));
        }
      } else {
        const QueryString = require('querystring');
        let http = require('http');
        if (options.https) {
          http = require('https');
        }
        const path = service.path;
        let queryString = '';
        if (params && Object.keys(params).length > 0) {
          queryString = QueryString.stringify(params);
        }
        const serverOptions = {
          hostname: service.hostname,
          port: service.port,
          path,
          method: service.method,
          headers: _extends({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': queryString.length,
          }, options.headers),
        };
        const req = http.request(serverOptions, (res) => {
          if (params && params.response) {
            res.setEncoding('binary');
          } else {
            res.setEncoding('utf8');
          }
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            resolve(body);
          });
        });
        req.on('error', (err) => {
          reject(err);
        });
        req.write(queryString);
        req.end();
      }
    } catch (err) {
      reject(err);
    }
  }));
};

module.exports = {
  executeService,
  notifyGroupsOnSocket,
};
