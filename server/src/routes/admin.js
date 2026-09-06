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

// GET /api/admin/analytics — college-scoped overview (admin sees ONLY their college)
router.get('/analytics', asyncHandler(async (req, res) => {
  const cid = req.user.college; // college ID of this admin
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  // Get course IDs for this college first (needed for related queries)
  const collegeCourses = await prisma.course.findMany({ where: { college: cid }, select: { id: true } });
  const courseIds = collegeCourses.map((c) => c.id);

  const [students, faculty, departments, courses, sections, subjects, enrollments, notices, events, clubs, activeUsers] = await Promise.all([
    prisma.user.count({ where: { role: 'student', college: cid } }),
    prisma.user.count({ where: { role: 'faculty', college: cid } }),
    prisma.department.count({ where: { college: cid } }),
    prisma.course.count({ where: { college: cid } }),
    courseIds.length > 0 ? prisma.section.count({ where: { course: { in: courseIds } } }) : 0,
    prisma.subject.count({ where: { college: cid } }),
    courseIds.length > 0 ? prisma.enrollment.count({ where: { course: { in: courseIds } } }) : 0,
    prisma.notice.count({ where: { college: cid } }).catch(() => 0),
    prisma.event.count({ where: { college: cid } }).catch(() => 0),
    prisma.club.count({ where: { college: cid } }).catch(() => 0),
    prisma.user.count({ where: { college: cid, lastLoginAt: { gte: weekAgo } } }),
  ]);

  const pendingUsers = await prisma.user.count({ where: { college: cid, approved: false } });

  res.json({
    college: { id: cid },
    totals: { students, faculty, departments, courses, sections, subjects, enrollments, notices, events, clubs },
    engagement: { activeUsers, pendingUsers },
  });
}));

// ---------------- College Info (admin's own college) ----------------
router.get('/college-info', asyncHandler(async (req, res) => {
  const college = await prisma.college.findUnique({ where: { id: req.user.college } });
  if (!college) throw ApiError.notFound('College not found');
  res.json({ college });
}));

// ---------------- Students (college-scoped) ----------------
router.get('/students', asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 15 } = req.query;
  const where = { role: 'student', college: req.user.college };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
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

  // Get enrollments for these students
  const enrollments = await prisma.enrollment.findMany({
    where: { student: { in: userIds } },
    include: { course: true, section: true },
  });
  const enrollMap = new Map();
  for (const e of enrollments) {
    if (!enrollMap.has(e.student)) enrollMap.set(e.student, []);
    enrollMap.get(e.student).push(e);
  }

  res.json({
    students: users.map((u) => ({
      ...toSafeUser(u),
      profile: profileMap.get(u.id),
      enrollments: enrollMap.get(u.id) || [],
    })),
    total,
    page: Number(page),
  });
}));

router.patch('/students/:id', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound('Student not found');
  if (user.college !== req.user.college) throw ApiError.forbidden('Access denied');
  const data = {};
  if (req.body.active !== undefined) data.active = req.body.active;
  if (req.body.role) data.role = req.body.role;
  const updated = await prisma.user.update({ where: { id: user.id }, data });
  res.json({ user: toSafeUser(updated) });
}));

router.delete('/students/:id', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound('Student not found');
  if (user.college !== req.user.college) throw ApiError.forbidden('Access denied');
  await prisma.user.deleteMany({ where: { id: req.params.id } });
  await prisma.studentProfile.deleteMany({ where: { user: req.params.id } });
  res.json({ message: 'Student deleted' });
}));

// ---------------- Faculty (college-scoped) ----------------
router.get('/faculty', asyncHandler(async (req, res) => {
  const faculty = await prisma.user.findMany({
    where: { role: 'faculty', college: req.user.college },
    orderBy: { name: 'asc' },
  });

  // Get faculty profiles
  const facIds = faculty.map((f) => f.id);
  const profiles = await prisma.facultyProfile.findMany({ where: { user: { in: facIds } } });
  const profileMap = new Map(profiles.map((p) => [p.user, p]));

  // Get faculty assignments
  const assignments = await prisma.facultyAssignment.findMany({
    where: { faculty: { in: facIds } },
  });
  const assignMap = new Map();
  for (const a of assignments) {
    if (!assignMap.has(a.faculty)) assignMap.set(a.faculty, []);
    assignMap.get(a.faculty).push(a);
  }

  res.json({
    faculty: faculty.map((f) => ({
      ...toSafeUser(f),
      profile: profileMap.get(f.id),
      assignments: assignMap.get(f.id) || [],
    })),
  });
}));

router.post(
  '/faculty',
  [body('name').trim().notEmpty().withMessage('Name is required'), body('email').isEmail().withMessage('Valid email required')],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password = 'faculty1234', designation } = req.body;
    if (await prisma.user.findUnique({ where: { email: email.toLowerCase() } })) throw ApiError.conflict('User with this email already exists');
    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.toLowerCase(), password: await hashPassword(password), role: 'faculty', designation: designation || '', college: req.user.college, approved: true },
    });
    res.status(201).json({ user: toSafeUser(user) });
  })
);

