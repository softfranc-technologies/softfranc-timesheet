const express = require('express');
const { z } = require('zod');
const AttendanceLog = require('../models/AttendanceLog');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper: get today's date string in YYYY-MM-DD
const todayStr = () => new Date().toISOString().split('T')[0];

// POST /api/attendance/punch-in
router.post('/punch-in', authenticate, authorize('employee'), async (req, res) => {
  try {
    const today = todayStr();
    const existing = await AttendanceLog.findOne({ userId: req.user._id, date: today });

    if (existing) {
      return res.status(409).json({ error: 'You have already punched in today.' });
    }

    const log = await AttendanceLog.create({
      userId: req.user._id,
      date: today,
      punchIn: new Date(),
      notes: req.body.notes || ''
    });

    res.status(201).json({ message: 'Punched in successfully.', log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Punch-in failed.' });
  }
});

// POST /api/attendance/punch-out
router.post('/punch-out', authenticate, authorize('employee'), async (req, res) => {
  try {
    const today = todayStr();
    const log = await AttendanceLog.findOne({ userId: req.user._id, date: today });

    if (!log) return res.status(404).json({ error: 'No punch-in found for today.' });
    if (log.punchOut) return res.status(409).json({ error: 'You have already punched out today.' });

    const now = new Date();
    const diffHours = (now - log.punchIn) / (1000 * 60 * 60);
    if (diffHours > 24) {
      return res.status(400).json({ error: 'Session exceeds 24 hours. Please contact admin.' });
    }

    log.punchOut = now;
    if (req.body.notes) log.notes = req.body.notes;
    await log.save();

    res.json({ message: 'Punched out successfully.', log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Punch-out failed.' });
  }
});

// GET /api/attendance/today
router.get('/today', authenticate, authorize('employee'), async (req, res) => {
  try {
    const log = await AttendanceLog.findOne({ userId: req.user._id, date: todayStr() });
    res.json({ log: log || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch today status.' });
  }
});

// GET /api/attendance/history?page=1&limit=20&from=&to=
router.get('/history', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };
    if (req.query.from) filter.date = { ...filter.date, $gte: req.query.from };
    if (req.query.to) filter.date = { ...filter.date, $lte: req.query.to };

    const [logs, total] = await Promise.all([
      AttendanceLog.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
      AttendanceLog.countDocuments(filter)
    ]);

    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance history.' });
  }
});

// GET /api/attendance/stats — summary for current month
router.get('/stats', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const logs = await AttendanceLog.find({
      userId: req.user._id,
      date: { $gte: firstDay, $lte: lastDay }
    });

    const totalDays = logs.length;
    const presentDays = logs.filter(l => l.status === 'completed').length;
    const totalHours = logs.reduce((sum, l) => sum + (l.hoursWorked || 0), 0);
    const avgHours = presentDays > 0 ? (totalHours / presentDays).toFixed(2) : 0;

    res.json({ totalDays, presentDays, totalHours: totalHours.toFixed(2), avgHours });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

module.exports = router;
