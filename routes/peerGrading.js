const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PeerGradingAssignment = require('../models/PeerGradingAssignment');
const QuizSubmission = require('../models/QuizSubmission');
const Quiz = require('../models/Quiz');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get peer grading assignments for current user
router.get('/assignments', auth, async (req, res) => {
  try {
    const assignments = await PeerGradingAssignment.find({
      reviewer: req.user.id,
      status: { $in: ['pending', 'in-progress'] }
    })
    .populate('quiz', 'title')
    .populate('submission')
    .populate({
      path: 'submission',
      populate: {
        path: 'student',
        select: 'username profile.firstName profile.lastName'
      }
    })
    .sort({ assignedAt: -1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific peer grading assignment
router.get('/assignments/:id', auth, async (req, res) => {
  try {
    const assignment = await PeerGradingAssignment.findById(req.params.id)
      .populate('quiz', 'title questions')
      .populate('submission')
      .populate({
        path: 'submission',
        populate: {
          path: 'student',
          select: 'username profile.firstName profile.lastName'
        }
      });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit peer grading review
router.post('/assignments/:id/review', auth, [
  body('reviews').isArray({ min: 1 }).withMessage('Reviews are required'),
  body('overallFeedback').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const assignment = await PeerGradingAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (assignment.status !== 'pending' && assignment.status !== 'in-progress') {
      return res.status(400).json({ message: 'Assignment is not available for review' });
    }

    const { reviews, overallFeedback } = req.body;

    // Update reviews
    assignment.reviews = reviews.map(review => ({
      ...review,
      reviewedAt: new Date()
    }));

    // Calculate overall score
    const totalScore = reviews.reduce((sum, review) => sum + review.score, 0);
    const maxScore = reviews.reduce((sum, review) => sum + review.maxScore, 0);
    assignment.overallScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    assignment.overallFeedback = overallFeedback;

    assignment.completedAt = new Date();
    assignment.status = 'completed';

    await assignment.save();

    // Check if we need to calculate consensus for this submission
    await calculateConsensus(assignment.submission);

    res.json({ message: 'Review submitted successfully', assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create peer grading assignments for a quiz
router.post('/create/:quizId', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get all completed submissions for this quiz
    const submissions = await QuizSubmission.find({
      quiz: req.params.quizId,
      isCompleted: true
    }).populate('student');

    if (submissions.length < 2) {
      return res.status(400).json({ message: 'Need at least 2 submissions for peer grading' });
    }

    const assignmentsPerSubmission = quiz.settings.peerGradingSettings?.assignmentsPerSubmission || 2;
    const gradingDeadline = quiz.settings.peerGradingSettings?.gradingDeadline || 7;

    const assignments = [];
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + gradingDeadline);

    // Create assignments for each submission
    for (const submission of submissions) {
      // Find other students who submitted (excluding the current student)
      const otherStudents = submissions
        .filter(s => s.student._id.toString() !== submission.student._id.toString())
        .map(s => s.student);

      // Randomly select reviewers
      const reviewers = shuffleArray(otherStudents).slice(0, assignmentsPerSubmission);

      for (const reviewer of reviewers) {
        const assignment = new PeerGradingAssignment({
          quiz: req.params.quizId,
          submission: submission._id,
          reviewer: reviewer._id,
          deadline: deadline
        });

        assignments.push(assignment);
        await assignment.save();
      }
    }

    res.json({
      message: 'Peer grading assignments created successfully',
      assignmentsCount: assignments.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get peer grading statistics for instructor
router.get('/stats/:quizId', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const assignments = await PeerGradingAssignment.find({ quiz: req.params.quizId })
      .populate('reviewer', 'username profile.firstName profile.lastName')
      .populate('submission');

    const stats = {
      totalAssignments: assignments.length,
      completedAssignments: assignments.filter(a => a.status === 'completed').length,
      pendingAssignments: assignments.filter(a => a.status === 'pending').length,
      overdueAssignments: assignments.filter(a => a.status === 'overdue').length,
      averageConsensusScore: 0,
      submissionsWithConsensus: 0
    };

    // Calculate consensus statistics
    const submissionsWithConsensus = assignments
      .filter(a => a.isConsensus)
      .map(a => a.submission.toString());

    stats.submissionsWithConsensus = new Set(submissionsWithConsensus).size;

    if (stats.totalAssignments > 0) {
      stats.completionRate = (stats.completedAssignments / stats.totalAssignments) * 100;
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to calculate consensus for a submission
async function calculateConsensus(submissionId) {
  try {
    const assignments = await PeerGradingAssignment.find({
      submission: submissionId,
      status: 'completed'
    });

    if (assignments.length === 0) return;

    const quiz = await Quiz.findOne({ 'submissions.submission': submissionId });
    const minReviewers = quiz?.settings?.peerGradingSettings?.minReviewers || 1;
    const requireConsensus = quiz?.settings?.peerGradingSettings?.requireConsensus || false;

    if (assignments.length < minReviewers) return;

    // Calculate average scores for each question
    const questionScores = {};
    assignments.forEach(assignment => {
      assignment.reviews.forEach(review => {
        if (!questionScores[review.questionId]) {
          questionScores[review.questionId] = [];
        }
        questionScores[review.questionId].push(review.score);
      });
    });

    // Check if scores are within acceptable range (consensus)
    let hasConsensus = true;
    const consensusThreshold = 10; // 10% difference allowed

    Object.values(questionScores).forEach(scores => {
      if (scores.length > 1) {
        const avg = scores.reduce((a, b) => a + b) / scores.length;
        const maxDiff = Math.max(...scores) - Math.min(...scores);
        if ((maxDiff / avg) * 100 > consensusThreshold) {
          hasConsensus = false;
        }
      }
    });

    // Update assignments with consensus status
    if (requireConsensus && hasConsensus) {
      await PeerGradingAssignment.updateMany(
        { submission: submissionId },
        { isConsensus: true }
      );
    } else if (!requireConsensus) {
      // If consensus not required, mark as consensus anyway
      await PeerGradingAssignment.updateMany(
        { submission: submissionId },
        { isConsensus: true }
      );
    }

    // Update the submission with final peer grade
    const submission = await QuizSubmission.findById(submissionId);
    if (submission && assignments.length >= minReviewers) {
      const totalPeerScore = assignments.reduce((sum, a) => sum + (a.overallScore || 0), 0);
      const averagePeerScore = totalPeerScore / assignments.length;

      submission.peerGradingScore = averagePeerScore;
      submission.peerGradingCompleted = true;
      submission.peerGradingReviews = assignments.length;

      await submission.save();
    }
  } catch (error) {
    console.error('Error calculating consensus:', error);
  }
}

// Helper function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

module.exports = router;
