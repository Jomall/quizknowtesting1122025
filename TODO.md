# TODO: Fix ESLint Errors in React Components

## Files to Edit
- `client/src/pages/CreateQuizPage.jsx`
- `client/src/pages/InstructorDashboardPage.jsx`
- `client/src/pages/LoginPage.jsx`
- `client/src/pages/ManageAssignmentsPage.jsx`
- `client/src/pages/ProfilePage.jsx`
- `client/src/pages/QuizListPage.jsx`
- `client/src/pages/QuizResultsPage.jsx`
- `client/src/pages/QuizReviewPage.jsx`
- `client/src/pages/QuizSessionPage.jsx`
- `client/src/pages/StudentDashboardPage.jsx`
- `client/src/pages/StudentsPage.jsx`

## Steps
1. Fix CreateQuizPage.jsx:
   - Add 'loadQuizData' to useEffect dependency array.

2. Fix InstructorDashboardPage.jsx:
   - Remove unused variable 'allContent'.
   - Remove unused variable 'hasSubmissions'.

3. Fix LoginPage.jsx:
   - Remove unused import 'IconButton'.

4. Fix ManageAssignmentsPage.jsx:
   - Remove unused imports: Avatar, IconButton, Tooltip, PeopleIcon.
   - Remove unused variables: navigate, user.

5. Fix ProfilePage.jsx:
   - Remove unused imports: ListItemText, ListItemIcon.
   - Remove unused variable 'updateUserProfile'.
   - Add 'loadProfileData' to useEffect dependency array.

6. Fix QuizListPage.jsx:
   - Remove unused variable 'quizzes'.
   - Add 'loadQuizzes' to useEffect dependency array.

7. Fix QuizResultsPage.jsx:
   - Remove unused import 'QuizResults'.
   - Remove unused variables: getSubmittedQuizzes, fetchQuiz.
   - Add 'loadResults' to useEffect dependency array.

8. Fix QuizReviewPage.jsx:
   - Remove unused imports: Card, CardContent, ListItemText.
   - Add 'loadReviewData' to useEffect dependency array.
   - Remove unused variables: getAnswerStatus, getUserAnswer.

9. Fix QuizSessionPage.jsx:
   - Add 'loadQuiz' to first useEffect dependency array.
   - Add 'checkCompleted' to second useEffect dependency array.

10. Fix StudentDashboardPage.jsx:
    - Remove unused variables: contentProgress, loading, error, latestSubmission.
    - Add 'loadDashboardData' to useEffect dependency array.

11. Fix StudentsPage.jsx:
    - Remove unused import: PeopleIcon.

12. Run `npm run build` to verify fixes.
