import mongooseModel from '../../configure/mongoose.model';
import { Promise } from 'mongoose';
import { sendEmail } from '../../utils';

const RefreshToken = require('./refreshToken.model');
const moment = require('moment-timezone');
const { jwtExpirationInterval } = require('../../../config/vars');
const APIError = require('../../utils/APIError');
const httpStatus = require('http-status');
const { host } = require('../../../config/vars');
const crypto = require('crypto');
/**
 * Returns a formated object with tokens
 * @private
 */
function generateTokenResponse(user, accessToken) {
  const tokenType = 'Bearer';
  const refreshToken = RefreshToken.generate(user).token;
  const expiresIn = moment().add(jwtExpirationInterval, 'minutes');
  return {
    tokenType, accessToken, refreshToken, expiresIn,
  };
}


/**
 * Returns jwt token if registration was successful
 * @public
 */
exports.register = async (userData) => {
  const User = mongooseModel.getCollection('User');

  try {
    const user = await new User(userData).save();
    const userTransformed = user.transform();
    const token = generateTokenResponse(user, user.token());
    return { token, user: userTransformed };
  } catch (error) {
    throw User.checkDuplicateEmail(error);
  }
};
/**
 * verifyEmail
 * @public
 */
exports.verifyEmail = async (query) => {
  const User = mongooseModel.getCollection('User');

  try {
    const user = await User.get({ filter: { email: query.email } });
    console.log('user', user, query);
    if (user && user[0] && user[0].emailVerificationCode) {
      if (user[0].emailVerified) {
        throw new APIError({ message: 'user is already verified', status: httpStatus.BAD_REQUEST });
      }
      if (user[0].emailVerificationCode === query.id) {
        const _temp = await User.update({ _id: user[0]._id }, { emailVerified: true });
        console.log('_temp', _temp);
        const updatedData = User.get({ filter: { _id: user._id } });
        const updatedUser = new User(updatedData);
        const userTransformed = updatedUser.transform();
        const token = generateTokenResponse(updatedUser, updatedUser.token());
        return { token, user: userTransformed };
      }
      throw new APIError({ message: 'invalid verification url', status: httpStatus.BAD_REQUEST });
    }
    throw new APIError({ message: 'user not found', status: httpStatus.BAD_REQUEST });
  } catch (error) {
    throw error;
  }
};

/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
exports.login = async (userData) => {
  try {
    const User = mongooseModel.getCollection('User');
    const { user, accessToken } = await User.findAndGenerateToken(userData);
    const token = generateTokenResponse(user, accessToken);
    const userTransformed = user.transform();
    return { token, user: userTransformed };
  } catch (error) {
    throw error;
  }
};

/**
 * Returns login use if token is valid
 * @public
 */
exports.getLoginUser = async (userData) => {
  try {
    const User = mongooseModel.getCollection('User');
    const user = await new User(userData);
    const userTransformed = user.transform();
    return { userTransformed };
  } catch (error) {
    throw error;
  }
};

/**
 * login with an existing user or creates a new one if valid accessToken token
 * Returns jwt token
 * @public
 */
exports.oAuth = async (user) => {
  try {
    const accessToken = user.token();
    const token = generateTokenResponse(user, accessToken);
    const userTransformed = user.transform();
    return { token, user: userTransformed };
  } catch (error) {
    throw error;
  }
};

/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
exports.refresh = async ({ email, refreshToken }) => {
  try {
    const User = mongooseModel.getCollection('User');
    const refreshObject = await RefreshToken.findOneAndRemove({
      userEmail: email,
      token: refreshToken,
    });
    const { user, accessToken } = await User.findAndGenerateToken({ email, refreshObject });
    return generateTokenResponse(user, accessToken);
  } catch (error) {
    throw error;
  }
};

exports.resetPassword = async ({ email, password, token }) => {
  const User = mongooseModel.getCollection('User');
  let user = await User.get({ filter: { email, resetPasswordToken: token } });
  user = user && user.length && user[0];
  if (!user) {
    throw new APIError({ message: 'No account with that email address exists.', status: httpStatus.BAD_REQUEST });
  }
  user.password = password;
  user.resetPasswordToken = null;
  const _temp = await new User(user).save();
  return { done: true };
};

exports.forgetPassword = async ({ email }) => new Promise(async (resolve, reject) => {
  crypto.randomBytes(20, async (err, buf) => {
    const token = buf.toString('hex');
    if (err) {
      reject(err);
    }
    const User = mongooseModel.getCollection('User');
    let user = await User.get({ filter: { email } });
    user = user && user.length && user[0];
    if (!user) {
      reject(new APIError({ message: 'No account with that email address exists.', status: httpStatus.BAD_REQUEST }));
    }
    const setter = {};
    setter.resetPasswordToken = token;
    setter.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    const _temp = await User.update({ _id: user._id }, { ...setter });
    const mailOptions = {
      to: user.email,
      subject: 'Password Reset',
      body: `<div>${'You are receiving this because you (or someone else) have requested the reset of the password for your account.</br></br>' +
          'Please click on the following link, or paste this into your browser to complete the process:</br></br>'}${host}/v1/auth/reset/${token}?email=${email}</br></br>` +
          'If you did not request this, please ignore this email and your password will remain unchanged.</br></div>',
    };
    console.log(mailOptions);
    const response = await sendEmail(mailOptions);
    resolve({ done: true });
  });
});

exports.changePassword = async ({ loginUser, password, newPassword }) => {
  const User = mongooseModel.getCollection('User');
  const user = await User.findOne({ _id: loginUser._id }).exec();
  if (user && await user.passwordMatches(password)) {
    user.password = newPassword;
    const _temp = await user.save();
    return { done: true };
  }
  throw new APIError({ message: 'password is incorrect', status: httpStatus.BAD_REQUEST });
};
