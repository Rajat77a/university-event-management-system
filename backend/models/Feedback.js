const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
      unique: true,
    },
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    contentRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    organizationRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    suggestions: {
      type: String,
      trim: true,
    },
    likedMost: {
      type: String,
      trim: true,
    },
    improvements: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
