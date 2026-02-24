const mongoose = require('mongoose');

const buzzSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    timestamp: {
      type: Number,
      required: true,
      index: true,
    },
    time: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Buzz', buzzSchema);
