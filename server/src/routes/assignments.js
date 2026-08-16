import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireFaculty } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(auth);

async function attachFaculty(assignments) {
  if (!assignments.length) return assignments;
  const ids = [...new Set(assignments.map((a) => a.faculty).filter(Boolean))];
  if (!ids.length) return assignments;
  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  const map = new Map(users.map((u) => [u.id, { _id: u.id, name: u.name }]));
  for (const a of assignments) {
    if (map.has(a.faculty)) a.faculty = map.get(a.faculty);
  }
  return assignments;
}

// GET /api/assignments — student sees college+semester assignments with own status
router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  const where = { college: req.user.college };
  if (profile) where.semester = profile.semester;
  if (status === 'done' || status === 'pending') {
    const all = await prisma.assignment.findMany({ where, orderBy: { dueDate: 'asc' } });
    const filtered = all.filter((a) => {
      const sub = a.submissions?.find((s) => String(s.student) === String(req.user.id));
      const done = sub && ['submitted', 'graded'].includes(sub.status);
      return status === 'done' ? done : !done;
    });
    return res.json({ assignments: filtered });
  }
  let assignments = await prisma.assignment.findMany({ where, orderBy: { dueDate: 'asc' } });
  assignments = await attachFaculty(assignments);
  res.json({ assignments });
}));

// GET /api/assignments/:id
router.get('/:id', asyncHandler(async (req, res) => {
  let assignment = await prisma.assignment.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!assignment) throw ApiError.notFound('Assignment not found');
  [assignment] = await attachFaculty([assignment]);
  res.json({ assignment });
}));

// PATCH /api/assignments/:id/submit — student marks submission
router.patch('/:id/submit', asyncHandler(async (req, res) => {
  const assignment = await prisma.assignment.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!assignment) throw ApiError.notFound('Assignment not found');
  const submissions = assignment.submissions || [];
  const idx = submissions.findIndex((s) => String(s.student) === String(req.user.id));
  if (idx === -1) {
    submissions.push({ student: req.user.id, status: 'submitted', submittedAt: new Date() });
  } else {
    submissions[idx] = { ...submissions[idx], status: 'submitted', submittedAt: new Date() };
  }
  const updated = await prisma.assignment.update({ where: { id: assignment.id }, data: { submissions } });
  res.json({ assignment: updated });
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
    const assignment = await prisma.assignment.create({
      data: {
        college: req.user.college,
        subject: subject || undefined,
        subjectName: subjectName || '',
        faculty: req.user.id,
        semester: Number(semester) || 1,
        title: title.trim(),
        description: description || '',
        type: type || 'assignment',
        dueDate: new Date(dueDate),
        priority: priority || 'medium',
        maxMarks: Number(maxMarks) || 100,
      },
    });
    res.status(201).json({ assignment });
  })
);

// PATCH /api/assignments/:id — faculty/admin
router.patch('/:id', requireFaculty, asyncHandler(async (req, res) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id } });
  if (!assignment) throw ApiError.notFound('Assignment not found');
  const allowed = ['title', 'description', 'subject', 'subjectName', 'type', 'dueDate', 'priority', 'maxMarks'];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  const updated = await prisma.assignment.update({ where: { id: assignment.id }, data });
  res.json({ assignment: updated });
}));

// DELETE /api/assignments/:id — faculty/admin
router.delete('/:id', requireFaculty, asyncHandler(async (req, res) => {
  await prisma.assignment.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Assignment deleted' });
}));

export default router;
