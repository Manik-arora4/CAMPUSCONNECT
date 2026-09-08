const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireFaculty, requireRole, handleValidation, asyncHandler } = require('../middleware/auth');

const router = Router();

// All faculty routes require authentication
router.use(authenticate);

/**
 * GET /api/faculty/profile
 * Get current faculty's profile
 */
router.get('/profile', requireFaculty, asyncHandler(async (req, res) => {
  const profile = await prisma.facultyProfile.findUnique({
    where: { user: req.user.id }
  });

  if (!profile) {
    return res.json({ profile: null, setupComplete: false });
  }

  res.json({ profile, setupComplete: profile.setupComplete });
}));

/**
 * POST /api/faculty/profile/setup
 * First-time faculty profile setup
 */
router.post('/profile/setup', requireFaculty, [
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
], handleValidation, asyncHandler(async (req, res) => {
  const { employeeId, department, designation, phone, location, bio } = req.body;

  // Check if profile already exists
  const existing = await prisma.facultyProfile.findUnique({
    where: { user: req.user.id }
  });

  if (existing && existing.setupComplete) {
    return res.status(400).json({ error: 'Profile already set up. Use PUT to update.' });
  }

  const profileData = {
    user: req.user.id,
    college: req.user.college,
    employeeId: employeeId.trim(),
    department: department.trim(),
    designation: designation.trim(),
    phone: phone || '',
    location: location || '',
    bio: bio || '',
    setupComplete: true
  };

  let profile;
  if (existing) {
    profile = await prisma.facultyProfile.update({
      where: { id: existing.id },
      data: profileData
    });
  } else {
    profile = await prisma.facultyProfile.create({ data: profileData });
  }

  // Update user designation
  await prisma.user.update({
    where: { id: req.user.id },
    data: { designation: designation.trim(), onboarded: true }
  });

  res.json({ profile, setupComplete: true });
}));

/**
 * PUT /api/faculty/profile
 * Update faculty profile (after initial setup)
 */
router.put('/profile', requireFaculty, asyncHandler(async (req, res) => {
  const profile = await prisma.facultyProfile.findUnique({
    where: { user: req.user.id }
  });

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found. Complete setup first.' });
  }

  const allowed = ['department', 'designation', 'phone', 'location', 'bio'];
  const updateData = {};
  allowed.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const updated = await prisma.facultyProfile.update({
    where: { id: profile.id },
    data: updateData
  });

  res.json({ profile: updated });
}));

/**
 * GET /api/faculty/dashboard
 * Faculty dashboard data — today's classes, students, stats
 */
router.get('/dashboard', requireFaculty, asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get faculty's assigned sections
  const assignments = await prisma.facultyAssignment.findMany({
    where: { faculty: req.user.id, active: true },
    orderBy: [{ semester: 'asc' }, { subjectName: 'asc' }]
  });

  // Get unique section IDs
  const sectionIds = [...new Set(assignments.map(a => a.section))];

  // Get sections with their details
  const sections = await prisma.section.findMany({
    where: { id: { in: sectionIds } }
  });

  // Get today's attendance sessions
  const todaySessions = await prisma.attendanceSession.findMany({
    where: {
      faculty: req.user.id,
      date: { gte: today, lt: tomorrow }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Get pending attendance sessions (open but not today)
  const pendingSessions = await prisma.attendanceSession.findMany({
    where: {
      faculty: req.user.id,
      status: 'open',
      date: { lt: today }
    }
  });

  // Count total students across assigned sections
  let totalStudents = 0;
  if (sectionIds.length > 0) {
    const enrollments = await prisma.enrollment.findMany({
      where: { section: { in: sectionIds }, status: 'active' },
      select: { student: true }
    });
    totalStudents = new Set(enrollments.map(e => e.student)).size;
  }

  // Recent attendance stats
  const recentSessions = await prisma.attendanceSession.findMany({
    where: { faculty: req.user.id, status: 'closed' },
    orderBy: { date: 'desc' },
    take: 30
  });

  const totalPresent = recentSessions.reduce((sum, s) => sum + s.presentCount, 0);
  const totalMarked = recentSessions.reduce((sum, s) => sum + s.presentCount + s.absentCount, 0);
  const averageAttendance = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  res.json({
    profile: await prisma.facultyProfile.findUnique({ where: { user: req.user.id } }),
    assignments,
    sections,
    todaySessions,
    pendingSessions,
    stats: {
      totalSections: sections.length,
      totalSubjects: new Set(assignments.map(a => a.subject)).size,
      totalStudents,
      todayClasses: todaySessions.length,
      pendingAttendance: pendingSessions.length,
      averageAttendance
    }
  });
}));

/**
 * GET /api/faculty/assignments
 * Get faculty's subject-section assignments
 */
router.get('/assignments', requireFaculty, asyncHandler(async (req, res) => {
  const assignments = await prisma.facultyAssignment.findMany({
    where: { faculty: req.user.id, active: true },
    orderBy: [{ semester: 'asc' }, { subjectName: 'asc' }]
  });

  // Enrich with section details
  const sectionIds = [...new Set(assignments.map(a => a.section))];
  const sections = sectionIds.length > 0
    ? await prisma.section.findMany({ where: { id: { in: sectionIds } } })
    : [];
  const sectionMap = new Map(sections.map(s => [s.id, s]));

  const enriched = assignments.map(a => ({
    ...a,
    sectionDetails: sectionMap.get(a.section) || null
  }));

  res.json({ assignments: enriched });
}));

/**
 * POST /api/faculty/assignments
 * Create a new faculty assignment (admin only)
 */
router.post('/assignments', requireRole('admin'), [
  body('facultyId').trim().notEmpty().withMessage('Faculty ID is required'),
  body('subjectId').trim().notEmpty().withMessage('Subject ID is required'),
  body('sectionId').trim().notEmpty().withMessage('Section ID is required'),
  body('semester').isInt({ min: 1 }).withMessage('Valid semester required'),
], handleValidation, asyncHandler(async (req, res) => {
  const { facultyId, subjectId, subjectName, sectionId, semester, academicYear } = req.body;

  // Verify faculty exists
  const faculty = await prisma.user.findUnique({ where: { id: facultyId } });
  if (!faculty || faculty.role !== 'faculty') {
    return res.status(400).json({ error: 'Invalid faculty ID' });
  }

  // Verify subject exists
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) {
    return res.status(400).json({ error: 'Invalid subject ID' });
  }

  // Verify section exists
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section) {
    return res.status(400).json({ error: 'Invalid section ID' });
  }

  const assignment = await prisma.facultyAssignment.create({
    data: {
      college: req.user.college,
      faculty: facultyId,
      subject: subjectId,
      subjectName: subjectName || subject.name,
      section: sectionId,
      semester: Number(semester),
      academicYear: academicYear || ''
    }
  });

  res.status(201).json({ assignment });
}));

