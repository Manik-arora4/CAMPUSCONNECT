const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireRole, requireCollege, handleValidation, asyncHandler } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

/**
 * GET /api/courses
 * List all courses for a college (or search)
 */
router.get('/', requireCollege, asyncHandler(async (req, res) => {
  const { search, degree } = req.query;

  const where = { college: req.user.college, active: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (degree) {
    where.degree = { contains: degree, mode: 'insensitive' };
  }

  const courses = await prisma.course.findMany({
    where,
    orderBy: { name: 'asc' }
  });

  res.json({ courses });
}));

/**
 * GET /api/courses/:id
 * Get course details with its sections
 */
router.get('/:id', requireCollege, asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id }
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const sections = await prisma.section.findMany({
    where: { course: course.id },
    orderBy: [{ semester: 'asc' }, { name: 'asc' }]
  });

  // Get enrollment counts per section
  const sectionIds = sections.map(s => s.id);
  const enrollments = sectionIds.length > 0
    ? await prisma.enrollment.findMany({
        where: { section: { in: sectionIds }, status: 'active' },
        select: { section: true }
      })
    : [];

  const enrollmentCounts = {};
  enrollments.forEach(e => {
    enrollmentCounts[e.section] = (enrollmentCounts[e.section] || 0) + 1;
  });

  const enrichedSections = sections.map(s => ({
    ...s,
    enrolledCount: enrollmentCounts[s.id] || 0
  }));

  res.json({ course, sections: enrichedSections });
}));

/**
 * POST /api/courses
 * Create a new course (admin only)
 */
router.post('/', requireRole('admin'), [
  body('name').trim().notEmpty().withMessage('Course name is required'),
  body('code').trim().notEmpty().withMessage('Course code is required'),
], handleValidation, asyncHandler(async (req, res) => {
  const { name, code, degree, totalSemesters, duration } = req.body;

  // Check duplicate
  const existing = await prisma.course.findFirst({
    where: { college: req.user.college, code: code.trim() }
  });
  if (existing) {
    return res.status(400).json({ error: 'Course with this code already exists' });
  }

  const course = await prisma.course.create({
    data: {
      college: req.user.college,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      degree: degree || '',
      totalSemesters: totalSemesters || 8,
      duration: duration || 4
    }
  });

  res.status(201).json({ course });
}));

/**
 * PUT /api/courses/:id
 * Update a course (admin only)
 */
router.put('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const allowed = ['name', 'code', 'degree', 'totalSemesters', 'duration', 'active'];
  const updateData = {};
  allowed.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const updated = await prisma.course.update({
    where: { id: course.id },
    data: updateData
  });

  res.json({ course: updated });
}));

/**
 * DELETE /api/courses/:id
 * Delete a course (admin only)
 */
router.delete('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  await prisma.course.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Course deleted' });
}));

// ========== SECTIONS ==========

/**
 * GET /api/courses/:courseId/sections
 * List sections for a course
 */
router.get('/:courseId/sections', requireCollege, asyncHandler(async (req, res) => {
  const { semester } = req.query;
  const where = { course: req.params.courseId, college: req.user.college };
  if (semester) where.semester = Number(semester);

  const sections = await prisma.section.findMany({
    where,
    orderBy: [{ semester: 'asc' }, { name: 'asc' }]
  });

  // Get enrollment counts
  const sectionIds = sections.map(s => s.id);
  const enrollments = sectionIds.length > 0
    ? await prisma.enrollment.findMany({
        where: { section: { in: sectionIds }, status: 'active' },
        select: { section: true }
      })
    : [];

  const counts = {};
  enrollments.forEach(e => { counts[e.section] = (counts[e.section] || 0) + 1; });

  const enriched = sections.map(s => ({ ...s, enrolledCount: counts[s.id] || 0 }));

  res.json({ sections: enriched });
}));

/**
 * POST /api/courses/:courseId/sections
 * Create a section (admin only)
 */
