# TODO: Enhance Short Answer Grading and Correction Logic

## Plan Overview
Enhance the existing short answer grading service to improve grading robustness and correctness, including order-insensitive keyword matching.

## Steps

1. Enhance synonym dictionary management for extended coverage.

2. Improve keyword matching logic in shortAnswerGradingService:
   - Implement order-insensitive matching of student answers against correct answers.
   - Use stemming, synonyms, and fuzzy matching robustly.

3. Improve semantic similarity calculations:
   - Add error handling and fallback mechanisms.
   - Support optional model refreshing.

4. Expand misconception detection with more patterns and context-awareness.

5. Add detection of contradictory or ambiguous student responses.

6. Implement configurable confidence thresholds for grading.

7. Improve partial credit scoring for granular keyword and semantic weighting.

8. Add logging for grading decisions analytics.

9. Update and expand tests in test_short_answer_grading_mocked.js:
   - Add tests for order-insensitive matching.
   - Add tests for new misconception patterns and other improvements.

## Follow-up

- Run all tests to validate enhancements.
- Review grading performance with sample data.
