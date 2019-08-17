const Joi = require('joi');


module.exports = {
  count: {
    params: {
      collection: Joi.string().required(),
    },
    body: {
      filter: Joi.object(),
    },
  },
  get: {
    params: {
      collection: Joi.string().required(),
    },
    body: {
      filter: Joi.object(),
      fields: Joi.object(),
      perPage: Joi.number().min(1).max(100).required(),
      page: Joi.number().min(1),
    },

  },
  update: {
    params: {
      collection: Joi.string().required(),
    },
    body: {
      filter: Joi.object(),
      setter: Joi.object().required(),
    },
  },
  deleteDocument: {
    params: {
      collection: Joi.string().required(),
    },
    body: {
      filter: Joi.object().required(),
    },
  },
  getFile: {
    params: {
      bucket: Joi.string().required(),
      name: Joi.string().required(),
    },
  },
};
