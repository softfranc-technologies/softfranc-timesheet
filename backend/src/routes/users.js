const express = require('express');
const { z } = require('zod');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/profile
router.get('/profile', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/users/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, department, position } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (department) updates.department = department;
    if (position) updates.position = position;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ message: 'Profile updated.', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// PUT /api/users/change-password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both fields required.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' });

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    user.passwordHash = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

module.exports = router;
