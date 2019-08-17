const httpStatus = require('http-status');
const service = require('./daffo.service');
// const { handler: errorHandler } = require('../middlewares/error');

/**
 * Get user
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    // const response = await service.get(id);
    const response = await service.get({
      query: req.query, body: req.body, params: req.params, user: req.user, access: req.access,
    });
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};


/**
 * Create new user
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const response = await service.create({
      query: req.query, body: req.body, params: req.params, user: req.user, access: req.access,
    });
    return res.status(httpStatus.CREATED).json(response);
  } catch (error) {
    return next(error);
  }
};

/**
 * Replace existing user
 * @public
 */
exports.replace = async (req, res, next) => {
  try {
    const { user } = req.locals;
    const response = await service.replace(user, req.body);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update existing user
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const response = await service.update({
      query: req.query, body: req.body, params: req.params, user: req.user, access: req.access,
    });
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get user list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const response = await service.list({
      query: req.query, body: req.body, params: req.params, user: req.user, access: req.access,
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get collection count
 * @public
 */
exports.count = async (req, res, next) => {
  try {
    const response = await service.count({
      query: req.query, body: req.body, params: req.params, user: req.user, access: req.access,
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @public
 */
exports.remove = async (req, res, next) => {
  try {
    await service.remove({
      query: req.query, body: req.body, params: req.params, user: req.user, access: req.access,
    });
    res.status(httpStatus.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};
/**
 * Dispatch an action
 * @public
 */
exports.actionHandler = async (req, res, next) => {
  try {
    const response = await service.actionHandler(req, res, next);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * File Handler
 * @public
 */
exports.fileHandler = (req, res, next) => {
  try {
    service.fileHandler(req, res, next);
  } catch (error) {
    next(error);
  }
};
