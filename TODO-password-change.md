# Password Change Feature Implementation

## Backend Changes
- [ ] Add PUT /auth/change-password endpoint in routes/auth.js for users to change their own password
- [ ] Add PUT /users/change-password/:id endpoint in routes/users.js for admins to change any user's password
- [ ] Both endpoints validate new password length and hash it

## Frontend Changes
- [ ] Add password change section to StudentDashboardPage.jsx with dialog for current/new password
- [ ] Add password change button in AdminDashboardPage.jsx user profiles tab with dialog for new password

## Testing
- [ ] Test self-password change for students, instructors, and admins
- [ ] Test admin password change for other users
- [ ] Verify password validation and error handling
- [ ] Ensure proper authentication and authorization

## Notes
- All authenticated users (student, instructor, admin) can change their own password via /auth/change-password
- Only admins can change other users' passwords via /users/change-password/:id
- Passwords must be at least 6 characters
- Current password verification required for self-change
