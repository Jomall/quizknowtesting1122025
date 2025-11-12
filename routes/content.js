const express = require('express');
const Content = require('../models/Content');
const ContentView = require('../models/ContentView');
const { auth, authorize, checkApproved } = require('../middleware/auth');
const path = require('path');
const { put } = require('@vercel/blob');

const router = express.Router();

// Middleware to get multer upload from app
const getUpload = (req, res, next) => {
  req.upload = req.app.get('upload');
  next();
};

// Create content with file upload (instructor only)
router.post('/upload', auth, authorize('instructor'), checkApproved, getUpload, async (req, res) => {
  try {
    const upload = req.upload;

    upload.single('file')(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ message: err.message });
      }

      const { title, type, description, tags, allowedStudents } = req.body;

      if (!title || !type) {
        return res.status(400).json({ message: 'Title and type are required' });
      }

      // Validate file upload for non-link types
      if (type !== 'link' && !req.file) {
        return res.status(400).json({ message: 'File is required for this content type' });
      }

      const contentData = {
        title,
        type,
        description,
        tags: tags ? JSON.parse(tags) : [],
        allowedStudents: allowedStudents ? JSON.parse(allowedStudents) : [],
        instructor: req.user.id
      };

      if (type === 'link') {
        contentData.url = req.body.url;
      } else {
        // Upload file to Vercel Blob from server-side
        const blob = await put(`content/${Date.now()}-${req.file.originalname}`, req.file.buffer, {
          access: 'public',
        });

        contentData.filePath = blob.url;
        contentData.fileName = req.file.originalname;
        contentData.fileSize = req.file.size;
        contentData.mimeType = req.file.mimetype;
      }

      const content = new Content(contentData);
      await content.save();

      res.status(201).json(content);
    });
  } catch (error) {
    console.error('Content upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create content (instructor only)
router.post('/', auth, authorize('instructor'), checkApproved, async (req, res) => {
  try {
    const content = new Content({
      ...req.body,
      instructor: req.user.id
    });
    
    await content.save();
    res.status(201).json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all content (public - only published)
router.get('/', async (req, res) => {
  try {
    const { type, category, search } = req.query;
    let query = { isPublic: true };

    if (type) query.type = type;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const content = await Content.find(query)
      .populate('instructor', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 });

    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get assigned content for student
router.get('/assigned', auth, authorize('student'), async (req, res) => {
  try {
    const content = await Content.find({ allowedStudents: req.user.id })
      .populate('instructor', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 });

    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get content progress for student
router.get('/progress', auth, authorize('student'), async (req, res) => {
  try {
    const contentViews = await ContentView.find({ student: req.user.id })
      .populate('content', 'title type instructor')
      .populate('content.instructor', 'username profile.firstName profile.lastName')
      .sort({ viewedAt: -1 });

    res.json(contentViews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get instructor's content
router.get('/my-content', auth, authorize('instructor'), checkApproved, async (req, res) => {
  try {
    const content = await Content.find({ instructor: req.user.id })
      .populate('allowedStudents', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 });

    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single content by ID (for instructors and assigned students)
router.get('/:id', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('instructor', 'username profile.firstName profile.lastName');

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Allow access if user is instructor or in allowedStudents
    const isInstructor = content.instructor._id.toString() === req.user.id;
    const isAllowedStudent = content.allowedStudents.includes(req.user.id);

    if (!isInstructor && !isAllowedStudent) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// View content file inline (for instructors and assigned students)
router.get('/:id/view-file', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Allow access if user is instructor or in allowedStudents
    const isInstructor = content.instructor._id.toString() === req.user.id;
    const isAllowedStudent = content.allowedStudents.includes(req.user.id);

    if (!isInstructor && !isAllowedStudent) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!content.filePath) {
      return res.status(400).json({ message: 'No file to view' });
    }

    // Set appropriate headers for inline viewing
    res.setHeader('Content-Type', content.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');

    // Send the file
    res.sendFile(content.filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download content file (for instructors and assigned students)
router.get('/:id/download', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Allow access if user is instructor or in allowedStudents
    const isInstructor = content.instructor._id.toString() === req.user.id;
    const isAllowedStudent = content.allowedStudents.includes(req.user.id);

    if (!isInstructor && !isAllowedStudent) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!content.filePath) {
      return res.status(400).json({ message: 'No file to download' });
    }

    // Fetch the file from Vercel Blob and stream it to the client
    const axios = require('axios');
    const response = await axios.get(content.filePath, { responseType: 'stream' });

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${content.fileName}"`);
    res.setHeader('Content-Type', content.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', response.headers['content-length']);

    // Pipe the stream to response
    response.data.pipe(res);

    response.data.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(500).json({ message: 'Error downloading file' });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Update content (instructor only)
router.put('/:id', auth, authorize('instructor'), checkApproved, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (content.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedContent = await Content.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    res.json(updatedContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign content to students (instructor only)
router.post('/:id/assign', auth, authorize('instructor'), checkApproved, async (req, res) => {
  try {
    const { studentIds } = req.body;
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (content.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add students to content allowedStudents if not already present
    const newStudents = studentIds.filter(id => !content.allowedStudents.includes(id));
    content.allowedStudents = [...content.allowedStudents, ...newStudents];
    await content.save();

    res.json({ message: 'Content assigned successfully', content });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete content (instructor only)
router.delete('/:id', auth, authorize('instructor'), checkApproved, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (content.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Content.findByIdAndDelete(req.params.id);
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark content as viewed (student only)
router.post('/:id/view', auth, authorize('student'), async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (!content.allowedStudents.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const view = await ContentView.findOneAndUpdate(
      { content: req.params.id, student: req.user.id },
      { viewedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json(view);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark content as completed (student only)
router.post('/:id/complete', auth, authorize('student'), async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (!content.allowedStudents.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const view = await ContentView.findOneAndUpdate(
      { content: req.params.id, student: req.user.id },
      { completedAt: new Date(), isCompleted: true },
      { upsert: true, new: true }
    );

    res.json(view);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit feedback for content (student only)
router.post('/:id/feedback', auth, authorize('student'), async (req, res) => {
  try {
    const { rating, comments } = req.body;
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (!content.allowedStudents.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const view = await ContentView.findOneAndUpdate(
      { content: req.params.id, student: req.user.id },
      {
        'feedback.rating': rating,
        'feedback.comments': comments,
        'feedback.submittedAt': new Date()
      },
      { upsert: true, new: true }
    );

    res.json(view);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student progress for instructor
router.get('/progress/students', auth, authorize('instructor'), checkApproved, async (req, res) => {
  try {
    // Get all content created by this instructor
    const content = await Content.find({ instructor: req.user.id }).select('_id title type');
    const contentIds = content.map(c => c._id);

    // Get all students assigned to any of this instructor's content
    const assignedStudents = [...new Set(content.flatMap(c => c.allowedStudents))];

    // Get views for this content
    const views = await ContentView.find({ content: { $in: contentIds } })
      .populate('student', 'username profile.firstName profile.lastName')
      .populate('content', 'title type');

    // Get quiz submissions for this instructor's quizzes
    const QuizSubmission = require('../models/QuizSubmission');
    const Quiz = require('../models/Quiz');
    const quizzes = await Quiz.find({ instructor: req.user.id }).select('_id title');
    const quizIds = quizzes.map(q => q._id);

    const submissions = await QuizSubmission.find({ quiz: { $in: quizIds } })
      .populate('student', 'username profile.firstName profile.lastName')
      .populate('quiz', 'title');

    // Organize by student
    const studentProgress = {};

    assignedStudents.forEach(studentId => {
      studentProgress[studentId] = {
        student: null,
        contentViews: [],
        quizSubmissions: []
      };
    });

    views.forEach(view => {
      const studentId = view.student._id.toString();
      if (studentProgress[studentId]) {
        studentProgress[studentId].contentViews.push(view);
        if (!studentProgress[studentId].student) {
          studentProgress[studentId].student = view.student;
        }
      }
    });

    submissions.forEach(sub => {
      const studentId = sub.student._id.toString();
      if (studentProgress[studentId]) {
        studentProgress[studentId].quizSubmissions.push(sub);
        if (!studentProgress[studentId].student) {
          studentProgress[studentId].student = sub.student;
        }
      }
    });

    res.json(Object.values(studentProgress));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
