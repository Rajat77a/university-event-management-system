const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Feedback = require('../models/Feedback');
const { auth, authorize } = require('../middleware/auth');
const { normalizeEventPayload } = require('../utils/eventPayload');

const router = express.Router();

const eventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category')
    .isIn(['Technical', 'Cultural', 'Academic', 'Sports', 'Workshop'])
    .withMessage('Invalid category'),
  body(['date', 'startDateTime']).custom((_, { req }) => {
    if (!req.body.date && !req.body.startDateTime) {
      throw new Error('Event date is required');
    }
    return true;
  }),
  body(['venue', 'venueName']).custom((_, { req }) => {
    if (!req.body.venue && !req.body.venueName) {
      throw new Error('Venue is required');
    }
    return true;
  }),
  body(['capacity', 'capacityLimit']).custom((_, { req }) => {
    if (!req.body.capacity && !req.body.capacityLimit) {
      throw new Error('Capacity is required');
    }
    return true;
  }),
];

const eventPopulate = [{ path: 'createdBy', select: 'name email role' }];

const ensureValidObjectId = (id, res, message) => {
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ success: false, message });
    return false;
  }

  return true;
};

router.get('/', async (req, res) => {
  try {
    const { category, search, status } = req.query;
    const query = {};

    if (!status) {
      query.status = 'Published';
    } else {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const events = await Event.find(query).populate(eventPopulate).sort({ date: 1, createdAt: -1 });
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/all', auth, authorize('admin'), async (req, res) => {
  try {
    const events = await Event.find().populate(eventPopulate).sort({ createdAt: -1 });
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/my-events', auth, authorize('organizer'), async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id })
      .populate(eventPopulate)
      .sort({ createdAt: -1 });
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!ensureValidObjectId(req.params.id, res, 'Invalid event id')) {
      return;
    }

    const event = await Event.findById(req.params.id).populate(eventPopulate);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    return res.json({ success: true, event });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', auth, authorize('organizer'), eventValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const payload = normalizeEventPayload(req.body);
    const event = await Event.create({
      ...payload,
      createdBy: req.user._id,
      status: 'Pending Approval',
    });

    const populatedEvent = await Event.findById(event._id).populate(eventPopulate);
    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: populatedEvent,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', auth, authorize('organizer', 'admin'), async (req, res) => {
  try {
    if (!ensureValidObjectId(req.params.id, res, 'Invalid event id')) {
      return;
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (req.user.role === 'organizer' && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own events',
      });
    }

    const payload = normalizeEventPayload(req.body);
    const nextStatus =
      req.user.role === 'organizer' && event.status === 'Published'
        ? 'Pending Approval'
        : event.status;

    Object.assign(event, payload, {
      status: req.body.status || nextStatus,
    });

    await event.save();

    const updatedEvent = await Event.findById(req.params.id).populate(eventPopulate);
    return res.json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', auth, authorize('organizer', 'admin'), async (req, res) => {
  try {
    if (!ensureValidObjectId(req.params.id, res, 'Invalid event id')) {
      return;
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (req.user.role === 'organizer' && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own events',
      });
    }

    await Promise.all([
      Feedback.deleteMany({ event: event._id }),
      Registration.deleteMany({ eventId: event._id }),
      Event.findByIdAndDelete(req.params.id),
    ]);

    return res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/approve', auth, authorize('admin'), async (req, res) => {
  try {
    if (!ensureValidObjectId(req.params.id, res, 'Invalid event id')) {
      return;
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'Published' },
      { new: true }
    ).populate(eventPopulate);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    return res.json({ success: true, message: 'Event approved successfully', event });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/reject', auth, authorize('admin'), async (req, res) => {
  try {
    if (!ensureValidObjectId(req.params.id, res, 'Invalid event id')) {
      return;
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'Draft' },
      { new: true }
    ).populate(eventPopulate);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    return res.json({ success: true, message: 'Event rejected successfully', event });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
