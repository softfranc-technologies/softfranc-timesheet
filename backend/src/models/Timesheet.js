const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  project: { type: String, trim: true, default: 'General' },
  hours: { type: Number, required: true, min: 0, max: 24 },
  description: { type: String, trim: true, maxlength: 500, default: '' }
}, { _id: false });

const timesheetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  weekStart: {
    type: String, // YYYY-MM-DD (Monday of the week)
    required: true
  },
  weekEnd: {
    type: String, // YYYY-MM-DD (Sunday of the week)
    required: true
  },
  entries: [entrySchema],
  totalHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  submittedAt: { type: Date, default: null },
  approvedAt: { type: Date, default: null },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectionReason: { type: String, default: '' }
}, { timestamps: true });

// Compound index
timesheetSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

// Auto-calculate totalHours
timesheetSchema.pre('save', function (next) {
  this.totalHours = this.entries.reduce((sum, e) => sum + (e.hours || 0), 0);
  next();
});

module.exports = mongoose.model('Timesheet', timesheetSchema);
