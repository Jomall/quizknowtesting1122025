/**
 * Standalone manual test script for fill-in-the-blank grading.
 * Runs without a test framework.
 * Usage: node tests/integration/fillInTheBlankGradingManual.js
 */

const request = require('supertest');
/**
 * Manual test script for fill-in-the-blank grading.
 * This script expects the API server to be running externally on port 5000.
 * Usage: node fillInTheBlankGradingManual.js
 */

const request = require('supertest');
const mongoose = require('mongoose');
const Quiz = require('../../models/Quiz');
const QuizSubmission = require('../../models/QuizSubmission');
const { ObjectId } = mongoose.Types;

// Do NOT require or start the API server here to avoid EADDRINUSE errors

const serverUrl = 'http://localhost:5000';

async function runTest() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quizknow', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB connected successfully');
    }

    console.log('Assuming external API server at', serverUrl);

    // Setup: create a quiz with fill-in-the-blank questions with multiple blanks
    const quiz = new Quiz({
      title: 'Fill-in-the-blank Manual Test Quiz',
      instructor: new ObjectId(),
      students: [],
      questions: [
        {
          _id: new ObjectId(),
          type: 'fill-in-the-blank',
          question: 'Complete the sentence',
          points: 4,
          blanks: [
            { id: new ObjectId(), correctAnswer: 'apple' },
            { id: new ObjectId(), correctAnswer: 'banana' },
            { id: new ObjectId(), correctAnswer: 'cherry' },
            { id: new ObjectId(), correctAnswer: 'date' }
          ]
        }
      ],
      settings: { maxAttempts: 1 }
    });
    await quiz.save();
    const quizId = quiz._id.toString();

    console.log('Quiz created with ID:', quizId);

    // Submit full correct answers
    let res = await request(serverUrl)
      .post('/submissions')
      .send({
        quizId,
        answers: [
          {
            questionId: quiz.questions[0]._id.toString(),
            answer: ['apple', 'banana', 'cherry', 'date']
          }
        ]
      });

    console.log('Full correct test response status:', res.status);
    console.log('Full correct test score:', res.body.submission?.score);

    // Submit partial correct answers
    res = await request(serverUrl)
      .post('/submissions')
      .send({
        quizId,
        answers: [
          {
            questionId: quiz.questions[0]._id.toString(),
            answer: ['apple', 'wrong', 'cherry', '']
          }
        ]
      });

    console.log('Partial correct test response status:', res.status);
    console.log('Partial correct test score:', res.body.submission?.score);

    // Cleanup
    await QuizSubmission.deleteMany({ quiz: quizId });
    await Quiz.findByIdAndDelete(quizId);

    await mongoose.disconnect();

	console.log('Manual test completed successfully.');
  } catch (error) {
    console.error('Manual test encountered an error:', error);
  }
}

runTest();
const mongoose = require('mongoose');
const Quiz = require('../../models/Quiz');
const QuizSubmission = require('../../models/QuizSubmission');
const { ObjectId } = mongoose.Types;

async function runTest() {
  try {
    // Setup: create a quiz with fill-in-the-blank questions with multiple blanks
    const quiz = new Quiz({
      title: 'Fill-in-the-blank Manual Test Quiz',
      instructor: new ObjectId(),
      students: [], // Add student ids later if needed
      questions: [
        {
          _id: new ObjectId(),
          type: 'fill-in-the-blank',
          question: 'Complete the sentence',
          points: 4,
          blanks: [
  { id: new ObjectId(), correctAnswer: 'apple' },
  { id: new ObjectId(), correctAnswer: 'banana' },
  { id: new ObjectId(), correctAnswer: 'cherry' },
  { id: new ObjectId(), correctAnswer: 'date' }
]

        }
      ],
      settings: { maxAttempts: 1 }
    });
    await quiz.save();
    const quizId = quiz._id.toString();

    console.log('Quiz created with ID:', quizId);

    // Test full correct answers
    const fullCorrect = ['apple', 'banana', 'cherry', 'date'];

    let res = await request(app)
      .post('/submissions')
      .send({
        quizId,
        answers: [
          {
            questionId: quiz.questions[0]._id.toString(),
            answer: fullCorrect
          }
        ]
      });

    console.log('Full correct test response status:', res.status);
    console.log('Full correct test score:', res.body.submission?.score);

    // Test partial correct answers
    const partialCorrect = ['apple', 'wrong', 'cherry', ''];

    res = await request(app)
      .post('/submissions')
      .send({
        quizId,
        answers: [
          {
            questionId: quiz.questions[0]._id.toString(),
            answer: partialCorrect
          }
        ]
      });

    console.log('Partial correct test response status:', res.status);
    console.log('Partial correct test score:', res.body.submission?.score);

    // Cleanup
    await QuizSubmission.deleteMany({ quiz: quizId });
    await Quiz.findByIdAndDelete(quizId);

    // Close mongoose connection
    await mongoose.disconnect();

    console.log('Manual test completed successfully.');
  } catch (error) {
    console.error('Manual test encountered an error:', error);
  }
}

runTest();
