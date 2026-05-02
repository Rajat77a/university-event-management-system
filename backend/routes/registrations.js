const express = require('express');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Feedback = require('../models/Feedback');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

const ensureValidObjectId = (id, res, message) => {
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ success: false, message });
    return false;
  }

  return true;
};

router.post('/:eventId', auth, authorize('student'), async (req, res) => {
  try {
    if (!ensureValidObjectId(req.params.eventId, res, 'Invalid event id')) {
      return;
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (!['Published', 'Registration Closed'].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: 'This event is not open for registration',
      });
    }

    if (event.status === 'Registration Closed') {
      return res.status(400).json({
        success: false,
        message: 'Registration is closed for this event',
      });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed',
      });
    }

    if (event.registrationCount >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    const existingRegistration = await Registration.findOne({
      eventId: req.params.eventId,
      userId: req.user._id,
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You have already registered for this event',
      });
    }

    const initialQrData = JSON.stringify({
      registrationId: 'temp',
      studentId: req.user._id,
      eventId: req.params.eventId,
      timestamp: Date.now(),
    });

    const initialQrCode = await QRCode.toDataURL(initialQrData);

    let registration;
    try {
      registration = await Registration.create({
        userId: req.user._id,
        eventId: req.params.eventId,
        qrData: initialQrData,
        qrCode: initialQrCode,
      });
    } catch (createError) {
      if (createError.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'You have already registered for this event',
        });
      }
      throw createError;
    }

    const finalQrData = JSON.stringify({
      registrationId: registration._id,
      studentId: req.user._id,
      eventId: req.params.eventId,
    });

    const finalQrCode = await QRCode.toDataURL(finalQrData);
    registration.qrData = finalQrData;
    registration.qrCode = finalQrCode;
    await registration.save();

    event.registrationCount += 1;
    if (event.registrationCount >= event.capacity) {
      event.status = 'Registration Closed';
    }
    await event.save();

    const populatedRegistration = await Registration.findById(registration._id)
      .populate('eventId')
      .populate('userId', 'name email role department universityId');

    return res.status(201).json({
      success: true,
      message: 'Successfully registered for the event',
      registration: populatedRegistration,
      qrCode: finalQrCode,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const registrations = await Registration.find({ userId: req.user._id })
      .populate('eventId')
      .populate('userId', 'name email role department universityId')
      .sort({ createdAt: -1 });

    return res.json({ success: true, registrations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:eventId', auth, authorize('student'), async (req, res) => {
  try {
    if (!ensureValidObjectId(req.params.eventId, res, 'Invalid event id')) {
      return;
    }

    const registration = await Registration.findOneAndDelete({
      eventId: req.params.eventId,
      userId: req.user._id,
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const event = await Event.findById(req.params.eventId);
    if (event) {
      event.registrationCount = Math.max(0, event.registrationCount - 1);
      if (event.status === 'Registration Closed' && event.registrationCount < event.capacity) {
        event.status = 'Published';
      }
      await event.save();
    }

    await Feedback.deleteOne({ registration: registration._id });

    return res.json({ success: true, message: 'Registration cancelled successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/event/:eventId', auth, authorize('organizer', 'admin'), async (req, res) => {
  try {
    if (!ensureValidObjectId(req.params.eventId, res, 'Invalid event id')) {
      return;
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (req.user.role === 'organizer' && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view registrations for your own events',
      });
    }

    const registrations = await Registration.find({ eventId: req.params.eventId })
      .populate('userId', 'name email department universityId role')
      .populate('eventId')
      .sort({ createdAt: -1 });

    return res.json({ success: true, registrations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/scan', auth, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) {
      return res.status(400).json({ success: false, message: 'QR data is required' });
    }

    const parsedQr = JSON.parse(qrData);
    const { registrationId, eventId } = parsedQr;

    if (!ensureValidObjectId(registrationId, res, 'Invalid registration id')) {
      return;
    }

    const registration = await Registration.findById(registrationId)
      .populate('userId', 'name email department')
      .populate('eventId');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Invalid QR code. Registration not found',
      });
    }

    if (registration.eventId.toString() !== eventId) {
      return res.status(400).json({
        success: false,
        message: 'QR code does not match this event',
      });
    }

    const event = await Event.findById(registration.eventId);
    if (req.user.role === 'organizer' && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only scan registrations for your own events',
      });
    }

    if (registration.status === 'Checked-in') {
      return res.status(400).json({
        success: false,
        message: `${registration.userId.name} has already checked in`,
      });
    }

    registration.status = 'Checked-in';
    registration.checkedInAt = new Date();
    registration.checkedInBy = req.user._id;
    await registration.save();

    return res.json({
      success: true,
      message: `Check-in successful. Welcome ${registration.userId.name}`,
      student: registration.userId,
      checkedInAt: registration.checkedInAt,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:registrationId/feedback', auth, authorize('student'), async (req, res) => {
  try {
    if (!ensureValidObjectId(req.params.registrationId, res, 'Invalid registration id')) {
      return;
    }

    const registration = await Registration.findById(req.params.registrationId).populate('eventId');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit feedback for your own registrations',
      });
    }

    const existingFeedback = await Feedback.findOne({ registration: registration._id });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback has already been submitted for this registration',
      });
    }

    const { overallRating, contentRating, organizationRating, suggestions, likedMost, improvements } =
      req.body;

    if (!overallRating) {
      return res.status(400).json({ success: false, message: 'Overall rating is required' });
    }

    const feedback = await Feedback.create({
      event: registration.eventId._id,
      student: req.user._id,
      registration: registration._id,
      overallRating,
      contentRating,
      organizationRating,
      suggestions,
      likedMost,
      improvements,
    });

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
