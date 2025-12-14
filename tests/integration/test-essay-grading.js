
const essayGradingService = require('../services/essayGradingService');

async function testEssayGrading() {
  console.log('Testing Enhanced Essay Grading Service...\n');

  const studentAnswer = 'Photosynthesis is the process where plants make food using sunlight. Chlorophyll helps in this process. Plants convert light energy into chemical energy.';

  const correctAnswer = 'Photosynthesis is the process by which plants convert light energy into chemical energy. Chlorophyll in the leaves absorbs sunlight. This process produces glucose which is used as food by the plant.';

  try {
    // Test basic grading
    console.log('=== BASIC ESSAY GRADING ===');
    const basicResult = essayGradingService.gradeEssay(studentAnswer, correctAnswer);
    console.log('Score:', basicResult.score);
    console.log('Analysis:', basicResult.analysis);
    console.log('Matched Keywords:', basicResult.matchedKeywords.length, '/', basicResult.totalKeywords);
    console.log('');

    // Test advanced grading
    console.log('=== ADVANCED ESSAY GRADING ===');
    const advancedResult = essayGradingService.gradeEssayAdvanced(studentAnswer, correctAnswer);
    console.log('Score:', advancedResult.score);
    console.log('Semantic Similarity:', advancedResult.semanticSimilarity);
    console.log('Analysis:', advancedResult.analysis);
    console.log('');

    // Test comprehensive grading
    console.log('=== COMPREHENSIVE ESSAY GRADING ===');
    const comprehensiveResult = await essayGradingService.gradeEssayComprehensive(studentAnswer, correctAnswer);
    console.log('Score:', comprehensiveResult.score);
    console.log('Analysis:', comprehensiveResult.analysis);
    console.log('Component Scores:', JSON.stringify(comprehensiveResult.componentScores, null, 2));
    console.log('');

    // Test sentence matching grading
    console.log('=== SENTENCE MATCHING GRADING ===');
    const sentenceMatchingResult = await essayGradingService.gradeEssayWithSentenceMatching(studentAnswer, correctAnswer);
    console.log('Score:', sentenceMatchingResult.score);
    console.log('Completeness Score:', sentenceMatchingResult.completenessScore);
    console.log('Analysis:', sentenceMatchingResult.analysis);
    console.log('Sentence Matches:', sentenceMatchingResult.sentenceMatches.matched.length, '/', sentenceMatchingResult.sentenceMatches.totalExpected);
    console.log('Organization Score:', sentenceMatchingResult.organizationAnalysis.coherenceScore);
    console.log('');

    console.log('✅ All essay grading tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEssayGrading();
