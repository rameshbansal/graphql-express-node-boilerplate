import Joi from 'joi';
import { get } from 'lodash';

const validate = schema => (req, res, next) => {
  const keys = Object.keys(schema);
  let result = {};
  for (let index = 0; index < keys.length; index++) {
    const data = get(req, keys[index], {});
    const schemaByKey = schema[keys[index]];
    result = Joi.validate(data, schemaByKey);
    if (result.error) {
      break;
    }
  }
  if (result.error) {
    return next(result.error);
  }
  next();
};

module.exports = {
  validate,
};
