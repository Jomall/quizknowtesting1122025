# TODO: Implement Essay Grading Enhancements and Manual Grading Option

## Essay Grading Service Enhancements
- [x] Add sentence parsing method to extract expected sentences from teacher's answer
- [x] Implement sentence-level syntactic matching (structural similarity)
- [x] Implement sentence-level semantic similarity using BERT or compromise
- [x] Add completeness scoring based on coverage of expected sentences
- [x] Enhance content relevance checking
- [x] Improve logical organization analysis (sentence order)
- [x] Update existing grading methods to integrate sentence-level criteria
- [ ] Test enhanced essay grading with sample questions

## Manual Grading Feature
- [x] Update quiz model/schema to include grading mode (auto/manual)
- [ ] Modify QuestionBuilder.jsx to add grading mode selection UI
- [ ] Update quiz creation API to store grading mode
- [x] Modify grading API (routes/submissions.js) to handle manual grading workflow
- [ ] Implement pending grade status for manual grading
- [ ] Add instructor review interface for manual grading
- [ ] Update grade rendering logic to show final grades only after review for manual mode

## Integration and Testing
- [ ] Ensure integration with existing quiz grading API
- [ ] Test auto vs manual grading workflows
- [ ] Update any dependent components or services
