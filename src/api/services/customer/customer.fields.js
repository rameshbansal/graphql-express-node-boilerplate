const mongoose = require('mongoose');

const fieldsDefinitions = {
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    maxlength: 128,
    index: true,
    trim: true,
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  age: Number,
  grades: [Number],
  location: [[{ lat: Number, long: Number }]],
  deafaultAddress: {
    street: String,
    city: String,
    contact: [String],
    country: {
      name: String,
      code: String,
    },
  },
  deliveryAddresses: [
    {
      address: {
        street: String,
        city: String,
        country: {
          name: String,
          code: String,
          abc: String,
        },
      },
    },
  ],

};

module.exports = fieldsDefinitions;
