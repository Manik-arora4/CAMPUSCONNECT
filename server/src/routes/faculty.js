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

// DELETE /api/faculty/resources/:id — delete a shared resource
router.delete('/resources/:id', asyncHandler(async (req, res) => {
  const resource = await prisma.resource.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!resource) throw ApiError.notFound('Resource not found');
  // Only the owner or admin can delete
  if (resource.faculty !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only delete your own resources');
  }
  await prisma.resource.delete({ where: { id: resource.id } });
  res.json({ message: 'Resource deleted' });
}));

// GET /api/faculty/students — class-wise student list for faculty's subjects
router.get('/students', asyncHandler(async (req, res) => {
  const { semester } = req.query;
  // Get subjects assigned to this faculty
  const subjects = await prisma.subject.findMany({ where: { college: req.user.college, faculty: req.user.id } });
  const semesters = [...new Set(subjects.map((s) => s.semester))];

  // Get students for these semesters
  let students = await prisma.user.findMany({
    where: { college: req.user.college, role: 'student' },
    select: { id: true, name: true, email: true, phone: true, avatar: true, createdAt: true },
    orderBy: { name: 'asc' },
  });

  // Attach student profiles
  const studentIds = students.map((s) => s.id);
  const profiles = await prisma.studentProfile.findMany({ where: { user: { in: studentIds } } });
  const profileMap = new Map(profiles.map((p) => [p.user, p]));

  // Filter by semester if specified
  let filteredStudents = students;
  if (semester) {
    filteredStudents = students.filter((s) => {
      const profile = profileMap.get(s.id);
      return profile && profile.semester === Number(semester);
    });
  } else {
    // Only show students from faculty's semesters
    filteredStudents = students.filter((s) => {
      const profile = profileMap.get(s.id);
      return profile && semesters.includes(profile.semester);
    });
  }

  // Attach profile data
  for (const s of filteredStudents) {
    s.profile = profileMap.get(s.id) || null;
  }

  // Get attendance summary for each student
  const studentIdsFiltered = filteredStudents.map((s) => s.id);
  const attendanceRecords = await prisma.attendance.findMany({
    where: { student: { in: studentIdsFiltered }, subjectName: { in: subjects.map((s) => s.name) } },
  });

  // Build attendance map per student
  const attendanceMap = {};
  for (const r of attendanceRecords) {
    if (!attendanceMap[r.student]) attendanceMap[r.student] = { total: 0, present: 0 };
    attendanceMap[r.student].total++;
    if (r.status === 'present') attendanceMap[r.student].present++;
  }

  // Attach attendance stats
  for (const s of filteredStudents) {
    const att = attendanceMap[s.id];
    s.attendance = att ? { total: att.total, present: att.present, percentage: att.total ? Math.round((att.present / att.total) * 100) : 0 } : { total: 0, present: 0, percentage: 0 };
  }

  // Group by semester
  const grouped = {};
  for (const s of filteredStudents) {
    const sem = s.profile?.semester || 1;
    if (!grouped[sem]) grouped[sem] = [];
    grouped[sem].push(s);
  }

  res.json({
    students: filteredStudents,
    grouped,
    semesters,
    subjects,
    total: filteredStudents.length,
  });
}));

// PATCH /api/faculty/assignments/:id/grade — grade a student submission
router.patch('/assignments/:id/grade', asyncHandler(async (req, res) => {
  const { studentId, marks, feedback } = req.body;
  if (!studentId) throw ApiError.badRequest('studentId is required');

  const assignment = await prisma.assignment.findFirst({ where: { id: req.params.id, college: req.user.college, faculty: req.user.id } });
  if (!assignment) throw ApiError.notFound('Assignment not found');

  const submissions = assignment.submissions || [];
  const idx = submissions.findIndex((s) => String(s.student) === String(studentId));
  if (idx === -1) throw ApiError.notFound('No submission found for this student');

  submissions[idx] = {
    ...submissions[idx],
    status: 'graded',
    marks: Number(marks) || 0,
    feedback: feedback || '',
    gradedAt: new Date(),
    gradedBy: req.user.id,
  };

  await prisma.assignment.update({ where: { id: assignment.id }, data: { submissions } });

  // Notify the student
  await createNotification(studentId, {
    category: 'academic',
    title: `Assignment graded: ${assignment.title}`,
    message: `You received ${marks}/${assignment.maxMarks} marks`,
    link: '/assignments',
    icon: 'clipboard',
    priority: 'medium',
  });

  res.json({ assignment: { ...assignment, submissions } });
}));

// GET /api/faculty/me/profile
router.get('/me/profile', asyncHandler(async (req, res) => {
  let profile = await prisma.facultyProfile.findFirst({ where: { user: req.user.id } });
  if (!profile) {
    profile = await prisma.facultyProfile.create({ data: { user: req.user.id, college: req.user.college } });
  }
  res.json(profile);
}));

// PATCH /api/faculty/me/profile
router.patch('/me/profile', asyncHandler(async (req, res) => {
  const existing = await prisma.facultyProfile.findFirst({ where: { user: req.user.id } });
  const allowed = ['employeeId', 'department', 'designation', 'subjects', 'classes', 'bio'];
  const data = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  if (existing) {
    const profile = await prisma.facultyProfile.update({ where: { id: existing.id }, data });
    res.json(profile);
  } else {
    const profile = await prisma.facultyProfile.create({ data: { user: req.user.id, college: req.user.college, ...data } });
    res.json(profile);
  }
}));

export default router;
