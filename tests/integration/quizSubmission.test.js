const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const submissionRoutes = require('../../routes/submissions');
const Quiz = require('../../models/Quiz');
const User = require('../../models/User');
const QuizSubmission = require('../../models/QuizSubmission');

const app = express();
app.use(bodyParser.json());
app.use('/api/submissions', submissionRoutes);

const { describe, test, beforeAll, afterAll, expect } = require('mocha');

const sinon = require('sinon');
const authMiddleware = require('../../middleware/auth');

describe('Quiz Submission Integration', () => {
  let authStub;
  let checkApprovedStub;

  before(() => {
    authStub = sinon.stub(authMiddleware, 'auth').callsFake((req, res, next) => {
      req.user = { id: 'studentId', role: 'student' };
      next();
    });

    checkApprovedStub = sinon.stub(authMiddleware, 'checkApproved').callsFake((req, res, next) => next());
  });

  after(() => {
    authStub.restore();
    checkApprovedStub.restore();
  });

  let quizId;

  beforeAll(async () => {
    // connect to test db
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/quizknow-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Clean up collections
    await Quiz.deleteMany({});
    await User.deleteMany({});
    await QuizSubmission.deleteMany({});

    // Create a quiz with fill-in-the-blank question
    const quiz = new Quiz({
      title: 'Test Quiz',
      questions: [{
        _id: mongoose.Types.ObjectId(),
        type: 'fill-in-the-blank',
        question: 'The capital of France is [blank]',
        correctAnswer: 'Paris',
        points: 5
      }],
      students: [{ student: 'studentId', submittedAt: null }],
      settings: { maxAttempts: 2, requireManualReview: false }
    });
    const savedQuiz = await quiz.save();
    quizId = savedQuiz._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('Submit fill-in-the-blank answer correctly', async () => {
    const res = await request(app)
      .post('/api/submissions')
      .send({
        quizId,
        answers: [{
          questionId: quizId,
          answer: 'Paris'
        }]
      });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Quiz submitted successfully');
    expect(res.body.submission.score).toBeGreaterThan(0);
  });

  test('Reject submission with max attempts exceeded', async () => {
    // Mark max attempts by creating dummy submissions
    await QuizSubmission.create({
      quiz: quizId,
      student: 'studentId',
      attemptNumber: 1,
      answers: [],
      score: 0,
      percentage: 0,
      maxScore: 5,
      totalQuestions: 1,
      isCompleted: true
    });
    await QuizSubmission.create({
      quiz: quizId,
      student: 'studentId',
      attemptNumber: 2,
      answers: [],
      score: 0,
      percentage: 0,
      maxScore: 5,
      totalQuestions: 1,
      isCompleted: true
    });

    const res = await request(app)
      .post('/api/submissions')
      .send({
        quizId,
        answers: [{ questionId: quizId, answer: 'Paris' }]
      });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message', 'Maximum attempts reached for this quiz');
  });

  // More integration tests for unauthorized, invalid inputs can be added here

});
