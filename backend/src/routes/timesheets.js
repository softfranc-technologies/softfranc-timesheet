const express = require('express');
const { z } = require('zod');
const Timesheet = require('../models/Timesheet');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const entrySchema = z.object({
  date: z.string(),
  project: z.string().optional().default('General'),
  hours: z.number().min(0).max(24),
  description: z.string().optional().default('')
});

const timesheetSchema = z.object({
  weekStart: z.string(),
  weekEnd: z.string(),
  entries: z.array(entrySchema).min(1)
});

// GET /api/timesheets/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [timesheets, total] = await Promise.all([
      Timesheet.find({ userId: req.user._id }).sort({ weekStart: -1 }).skip(skip).limit(limit),
      Timesheet.countDocuments({ userId: req.user._id })
    ]);

    res.json({ timesheets, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timesheets.' });
  }
});

// GET /api/timesheets/current
router.get('/current', authenticate, async (req, res) => {
  try {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    const weekStart = monday.toISOString().split('T')[0];

    const ts = await Timesheet.findOne({ userId: req.user._id, weekStart });
    res.json({ timesheet: ts || null, weekStart });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch current timesheet.' });
  }
});

// POST /api/timesheets — create or update draft
router.post('/', authenticate, authorize('employee'), async (req, res) => {
  try {
    const parsed = timesheetSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

    const { weekStart, weekEnd, entries } = parsed.data;

    let ts = await Timesheet.findOne({ userId: req.user._id, weekStart });

    if (ts && ts.status === 'submitted') {
      return res.status(409).json({ error: 'Timesheet already submitted and awaiting approval.' });
    }
    if (ts && ts.status === 'approved') {
      return res.status(409).json({ error: 'Approved timesheet cannot be edited.' });
    }

    if (ts) {
      ts.entries = entries;
      ts.weekEnd = weekEnd;
      ts.status = 'draft';
      await ts.save();
    } else {
      ts = await Timesheet.create({ userId: req.user._id, weekStart, weekEnd, entries });
    }

    res.status(201).json({ message: 'Timesheet saved as draft.', timesheet: ts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save timesheet.' });
  }
});

// POST /api/timesheets/:id/submit
router.post('/:id/submit', authenticate, authorize('employee'), async (req, res) => {
  try {
    const ts = await Timesheet.findOne({ _id: req.params.id, userId: req.user._id });
    if (!ts) return res.status(404).json({ error: 'Timesheet not found.' });
    if (ts.status !== 'draft') return res.status(400).json({ error: `Cannot submit a ${ts.status} timesheet.` });

    ts.status = 'submitted';
    ts.submittedAt = new Date();
    await ts.save();

    res.json({ message: 'Timesheet submitted for approval.', timesheet: ts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit timesheet.' });
  }
});

module.exports = router;