/**
 * DELETE /api/faculty/assignments/:id
 * Remove a faculty assignment (admin only)
 */
router.delete('/assignments/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  await prisma.facultyAssignment.deleteMany({
    where: { id: req.params.id }
  });
  res.json({ message: 'Assignment removed' });
}));

/**
 * GET /api/faculty/students
 * Get students in faculty's assigned sections
 */
router.get('/students', requireFaculty, asyncHandler(async (req, res) => {
  const { sectionId, semester } = req.query;

  // Get faculty's assignments
  const where = { faculty: req.user.id, active: true };
  if (sectionId) where.section = sectionId;
  if (semester) where.semester = Number(semester);

  const assignments = await prisma.facultyAssignment.findMany({ where });
  const sectionIds = [...new Set(assignments.map(a => a.section))];

  if (sectionIds.length === 0) {
    return res.json({ students: [], sections: [] });
  }

  // Get enrollments for these sections
  const enrollments = await prisma.enrollment.findMany({
    where: { section: { in: sectionIds }, status: 'active' },
    select: { student: true, section: true, semester: true }
  });

  const studentIds = [...new Set(enrollments.map(e => e.student))];

  // Get student details
  const students = studentIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, name: true, email: true, college: true, phone: true }
      })
    : [];

  // Get student profiles
  const profiles = studentIds.length > 0
    ? await prisma.studentProfile.findMany({
        where: { user: { in: studentIds } },
        select: { user: true, enrollmentNumber: true, semester: true, section: true, year: true }
      })
    : [];

  const profileMap = new Map(profiles.map(p => [p.user, p]));

  // Get sections
  const sections = await prisma.section.findMany({
    where: { id: { in: sectionIds } }
  });

  // Enrich students with profile and section info
  const enriched = students.map(s => {
    const profile = profileMap.get(s.id);
    const studentEnrollments = enrollments.filter(e => e.student === s.id);
    return {
      ...s,
      profile: profile || null,
      enrollments: studentEnrollments.map(e => ({
        section: e.section,
        semester: e.semester
      }))
    };
  });

  res.json({ students: enriched, sections });
}));

/**
 * GET /api/faculty/my-students
 * Get all students the faculty teaches (across all assigned sections)
 */
router.get('/my-students', requireFaculty, asyncHandler(async (req, res) => {
  // Get all active assignments for this faculty
  const assignments = await prisma.facultyAssignment.findMany({
    where: { faculty: req.user.id, active: true }
  });

  const sectionIds = [...new Set(assignments.map(a => a.section))];
  if (sectionIds.length === 0) {
    return res.json({ students: [], totalStudents: 0 });
  }

  // Get enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: { section: { in: sectionIds }, status: 'active' }
  });

  const studentIds = [...new Set(enrollments.map(e => e.student))];
  if (studentIds.length === 0) {
    return res.json({ students: [], totalStudents: 0 });
  }

  // Get student profiles with attendance summary
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, name: true, email: true, phone: true }
  });

  const profiles = await prisma.studentProfile.findMany({
    where: { user: { in: studentIds } },
    select: { user: true, enrollmentNumber: true, semester: true, section: true, year: true, degree: true }
  });

  const profileMap = new Map(profiles.map(p => [p.user, p]));

  const enriched = students.map(s => ({
    ...s,
    profile: profileMap.get(s.id) || null
  }));

  res.json({ students: enriched, totalStudents: enriched.length });
}));

module.exports = router;
