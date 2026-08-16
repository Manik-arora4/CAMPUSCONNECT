import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword, toSafeUser } from '../utils/userUtils.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();
router.use(auth, requireAdmin);

// GET /api/admin/analytics — enterprise overview
router.get('/analytics', asyncHandler(async (req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const [students, faculty, colleges, opportunities, applications, notices, events, clubs, activeUsers, eventsWeek, applicationsWeek] = await Promise.all([
    prisma.user.count({ where: { role: 'student' } }),
    prisma.user.count({ where: { role: 'faculty' } }),
    prisma.college.count(),
    prisma.opportunity.count(),
    prisma.application.count(),
    prisma.notice.count(),
    prisma.event.count(),
    prisma.club.count(),
    prisma.user.count({ where: { lastLoginAt: { gte: weekAgo } } }),
    prisma.recommendationEvent.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.application.count({ where: { updatedAt: { gte: weekAgo } } }),
  ]);
  const oppByStatus = (await prisma.opportunity.groupBy({ by: ['status'], _count: { _all: true } })).map((g) => ({ _id: g.status, count: g._count._all }));
  const appByStatus = (await prisma.application.groupBy({ by: ['status'], _count: { _all: true } })).map((g) => ({ _id: g.status, count: g._count._all }));
  const oppByCategory = (await prisma.opportunity.groupBy({ by: ['category'], _count: { _all: true } })).map((g) => ({ _id: g.category, count: g._count._all }));
  const engagementEvents = await prisma.recommendationEvent.findMany({ where: { createdAt: { gte: weekAgo } }, select: { createdAt: true } });
  const byDay = new Map();
  for (const e of engagementEvents) {
    const key = e.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) || 0) + 1);
  }
  const engagementByDay = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([day, count]) => ({ _id: day, count }));
  res.json({
    totals: { students, faculty, colleges, opportunities, notices, events, clubs, applications },
    engagement: { activeUsers, eventsWeek, applicationsWeek },
    oppByStatus,
    appByStatus,
    oppByCategory,
    engagementByDay,
  });
}));

// ---------------- Students ----------------
router.get('/students', asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 15 } = req.query;
  const where = { role: 'student' };
  if (search) {
    where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];
  }
  const total = await prisma.user.count({ where });
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  });
  const userIds = users.map((u) => u.id);
  const profiles = await prisma.studentProfile.findMany({ where: { user: { in: userIds } } });
  const profileMap = new Map(profiles.map((p) => [p.user, p]));
  const collegeIds = [...new Set(users.map((u) => u.college).filter(Boolean))];
  let collegeMap = new Map();
  if (collegeIds.length) {
    const colleges = await prisma.college.findMany({ where: { id: { in: collegeIds } }, select: { id: true, name: true } });
    collegeMap = new Map(colleges.map((c) => [c.id, { _id: c.id, name: c.name }]));
  }
  res.json({
    students: users.map((u) => ({ ...toSafeUser(u), college: collegeMap.get(u.college) || u.college, profile: profileMap.get(u.id) })),
    total,
    page: Number(page),
  });
}));

router.patch('/students/:id', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound('Student not found');
  const data = {};
  if (req.body.active !== undefined) data.active = req.body.active;
  if (req.body.role) data.role = req.body.role;
  if (req.body.college) data.college = req.body.college;
  const updated = await prisma.user.update({ where: { id: user.id }, data });
  res.json({ user: toSafeUser(updated) });
}));

router.delete('/students/:id', asyncHandler(async (req, res) => {
  await prisma.user.deleteMany({ where: { id: req.params.id } });
  await prisma.studentProfile.deleteMany({ where: { user: req.params.id } });
  res.json({ message: 'Student deleted' });
}));

// ---------------- Faculty ----------------
router.get('/faculty', asyncHandler(async (req, res) => {
  const faculty = await prisma.user.findMany({ where: { role: 'faculty' }, orderBy: { name: 'asc' } });
  const collegeIds = [...new Set(faculty.map((f) => f.college).filter(Boolean))];
  let collegeMap = new Map();
  if (collegeIds.length) {
    const colleges = await prisma.college.findMany({ where: { id: { in: collegeIds } }, select: { id: true, name: true } });
    collegeMap = new Map(colleges.map((c) => [c.id, { _id: c.id, name: c.name }]));
  }
  res.json({ faculty: faculty.map((f) => ({ ...toSafeUser(f), college: collegeMap.get(f.college) || f.college })) });
}));

router.post(
  '/faculty',
  [body('name').trim().notEmpty().withMessage('Name is required'), body('email').isEmail().withMessage('Valid email required')],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password = 'faculty1234', designation, college } = req.body;
    if (await prisma.user.findUnique({ where: { email: email.toLowerCase() } })) throw ApiError.conflict('User with this email already exists');
    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.toLowerCase(), password: await hashPassword(password), role: 'faculty', designation: designation || '', college: college || req.user.college },
    });
    res.status(201).json({ user: toSafeUser(user) });
  })
);

