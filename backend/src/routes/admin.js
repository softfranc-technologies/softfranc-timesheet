const express = require('express');
const AttendanceLog = require('../models/AttendanceLog');
const Timesheet = require('../models/Timesheet');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// GET /api/admin/dashboard — overview stats
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const [
      totalEmployees,
      activeEmployees,
      todayAttendance,
      pendingTimesheets,
      monthlyHours
    ] = await Promise.all([
      User.countDocuments({ role: 'employee' }),
      User.countDocuments({ role: 'employee', isActive: true }),
      AttendanceLog.countDocuments({ date: today }),
      Timesheet.countDocuments({ status: 'submitted' }),
      AttendanceLog.aggregate([
        { $match: { date: { $gte: firstDay } } },
        { $group: { _id: null, total: { $sum: '$hoursWorked' } } }
      ])
    ]);

    res.json({
      totalEmployees,
      activeEmployees,
      todayAttendance,
      pendingTimesheets,
      monthlyHours: monthlyHours[0]?.total?.toFixed(2) || '0.00'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
});

// GET /api/admin/attendance/all?date=&userId=&page=
router.get('/attendance/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.date) filter.date = req.query.date;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = req.query.from;
      if (req.query.to) filter.date.$lte = req.query.to;
    }

    const [logs, total] = await Promise.all([
      AttendanceLog.find(filter)
        .populate('userId', 'name email department')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AttendanceLog.countDocuments(filter)
    ]);

    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance logs.' });
  }
});

// GET /api/admin/timesheets?status=submitted&page=
router.get('/timesheets', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.userId = req.query.userId;

    const [timesheets, total] = await Promise.all([
      Timesheet.find(filter)
        .populate('userId', 'name email department position')
        .populate('approvedBy', 'name')
        .sort({ submittedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Timesheet.countDocuments(filter)
    ]);

    res.json({ timesheets, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timesheets.' });
  }
});

// PUT /api/admin/timesheets/:id/approve
router.put('/timesheets/:id/approve', async (req, res) => {
  try {
    const ts = await Timesheet.findById(req.params.id);
    if (!ts) return res.status(404).json({ error: 'Timesheet not found.' });
    if (ts.status !== 'submitted') return res.status(400).json({ error: 'Only submitted timesheets can be approved.' });

    ts.status = 'approved';
    ts.approvedAt = new Date();
    ts.approvedBy = req.user._id;
    await ts.save();

    res.json({ message: 'Timesheet approved.', timesheet: ts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve timesheet.' });
  }
});

// PUT /api/admin/timesheets/:id/reject
router.put('/timesheets/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const ts = await Timesheet.findById(req.params.id);
    if (!ts) return res.status(404).json({ error: 'Timesheet not found.' });
    if (ts.status !== 'submitted') return res.status(400).json({ error: 'Only submitted timesheets can be rejected.' });

    ts.status = 'rejected';
    ts.rejectionReason = reason || 'No reason provided.';
    await ts.save();

    res.json({ message: 'Timesheet rejected.', timesheet: ts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject timesheet.' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { role: 'employee' };
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// POST /api/admin/users — create new employee
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, department, position } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required.' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered.' });

    const user = await User.create({ name, email, passwordHash: password, department, position, role: 'employee' });
    res.status(201).json({ message: 'Employee created.', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create employee.' });
  }
});

// PATCH /api/admin/users/:id/toggle-active
router.patch('/users/:id/toggle-active', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

module.exports = router;
