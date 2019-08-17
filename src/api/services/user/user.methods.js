const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const jwt = require('jwt-simple');
const { jwtSecret, jwtExpirationInterval } = require('../../../config/vars');

// // /**
// //  * Methods
// //  */
module.exports = {
  User: {
    transform() {
      const transformed = {};
      const fields = ['id', 'name', 'email'];

      fields.forEach((field) => {
        transformed[field] = this[field];
      });

      return transformed;
    },

    token() {
      const payload = {
        exp: moment().add(jwtExpirationInterval, 'minutes').unix(),
        iat: moment().unix(),
        sub: this._id,
      };
      return jwt.encode(payload, jwtSecret);
    },

    async passwordMatches(password) {
      return bcrypt.compare(password, this.password);
    },
  },
};
