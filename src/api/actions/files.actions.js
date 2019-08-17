import { each } from 'lodash';
import fs from 'fs';

const { fileUpload } = require('../../config/vars');

const APIError = require('../utils/APIError');
const httpStatus = require('http-status');

module.exports = {
  /**
     * @api {all} v1/dispatch/upload File Upload
     * @apiDescription upload file on server
     * @apiVersion 1.0.0
     * @apiName file upload
     * @apiGroup Dispatch
     * @apiPermission public or private or role based
     *
     * @apiHeader {String} Authorization  User's access token required for public or role based api
     * @apiHeader {String} content-type   multipart/form-data
     *
     * @apiParam  {file}      FileName     file data with file name field
     * @apiParam  {String}    bucket       specify the bucket name based on buckets provided in server config
     *
     * @apiSuccess (Done 200) {Object}  response    response object
     *
     * @apiError (Bad Request 400)   ValidationError  Some parameters may contain invalid values
     * @apiError (Unauthorized 401)  Unauthorized     Only authenticated users
     * @apiError (Forbidden 403)     Forbidden        You are not allowed to access this API
  */
  upload: {
    public: false,
    dispatch: async ({
      params, user, getModel, dispatch,
    }) => {
      const { files, bucket } = params;
      if (files) {
        const allPromises = [];
        const permissions = fileUpload.buckets && fileUpload.buckets[bucket] && fileUpload.buckets[bucket].permissions.write;
        const isValidRequest = permissions && (permissions.indexOf('ANY') !== -1 || permissions.indexOf(user.role) !== -1);
        if (isValidRequest) {
          if ((!fileUpload.type || fileUpload.type === 'local') && fileUpload.buckets[bucket]) {
            const subfolderPath = bucket;
            return new Promise((presolve, preject) => {
              fs.exists(`${appRoot}/uploads/${subfolderPath}`, (exists) => {
                if (!exists) {
                  fs.mkdirSync(`${appRoot}/uploads/${subfolderPath}`);
                }
                each(Object.keys(files), (file) => {
                  allPromises.push(new Promise((resolve, reject) => {
                    files[file].mv(`${appRoot}/uploads/${subfolderPath}/${Date.now()}-${files[file].name}`, (err) => {
                      if (err) {
                        reject(err);
                      } else {
                        resolve({ [file]: `${subfolderPath}/${Date.now()}-${files[file].name}` });
                      }
                    });
                  }));
                });
                presolve(true);
              });
            }).then(_ => Promise.all(allPromises).then((values) => {
              console.log(values);
              return values;
            }));
          } else if (fileUpload.type === 'db' && fileUpload.buckets[bucket]) {
            each(Object.keys(files), (file) => {
              allPromises.push(new Promise((resolve, reject) => {
                const filename = `${bucket}/${files[file].name}`;

                const writestream = gfs.createWriteStream({ filename });
                fs.createReadStream(files[file].tempFilePath).pipe(writestream);
                writestream.on('close', (savedFile, err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve({ [file]: savedFile });
                  }
                });
              }));
            });
            return Promise.all(allPromises).then((values) => {
              console.log(values);
              return values;
            });
          }
        }
        const apiError = new APIError({
          message: 'Unauthorized',
          status: httpStatus.FORBIDDEN,
          stack: undefined,
        });

        throw apiError;
        // else if (fileUpload.type == 'db') {

        // }
      }
    },
  },
};
