const mongoose = require('mongoose');

const peerGradingAssignmentSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  submission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizSubmission',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'overdue'],
    default: 'pending'
  },
  reviews: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0
    },
    maxScore: {
      type: Number,
      required: true
    },
    feedback: String,
    reviewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  overallScore: Number,
  overallFeedback: String,
  isConsensus: {
    type: Boolean,
    default: false
  }
});

// Indexes for performance
peerGradingAssignmentSchema.index({ quiz: 1, reviewer: 1 });
peerGradingAssignmentSchema.index({ submission: 1 });
peerGradingAssignmentSchema.index({ status: 1, deadline: 1 });

// Virtual for completion percentage
peerGradingAssignmentSchema.virtual('completionPercentage').get(function() {
  if (!this.reviews || !this.reviews.length) return 0;
  const totalQuestions = this.reviews.length;
  const completedReviews = this.reviews.filter(review => review.score !== undefined).length;
  return Math.round((completedReviews / totalQuestions) * 100);
});

// Pre-save middleware to update status
peerGradingAssignmentSchema.pre('save', function(next) {
  if (this.completedAt) {
    this.status = 'completed';
  } else if (new Date() > this.deadline) {
    this.status = 'overdue';
  } else if (this.reviews && this.reviews.length > 0) {
    this.status = 'in-progress';
  }
  next();
});

module.exports = mongoose.model('PeerGradingAssignment', peerGradingAssignmentSchema);
