const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Load models
require('./models/User');
require('./models/Quiz');
require('./models/QuizSubmission');

async function checkUserSubmissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User');
    const QuizSubmission = mongoose.model('QuizSubmission');

    // Find user with username containing "josiah"
    const user = await User.findOne({ username: /josiah/ });
    if (!user) {
      console.log('No user found with username containing "josiah"');
      process.exit(0);
    }

    console.log('User found:', user.username, user._id);

    // Get submissions for this user
    const submissions = await QuizSubmission.find({ student: user._id }).populate('quiz').populate('student');

    console.log(`Submissions for ${user.username}:`);
    submissions.forEach(sub => {
      console.log('Submission ID:', sub._id);
      console.log('Quiz:', sub.quiz ? sub.quiz.title : 'NULL QUIZ');
      console.log('Quiz ID:', sub.quiz ? sub.quiz._id : 'NULL');
      console.log('Student:', sub.student ? sub.student.username : 'NULL STUDENT');
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserSubmissions();
