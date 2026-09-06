import { Router } from 'express';
import { body } from 'express-validator';
import { auth, optionalAuth } from '../middleware/auth.js';
import { requireAdmin, requireFaculty } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// ═══════════════════════════════════════════════════════════
// COURSES (Admin only for create/update/delete, all can read)
// ═══════════════════════════════════════════════════════════

// GET /api/courses?collegeId= — List all courses (filtered by college, public for registration)
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const collegeId = req.query.collegeId || req.user?.college;
  const where = collegeId ? { college: collegeId, active: true } : { active: true };
  const courses = await prisma.course.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  // Include sections for each course (needed for registration form)
  const coursesWithSections = await Promise.all(
    courses.map(async (course) => {
      const sections = await prisma.section.findMany({
        where: { course: course.id },
        orderBy: [{ semester: 'asc' }, { name: 'asc' }],
      });
      return { ...course, sections };
    })
  );

  res.json({ courses: coursesWithSections });
}));

// GET /api/courses/:id — Get course with sections
router.get('/:id', asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id },
  });
  if (!course) throw ApiError.notFound('Course not found');

  const sections = await prisma.section.findMany({
    where: { course: course.id },
    orderBy: [{ semester: 'asc' }, { name: 'asc' }],
  });

  // Get enrollment counts per section
  const sectionsWithCounts = await Promise.all(
    sections.map(async (section) => {
      const enrollmentCount = await prisma.enrollment.count({
        where: { section: section.id, status: 'active' },
      });
      return { ...section, enrollmentCount };
    })
  );

  res.json({ course, sections: sectionsWithCounts });
}));

// POST /api/courses — Create a course (Admin only)
router.post(
  '/',
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Course name is required'),
    body('code').trim().notEmpty().withMessage('Course code is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, code, department, duration, totalSemesters, description } = req.body;

    // Check for duplicate code
    const existing = await prisma.course.findFirst({
      where: { college: req.user.college, code: code.trim() },
    });
    if (existing) throw ApiError.conflict('Course with this code already exists');

    const course = await prisma.course.create({
      data: {
        college: req.user.college,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        department: department || null,
        duration: Number(duration) || 4,
        totalSemesters: Number(totalSemesters) || 8,
        description: description || '',
      },
    });

    res.status(201).json({ course });
  })
);

// PATCH /api/courses/:id — Update a course (Admin only)
router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) throw ApiError.notFound('Course not found');

  const allowed = ['name', 'code', 'department', 'duration', 'totalSemesters', 'description', 'active'];
  const data = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });

  const updated = await prisma.course.update({
    where: { id: course.id },
    data,
  });

  res.json({ course: updated });
}));

// DELETE /api/courses/:id — Delete a course (Admin only)
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) throw ApiError.notFound('Course not found');

  // Check if course has enrollments
  const enrollmentCount = await prisma.enrollment.count({
    where: { course: course.id },
  });
  if (enrollmentCount > 0) {
    throw ApiError.badRequest('Cannot delete course with active enrollments. Deactivate it instead.');
  }

  await prisma.course.delete({ where: { id: course.id } });
  res.json({ message: 'Course deleted' });
}));

// ═══════════════════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════════════════

// GET /api/courses/:courseId/sections — List sections for a course
router.get('/:courseId/sections', asyncHandler(async (req, res) => {
  const sections = await prisma.section.findMany({
    where: { course: req.params.courseId },
    orderBy: [{ semester: 'asc' }, { name: 'asc' }],
  });

  // Get enrollment counts
  const sectionsWithCounts = await Promise.all(
    sections.map(async (section) => {
      const enrollmentCount = await prisma.enrollment.count({
        where: { section: section.id, status: 'active' },
      });
      return { ...section, enrollmentCount };
    })
  );

  res.json({ sections: sectionsWithCounts });
}));

// POST /api/courses/:courseId/sections — Create a section (Admin only)
router.post(
  '/:courseId/sections',
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Section name is required'),
    body('semester').isInt({ min: 1 }).withMessage('Valid semester required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, semester, code, maxStudents } = req.body;
    const courseId = req.params.courseId;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound('Course not found');

    // Check for duplicate
    const existing = await prisma.section.findFirst({
      where: { course: courseId, semester: Number(semester), name: name.trim() },
    });
    if (existing) throw ApiError.conflict('Section already exists for this semester');

    const section = await prisma.section.create({
      data: {
        course: courseId,
        name: name.trim(),
        code: code || name.trim().charAt(0).toUpperCase(),
        semester: Number(semester),
        maxStudents: Number(maxStudents) || 60,
      },
    });

    res.status(201).json({ section });
  })
);

// DELETE /api/courses/sections/:id — Delete a section (Admin only)
router.delete('/sections/:id', requireAdmin, asyncHandler(async (req, res) => {
  const section = await prisma.section.findUnique({ where: { id: req.params.id } });
  if (!section) throw ApiError.notFound('Section not found');

  const enrollmentCount = await prisma.enrollment.count({
    where: { section: section.id, status: 'active' },
  });
  if (enrollmentCount > 0) {
    throw ApiError.badRequest('Cannot delete section with active enrollments');
  }

  await prisma.section.delete({ where: { id: section.id } });
  res.json({ message: 'Section deleted' });
}));

