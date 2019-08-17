import { emailVerification } from '../../config/vars';


const mongoose = require('mongoose');
const httpStatus = require('http-status');
const {
  each, get, omitBy, isNil, isEmpty,
} = require('lodash');
const APIError = require('../utils/APIError');

const MongoOperators = [
  '$set', '$inc', '$push', '$min', '$max', '$addToSet',
];

const MongoDeleteOperators = ['$pop', '$pull', '$unset'];

const collection = {};
const mongooseModel = {
  addCollection(collectionName, collectionFields, hooks, methods) {
    const collectionSchema = new mongoose.Schema(collectionFields, { timestamps: true });

    /*
      Methods
    */
    if (methods) {
      collectionSchema.methods = ({
        ...methods,
      });
    }

    /*
    Hooks
    */
    if (hooks) {
      each(Object.keys(hooks), (hook) => {
        each(Object.keys(hooks[hook]), (hookType) => {
          collectionSchema[hook](hookType, hooks[hook][hookType]);
        });
      });
    }
    /**
 * Statics
 */
    collectionSchema.statics = {

      /**
     * List records in descending order of 'createdAt' timestamp.
     *
     * @param {number} skip - Number of records to be skipped.
     * @param {number} limit - Limit number of records to be returned.
     * @returns {Promise<Collection[]>}
     */
      get({
        page = 1, perPage = 30, sort = { createdAt: -1 }, filter = {}, fields, populate = [],
      }) {
        if (perPage === 0) {
          throw new APIError({
            message: 'you are not permitted to fetch with perPage 0',
            status: httpStatus.FORBIDDEN,
          });
        } else if (perPage > 100) {
          throw new APIError({
            message: 'you are not permitted to fetch more than 100 records',
            status: httpStatus.FORBIDDEN,
          });
        }
        console.log('filter.....', filter);
        let findCursor = this.find(filter, fields);
        if (populate.length) {
          findCursor = findCursor.populate(populate);
        }
        return findCursor
          .sort(sort)
          .skip(perPage * (page - 1))
          .limit(perPage)
          .exec();
      },
      getCount({
        filter = {},
      }) {
        console.log('filter', filter);
        const countCursor = this.count(filter);

        return countCursor;
      },
      //   /**
      //    * Find user by email and tries to generate a JWT token
      //    *
      //    * @param {ObjectId} id - The objectId of user.
      //    * @returns {Promise<User, APIError>}
      //    */
      async findAndGenerateToken(options) {
        const { email, password, refreshObject } = options;
        if (!email) throw new APIError({ message: 'An email is required to generate a token' });
        const user = await this.findOne({ email }).exec();
        const err = {
          status: httpStatus.UNAUTHORIZED,
          isPublic: true,
        };
        if (password) {
          if (emailVerification && !user.emailVerified) {
            throw new APIError({ message: 'Your email is not verified', status: httpStatus.UNAUTHORIZED });
          }
          if (user && await user.passwordMatches(password)) {
            return { user, accessToken: user.token() };
          }
          err.message = 'Incorrect email or password';
        } else if (refreshObject && refreshObject.userEmail === email) {
          return { user, accessToken: user.token() };
        } else {
          err.message = 'Incorrect email or refreshToken';
        }
        throw new APIError(err);
      },
      /**
   * Return new validation error
   * if error is a mongoose duplicate key error
   *
   * @param {Error} error
   * @returns {Error|APIError}
   */
      checkDuplicateEmail(error) {
        if (error.code === 11000 && (error.name === 'BulkWriteError' || error.name === 'MongoError')) {
          return new APIError({
            message: 'Validation Error',
            errors: [{
              field: 'email',
              location: 'body',
              messages: ['"email" already exists'],
            }],
            status: httpStatus.CONFLICT,
            isPublic: true,
            stack: error.stack,
          });
        }
        return error;
      },

      async oAuthLogin({
        service, id, email, name, picture,
      }) {
        const user = await this.findOne({ $or: [{ [`services.${service}`]: id }, { email }] });
        if (user) {
          user.services[service] = id;
          if (!user.name) user.name = name;
          if (!user.picture) user.picture = picture;
          return user.save();
        }
        const password = uuidv4();
        return this.create({
          services: { [service]: id }, email, password, name, picture,
        });
      },

    };
    collection[collectionName] = mongoose.model(collectionName, collectionSchema);
  },
  getCollection(collectionName) {
    return collection[collectionName];
  },
  queryMakerAndValidator({ access, reqParams, user }) {
    // const options = omitBy({ name, email, role }, isNil);
    let topLevelFields = '';
    let populateStack = [];
    // if (access && access.fields) {
    //   populate(access.fields, populateStack);
    // }
    if (!reqParams.fields) {
      each(Object.keys(access.fields), (field) => {
        if (access.fields[field] === 1) {
          topLevelFields = topLevelFields ? `${topLevelFields} ${field}` : field;
        } else if (typeof access.fields[field] === 'object') {
          topLevelFields = topLevelFields ? `${topLevelFields} ${field}` : field;
          const stack = populate(access.fields[field], populateStack, 0, {}, field);
          if (stack && stack.select && Object.keys(stack.select).length > 0) {
            populateStack.push(stack);
          }
        }
      });
    } else {
      const result = normalize({ reqParams, parentRequestParams: reqParams, access });
      topLevelFields = result.topLevelFields;
      populateStack = result.populateStack;
    }
    let filter = reqParams.filter || {};
    if (access.filter) {
      filter = { ...filter, ...access.filter };
    }
    each(Object.keys(filter), (field) => {
      if (!access.fields[field]) {
        console.log('filed...', field);
        if (field !== '_id') {
          throw new APIError({
            message: `you are not permitted to filter ${field}`,
            status: httpStatus.FORBIDDEN,
          });
        }
      }
    });
    console.log('filter', filter);
    filter = justifyData({ data: filter, currentUser: user });
    console.log('topLevelFields', topLevelFields);
    console.log('populateStack', JSON.stringify(populateStack, null, 4));
    return {
      filter, fields: topLevelFields, populate: populateStack, sort: reqParams.sort, page: reqParams.page, perPage: reqParams.perPage,
    };
  },
  setterMakerAndValidator({ access, reqParams, user }) {
    /* TO Do setter making */
    const setterFields = {};
    each(Object.keys(reqParams.setter), (op) => {
      if (MongoOperators.indexOf(op) > -1) {
        normalizeSetterFields(reqParams.setter[op], setterFields);
      } else if (MongoDeleteOperators.indexOf(op) > -1) {
        if (access[op]) {
          console.log('access[op] ', access[op].allowedFields[0].trim());
          console.log('access[op] ', access[op].allowedFields[0].trim() === '*');
          if (access[op] && !(access[op].allowedFields[0].trim() === '*')) {
            console.log('11111111111111111');
            each(Object.keys(reqParams.setter[op]), (field) => {
              console.log('access[op].allowedFields', access[op].allowedFields);
              if (access[op].allowedFields.indexOf(field) === -1) {
                throw new APIError({
                  message: `you are not permitted to do ${op} on ${field} of this collection`,
                  status: httpStatus.FORBIDDEN,
                });
              }
            });
          }
        } else {
          throw new APIError({
            message: `you are not permitted to do ${op} on this collection`,
            status: httpStatus.FORBIDDEN,
          });
        }
      } else {
        throw new APIError({
          message: 'At top level of update, mongo operator should be specified',
          status: httpStatus.FORBIDDEN,
        });
      }
    });
    console.log('setterFields', setterFields);
    each(Object.keys(setterFields), (field) => {
      if (!access.fields[field]) {
        throw new APIError({
          message: `you are not permitted to update ${field}`,
          status: httpStatus.FORBIDDEN,
        });
      }
    });
    let filter = reqParams.filter || {};
    if (access.filter) {
      filter = { ...filter, ...access.filter };
    }
    each(Object.keys(filter), (field) => {
      if (!access.filter_access.fields[field]) {
        console.log('filed...', field);
        if (field !== '_id') {
          throw new APIError({
            message: `you are not permitted to filter on ${field}`,
            status: httpStatus.FORBIDDEN,
          });
        }
      }
    });
    filter = justifyData({ data: filter, currentUser: user });
    return {
      filter, setter: reqParams.setter,
    };
  },
  insertMakerAndValidator({
    access, data,
  }) {
    each(Object.keys(data), (field) => {
      if (!access.fields[field]) {
        console.log('filed...', field);
        throw new APIError({
          message: `you are not permitted to add ${field}`,
          status: httpStatus.FORBIDDEN,
        });
      }
    });
    let setter = access.setter || {};
    setter = justifyData({ data: setter, currentUser: user });
    data = { ...data, ...setter };
    return data;
  },
};


