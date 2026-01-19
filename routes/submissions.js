
const express = require('express');
const QuizSubmission = require('../models/QuizSubmission');
const Quiz = require('../models/Quiz');
const { auth, checkApproved } = require('../middleware/auth');
const shortAnswerGradingService = require('../services/shortAnswerGradingService');

const router = express.Router();

// Submit quiz (student only)
router.post('/', auth, checkApproved, async (req, res) => {
  try {
    const { quizId, answers } = req.body;

    // Check if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if student is assigned to this quiz
    const isAssigned = quiz.students.some(s =>
      s.student.toString() === req.user.id
    );

    if (!isAssigned) {
      return res.status(403).json({ message: 'Not assigned to this quiz' });
    }

    // Check attempt limit
    const previousAttempts = await QuizSubmission.countDocuments({
      quiz: quizId,
      student: req.user.id,
      isCompleted: true
    });

    const maxAttempts = quiz.settings?.maxAttempts || 1;
    if (previousAttempts >= maxAttempts) {
      return res.status(403).json({ message: 'Maximum attempts reached for this quiz' });
    }

    // Calculate score based on points earned
    let score = 0;
    const totalQuestions = quiz.questions.length;
    const maxScore = quiz.questions.reduce((total, q) => total + (q.points || 1), 0);

    const submissionAnswers = await Promise.all(answers.map(async (answer) => {
      const question = quiz.questions.find(q => q._id.toString() === answer.questionId);
      if (!question) {
        return {
          questionId: answer.questionId,
          answer: answer.answer,
          isCorrect: false,
          pointsEarned: 0
        };
      }

      let isCorrect = false;
      let pointsEarned = 0;

if (question.type === 'fill-in-the-blank') {
  if (Array.isArray(answer.answer)) {
    let totalScore = 0;
    const blanks = question.blanks || [];
    for (let i = 0; i < blanks.length; i++) {
      const blankAnswer = (answer.answer[i] || '').toString();
      const blankPoints = blanks[i]?.points || 1;
      const blankQuestionConfig = {
        correctAnswer: blanks[i]?.correctAnswer || '',
        alternativeAnswers: blanks[i]?.alternativeAnswers || [],
        keywordWeights: blanks[i]?.keywordWeights || {},
      };
      const gradingResult = await shortAnswerGradingService.gradeShortAnswer(blankAnswer, blankQuestionConfig);
      if (gradingResult.isCorrect) {
        totalScore += blankPoints;
      }
    }
    pointsEarned = totalScore;
    // Consider partial credit correct if any blank correct
    isCorrect = totalScore > 0;
  } else {
    const gradingResult = await shortAnswerGradingService.gradeShortAnswer(answer.answer, question);
    isCorrect = gradingResult.isCorrect;
    pointsEarned = isCorrect ? (question.points || 1) : 0;
  }
} else {
  isCorrect = question.correctAnswer === answer.answer;
  pointsEarned = isCorrect ? (question.points || 1) : 0;
}

      if (isCorrect) {
        score += pointsEarned;
      }

      return {
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect,
        pointsEarned
      };
    }));

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    // Create QuizSession for consistency
    const QuizSession = require('../models/QuizSession');
    const session = new QuizSession({
      quiz: quizId,
      student: req.user.id,
      startTime: new Date(),
      endTime: new Date(),
      timeLimit: quiz.settings?.timeLimit || 60,
      status: 'completed',
      score,
      maxScore: quiz.questions.reduce((total, q) => total + (q.points || 1), 0),
      answers: submissionAnswers.map(ans => {
        const question = quiz.questions.find(q => q._id.toString() === ans.questionId);
        return {
          questionId: ans.questionId,
          answer: ans.answer,
          isCorrect: ans.isCorrect,
          points: ans.isCorrect ? (question?.points || 1) : 0
        };
      }),
      timeSpent: 0 // Will be calculated later if needed
    });
    await session.save();

    // Create submission
    const submission = new QuizSubmission({
      quiz: quizId,
      student: req.user.id,
      session: session._id,
      attemptNumber: previousAttempts + 1,
      answers: submissionAnswers,
      score,
      percentage,
      maxScore: session.maxScore,
      totalQuestions
    });

    await submission.save();

    // Update quiz student record
    const studentIndex = quiz.students.findIndex(s =>
      s.student.toString() === req.user.id
    );
    quiz.students[studentIndex].submittedAt = new Date();
    await quiz.save();

    // Handle different correction methods
    if (quiz.settings.correctionMethod === 'auto') {
      // Auto-correction: complete immediately if no manual review required
      if (!quiz.settings.requireManualReview && quiz.settings.gradingMode === 'auto') {
        submission.isCompleted = true;
        submission.reviewedAt = new Date();
        await submission.save();
      }
    } else if (quiz.settings.correctionMethod === 'instructor') {
      // Instructor correction: mark for manual review
      submission.isCompleted = false; // Wait for instructor review
    } else if (quiz.settings.correctionMethod === 'peer') {
      // Peer correction: assign to other students for grading
      submission.isCompleted = false; // Wait for peer reviews
      await assignPeerGradingTasks(submission, quiz);
    }

    res.status(201).json({
      message: 'Quiz submitted successfully',
      submission: {
        id: submission._id,
        score,
        percentage,
        totalQuestions
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get my submissions (student only)
router.get('/my-submissions', auth, async (req, res) => {
  try {
    const submissions = await QuizSubmission.find({ student: req.user.id })
      .populate('quiz')
      .populate('session')
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get submissions for a quiz (instructor only)
router.get('/quiz/:quizId', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (req.user.role !== 'instructor' && quiz.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const submissions = await QuizSubmission.find({ quiz: req.params.quizId })
      .populate('student', 'username profile.firstName profile.lastName')
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get submission by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const submission = await QuizSubmission.findById(req.params.id)
      .populate('quiz')
      .populate('student', 'username profile.firstName profile.lastName');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if user has access
    const isStudent = submission.student._id.toString() === req.user.id;
    const isInstructor = req.user.role === 'instructor' || submission.quiz.instructor.toString() === req.user.id;

    if (!isStudent && !isInstructor) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark submission as reviewed (instructor only)
router.put('/:id/review', auth, async (req, res) => {
  try {
    const submission = await QuizSubmission.findById(req.params.id)
      .populate('quiz');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (req.user.role !== 'instructor' && submission.quiz.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    submission.reviewedAt = new Date();
    submission.isCompleted = true;
    await submission.save();

    res.json({ message: 'Submission marked as reviewed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete single submission (instructor only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const submission = await QuizSubmission.findById(req.params.id)
      .populate('quiz');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (req.user.role !== 'instructor' && submission.quiz.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update quiz student record to allow retake
    const studentIndex = submission.quiz.students.findIndex(s =>
      s.student.toString() === submission.student.toString()
    );
    if (studentIndex >= 0) {
      submission.quiz.students[studentIndex].submittedAt = undefined;
      await submission.quiz.save();
    }

    await QuizSubmission.findByIdAndDelete(req.params.id);

    res.json({ message: 'Submission cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete multiple submissions (batch clear) (instructor only)
router.delete('/', auth, async (req, res) => {
  try {
    const { submissionIds } = req.body;

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return res.status(400).json({ message: 'submissionIds array is required' });
    }

    // Get all submissions to verify ownership
    const submissions = await QuizSubmission.find({ _id: { $in: submissionIds } })
      .populate('quiz');

    if (submissions.length !== submissionIds.length) {
      return res.status(404).json({ message: 'One or more submissions not found' });
    }

    // Verify all submissions belong to the same instructor
    const instructorId = submissions[0].quiz.instructor.toString();
    const allSameInstructor = submissions.every(sub =>
      sub.quiz.instructor.toString() === instructorId
    );

    if (!allSameInstructor || (req.user.role !== 'instructor' && instructorId !== req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update quiz student records to allow retakes
    const quizUpdates = {};
    submissions.forEach(submission => {
      const quizId = submission.quiz._id.toString();
      if (!quizUpdates[quizId]) {
        quizUpdates[quizId] = [];
      }
      quizUpdates[quizId].push(submission.student.toString());
    });

    for (const [quizId, studentIds] of Object.entries(quizUpdates)) {
      const quiz = await Quiz.findById(quizId);
      studentIds.forEach(studentId => {
        const studentIndex = quiz.students.findIndex(s =>
          s.student.toString() === studentId
        );
        if (studentIndex >= 0) {
          quiz.students[studentIndex].submittedAt = undefined;
        }
      });
      await quiz.save();
    }

    // Delete submissions
    const result = await QuizSubmission.deleteMany({ _id: { $in: submissionIds } });

    res.json({
      message: `${result.deletedCount} submissions cleared successfully`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
