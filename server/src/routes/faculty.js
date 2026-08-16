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
router.use(auth, requireFaculty);

// GET /api/faculty/dashboard
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [subjects, assignments, notices, events] = await Promise.all([
    prisma.subject.findMany({ where: { college: req.user.college, faculty: req.user.id }, orderBy: { name: 'asc' } }),
    prisma.assignment.findMany({ where: { college: req.user.college, faculty: req.user.id }, orderBy: { dueDate: 'asc' } }),
    prisma.notice.findMany({ where: { college: req.user.college, createdBy: req.user.id }, orderBy: { date: 'desc' }, take: 10 }),
    prisma.event.findMany({ where: { college: req.user.college }, orderBy: { date: 'asc' }, take: 10 }),
  ]);
  const studentCount = await prisma.user.count({ where: { college: req.user.college, role: 'student' } });
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
  const subjects = await prisma.subject.findMany({ where: { college: req.user.college, faculty: req.user.id }, orderBy: { name: 'asc' } });
  res.json({ subjects });
}));

// POST /api/faculty/announcements
router.post(
  '/announcements',
  [body('title').trim().notEmpty().withMessage('Title is required'), body('content').trim().notEmpty().withMessage('Content is required')],
  validate,
  asyncHandler(async (req, res) => {
    const { title, content, category = 'general', important = false } = req.body;
    const notice = await prisma.notice.create({
      data: {
        college: req.user.college,
        title: title.trim(),
        content: content.trim(),
        category,
        important: important === true || important === 'true',
        createdBy: req.user.id,
      },
    });
    const students = await prisma.user.findMany({ where: { college: req.user.college, role: 'student' }, select: { id: true } });
    await Promise.all(students.map((s) => createNotification(s.id, { category: 'college', title: notice.title, message: 'New announcement from faculty', link: '/college', icon: 'megaphone', priority: notice.important ? 'high' : 'medium' })));
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
    const resource = await prisma.resource.create({
      data: {
        college: req.user.college,
        title: title.trim(),
        description: description || '',
        subjectName: subjectName || '',
        semester: Number(semester) || 1,
        url: url || '',
        type: type || 'link',
        faculty: req.user.id,
      },
    });
    res.status(201).json({ resource });
  })
);

// GET /api/faculty/resources
router.get('/resources', asyncHandler(async (req, res) => {
  let resources = await prisma.resource.findMany({ where: { college: req.user.college }, orderBy: { createdAt: 'desc' } });
  const facIds = [...new Set(resources.map((r) => r.faculty).filter(Boolean))];
  if (facIds.length) {
    const users = await prisma.user.findMany({ where: { id: { in: facIds } }, select: { id: true, name: true } });
    const map = new Map(users.map((u) => [u.id, { _id: u.id, name: u.name }]));
    for (const r of resources) {
      if (map.has(r.faculty)) r.faculty = map.get(r.faculty);
    }
  }
  res.json({ resources });
}));

export default router;