const populate = (data, populateStack, level = 0, stack = {}, path = false, nestedParamsFields = {}) => {
  if (data) {
    stack.select = {};
    console.log('data', data, nestedParamsFields);
    each(Object.keys(data.fields), (field) => {
      if (!nestedParamsFields || (nestedParamsFields === 1) || nestedParamsFields[field]) {
        const newNestedParamsFields = typeof nestedParamsFields === 'object' ? nestedParamsFields : {};
        stack.path = path;
        stack.model = data.ref;
        if (typeof data.fields[field] === 'object' && typeof nestedParamsFields[field] === 'object') {
          console.log('fields[field].ref;', data.ref);
          const newStack = populate(data.fields[field], populateStack, level + 1, {}, field, newNestedParamsFields[field]);
          if (newStack && newStack.select && Object.keys(newStack.select).length > 0) {
            stack.populate = newStack;
          }
        }
        stack.select[field] = 1;
      }
    });
    return stack;
  }
};

const justifyData = ({ data, currentUser }) => {
  each(Object.keys(data), (key) => {
    if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
      console.log('value.............', data[key]);
      data[key] = justifyData({ data: data[key], currentUser });
    } else if (typeof data[key] === 'object' && Array.isArray(data[key])) {
      data[key] = data[key].map((arrayElement) => {
        if (typeof arrayElement === 'string') {
          if (arrayElement.indexOf('=') !== -1) {
            let value = arrayElement.replace('=', '');
            console.log('value.............', value);
            value = get({ currentUser }, value, 'null');
            if (value === 'null') {
              throw new APIError({
                message: `Current user doen't contain value at ${data[key]}`,
                status: httpStatus.CONFLICT,
              });
            }
            return value;
          }
          return arrayElement;
        }
        return justifyData({ data: arrayElement, currentUser });
      });
    } else if (typeof data[key] === 'string' && data[key].indexOf('=') !== -1) {
      let value = data[key].replace('=', '');
      console.log('value.............', value);
      value = get({ currentUser }, value, 'null');
      if (value === 'null') {
        throw new APIError({
          message: `Current user doen't contain value at ${data[key]}`,
          status: httpStatus.CONFLICT,
        });
      }
      data[key] = value;
    }
  });
  return data;
};

