# Fix Video Upload Issues

## Problem
- Vercel Blob token not found error when uploading from client-side
- Need to support videos of any size and format

## Solution
- Move file uploads to server-side to keep token secure
- Increase file size limits to 1GB
- Update client and server code accordingly

## Tasks
- [x] Update server.js: Increase multer file size limit to 1GB
- [x] Update routes/content.js: Remove client-side Blob upload logic, handle all uploads server-side
- [x] Update CreateContentPage.jsx: Remove client-side Blob put, send file via formData to server
- [ ] Test upload functionality with large video files
