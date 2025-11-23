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
