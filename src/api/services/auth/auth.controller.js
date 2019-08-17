import { sendEmail } from '../../utils';
import { resolve } from 'dns';
import { rejects } from 'assert';

const httpStatus = require('http-status');
const service = require('./auth.service');
const { emailVerification, host } = require('../../../config/vars');

/**
 * Returns jwt token if registration was successful
 * @public
 */
/**
 * send email
 * @public
 */
const sendVerificationEmail = async (user, emailVerificationCode, req) => new Promise(async (resolve, reject) => {
  try {
    const link = `${host}/v1/auth/verify?id=${emailVerificationCode}&email=${encodeURIComponent(user.email)}`;
    const mailOptions = {
      to: user.email,
      subject: 'Please confirm your Email account',
      body: `Hello,<br> Please Click on the link to verify your email.<br><a href=${link}>Click here to verify</a>`,
    };
    console.log(mailOptions);
    const response = await sendEmail(mailOptions);
    return resolve(response);
  } catch (error) {
    return reject(error);
  }
});
exports.register = async (req, res, next) => {
  try {
    if (emailVerification) {
      const emailVerificationCode = `${Math.floor((Math.random() * 100) + 54)}`;
      const userData = { ...req.body, emailVerificationCode };
      const response = await service.register(userData);
      console.log('response........', response);
      const emailResponse = await sendVerificationEmail(response.user, emailVerificationCode, req);
      return res.status(httpStatus.CREATED).json(response);
    }
    const response = await service.register(req.body);
    console.log('response........', response);
    return res.status(httpStatus.CREATED).json(response);
  } catch (error) {
    return next(error);
  }
};


/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
exports.login = async (req, res, next) => {
  try {
    const response = await service.login(req.body);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns return the login user if token is valid
 * @public
 */
exports.isLogin = async (req, res, next) => {
  try {
    const response = await service.getLoginUser(req.user);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

/**
 * login with an existing user or creates a new one if valid accessToken token
 * Returns jwt token
 * @public
 */
exports.oAuth = async (req, res, next) => {
  try {
    const { user } = req;
    const response = await service.oAuth(user);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
exports.refresh = async (req, res, next) => {
  try {
    const response = await service.refresh(req.body);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

/**
 * Email Verification
 * @public
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const response = await service.verifyEmail(req.query);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};
/**
 * Forget password
 * @public
 */
exports.forgetPassword = async (req, res, next) => {
  try {
    const response = await service.forgetPassword(req.body);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};
/**
 * reset password
 * @public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const response = await service.resetPassword({ ...req.body, ...req.params });
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};
/**
 * change password
 * @public
 */
exports.changePassword = async (req, res, next) => {
  try {
    const response = await service.changePassword({ loginUser: req.user, ...req.body, ...req.params });
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

