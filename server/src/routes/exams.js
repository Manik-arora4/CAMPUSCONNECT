import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireFaculty } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Exam } from '../models/Exam.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();
router.use(auth);

// GET /api/exams
router.get('/', asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id });
  const filter = { college: req.user.college };
  if (profile) filter.semester = profile.semester;
  const exams = await Exam.find(filter).sort({ date: 1 });
  res.json({ exams });
}));

// POST /api/exams — faculty/admin
router.post(
  '/',
  requireFaculty,
  [body('title').trim().notEmpty().withMessage('Title is required'), body('date').isISO8601().withMessage('Valid date required')],
  validate,
  asyncHandler(async (req, res) => {
    const { title, subject, subjectName, semester, date, startTime, endTime, room, maxMarks, type } = req.body;
    const exam = await Exam.create({
      college: req.user.college,
      title: title.trim(),
      subject: subject || undefined,
      subjectName: subjectName || '',
      semester: Number(semester) || 1,
      date: new Date(date),
      startTime: startTime || '10:00',
      endTime: endTime || '13:00',
      room: room || '',
      maxMarks: Number(maxMarks) || 100,
      type: type || 'midterm',
    });
    // Notify students of the college in that semester
    const { User } = await import('../models/User.js');
    const students = await User.find({ college: req.user.college, role: 'student' });
    await Promise.all(
      students
        .filter((s) => true)
        .map((s) =>
          createNotification(s._id, {
            category: 'academic',
            title: `New exam: ${exam.title}`,
            message: `${exam.subjectName || exam.title} on ${new Date(exam.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${exam.startTime}`,
            link: '/college',
            icon: 'graduation-cap',
            priority: 'high',
          })
        )
    );
    res.status(201).json({ exam });
  })
);

// DELETE /api/exams/:id — faculty/admin
router.delete('/:id', requireFaculty, asyncHandler(async (req, res) => {
  await Exam.findByIdAndDelete(req.params.id);
  res.json({ message: 'Exam deleted' });
}));

export default router;
