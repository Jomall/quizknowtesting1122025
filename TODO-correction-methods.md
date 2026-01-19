# Quiz Correction Methods Implementation

## Overview
Implement three correction methods for quizzes:
- Auto-correction (existing)
- Instructor self-correction
- Peer correction (students grade other students)

## Tasks

### 1. Backend Model Updates
- [ ] Add `correctionMethod` field to Quiz model with enum: ['auto', 'instructor', 'peer']
- [ ] Add peer grading assignment fields to QuizSubmission model
- [ ] Create PeerGradingAssignment model for tracking peer grading tasks

### 2. Backend Route Updates
- [ ] Update submissions.js to handle different correction methods
- [ ] Add peer grading assignment logic
- [ ] Add routes for peer grading submissions and reviews
- [ ] Update grading flow based on correctionMethod

### 3. Frontend Quiz Creation
- [ ] Add correction method selection to quiz creation form
- [ ] Update QuizBuilder component to include correction method options
- [ ] Add validation for peer correction requirements (minimum students)

### 4. Frontend Instructor Dashboard
- [ ] Show correction method in quiz list/details
- [ ] Add peer grading management interface
- [ ] Show peer grading assignments and progress

### 5. Frontend Student Dashboard
- [ ] Add peer grading tasks for students
- [ ] Show assigned peer grading submissions
- [ ] Add peer grading interface

### 6. Peer Correction Logic
- [ ] Implement random assignment of submissions to students
- [ ] Ensure students don't grade their own submissions
- [ ] Handle grading consensus or instructor override
- [ ] Add peer grading deadline management

### 7. Testing
- [ ] Test auto-correction flow
- [ ] Test instructor correction flow
- [ ] Test peer correction assignment and grading
- [ ] Test edge cases (insufficient students for peer grading)
