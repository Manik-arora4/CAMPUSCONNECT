const { Router } = require('express');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireRole, handleValidation, asyncHandler } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  const where = { college: req.user.college };
  if (profile) where.semester = profile.semester;
  const exams = await prisma.exam.findMany({ where, orderBy: { date: 'asc' } });
  res.json({ exams });
}));

router.post('/', requireRole('admin', 'faculty'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('date').isISO8601().withMessage('Valid date required'),
], handleValidation, asyncHandler(async (req, res) => {
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
      type: type || 'midterm'
    }
  });
  res.status(201).json({ exam });
}));

router.delete('/:id', requireRole('admin', 'faculty'), asyncHandler(async (req, res) => {
  await prisma.exam.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Exam deleted' });
}));

module.exports = router;
