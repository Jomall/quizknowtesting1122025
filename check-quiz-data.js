const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Load models
require('./models/User');
require('./models/Quiz');
require('./models/QuizSubmission');

async function checkQuizData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Quiz = mongoose.model('Quiz');

    // Check quizzes that josiahjack has submissions for
    const quizIds = [
      '68ebbcc50854ea4c794166af', // Spelling 1
      '68ebc4f9298f15e647c334dc', // Maths2
      '68ebc5c7298f15e647c33853'  // Test3
    ];

    for (const quizId of quizIds) {
      console.log(`\nChecking quiz ${quizId}:`);
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        console.log('Quiz not found');
        continue;
      }

      console.log('Title:', quiz.title);
      console.log('Students assigned:', quiz.students.length);
      quiz.students.forEach(student => {
        console.log('  Student ID:', student.student);
        console.log('  Submitted At:', student.submittedAt);
        console.log('  ---');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkQuizData();
