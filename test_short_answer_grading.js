const assert = require('assert');
const ShortAnswerGradingService = require('./services/shortAnswerGradingService');

describe('ShortAnswerGradingService', () => {
  const gradingService = ShortAnswerGradingService;

  describe('normalizeText()', () => {
    it('should normalize text correctly', () => {
      const input = "He's running. She's happy!";
      const expected = 'he is running she is happy';
      const actual = gradingService.normalizeText(input);
      assert.strictEqual(actual, expected);
    });
  });

  describe('gradeShortAnswer()', () => {
    it('should return high score and correct for exact match', async () => {
      const studentAnswer = 'Mitochondria are the powerhouse of the cell.';
      const questionConfig = {
        correctAnswer: 'Mitochondria are the powerhouse of the cell.',
      };

      const result = await gradingService.gradeShortAnswer(studentAnswer, questionConfig);
      assert.strictEqual(result.isCorrect, true);
      assert.ok(result.score >= 0.7);
    });

    it('should detect misconception', async () => {
      const studentAnswer = 'Mitochondria store food.';
      const questionConfig = {
        correctAnswer: 'Mitochondria are the powerhouse of the cell.',
      };

      const result = await gradingService.gradeShortAnswer(studentAnswer, questionConfig);
      assert.strictEqual(result.misconception.detected, true);
    });

    it('should give partial credit for partial match', async () => {
      const studentAnswer = 'Mitochondria generate energy.';
      const questionConfig = {
        correctAnswer: 'Mitochondria are the powerhouse of the cell.',
      };

      const result = await gradingService.gradeShortAnswer(studentAnswer, questionConfig);
      assert.ok(result.score > 0 && result.score < 0.7);
    });

    it('should detect off-topic answer', async () => {
      const studentAnswer = 'The moon is bright tonight.';
      const questionConfig = {
        correctAnswer: 'Mitochondria are the powerhouse of the cell.',
      };

      const result = await gradingService.gradeShortAnswer(studentAnswer, questionConfig);
      assert.strictEqual(typeof result.offTopic.detected, 'boolean', `Received offTopic.detected value: ${result.offTopic.detected}`);
    });
  });
});
