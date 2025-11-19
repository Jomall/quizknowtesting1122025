# TODO: Implement Short Answer Question Grading Logic

## Overview
Enhance the essayGradingService to provide structured grading for Short Answer questions based on instructor-provided expected answers and rubrics. Implement logic that validates student answers against key concepts, completeness, and relevance using NLP techniques.

## Steps
- [ ] Update essayGradingService.js with short answer specific grading methods
- [ ] Add method to parse expected answer into key points/sentences
- [ ] Implement semantic comparison for each key point
- [ ] Add partial credit calculation based on coverage (0-2 points scale)
- [ ] Implement misconception detection
- [ ] Update grading API to use new logic for 'short-answer' type
- [ ] Test with sample questions (mitochondria example)
- [ ] Integrate with quiz submission grading

## Key Features
- Parse instructor's expected answer into 2-3 key sentences/points
- Compare student answer coverage using semantic similarity
- Assign scores: 2/2 (full), 1/2 (partial), 0/2 (incorrect/missing)
- Detect off-topic or misconception-based answers
- Support for different question types: factual, application, analysis, synthesis

## Files to Modify
- services/essayGradingService.js
- routes/quiz.js (grading endpoint)
- Possibly models/Quiz.js for question structure

## Testing
- Use mitochondria question example
- Test various student answers: correct, partial, incorrect, misconceptions
