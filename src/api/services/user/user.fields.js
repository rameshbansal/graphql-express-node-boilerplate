const mongoose = require('mongoose');

const ROLES = require('../../../config/roles');
const { emailVerification } = require('../../../config/vars');
/**
* User Roles
*/
const roles = Object.values(ROLES);

const fieldsDefinitions = {
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 128,
  },
  name: {
    type: String,
    maxlength: 128,
    index: true,
    trim: true,
  },
  services: {
    facebook: String,
    google: {
      url: String,
    },
  },
  role: {
    type: String,
    enum: roles,
    default: ROLES.GUEST,
  },
  picture: {
    type: String,
    trim: true,
  },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  resetPasswordToken: {
    type: String,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
};
if (emailVerification) {
  fieldsDefinitions.emailVerified = {
    type: Boolean,
    default: false,
  };
  fieldsDefinitions.emailVerificationCode = {
    type: String,
  };
}

module.exports = fieldsDefinitions;
