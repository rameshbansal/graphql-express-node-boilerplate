const bcrypt = require('bcryptjs');
const { env } = require('../../../config/vars');

module.exports = {
  User: {
    pre: {
      async save(next) {
        try {
          if (!this.isModified('password')) return next();

          const rounds = env === 'test' ? 1 : 10;

          const hash = await bcrypt.hash(this.password, rounds);
          this.password = hash;

          return next();
        } catch (error) {
          return next(error);
        }
      },
    },
  },
};
