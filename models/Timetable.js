const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  endTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  activity: {
    type: String,
    required: true
  },
  phase: {
    type: String,
    enum: ['Prime Focus', 'Recharge', 'Rest', 'Active Practice', 'Revision', 'Balance', 'Light Prep', 'Recovery'],
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  linkedQuiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  linkedContent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  },
  pomodoroEnabled: {
    type: Boolean,
    default: false
  },
  pomodoroDuration: {
    type: Number, // in minutes
    default: 25
  },
  spacedRepetition: {
    type: Boolean,
    default: false
  },
  repetitionInterval: {
    type: Number, // days
    default: 1
  },
  completed: {
    type: Boolean,
    default: false
  },
  notes: String
});

const timetableSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  title: {
    type: String,
    default: 'Daily Study Schedule'
  },
  energyPattern: {
    type: String,
    enum: ['lark', 'owl', 'balanced'],
    default: 'balanced'
  },
  peakEnergyTime: {
    type: String,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    default: '08:00'
  },
  timeSlots: [timeSlotSchema],
  totalStudyTime: {
    type: Number, // in minutes
    default: 0
  },
  completedSlots: {
    type: Number,
    default: 0
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateName: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
timetableSchema.index({ student: 1, date: 1 });
timetableSchema.index({ student: 1, isTemplate: 1 });

// Pre-save middleware to update total study time
timetableSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Calculate total study time from time slots
  this.totalStudyTime = this.timeSlots.reduce((total, slot) => {
    const start = new Date(`1970-01-01T${slot.startTime}:00`);
    const end = new Date(`1970-01-01T${slot.endTime}:00`);
    const duration = (end - start) / (1000 * 60); // in minutes
    return total + duration;
  }, 0);

  next();
});

// Virtual for completion percentage
timetableSchema.virtual('completionPercentage').get(function() {
  if (this.timeSlots.length === 0) return 0;
  return Math.round((this.completedSlots / this.timeSlots.length) * 100);
});

// Method to get upcoming activities
timetableSchema.methods.getUpcomingActivities = function(currentTime) {
  const now = currentTime || new Date();
  const currentTimeString = now.toTimeString().slice(0, 5); // HH:MM format

  return this.timeSlots.filter(slot => {
    return slot.startTime >= currentTimeString && !slot.completed;
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));
};

// Method to get overdue activities
timetableSchema.methods.getOverdueActivities = function(currentTime) {
  const now = currentTime || new Date();
  const currentTimeString = now.toTimeString().slice(0, 5); // HH:MM format

  return this.timeSlots.filter(slot => {
    return slot.endTime < currentTimeString && !slot.completed;
  });
};

module.exports = mongoose.model('Timetable', timetableSchema);
