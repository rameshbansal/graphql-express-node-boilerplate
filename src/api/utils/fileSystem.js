import fs from 'fs';

const httpStatus = require('http-status');
const APIError = require('./APIError');

// import Constants from '../Constant';
// import Utilities from '../Utilities';


// let upload = (files, path) => {
//   if (!path || !fs.existsSync(path)) {
//     throw Utilities.getErrorInstance(Constants.ERROR_CODES.FILE_SYSTEM.INVALID_PATH, { path });
//   }
//   if (!Array.isArray(files)) {
//     files = [files];
//   }
//   let result = [];
//   return Utilities.iterator(files, (index, file) => {
//     let { data, filename, name } = file;
//     const fileKey = name || filename;
//     let filePath = `${path  }/${  fileKey}`;
//     result.push({ key: fileKey, name: filename });
//     return write(filePath, data);
//   }).then(_ => result);
// };

// var write = (path, fileContent) => new Promise((resolve, reject)=> {
//         fs.open(path, 'ax', (err, fd) => {
//             if (err) {
//                 reject(err);
//                 return;
//             }
//             return Utilities.iterator(fileContent, (i, data)=> {
//                 return new Promise((res, rej)=> {
//                     let len = data.length;
//                     let offset = 0;
//                     fs.write(fd, data, offset, len, err=> {
//                         if (err) {
//                             rej(err);
//                             return;
//                         }
//                         offset = len;
//                         res();
//                         return;
//                     })
//                 })
//             }).then(_=> {
//                 resolve(fs.close(fd));
//             }).catch(err=> {
//                 reject(err);
//             })
//         })
//     });

const download = (path) => {
  console.log('path', path);
  console.log(__dirname);
  if (!path || !fs.existsSync(path)) {
    throw new APIError({
      message: 'invalid path',
      status: httpStatus.BAD_REQUEST,
      stack: undefined,
    });
  }
  if (!path) {
    throw new APIError({
      message: 'path is required',
      status: httpStatus.BAD_REQUEST,
      stack: undefined,
    });
  }
  const filePath = `${path}`;
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
};

// let removeFile = (fileKeys, path) => {
//   if (!Array.isArray(fileKeys)) {
//     fileKeys = [fileKeys];
//   }
//   return Utilities.iterator(fileKeys, (index, fileKey) => {
//     let filePath = `${path  }/${  fileKey}`;
//     return new Promise((resolve, reject) => {
//       fs.unlink(filePath, (err) => {
//         if (err) {
//           reject(err);
//           return;
//         }
//         resolve();
//       });
//     });
//   });
// };


module.exports = {
//   upload,
  download,
//   removeFile,
};
