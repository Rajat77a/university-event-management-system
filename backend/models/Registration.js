const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    status: {
      type: String,
      enum: ['Registered', 'Checked-in', 'Cancelled'],
      default: 'Registered',
    },
    qrData: {
      type: String,
      unique: true,
      sparse: true,
    },
    qrCode: {
      type: String,
    },
    checkedInAt: {
      type: Date,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

registrationSchema.virtual('student').get(function studentGetter() {
  return this.userId;
});

registrationSchema.virtual('event').get(function eventGetter() {
  return this.eventId;
});

registrationSchema.virtual('attendanceStatus').get(function attendanceStatusGetter() {
  return this.status;
});

module.exports = mongoose.model('Registration', registrationSchema);
