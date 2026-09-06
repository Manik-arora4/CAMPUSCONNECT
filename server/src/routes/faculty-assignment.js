import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireAdmin, requireFaculty, requireStudent } from '../middleware/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';

const router = Router();

// ═══════════════════════════════════════════════════════════
// ADMIN: Assign Faculty to Courses/Sections
// ═══════════════════════════════════════════════════════════

// GET /api/faculty-assignment — List all assignments (admin: all, faculty: own)
router.get('/', auth, asyncHandler(async (req, res) => {
  const where = {};

  if (req.user.role === 'admin') {
    // Admin sees all assignments in their college
    where.college = req.user.college;
  } else if (req.user.role === 'faculty') {
    // Faculty sees only their own assignments
    where.faculty = req.user.id;
  } else {
    throw ApiError.forbidden('Not authorized');
  }

  const assignments = await prisma.facultyAssignment.findMany({
    where,
    orderBy: [{ semester: 'asc' }, { createdAt: 'desc' }],
  });

  // Enrich with names
  const enriched = await Promise.all(assignments.map(async (a) => {
    const faculty = await prisma.user.findUnique({ where: { id: a.faculty }, select: { id: true, name: true, email: true } });
    const course = await prisma.course.findUnique({ where: { id: a.course }, select: { id: true, name: true, code: true } });
    const section = a.section ? await prisma.section.findUnique({ where: { id: a.section }, select: { id: true, name: true, semester: true } }) : null;
    const subject = a.subject ? await prisma.subject.findUnique({ where: { id: a.subject }, select: { id: true, name: true, code: true } }) : null;
    return { ...a, facultyDetails: faculty, courseDetails: course, sectionDetails: section, subjectDetails: subject };
  }));

  res.json({ assignments: enriched });
}));

// POST /api/faculty-assignment — Create assignment (admin only)
router.post('/', auth, requireAdmin, asyncHandler(async (req, res) => {
  const { facultyId, courseId, sectionId, subjectId, semester, academicYear } = req.body;

  if (!facultyId || !courseId || !semester) {
    throw ApiError.badRequest('facultyId, courseId, and semester are required');
  }

  // Verify faculty exists and is in same college
  const facultyUser = await prisma.user.findUnique({ where: { id: facultyId } });
  if (!facultyUser || facultyUser.role !== 'faculty') {
    throw ApiError.badRequest('Invalid faculty ID');
  }
  if (facultyUser.college !== req.user.college) {
    throw ApiError.forbidden('Faculty not in your college');
  }

  // Verify course exists and is in same college
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.college !== req.user.college) {
    throw ApiError.badRequest('Invalid course');
  }

  // Check duplicate
  const existing = await prisma.facultyAssignment.findFirst({
    where: {
      faculty: facultyId,
      course: courseId,
      section: sectionId || null,
      semester: parseInt(semester),
      academicYear: academicYear || '2025-2026',
    }
  });
  if (existing) {
    throw ApiError.conflict('Faculty already assigned to this course/section');
  }

  const assignment = await prisma.facultyAssignment.create({
    data: {
      id: crypto.randomBytes(10).toString('base64url').slice(0, 25),
      faculty: facultyId,
      course: courseId,
      section: sectionId || null,
      subject: subjectId || null,
      semester: parseInt(semester),
      academicYear: academicYear || '2025-2026',
      college: req.user.college,
    }
  });

  res.status(201).json({ assignment });
}));

// DELETE /api/faculty-assignment/:id — Remove assignment (admin only)
router.delete('/:id', auth, requireAdmin, asyncHandler(async (req, res) => {
  const assignment = await prisma.facultyAssignment.findUnique({ where: { id: req.params.id } });
  if (!assignment) throw ApiError.notFound('Assignment not found');
  if (assignment.college !== req.user.college) throw ApiError.forbidden('Not your college');

  await prisma.facultyAssignment.delete({ where: { id: req.params.id } });
  res.json({ message: 'Assignment removed' });
}));

// ═══════════════════════════════════════════════════════════
// FACULTY: Get my assigned courses with student lists
// ═══════════════════════════════════════════════════════════

// GET /api/faculty-assignment/my-courses — Faculty's assigned courses
router.get('/my-courses', auth, requireFaculty, asyncHandler(async (req, res) => {
  const assignments = await prisma.facultyAssignment.findMany({
    where: { faculty: req.user.id, active: true },
    orderBy: [{ semester: 'asc' }],
  });

  const courses = await Promise.all(assignments.map(async (a) => {
    const course = await prisma.course.findUnique({ where: { id: a.course } });
    const section = a.section ? await prisma.section.findUnique({ where: { id: a.section } }) : null;

    // Get enrolled students count
    const where = { course: a.course, status: 'active' };
    if (a.section) where.section = a.section;
    const studentCount = await prisma.enrollment.count({ where });

    // Get student list
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: { /* will resolve manually */ },
    });

    const students = await Promise.all(enrollments.map(async (e) => {
      const user = await prisma.user.findUnique({ where: { id: e.student }, select: { id: true, name: true, email: true } });
      return { ...e, studentDetails: user };
    }));

    return {
      assignmentId: a.id,
      course,
      section,
      semester: a.semester,
      academicYear: a.academicYear,
      studentCount,
      students,
    };
  }));

  res.json({ courses });
}));

// ═══════════════════════════════════════════════════════════
// STUDENT: See faculty for my courses
// ═══════════════════════════════════════════════════════════

// GET /api/faculty-assignment/my-faculty — Student sees assigned faculty
router.get('/my-faculty', auth, requireStudent, asyncHandler(async (req, res) => {
  // Get student's enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: { student: req.user.id, status: 'active' },
  });

  const facultyList = [];
  for (const e of enrollments) {
    const assignments = await prisma.facultyAssignment.findMany({
      where: {
        course: e.course,
        semester: e.semester,
        active: true,
        OR: [
          { section: e.section },
          { section: null }, // null means all sections
        ],
      },
    });

    for (const a of assignments) {
      const faculty = await prisma.user.findUnique({ where: { id: a.faculty }, select: { id: true, name: true, email: true, designation: true } });
      const course = await prisma.course.findUnique({ where: { id: a.course }, select: { id: true, name: true, code: true } });
      const section = a.section ? await prisma.section.findUnique({ where: { id: a.section }, select: { id: true, name: true } }) : null;

      // Avoid duplicates
      const exists = facultyList.find(f => f.facultyId === a.faculty && f.courseId === a.course);
      if (!exists && faculty) {
        facultyList.push({
          facultyId: a.faculty,
          facultyDetails: faculty,
          courseId: a.course,
          courseDetails: course,
          sectionDetails: section,
          semester: a.semester,
        });
      }
    }
  }

  res.json({ faculty: facultyList });
}));

// ═══════════════════════════════════════════════════════════
// ADMIN: Get all faculty in college (for assignment dropdown)
// ═══════════════════════════════════════════════════════════

// GET /api/faculty-assignment/faculty-list — Admin gets faculty list for their college
router.get('/faculty-list', auth, requireAdmin, asyncHandler(async (req, res) => {
  const faculty = await prisma.user.findMany({
    where: { role: 'faculty', college: req.user.college },
    select: { id: true, name: true, email: true, designation: true },
    orderBy: { name: 'asc' },
  });
  res.json({ faculty });
}));

export default router;