router.patch('/faculty/:id', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound('Faculty not found');
  if (user.college !== req.user.college) throw ApiError.forbidden('Access denied');
  const data = {};
  if (req.body.designation !== undefined) data.designation = req.body.designation;
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.active !== undefined) data.active = req.body.active;
  const updated = await prisma.user.update({ where: { id: user.id }, data });
  res.json({ user: toSafeUser(updated) });
}));

router.delete('/faculty/:id', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound('Faculty not found');
  if (user.college !== req.user.college) throw ApiError.forbidden('Access denied');
  await prisma.user.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Faculty deleted' });
}));

// ---------------- Departments (college-scoped) ----------------
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
  if (dep.college !== req.user.college) throw ApiError.forbidden('Access denied');
  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.head !== undefined) data.head = req.body.head;
  const updated = await prisma.department.update({ where: { id: dep.id }, data });
  res.json({ department: updated });
}));

router.delete('/departments/:id', asyncHandler(async (req, res) => {
  const dep = await prisma.department.findUnique({ where: { id: req.params.id } });
  if (!dep) throw ApiError.notFound('Department not found');
  if (dep.college !== req.user.college) throw ApiError.forbidden('Access denied');
  await prisma.department.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Department deleted' });
}));

// ---------------- Subjects (college-scoped) ----------------
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
  if (subject.college !== req.user.college) throw ApiError.forbidden('Access denied');
  const allowed = ['name', 'code', 'semester', 'faculty', 'department', 'credits'];
  const data = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  const updated = await prisma.subject.update({ where: { id: subject.id }, data });
  res.json({ subject: updated });
}));

router.delete('/subjects/:id', asyncHandler(async (req, res) => {
  const subject = await prisma.subject.findUnique({ where: { id: req.params.id } });
  if (!subject) throw ApiError.notFound('Subject not found');
  if (subject.college !== req.user.college) throw ApiError.forbidden('Access denied');
  await prisma.subject.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Subject deleted' });
}));

// ---------------- Colleges (read-only for college admins — see all for reference) ----------------
router.get('/colleges', asyncHandler(async (req, res) => {
  const colleges = await prisma.college.findMany({ orderBy: { name: 'asc' } });
  res.json({ colleges });
}));

router.post('/colleges', asyncHandler(async (req, res) => {
  const { name, code, city, state, website, contactEmail, contactPhone } = req.body;
  const college = await prisma.college.create({ data: { name, code, city, state, website, contactEmail, contactPhone } });
  res.status(201).json({ college });
}));

// ---------------- Opportunity moderation (college-scoped) ----------------
router.get('/pending-opportunities', asyncHandler(async (req, res) => {
  const opportunities = await prisma.opportunity.findMany({
    where: { college: req.user.college, status: 'pending' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ opportunities });
}));

// ---------------- Pending approvals (college-scoped) ----------------
router.get('/pending-users', asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { college: req.user.college, approved: false, role: { in: ['faculty', 'admin'] } },
    orderBy: { createdAt: 'desc' },
  });
  const userIds = users.map((u) => u.id);
  const profiles = await prisma.facultyProfile.findMany({ where: { user: { in: userIds } } });
  const profileMap = new Map(profiles.map((p) => [p.user, p]));
  res.json({ users: users.map((u) => ({ ...toSafeUser(u), facultyProfile: profileMap.get(u.id) })) });
}));

router.post('/approve-user/:id', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound('User not found');
  if (user.college !== req.user.college) throw ApiError.forbidden('Access denied');
  const updated = await prisma.user.update({ where: { id: user.id }, data: { approved: true } });
  await createNotification(user.id, {
    category: 'system',
    title: 'Account Approved! 🎉',
    message: 'Your account has been approved. You can now access all features.',
    link: '/dashboard',
    icon: 'check-circle',
    priority: 'high',
  });
  res.json({ user: toSafeUser(updated) });
}));

router.post('/reject-user/:id', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound('User not found');
  if (user.college !== req.user.college) throw ApiError.forbidden('Access denied');
  await prisma.user.delete({ where: { id: user.id } });
  res.json({ message: 'User rejected and removed' });
}));

// ---------------- Engagement broadcast (college-scoped) ----------------
router.post('/broadcast', asyncHandler(async (req, res) => {
  const { title, message, category = 'college', link = '' } = req.body;
  if (!title || !message) throw ApiError.badRequest('title and message are required');
  // Only broadcast to students in THIS college
  const students = await prisma.user.findMany({ where: { role: 'student', college: req.user.college }, select: { id: true } });
  await Promise.all(students.map((s) => createNotification(s.id, { category, title, message, link, icon: 'megaphone', priority: 'high' })));
  res.json({ message: `Broadcast sent to ${students.length} students` });
}));

export default router;
