import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireFaculty } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();
router.use(auth);

// GET /api/exams
router.get('/', asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  const where = { college: req.user.college };
  if (profile) where.semester = profile.semester;
  const exams = await prisma.exam.findMany({ where, orderBy: { date: 'asc' } });
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
    const exam = await prisma.exam.create({
      data: {
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
      },
    });
    // Notify students of the college in that semester
    const students = await prisma.user.findMany({ where: { college: req.user.college, role: 'student' }, select: { id: true } });
    await Promise.all(
      students.map((s) =>
        createNotification(s.id, {
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
  await prisma.exam.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Exam deleted' });
}));

export default router;
