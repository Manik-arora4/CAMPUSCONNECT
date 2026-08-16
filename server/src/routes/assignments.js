import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireFaculty } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Assignment } from '../models/Assignment.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();
router.use(auth);

// GET /api/assignments — student sees college+semester assignments with own status
router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const profile = await StudentProfile.findOne({ user: req.user._id });
  const filter = { college: req.user.college };
  if (profile) filter.semester = profile.semester;
  if (status === 'done' || status === 'pending') {
    const all = await Assignment.find(filter).sort({ dueDate: 1 });
    const filtered = all.filter((a) => {
      const sub = a.submissions?.find((s) => String(s.student) === String(req.user._id));
      const done = sub && ['submitted', 'graded'].includes(sub.status);
      return status === 'done' ? done : !done;
    });
    return res.json({ assignments: filtered });
  }
  const assignments = await Assignment.find(filter).sort({ dueDate: 1 }).populate('faculty', 'name');
  res.json({ assignments });
}));

// GET /api/assignments/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, college: req.user.college }).populate('faculty', 'name');
  if (!assignment) throw ApiError.notFound('Assignment not found');
  res.json({ assignment });
}));

// PATCH /api/assignments/:id/submit — student marks submission
router.patch('/:id/submit', asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, college: req.user.college });
  if (!assignment) throw ApiError.notFound('Assignment not found');
  const existing = assignment.submissions.find((s) => String(s.student) === String(req.user._id));
  if (existing) existing.status = 'submitted';
  else assignment.submissions.push({ student: req.user._id, status: 'submitted', submittedAt: new Date() });
  existing && (existing.submittedAt = new Date());
  await assignment.save();
  res.json({ assignment });
}));

// POST /api/assignments — faculty/admin only
router.post(
  '/',
  requireFaculty,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('dueDate').isISO8601().withMessage('Valid due date required'),
    body('semester').optional().isInt({ min: 1 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { title, description, subject, subjectName, type, dueDate, priority, semester, maxMarks } = req.body;
    const assignment = await Assignment.create({
      college: req.user.college,
      subject: subject || undefined,
      subjectName: subjectName || '',
      faculty: req.user._id,
      semester: Number(semester) || 1,
      title: title.trim(),
      description: description || '',
      type: type || 'assignment',
      dueDate: new Date(dueDate),
      priority: priority || 'medium',
      maxMarks: Number(maxMarks) || 100,
    });
    res.status(201).json({ assignment });
  })
);

// PATCH /api/assignments/:id — faculty/admin
router.patch('/:id', requireFaculty, asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw ApiError.notFound('Assignment not found');
  const allowed = ['title', 'description', 'subject', 'subjectName', 'type', 'dueDate', 'priority', 'maxMarks'];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) assignment[k] = req.body[k];
  });
  await assignment.save();
  res.json({ assignment });
}));

// DELETE /api/assignments/:id — faculty/admin
router.delete('/:id', requireFaculty, asyncHandler(async (req, res) => {
  await Assignment.findByIdAndDelete(req.params.id);
  res.json({ message: 'Assignment deleted' });
}));

export default router;