// ═══════════════════════════════════════════════════════════
// ENROLLMENTS
// ═══════════════════════════════════════════════════════════

// GET /api/courses/enrollments/:courseId — List enrollments for a course
router.get('/enrollments/:courseId', asyncHandler(async (req, res) => {
  const { semester, sectionId } = req.query;
  const where = { course: req.params.courseId, status: 'active' };
  if (semester) where.semester = Number(semester);
  if (sectionId) where.section = sectionId;

  const enrollments = await prisma.enrollment.findMany({
    where,
    orderBy: [{ semester: 'asc' }, { createdAt: 'asc' }],
  });

  // Get student details
  const studentIds = enrollments.map(e => e.student);
  const users = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, name: true, email: true, phone: true },
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  // Get section details
  const sectionIds = [...new Set(enrollments.map(e => e.section))];
  const sections = await prisma.section.findMany({
    where: { id: { in: sectionIds } },
  });
  const sectionMap = new Map(sections.map(s => [s.id, s]));

  const enriched = enrollments.map(e => ({
    ...e,
    studentDetails: userMap.get(e.student) || null,
    sectionDetails: sectionMap.get(e.section) || null,
  }));

  res.json({ enrollments: enriched, total: enriched.length });
}));

// POST /api/courses/enroll — Enroll a student (Admin or Faculty)
router.post(
  '/enroll',
  [
    body('studentId').trim().notEmpty().withMessage('Student ID required'),
    body('courseId').trim().notEmpty().withMessage('Course ID required'),
    body('sectionId').trim().notEmpty().withMessage('Section ID required'),
    body('semester').isInt({ min: 1 }).withMessage('Valid semester required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { studentId, courseId, sectionId, semester, year, enrollmentNumber } = req.body;

    // Verify student exists
    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== 'student') {
      throw ApiError.notFound('Student not found');
    }

    // Verify course and section exist
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound('Course not found');

    const section = await prisma.section.findFirst({
      where: { id: sectionId, course: courseId },
    });
    if (!section) throw ApiError.notFound('Section not found for this course');

    // Check for existing enrollment
    const existing = await prisma.enrollment.findFirst({
      where: { student: studentId, course: courseId, semester: Number(semester) },
    });
    if (existing) throw ApiError.conflict('Student already enrolled in this course for this semester');

    // Check section capacity
    const currentCount = await prisma.enrollment.count({
      where: { section: sectionId, status: 'active' },
    });
    if (currentCount >= section.maxStudents) {
      throw ApiError.badRequest('Section is full');
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        student: studentId,
        course: courseId,
        section: sectionId,
        semester: Number(semester),
        year: Number(year) || 1,
        enrollmentNumber: enrollmentNumber || '',
        status: 'active',
      },
    });

    // Also update student profile with course/section info
    await prisma.studentProfile.updateMany({
      where: { user: studentId },
      data: {
        course: course.name,
        semester: Number(semester),
        section: section.name,
        enrollment: enrollment.id,
      },
    });

    res.status(201).json({ enrollment });
  })
);

// POST /api/courses/bulk-enroll — Bulk enroll students
router.post('/bulk-enroll', requireAdmin, asyncHandler(async (req, res) => {
  const { studentIds, courseId, sectionId, semester, year } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw ApiError.badRequest('studentIds array is required');
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw ApiError.notFound('Course not found');

  const section = await prisma.section.findFirst({
    where: { id: sectionId, course: courseId },
  });
  if (!section) throw ApiError.notFound('Section not found');

  const results = { enrolled: 0, skipped: 0, errors: [] };

  for (const studentId of studentIds) {
    try {
      const existing = await prisma.enrollment.findFirst({
        where: { student: studentId, course: courseId, semester: Number(semester) },
      });
      if (existing) {
        results.skipped++;
        continue;
      }

      await prisma.enrollment.create({
        data: {
          student: studentId,
          course: courseId,
          section: sectionId,
          semester: Number(semester),
          year: Number(year) || 1,
          status: 'active',
        },
      });
      results.enrolled++;
    } catch (err) {
      results.errors.push({ studentId, error: err.message });
    }
  }

  res.json({ message: `Enrolled ${results.enrolled} students`, ...results });
}));

// PATCH /api/courses/enrollment/:id — Update enrollment (change section, status)
router.patch('/enrollment/:id', requireAdmin, asyncHandler(async (req, res) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: req.params.id },
  });
  if (!enrollment) throw ApiError.notFound('Enrollment not found');

  const allowed = ['section', 'status', 'year', 'enrollmentNumber'];
  const data = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });

  const updated = await prisma.enrollment.update({
    where: { id: enrollment.id },
    data,
  });

  res.json({ enrollment: updated });
}));

export default router;
