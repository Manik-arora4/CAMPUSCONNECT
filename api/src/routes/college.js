const { Router } = require('express');
const prisma = require('../lib/prisma');
const { authenticate, asyncHandler } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const { search } = req.query;
  const where = search ? { name: { contains: search, mode: 'insensitive' } } : {};
  const colleges = await prisma.college.findMany({ where, orderBy: { name: 'asc' }, take: 30 });
  res.json({ colleges });
}));

router.get('/my', asyncHandler(async (req, res) => {
  if (!req.user.college) return res.json({ college: null, counts: {} });
  const college = await prisma.college.findUnique({ where: { id: req.user.college } });
  if (!college) return res.json({ college: null, counts: {} });

  // Get student's semester to filter subjects
  let studentSemester = null;
  if (req.user.role === 'student') {
    const profile = await prisma.studentProfile.findUnique({ where: { user: req.user.id } });
    studentSemester = profile?.semester || null;
  }

  // Build subject filter: if student, only show their semester subjects
  const subjectWhere = studentSemester
    ? { college: college.id, semester: studentSemester }
    : { college: college.id };

  const [notices, events, clubs, faculty, rawSubjects] = await Promise.all([
    prisma.notice.findMany({ where: { college: college.id }, orderBy: { date: 'desc' }, take: 20 }),
    prisma.event.findMany({ where: { college: college.id, date: { gte: new Date() } }, orderBy: { date: 'asc' }, take: 20 }),
    prisma.club.findMany({ where: { college: college.id }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { college: college.id, role: 'faculty' }, select: { id: true, name: true, email: true, designation: true }, take: 50 }),
    prisma.subject.findMany({ where: subjectWhere, select: { id: true, name: true, code: true, semester: true, faculty: true }, take: 100 })
  ]);

  // Resolve faculty IDs to actual teacher names — check both Subject.faculty and FacultyAssignment
  const facultyIds = [...new Set(rawSubjects.map(s => s.faculty).filter(Boolean))];
  let facultyMap = {};
  if (facultyIds.length) {
    const facultyUsers = await prisma.user.findMany({ where: { id: { in: facultyIds } }, select: { id: true, name: true } });
    facultyMap = Object.fromEntries(facultyUsers.map(f => [f.id, f.name]));
  }

  // Also look up FacultyAssignment table for subjects without a direct faculty link
  const subjectIds = rawSubjects.map(s => s.id);
  let assignmentFacultyMap = {};
  if (subjectIds.length) {
    const assignments = await prisma.facultyAssignment.findMany({
      where: { college: college.id, subject: { in: subjectIds }, active: true },
      select: { subject: true, faculty: true },
    });
    assignmentFacultyMap = Object.fromEntries(assignments.map(a => [a.subject, a.faculty]));
  }
  const assignmentFacultyIds = [...new Set(Object.values(assignmentFacultyMap))];
  if (assignmentFacultyIds.length) {
    const users = await prisma.user.findMany({ where: { id: { in: assignmentFacultyIds } }, select: { id: true, name: true } });
    for (const u of users) facultyMap[u.id] = u.name;
  }

  const subjects = rawSubjects.map(s => ({
    ...s,
    facultyName: s.faculty ? (facultyMap[s.faculty] || '') : (assignmentFacultyMap[s.id] ? (facultyMap[assignmentFacultyMap[s.id]] || '') : ''),
  }));

  res.json({
    college,
    counts: { notices: notices.length, events: events.length, clubs: clubs.length, faculty: faculty.length, subjects: subjects.length },
    notices, events, clubs, faculty, subjects
  });
}));

module.exports = router;
