import { authWrapper } from '../middlewares/auth';
import mongooseModel from './mongoose.model';

const Joi = require('joi');
const {
  get,
} = require('lodash');

const actions = {};

const dispatchAction = async (action, req, resp) => {
  const response = await actions[action](req, resp);
  return response;
};

const setAction = (action, name) => {
  const dispatch = get(action, 'dispatch', false);
  const joiValidationSchema = get(action, 'joi', false);
  if (!dispatch || typeof dispatch !== 'function') {
    throw new Error('dispatch key is required in action definition');
  }
  if (!action.public) {
    const auth = authWrapper(action.roles);
    actions[name] = async (req, resp) => new Promise((resolve, reject) => {
      auth(req, resp, async (error, _) => {
        if (error) {
          return reject(error);
        }
        try {
          if (joiValidationSchema) {
            joiValidationSchema.action = Joi.string();
            joiValidationSchema.files = Joi.any();
            const result = Joi.validate({
              ...req.query, ...req.body, ...req.params, files: req.files,
            }, joiValidationSchema);
            if (result.error) {
              return reject(result.error);
            }
          }
          const data = await dispatch({
            params: {
              ...req.query, ...req.body, ...req.params, files: req.files,
            },
            user: req.user,
            dispatch,
            getModel: mongooseModel.getCollection,
          });

          return resolve(data);
        } catch (err) {
          return reject(err);
        }
      });
    });
  } else {
    actions[name] = async (req, resp) => new Promise(async (resolve, reject) => {
      try {
        if (joiValidationSchema) {
          joiValidationSchema.action = Joi.string();
          joiValidationSchema.files = Joi.any();
          const result = Joi.validate({
            ...req.query, ...req.body, ...req.params, files: req.files,
          }, joiValidationSchema);
          if (result.error) {
            return reject(result.error);
          }
        }
        const data = await dispatch({
          params: {
            ...req.query, ...req.body, ...req.params, files: req.files,
          },
          user: req.user,
          dispatch,
          getModel: mongooseModel.getCollection,
        });

        return resolve(data);
      } catch (err) {
        return reject(err);
      }
    });
  }
};

module.exports = {
  actions,
  setAction,
  dispatch: dispatchAction,
};