router.patch('/faculty/:id', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound('Faculty not found');
  const data = {};
  if (req.body.designation !== undefined) data.designation = req.body.designation;
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.active !== undefined) data.active = req.body.active;
  const updated = await prisma.user.update({ where: { id: user.id }, data });
  res.json({ user: toSafeUser(updated) });
}));

router.delete('/faculty/:id', asyncHandler(async (req, res) => {
  await prisma.user.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Faculty deleted' });
}));

// ---------------- Departments ----------------
router.get('/departments', asyncHandler(async (req, res) => {
  const departments = await prisma.department.findMany({ where: { college: req.user.college } });
  const headIds = [...new Set(departments.map((d) => d.head).filter(Boolean))];
  if (headIds.length) {
    const heads = await prisma.user.findMany({ where: { id: { in: headIds } }, select: { id: true, name: true } });
    const map = new Map(heads.map((h) => [h.id, { _id: h.id, name: h.name }]));
    for (const d of departments) {
      if (map.has(d.head)) d.head = map.get(d.head);
    }
  }
  res.json({ departments });
}));

router.post('/departments', asyncHandler(async (req, res) => {
  const { name, code, head } = req.body;
  const dep = await prisma.department.create({ data: { college: req.user.college, name, code, head } });
  res.status(201).json({ department: dep });
}));

router.patch('/departments/:id', asyncHandler(async (req, res) => {
  const dep = await prisma.department.findUnique({ where: { id: req.params.id } });
  if (!dep) throw ApiError.notFound('Department not found');
  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.head !== undefined) data.head = req.body.head;
  const updated = await prisma.department.update({ where: { id: dep.id }, data });
  res.json({ department: updated });
}));

router.delete('/departments/:id', asyncHandler(async (req, res) => {
  await prisma.department.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Department deleted' });
}));

// ---------------- Subjects ----------------
router.get('/subjects', asyncHandler(async (req, res) => {
  const subjects = await prisma.subject.findMany({ where: { college: req.user.college } });
  const facIds = [...new Set(subjects.map((s) => s.faculty).filter(Boolean))];
  if (facIds.length) {
    const users = await prisma.user.findMany({ where: { id: { in: facIds } }, select: { id: true, name: true } });
    const map = new Map(users.map((u) => [u.id, { _id: u.id, name: u.name }]));
    for (const s of subjects) {
      if (map.has(s.faculty)) s.faculty = map.get(s.faculty);
    }
  }
  res.json({ subjects });
}));

router.post('/subjects', asyncHandler(async (req, res) => {
  const { name, code, semester, faculty, department, credits } = req.body;
  const subject = await prisma.subject.create({ data: { college: req.user.college, name, code, semester: Number(semester) || 1, faculty, department, credits } });
  res.status(201).json({ subject });
}));

router.patch('/subjects/:id', asyncHandler(async (req, res) => {
  const subject = await prisma.subject.findUnique({ where: { id: req.params.id } });
  if (!subject) throw ApiError.notFound('Subject not found');
  const allowed = ['name', 'code', 'semester', 'faculty', 'department', 'credits'];
  const data = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  const updated = await prisma.subject.update({ where: { id: subject.id }, data });
  res.json({ subject: updated });
}));

router.delete('/subjects/:id', asyncHandler(async (req, res) => {
  await prisma.subject.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Subject deleted' });
}));

// ---------------- Colleges ----------------
router.get('/colleges', asyncHandler(async (req, res) => {
  const colleges = await prisma.college.findMany({ orderBy: { name: 'asc' } });
  res.json({ colleges });
}));

router.post('/colleges', asyncHandler(async (req, res) => {
  const { name, code, city, state, website, contactEmail, contactPhone } = req.body;
  const college = await prisma.college.create({ data: { name, code, city, state, website, contactEmail, contactPhone } });
  res.status(201).json({ college });
}));

// ---------------- Opportunity moderation ----------------
router.get('/pending-opportunities', asyncHandler(async (req, res) => {
  const opportunities = await prisma.opportunity.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' }, take: 50 });
  res.json({ opportunities });
}));

// ---------------- Engagement broadcast ----------------
router.post('/broadcast', asyncHandler(async (req, res) => {
  const { title, message, category = 'college', link = '' } = req.body;
  if (!title || !message) throw ApiError.badRequest('title and message are required');
  const students = await prisma.user.findMany({ where: { role: 'student' }, select: { id: true } });
  await Promise.all(students.map((s) => createNotification(s.id, { category, title, message, link, icon: 'megaphone', priority: 'high' })));
  res.json({ message: `Broadcast sent to ${students.length} students` });
}));

export default router;
