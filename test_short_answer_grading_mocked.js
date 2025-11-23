const assert = require('assert');
const shortAnswerGradingService = require('./services/shortAnswerGradingService');

describe('ShortAnswerGradingService', function () {
  this.timeout(15000); // Increase timeout for async/await with BERT model

  it('should mark exact correct answer as correct', async () => {
    const questionConfig = {
      correctAnswer: 'Paris',
      alternativeAnswers: ['paris city', 'the city of Paris'],
      keywordWeights: {}
    };
    const studentAnswer = 'Paris';
    const result = await shortAnswerGradingService.gradeShortAnswer(studentAnswer, questionConfig);
    assert.strictEqual(result.isCorrect, true);
    assert.ok(result.score > 0.7, 'Score should be above threshold');
  });

  it('should mark a synonym answer as correct', async () => {
    const questionConfig = {
      correctAnswer: 'car',
      alternativeAnswers: ['automobile', 'vehicle'],
      keywordWeights: {}
    };
    const studentAnswer = 'automobile';
    const result = await shortAnswerGradingService.gradeShortAnswer(studentAnswer, questionConfig);
    assert.strictEqual(result.isCorrect, true);
  });

  it('should allow partial credit for partially correct answers', async () => {
    const questionConfig = {
      correctAnswer: 'The mitochondria is the powerhouse of the cell',
      alternativeAnswers: ['Mitochondria produces energy', 'Mitochondria generate ATP'],
      gradingOptions: {
        usePartialCredit: true
      }
    };
    const studentAnswer = 'The mitochondria is the powerplant of the cell';
    const result = await shortAnswerGradingService.gradeShortAnswer(studentAnswer, questionConfig, { usePartialCredit: true });
    assert.ok(result.score > 0 && result.score < 1, 'Score should represent partial credit');
  });

  it('should mark completely wrong answers as incorrect', async () => {
    const questionConfig = {
      correctAnswer: 'Water freezes at 0 degrees Celsius',
      alternativeAnswers: ['Freezing point of water is zero'],
    };
    const studentAnswer = 'Water boils at 100 degrees Celsius';
    const result = await shortAnswerGradingService.gradeShortAnswer(studentAnswer, questionConfig);
    assert.strictEqual(result.isCorrect, false);
  });

  it('should flag common misconceptions', async () => {
    const questionConfig = {
      correctAnswer: 'Mitochondria produces energy',
    };
    const studentAnswer = 'Mitochondria store food';
    const result = await shortAnswerGradingService.gradeShortAnswer(studentAnswer, questionConfig);
    assert.strictEqual(result.misconception.detected, true);
  });
});
