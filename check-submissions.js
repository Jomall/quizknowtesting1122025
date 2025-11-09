const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Load models
require('./models/User');
require('./models/Quiz');
require('./models/QuizSubmission');

async function checkSubmissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const QuizSubmission = mongoose.model('QuizSubmission');
    const submissions = await QuizSubmission.find({}).populate('quiz').populate('student').limit(10);

    console.log('Sample submissions:');
    submissions.forEach(sub => {
      console.log('Submission ID:', sub._id);
      console.log('Student:', sub.student ? sub.student.username : 'NULL STUDENT');
      console.log('Quiz:', sub.quiz ? sub.quiz.title : 'NULL QUIZ');
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSubmissions();
