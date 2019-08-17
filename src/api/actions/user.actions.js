import { each } from 'lodash';

const { fileUpload } = require('../../config/vars');
const Joi = require('joi');

import utils from '../utils';

module.exports = {
  /**
     * @api {all} v1/dispatch/testing Dispatch Example
     * @apiDescription this is example dispatch api for developers at server side
     * @apiVersion 1.0.0
     * @apiName Testing
     * @apiGroup Dispatch
     * @apiPermission public or private or role based
     *
     * @apiHeader {String} Authorization  User's access token required for public or role based api
     *
     * @apiParam  {String}              Email     Email of the tester
     * @apiParam  {String}              name      Name of the tester
     * @apiParam  {String}              role      Role of the tester
     *
     * @apiSuccess (Done 200) {Object}  response    response object
     *
     * @apiError (Bad Request 400)   ValidationError  Some parameters may contain invalid values
     * @apiError (Unauthorized 401)  Unauthorized     Only authenticated users
     * @apiError (Forbidden 403)     Forbidden        You are not allowed to access this API
  */
  testing: {
    public: false,
    roles: ['SUPERADMIN', 'GUEST'],
    joi: {
      email: Joi.string().email().required(),
      name: Joi.string().max(128),
      role: Joi.string().valid(['CUSTOMER', 'ADMIN', 'SUPERADMIN']),
    },
    dispatch: async ({
      params, user, getModel, dispatch,
    }) => {
      // console.log('params--->', params, user);
      const Users = await getModel('User').get({ filter: { email: params.email } });
      utils.notifyGroupsOnSocket('groupId', { users: Users });
      return { users: Users };
    },
  },
};
