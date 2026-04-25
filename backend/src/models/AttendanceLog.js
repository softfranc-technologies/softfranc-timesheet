const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String, // stored as YYYY-MM-DD for easy daily queries
    required: true,
    index: true
  },
  punchIn: {
    type: Date,
    required: true
  },
  punchOut: {
    type: Date,
    default: null
  },
  hoursWorked: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  }
}, { timestamps: true });

// Compound index for uniqueness per user per day
attendanceLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// Calculate hours when punchOut is set
attendanceLogSchema.pre('save', function (next) {
  if (this.punchIn && this.punchOut) {
    const diffMs = this.punchOut - this.punchIn;
    this.hoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    this.status = 'completed';
  }
  next();
});

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema);
