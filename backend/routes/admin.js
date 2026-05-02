const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
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

router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await Registration.countDocuments();
    const pendingEvents = await Event.countDocuments({ status: 'Pending Approval' });
    const totalOrganizers = await User.countDocuments({ role: 'organizer' });
    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'name');
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);

    return res.json({
      success: true,
      totalUsers,
      totalEvents,
      totalRegistrations,
      pendingEvents,
      totalOrganizers,
      recentEvents,
      recentUsers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

router.post('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, department, universityId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required',
      });
    }

    if (!['admin', 'organizer', 'student'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      department,
      universityId,
    });

    return res.status(201).json({ success: true, message: 'User created successfully', user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

router.put('/users/:id', auth, authorize('admin'), async (req, res) => {
  try {
    if (!ensureValidObjectId(req.params.id, res, 'Invalid user id')) {
      return;
    }

    const { name, email, role, department, universityId, password } = req.body;
    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (email && email !== user.email) {
      const duplicateUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id },
      });

      if (duplicateUser) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }

      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (universityId !== undefined) user.universityId = universityId;
    if (password && password.trim() !== '') user.password = password;

    await user.save();

    return res.json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

router.delete('/users/:id', auth, authorize('admin'), async (req, res) => {
  try {
    if (!ensureValidObjectId(req.params.id, res, 'Invalid user id')) {
      return;
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await Registration.deleteMany({ userId: user._id });
    await Event.deleteMany({ createdBy: user._id });

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

router.put('/users/:id/toggle-status', auth, authorize('admin'), async (req, res) => {
  try {
    if (!ensureValidObjectId(req.params.id, res, 'Invalid user id')) {
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

router.get('/export-csv', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({});
    const registrations = await Registration.find({})
      .populate('userId', 'name email department universityId role')
      .populate('eventId', 'title category date venue');

    let csv = 'Type,Name,Email,Role,Department,UniversityID,Event,Category,Venue,Date,AttendanceStatus\n';

    users.forEach((user) => {
      csv += `User,${user.name || ''},${user.email || ''},${user.role || ''},${user.department || '-'},${user.universityId || '-'},-,-,-,-,-\n`;
    });

    registrations.forEach((registration) => {
      csv += `Registration,${registration.userId?.name || '-'},${registration.userId?.email || '-'},${registration.userId?.role || '-'},${registration.userId?.department || '-'},${registration.userId?.universityId || '-'},${registration.eventId?.title || '-'},${registration.eventId?.category || '-'},${registration.eventId?.venue || '-'},${registration.eventId?.date ? new Date(registration.eventId.date).toLocaleDateString('en-IN') : '-'},${registration.status || '-'}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=unievents-export.csv');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Export failed',
      error: error.message,
    });
  }
});

router.get('/feedback', auth, authorize('admin'), async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('student', 'name email')
      .populate('event', 'title category')
      .sort({ createdAt: -1 });

    return res.json({ success: true, feedback });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

module.exports = router;