router.post('/:courseId/sections', requireRole('admin'), [
  body('name').trim().notEmpty().withMessage('Section name is required'),
  body('semester').isInt({ min: 1 }).withMessage('Valid semester required'),
], handleValidation, asyncHandler(async (req, res) => {
  const { name, semester, year, capacity } = req.body;

  const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  // Check duplicate
  const existing = await prisma.section.findFirst({
    where: {
      college: req.user.college,
      course: req.params.courseId,
      semester: Number(semester),
      name: name.trim()
    }
  });
  if (existing) {
    return res.status(400).json({ error: 'Section already exists for this semester' });
  }

  const section = await prisma.section.create({
    data: {
      college: req.user.college,
      course: req.params.courseId,
      courseName: course.name,
      semester: Number(semester),
      year: Number(year) || 1,
      name: name.trim(),
      capacity: capacity || 60
    }
  });

  res.status(201).json({ section });
}));

/**
 * PUT /api/courses/sections/:id
 * Update a section (admin only)
 */
router.put('/sections/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const section = await prisma.section.findUnique({ where: { id: req.params.id } });
  if (!section) {
    return res.status(404).json({ error: 'Section not found' });
  }

  const allowed = ['name', 'capacity', 'year'];
  const updateData = {};
  allowed.forEach(field => {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
  });

  const updated = await prisma.section.update({
    where: { id: section.id },
    data: updateData
  });

  res.json({ section: updated });
}));

/**
 * DELETE /api/courses/sections/:id
 * Delete a section (admin only)
 */
router.delete('/sections/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  await prisma.section.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Section deleted' });
}));

// ========== ENROLLMENTS ==========

/**
 * POST /api/courses/enroll
 * Enroll a student in a section (admin only)
 */
router.post('/enroll', requireRole('admin'), [
  body('studentId').trim().notEmpty().withMessage('Student ID is required'),
  body('sectionId').trim().notEmpty().withMessage('Section ID is required'),
  body('semester').isInt({ min: 1 }).withMessage('Valid semester required'),
], handleValidation, asyncHandler(async (req, res) => {
  const { studentId, sectionId, semester, year } = req.body;

  // Verify student
  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student || student.role !== 'student') {
    return res.status(400).json({ error: 'Invalid student ID' });
  }

  // Verify section
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section) {
    return res.status(400).json({ error: 'Invalid section ID' });
  }

  // Check duplicate enrollment
  const existing = await prisma.enrollment.findFirst({
    where: { student: studentId, section: sectionId, semester: Number(semester) }
  });
  if (existing) {
    return res.status(400).json({ error: 'Student already enrolled in this section' });
  }

  // Check section capacity
  const currentEnrollments = await prisma.enrollment.count({
    where: { section: sectionId, semester: Number(semester), status: 'active' }
  });
  if (currentEnrollments >= section.capacity) {
    return res.status(400).json({ error: 'Section is at full capacity' });
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      student: studentId,
      section: sectionId,
      college: section.college,
      course: section.course,
      semester: Number(semester),
      year: Number(year) || section.year,
      status: 'active'
    }
  });

  res.status(201).json({ enrollment });
}));

/**
 * POST /api/courses/enroll-bulk
 * Bulk enroll students (admin only)
 */
router.post('/enroll-bulk', requireRole('admin'), [
  body('studentIds').isArray({ min: 1 }).withMessage('At least one student required'),
  body('sectionId').trim().notEmpty().withMessage('Section ID required'),
  body('semester').isInt({ min: 1 }).withMessage('Valid semester required'),
], handleValidation, asyncHandler(async (req, res) => {
  const { studentIds, sectionId, semester, year } = req.body;

  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section) {
    return res.status(400).json({ error: 'Invalid section ID' });
  }

  const results = { enrolled: 0, skipped: 0, errors: [] };

  for (const studentId of studentIds) {
    try {
      // Check if already enrolled
      const existing = await prisma.enrollment.findFirst({
        where: { student: studentId, section: sectionId, semester: Number(semester) }
      });
      if (existing) {
        results.skipped++;
        continue;
      }

      await prisma.enrollment.create({
        data: {
          student: studentId,
          section: sectionId,
          college: section.college,
          course: section.course,
          semester: Number(semester),
          year: Number(year) || section.year,
          status: 'active'
        }
      });
      results.enrolled++;
    } catch (err) {
      results.errors.push({ studentId, error: err.message });
    }
  }

  res.json(results);
}));

/**
 * DELETE /api/courses/enroll/:id
 * Drop a student from a section (admin only)
 */
router.delete('/enroll/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  await prisma.enrollment.update({
    where: { id: req.params.id },
    data: { status: 'dropped' }
  });
  res.json({ message: 'Enrollment dropped' });
}));

module.exports = router;
