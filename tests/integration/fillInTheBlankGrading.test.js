const request = require('supertest');
const app = require('../../api/server'); // Adjust path if necessary
const mongoose = require('mongoose');
const Quiz = require('../../models/Quiz');
const QuizSubmission = require('../../models/QuizSubmission');

describe('Fill-in-the-blank grading', () => {
  let quizId;
  let studentToken; // Assume authentication token for student
  let quiz;

  before(async () => {
    // Setup: create a quiz with fill-in-the-blank questions with multiple blanks
    quiz = new Quiz({
      title: 'Fill-in-the-blank Test Quiz',
      instructor: mongoose.Types.ObjectId(),
      students: [], // Add student ids later if needed
      questions: [
        {
          _id: mongoose.Types.ObjectId(),
          type: 'fill-in-the-blank',
          question: 'Complete the sentence',
          points: 4,
          blanks: [
            { correctAnswer: 'apple' },
            { correctAnswer: 'banana' },
            { correctAnswer: 'cherry' },
            { correctAnswer: 'date' }
          ]
        }
      ],
      settings: { maxAttempts: 1 }
    });

    await quiz.save();
    quizId = quiz._id.toString();

    // TODO: setup student authentication token and add student to quiz.students if needed
    // For test assume studentToken is set or use test authentication middleware to bypass auth
  });

  after(async () => {
    // Cleanup
    await QuizSubmission.deleteMany({ quiz: quizId });
    await Quiz.findByIdAndDelete(quizId);
    await mongoose.disconnect();
  });

  it('correctly grades each blank independently and sums the score', async () => {
    const studentAnswers = ['apple', 'banana', 'cherry', 'date'];

    const res = await request(app)
      .post('/submissions')
      // .set('Authorization', `Bearer ${studentToken}`) // enable if auth middleware in place
      .send({
        quizId,
        answers: [
          {
            questionId: quiz.questions[0]._id.toString(),
            answer: studentAnswers
          }
        ]
      });

    if (res.status !== 201) {
      throw new Error(`Expected status 201 but got ${res.status}`);
    }

    if (!res.body.submission || typeof res.body.submission.score !== 'number') {
      throw new Error('Response missing submission score');
    }

    if (Math.abs(res.body.submission.score - 4) > 0.001) {
      throw new Error(`Expected score near 4 but got ${res.body.submission.score}`);
    }
  });

  it('gives partial credit for partially correct blanks', async () => {
    const partialAnswers = ['apple', 'wrong', 'cherry', ''];

    const res = await request(app)
      .post('/submissions')
      // .set('Authorization', `Bearer ${studentToken}`)
      .send({
        quizId,
        answers: [
          {
            questionId: quiz.questions[0]._id.toString(),
            answer: partialAnswers
          }
        ]
      });

    if (res.status !== 201) {
      throw new Error(`Expected status 201 but got ${res.status}`);
    }

    if (!res.body.submission || typeof res.body.submission.score !== 'number') {
      throw new Error('Response missing submission score');
    }

    const score = res.body.submission.score;
    if (score <= 0 || score >= 4) {
      throw new Error(`Expected partial score between 0 and 4 but got ${score}`);
    }
  });
});
