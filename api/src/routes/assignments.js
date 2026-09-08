const { Router } = require('express');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireRole, handleValidation, asyncHandler } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

// Enrich with faculty name
async function enrichAssignments(assignments) {
  if (!assignments.length) return assignments;
  const facultyIds = [...new Set(assignments.map(a => a.faculty).filter(Boolean))];
  if (!facultyIds.length) return assignments;
  const faculty = await prisma.user.findMany({ where: { id: { in: facultyIds } }, select: { id: true, name: true } });
  const fMap = new Map(faculty.map(f => [f.id, f]));
  return assignments.map(a => ({ ...a, faculty: fMap.get(a.faculty) || a.faculty }));
}

router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  const where = { college: req.user.college };
  if (profile) where.semester = profile.semester;

  if (status === 'done' || status === 'pending') {
    const all = await prisma.assignment.findMany({ where, orderBy: { dueDate: 'asc' } });
    const filtered = all.filter(a => {
      const sub = a.submissions?.find(s => String(s.student) === String(req.user.id));
      const done = sub && ['submitted', 'graded'].includes(sub.status);
      return status === 'done' ? done : !done;
    });
    return res.json({ assignments: await enrichAssignments(filtered) });
  }

  const assignments = await prisma.assignment.findMany({ where, orderBy: { dueDate: 'asc' } });
  res.json({ assignments: await enrichAssignments(assignments) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const assignment = await prisma.assignment.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
  const [enriched] = await enrichAssignments([assignment]);
  res.json({ assignment: enriched });
}));

router.patch('/:id/submit', asyncHandler(async (req, res) => {
  const assignment = await prisma.assignment.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
  const subs = assignment.submissions || [];
  const idx = subs.findIndex(s => String(s.student) === String(req.user.id));
  if (idx === -1) {
    subs.push({ student: req.user.id, status: 'submitted', submittedAt: new Date() });
  } else {
    subs[idx] = { ...subs[idx], status: 'submitted', submittedAt: new Date() };
  }
  const updated = await prisma.assignment.update({ where: { id: assignment.id }, data: { submissions: subs } });
  res.json({ assignment: updated });
}));

router.post('/', requireRole('admin', 'faculty'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('dueDate').isISO8601().withMessage('Valid due date required'),
], handleValidation, asyncHandler(async (req, res) => {
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
      maxMarks: Number(maxMarks) || 100
    }
  });
  res.status(201).json({ assignment });
}));

router.put('/:id', requireRole('admin', 'faculty'), asyncHandler(async (req, res) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id } });
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
  const allowed = ['title', 'description', 'subject', 'subjectName', 'type', 'dueDate', 'priority', 'maxMarks'];
  const data = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
  const updated = await prisma.assignment.update({ where: { id: assignment.id }, data });
  res.json({ assignment: updated });
}));

router.delete('/:id', requireRole('admin', 'faculty'), asyncHandler(async (req, res) => {
  await prisma.assignment.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Assignment deleted' });
}));

module.exports = router;
