const path = require('path');

// import .env variables
require('dotenv-safe').load({
  path: path.join(__dirname, '../../.env.example'),
  sample: path.join(__dirname, '../../.env.example'),
});

module.exports = {
  env: process.env.NODE_ENV,
  emailVerification: true,
  host: 'http://localhost:3000',
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpirationInterval: process.env.JWT_EXPIRATION_MINUTES,
  mongo: {
    uri: process.env.NODE_ENV === 'test' ? process.env.MONGO_URI_TESTS : process.env.MONGO_URI,
  },
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  rateLimitTime: process.env.RATE_LIMIT_TIME,
  rateLimitRequest: process.env.RATE_LIMIT_REQUEST,
  socket: {
    host: 'localhost',
    port: '7900',
  },
  fileUpload: {
    // type: 'local', // local or S3 or db
    // buckets: {
    //   public: { permissions: { write: 'ANY', read: 'ANY' } },
    //   app: { permissions: { write: ['SUPERADMIN'], read: ['SUPERADMIN', 'CUSTOMER'] } },
    //   authBucket: { permissions: { write: ['CUSTOMER'], read: ['SUPERADMIN', 'CUSTOMER'] } },
    // },

    type: 'local', // local or S3 or db
    buckets: {
      public: { permissions: { write: 'ANY', read: 'ANY' } },
      app: { permissions: { write: ['SUPERADMIN'], read: ['SUPERADMIN', 'CUSTOMER'] } },
      authBucket: { permissions: { write: ['CUSTOMER'], read: ['SUPERADMIN', 'CUSTOMER'] } },
    },

  },
};
