import mongooseModel from '../../configure/mongoose.model';
import API_STORE from '../../configure/api.store';
import { authWrapper } from '../../middlewares/auth';
import { download } from '../../utils/fileSystem';

const { fileUpload } = require('../../../config/vars');
const APIError = require('../../utils/APIError');
const httpStatus = require('http-status');
const { omit } = require('lodash');

/**
 * Get user
 * @public
 */
exports.get = async ({
  query, body, params, user, access,
}) => {
  console.log('query, body, params, user,', query, body, params, user, access);
  try {
    const Collection = mongooseModel.getCollection(params.collection);
    const data = mongooseModel.queryMakerAndValidator({ access, user, reqParams: { ...query, ...params, ...body } });
    const users = await Collection.get(data);
    // const transformedUsers = users.map(user => user.transform());
    return users;
  } catch (error) {
    throw error;
  }
};


/**
 * Create new user
 * @public
 */
exports.create = async ({
  query, body, params, user, access,
}) => {
  console.log('query, body, params, user, access', query, body, params, user, access);
  try {
    const Collection = mongooseModel.getCollection(params.collection);
    const data = mongooseModel.insertMakerAndValidator({
      access, data: body, user, reqParams: { ...query, ...params },
    });
    const collectionInstance = new Collection(data);
    const dataSaved = await collectionInstance.save();
    return dataSaved;
  } catch (error) {
    throw error;
  }
  // catch (error) {
  //   throw User.checkDuplicateEmail(error);
  // }
};

/**
 * Replace existing user
 * @public
 */
exports.replace = async (Collection, user, newUserData) => {
  try {
    const newUser = new Collection(newUserData);
    const ommitRole = user.role !== 'admin' ? 'role' : '';
    const newUserObject = omit(newUser.toObject(), '_id', ommitRole);

    await user.update(newUserObject, { override: true, upsert: true });
    const savedUser = await User.findById(user._id);

    return savedUser.transform();
  } catch (error) {
    throw error;
  }
  // catch (error) {
  //   throw User.checkDuplicateEmail(error);
  // }
};

/**
 * Update existing user
 * @public
 */
exports.update = async ({
  query, body, params, user, access,
}) => {
  try {
    const Collection = mongooseModel.getCollection(params.collection);
    const data = mongooseModel.setterMakerAndValidator({ access, user, reqParams: { ...query, ...params, ...body } });
    const users = await Collection.update(data.filter, data.setter, { multi: true });
    const updatedData = await Collection.get({ filter: data.filter });
    console.log('updatedDataupdatedData', updatedData);
    return updatedData && updatedData.length && updatedData[0];
  } catch (error) {
    throw error;
  }
  // catch (error) {
  //   throw User.checkDuplicateEmail(error);
  // }
};

/**
 * Get user list
 * @public
 */
exports.list = async ({
  query, body, params, user, access,
}) => {
  console.log('query, body, params, user,', query, body, params, user, access);
  try {
    const Collection = mongooseModel.getCollection(params.collection);
    const data = mongooseModel.queryMakerAndValidator({ access, user, reqParams: { ...query, ...params, ...body } });
    const users = await Collection.get(data);
    // const transformedUsers = users.map(user => user.transform());
    return users;
  } catch (error) {
    throw error;
  }
};

/**
 * Get documents count
 * @public
 */
exports.count = async ({
  query, body, params, user, access,
}) => {
  console.log('query, body, params, user,', query, body, params, user, access);
  try {
    const Collection = mongooseModel.getCollection(params.collection);
    const data = mongooseModel.queryMakerAndValidator({ access, user, reqParams: { ...query, ...params, ...body } });
    const count = await Collection.getCount(data);
    // const transformedUsers = users.map(user => user.transform());
    return { count };
  } catch (error) {
    throw error;
  }
};

/**
 * Delete user
 * @public
 */
exports.remove = async ({
  query, body, params, user, access,
}) => {
  console.log('query, body, params, user,', query, body, params, user, access);
  try {
    const Collection = mongooseModel.getCollection(params.collection);
    const data = mongooseModel.queryMakerAndValidator({ access, user, reqParams: { ...query, ...params, ...body } });
    const users = await Collection.remove(data.filter);
    // const transformedUsers = users.map(user => user.transform());
    console.log('users', users);
    return users;
  } catch (error) {
    throw error;
  }
};

/**
 * Dispatch action
 * @public
 */
exports.actionHandler = async (req, resp, next) => {
  try {
    const users = await API_STORE.dispatch(req.params.action, req, resp);
    return users;
  } catch (error) {
    throw error;
  }
};

/**
 * get file
 * @public
 */
exports.fileHandler = async (req, resp, next) => {
  try {
    const auth = authWrapper();
    return new Promise((resolve, reject) => {
      auth(req, resp, async (error, _) => {
        let { filename, bucket } = req.params;
        const permissions = fileUpload.buckets[bucket] && fileUpload.buckets[bucket].permissions.read;
        const isValidRequest = permissions.indexOf('ANY') !== -1 || permissions.indexOf(user.role) !== -1;
        if (isValidRequest) {
          if (fileUpload.type == 'local') {
            try {
              console.log('req', req.user, __dirname, permissions, isValidRequest);
              return download(`${appRoot}/uploads/${bucket}/${filename}`).then((file) => { resp.send(file); return resolve(file); }).catch(err => reject(err));
            } catch (err) {
              return reject(err);
            }
          } else {
            try {
              console.log('req', req.user, __dirname, permissions, isValidRequest);
              filename = `${bucket}/${filename}`;

              gfs.exist({ filename }, (err, file) => {
                if (err || !file) {
                  const apiError = new APIError({
                    message: 'File Not found',
                    status: httpStatus.BAD_REQUEST,
                    stack: undefined,
                  });
                  return reject(apiError);
                }

                const readstream = gfs.createReadStream({ filename });
                readstream.pipe(resp);
                return resolve(true);
              });
            } catch (err) {
              return reject(err);
            }
          }
        } else {
          const apiError = new APIError({
            message: 'Unauthorized',
            status: httpStatus.FORBIDDEN,
            stack: undefined,
          });
          return reject(apiError);
        }
      });
    });
  } catch (error) {
    throw error;
  }
};