const normalize = ({
  parentRequestParams, reqParams, access, appendKey = '', populateStack = [], topLevelFields = '',
}) => {
  each(Object.keys(reqParams.fields), (field) => {
    if (access.fields[`${appendKey}${field}`]) {
      if (access.fields[`${appendKey}${field}`] === 1) {
        topLevelFields = topLevelFields ? `${topLevelFields} ${appendKey}${field}` : `${appendKey}${field}`;
      } else if (typeof access.fields[`${appendKey}${field}`] === 'object' && access.fields[`${appendKey}${field}`].ref) {
        topLevelFields = topLevelFields ? `${topLevelFields} ${appendKey}${field}` : `${appendKey}${field}`;
        const stack = populate(access.fields[`${appendKey}${field}`], populateStack, 0, {}, field, reqParams.fields[`${appendKey}${field}`]);
        populateStack.push(stack);
      }
    } else {
      const childField = get(parentRequestParams.fields, `${appendKey}${field}`, false);
      if (typeof childField === 'object' && !Array.isArray(childField)) {
        const result = normalize({
          reqParams: { fields: childField },
          access,
          appendKey: `${appendKey}${field}.`,
          populateStack,
          topLevelFields,
          parentRequestParams,
        });
        topLevelFields = result.topLevelFields;
        populateStack = result.populateStack;
      } else {
        console.log('----------------------------------------', childField);
        console.log('----------------------------------------', appendKey);
        console.log('----------------------------------------', field);
        console.log('----------------------------------------', parentRequestParams.fields);
        console.log('----------------------------------------');
        if (field !== '_id') {
          throw new APIError({
            message: `you are not permitted to access ${appendKey}${field}`,
            status: httpStatus.FORBIDDEN,
          });
        }
      }
    }
  });
  return { topLevelFields, populateStack };
};
const checkEmpty = (value) => {
  console.log('value.......', value);
  if (value == null || value === '' || (typeof value === 'object' && isEmpty(value))) {
    throw new APIError({
      message: 'you are not permitted to set empty or null values',
      status: httpStatus.FORBIDDEN,
    });
  }
};

const normalizeSetterFields = (definition, fields = {}, appendKey = '') => {
  console.log('definition', definition);
  checkEmpty(definition);
  each(Object.keys(definition), (field) => {
    checkEmpty(definition[field]);
    if (Array.isArray(definition[field])) {
      each(definition[field], (arrElement) => {
        if (typeof arrElement === 'object') {
          normalizeSetterFields(arrElement, fields, `${appendKey}${field}.`);
        } else {
          const key = removeIndexOrDollarFromkey(`${appendKey}${field}`);
          fields[key] = definition[field];
        }
      });
    } else if (typeof definition[field] === 'object') {
      normalizeSetterFields(definition[field], fields, `${appendKey}${field}.`);
    } else if (definition[field]) {
      const key = removeIndexOrDollarFromkey(`${appendKey}${field}`);
      fields[key] = definition[field];
    }
  });
};

const removeIndexOrDollarFromkey = (key) => {
  let newKey = '';
  key = key.split('');
  console.log('key------>>>>', key);
  for (let index = key.length - 1; index >= 0; index--) {
    const element = key[index];
    if (element === '$' || !isNaN(element) || element === ']') {
      if (key[index - 1] === '[' && key[index - 2] === '$') {
        index -= 3;
      } else {
        index -= 1;
      }
    } else if (element === 'h' && key[index - 1] === 'c' && key[index - 2] === 'a' && key[index - 3] === 'e' && key[index - 4] === '$') {
      index -= 5;
    } else if (element === 'n' && key[index - 1] === 'o' && key[index - 2] === 'i' && key[index - 3] === 't' && key[index - 4] === 'i' && key[index - 5] === 's' && key[index - 6] === 'o' && key[index - 7] === 'p' && key[index - 8] === '$') {
      index -= 9;
    } else {
      newKey = element + newKey;
    }
  }
  return newKey;
};

module.exports = mongooseModel;
