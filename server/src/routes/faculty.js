import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireFaculty } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Subject } from '../models/Subject.js';
import { Assignment } from '../models/Assignment.js';
import { Notice } from '../models/Notice.js';
import { Resource } from '../models/Resource.js';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();
router.use(auth, requireFaculty);

// GET /api/faculty/dashboard
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [subjects, assignments, notices, events] = await Promise.all([
    Subject.find({ college: req.user.college, faculty: req.user._id }).sort({ name: 1 }),
    Assignment.find({ college: req.user.college, faculty: req.user._id }).sort({ dueDate: 1 }),
    Notice.find({ college: req.user.college, createdBy: req.user._id }).sort({ date: -1 }).limit(10),
    Event.find({ college: req.user.college }).sort({ date: 1 }).limit(10),
  ]);
  const studentCount = await User.countDocuments({ college: req.user.college, role: 'student' });
  res.json({
    stats: {
      classes: subjects.length,
      assignments: assignments.length,
      notices: notices.length,
      students: studentCount,
    },
    subjects,
    assignments,
    notices,
    events,
  });
}));

// GET /api/faculty/classes
router.get('/classes', asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ college: req.user.college, faculty: req.user._id }).sort({ name: 1 });
  res.json({ subjects });
}));

// POST /api/faculty/announcements
router.post(
  '/announcements',
  [body('title').trim().notEmpty().withMessage('Title is required'), body('content').trim().notEmpty().withMessage('Content is required')],
  validate,
  asyncHandler(async (req, res) => {
    const { title, content, category = 'general', important = false } = req.body;
    const notice = await Notice.create({
      college: req.user.college,
      title: title.trim(),
      content: content.trim(),
      category,
      important: important === true || important === 'true',
      createdBy: req.user._id,
    });
    const students = await User.find({ college: req.user.college, role: 'student' });
    await Promise.all(students.map((s) => createNotification(s._id, { category: 'college', title: notice.title, message: 'New announcement from faculty', link: '/college', icon: 'megaphone', priority: notice.important ? 'high' : 'medium' })));
    res.status(201).json({ notice });
  })
);

// POST /api/faculty/resources
router.post(
  '/resources',
  [body('title').trim().notEmpty().withMessage('Title is required')],
  validate,
  asyncHandler(async (req, res) => {
    const { title, description, subjectName, semester, url, type } = req.body;
    const resource = await Resource.create({
      college: req.user.college,
      title: title.trim(),
      description: description || '',
      subjectName: subjectName || '',
      semester: Number(semester) || 1,
      url: url || '',
      type: type || 'link',
      faculty: req.user._id,
    });
    res.status(201).json({ resource });
  })
);

// GET /api/faculty/resources
router.get('/resources', asyncHandler(async (req, res) => {
  const resources = await Resource.find({ college: req.user.college }).sort({ createdAt: -1 }).populate('faculty', 'name');
  res.json({ resources });
}));

export default router;
