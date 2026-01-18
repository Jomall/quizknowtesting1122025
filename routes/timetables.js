const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const Quiz = require('../models/Quiz');
const Content = require('../models/Content');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateTimetable = [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('title').optional().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('energyPattern').optional().isIn(['lark', 'owl', 'balanced']).withMessage('Invalid energy pattern'),
  body('peakEnergyTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('timeSlots').isArray().withMessage('Time slots must be an array'),
  body('timeSlots.*.startTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format'),
  body('timeSlots.*.endTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format'),
  body('timeSlots.*.activity').isLength({ min: 1, max: 200 }).withMessage('Activity must be between 1 and 200 characters'),
  body('timeSlots.*.phase').isIn(['Prime Focus', 'Recharge', 'Rest', 'Active Practice', 'Revision', 'Balance', 'Light Prep', 'Recovery']).withMessage('Invalid phase'),
  body('timeSlots.*.purpose').isLength({ min: 1, max: 500 }).withMessage('Purpose must be between 1 and 500 characters')
];

// Get student's timetables
router.get('/', auth, async (req, res) => {
  try {
    const { date, isTemplate } = req.query;
    const query = { student: req.user.id };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (isTemplate !== undefined) {
      query.isTemplate = isTemplate === 'true';
    }

    const timetables = await Timetable.find(query)
      .populate('timeSlots.linkedQuiz', 'title dueDate')
      .populate('timeSlots.linkedContent', 'title type')
      .sort({ date: -1 });

    res.json(timetables);
  } catch (error) {
    console.error('Error fetching timetables:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific timetable
router.get('/:id', auth, async (req, res) => {
  try {
    const timetable = await Timetable.findOne({
      _id: req.params.id,
      student: req.user.id
    })
    .populate('timeSlots.linkedQuiz', 'title dueDate difficulty')
    .populate('timeSlots.linkedContent', 'title type instructor');

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    res.json(timetable);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new timetable
router.post('/', [auth, validateTimetable], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, title, energyPattern, peakEnergyTime, timeSlots, isTemplate, templateName } = req.body;
    console.log('Received data:', { date, title, energyPattern, peakEnergyTime, isTemplate, timeSlotsLength: timeSlots.length });

    // Check if timetable already exists for this date (if not a template)
    if (!isTemplate) {
      console.log('Checking for existing timetable for date:', date, 'parsed:', new Date(date));
      const existingTimetable = await Timetable.findOne({
        student: req.user.id,
        date: new Date(date),
        isTemplate: false
      });
      console.log('Existing timetable found:', !!existingTimetable);

      if (existingTimetable) {
        return res.status(400).json({ message: 'Timetable already exists for this date' });
      }
    }

    // Validate linked quizzes and content
    for (const slot of timeSlots) {
      if (slot.linkedQuiz) {
        const quiz = await Quiz.findOne({
          _id: slot.linkedQuiz,
          'students.student': req.user.id
        });
        if (!quiz) {
          return res.status(400).json({ message: `Quiz ${slot.linkedQuiz} not assigned to this student` });
        }
      }

      if (slot.linkedContent) {
        const content = await Content.findOne({
          _id: slot.linkedContent,
          'assignedStudents.student': req.user.id
        });
        if (!content) {
          return res.status(400).json({ message: `Content ${slot.linkedContent} not assigned to this student` });
        }
      }
    }

    const timetable = new Timetable({
      student: req.user.id,
      date: new Date(date),
      title: title || 'Daily Study Schedule',
      energyPattern: energyPattern || req.user.energyPatterns?.preference || 'balanced',
      peakEnergyTime: peakEnergyTime || req.user.energyPatterns?.peakEnergyTime || '08:00',
      timeSlots,
      isTemplate,
      templateName
    });

    await timetable.save();

    const populatedTimetable = await Timetable.findById(timetable._id)
      .populate('timeSlots.linkedQuiz', 'title dueDate')
      .populate('timeSlots.linkedContent', 'title type');

    res.status(201).json(populatedTimetable);
  } catch (error) {
    console.error('Error creating timetable:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update timetable
router.put('/:id', [auth, validateTimetable], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const timetable = await Timetable.findOne({
      _id: req.params.id,
      student: req.user.id
    });

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    const { title, energyPattern, peakEnergyTime, timeSlots } = req.body;

    // Validate linked quizzes and content
    for (const slot of timeSlots) {
      if (slot.linkedQuiz) {
        const quiz = await Quiz.findOne({
          _id: slot.linkedQuiz,
          'students.student': req.user.id
        });
        if (!quiz) {
          return res.status(400).json({ message: `Quiz ${slot.linkedQuiz} not assigned to this student` });
        }
      }

      if (slot.linkedContent) {
        const content = await Content.findOne({
          _id: slot.linkedContent,
          'assignedStudents.student': req.user.id
        });
        if (!content) {
          return res.status(400).json({ message: `Content ${slot.linkedContent} not assigned to this student` });
        }
      }
    }

    timetable.title = title || timetable.title;
    timetable.energyPattern = energyPattern || timetable.energyPattern;
    timetable.peakEnergyTime = peakEnergyTime || timetable.peakEnergyTime;
    timetable.timeSlots = timeSlots;

    await timetable.save();

    const updatedTimetable = await Timetable.findById(timetable._id)
      .populate('timeSlots.linkedQuiz', 'title dueDate')
      .populate('timeSlots.linkedContent', 'title type');

    res.json(updatedTimetable);
  } catch (error) {
    console.error('Error updating timetable:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update time slot completion
router.patch('/:id/slots/:slotIndex', auth, async (req, res) => {
  try {
    const { completed } = req.body;

    const timetable = await Timetable.findOne({
      _id: req.params.id,
      student: req.user.id
    });

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    const slotIndex = parseInt(req.params.slotIndex);
    if (slotIndex < 0 || slotIndex >= timetable.timeSlots.length) {
      return res.status(400).json({ message: 'Invalid slot index' });
    }

    timetable.timeSlots[slotIndex].completed = completed;
    timetable.completedSlots = timetable.timeSlots.filter(slot => slot.completed).length;

    await timetable.save();

    res.json(timetable);
  } catch (error) {
    console.error('Error updating time slot:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete timetable
router.delete('/:id', auth, async (req, res) => {
  try {
    const timetable = await Timetable.findOneAndDelete({
      _id: req.params.id,
      student: req.user.id
    });

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    console.error('Error deleting timetable:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate timetable from template
router.post('/generate-from-template/:templateId', auth, async (req, res) => {
  try {
    const { date } = req.body;

    const template = await Timetable.findOne({
      _id: req.params.templateId,
      student: req.user.id,
      isTemplate: true
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check if timetable already exists for this date
    const existingTimetable = await Timetable.findOne({
      student: req.user.id,
      date: new Date(date),
      isTemplate: false
    });

    if (existingTimetable) {
      return res.status(400).json({ message: 'Timetable already exists for this date' });
    }

    const newTimetable = new Timetable({
      student: req.user.id,
      date: new Date(date),
      title: template.title,
      energyPattern: template.energyPattern,
      peakEnergyTime: template.peakEnergyTime,
      timeSlots: template.timeSlots.map(slot => ({
        ...slot.toObject(),
        completed: false
      })),
      isTemplate: false
    });

    await newTimetable.save();

    const populatedTimetable = await Timetable.findById(newTimetable._id)
      .populate('timeSlots.linkedQuiz', 'title dueDate')
      .populate('timeSlots.linkedContent', 'title type');

    res.status(201).json(populatedTimetable);
  } catch (error) {
    console.error('Error generating timetable from template:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get upcoming activities
router.get('/:id/upcoming-activities', auth, async (req, res) => {
  try {
    const timetable = await Timetable.findOne({
      _id: req.params.id,
      student: req.user.id
    });

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    const upcomingActivities = timetable.getUpcomingActivities();
    res.json(upcomingActivities);
  } catch (error) {
    console.error('Error fetching upcoming activities:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
