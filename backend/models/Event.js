const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    buildingName: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Technical', 'Cultural', 'Academic', 'Sports', 'Workshop'],
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    registrationDeadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Published', 'Registration Closed', 'Completed', 'Cancelled'],
      default: 'Pending Approval',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    guestSpeaker: {
      name: String,
      designation: String,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    prerequisites: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    registrationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

eventSchema.virtual('startDateTime').get(function startDateTimeGetter() {
  return this.date;
});

eventSchema.virtual('endDateTime').get(function endDateTimeGetter() {
  return this.endDate || this.date;
});

eventSchema.virtual('venueName').get(function venueNameGetter() {
  return this.venue;
});

eventSchema.virtual('capacityLimit').get(function capacityLimitGetter() {
  return this.capacity;
});

eventSchema.virtual('organizer').get(function organizerGetter() {
  return this.createdBy;
});

module.exports = mongoose.model('Event', eventSchema);
