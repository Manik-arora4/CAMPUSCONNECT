const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireFaculty, requireRole, handleValidation, asyncHandler } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

/**
 * Helper: Check if faculty is assigned to a section+subject
 */
async function verifyFacultyAccess(facultyId, subjectId, sectionId) {
  const assignment = await prisma.facultyAssignment.findFirst({
    where: {
      faculty: facultyId,
      subject: subjectId,
      section: sectionId,
      active: true
    }
  });
  return !!assignment;
}

/**
 * Helper: Calculate attendance percentage for a student in a subject
 */
async function calculateAttendance(studentId, subjectName, collegeId) {
  const records = await prisma.attendanceRecord.findMany({
    where: { student: studentId },
    include: { session: true }
  });

  const filtered = records.filter(r =>
    r.session.subjectName === subjectName &&
    r.session.college === collegeId
  );

  const total = filtered.length;
  const present = filtered.filter(r => ['present', 'late'].includes(r.status)).length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return { total, present, absent: total - present, percentage };
}

/**
 * POST /api/attendance/sessions
 * Faculty creates a new attendance session
 */
router.post('/sessions', requireFaculty, [
  body('subjectId').trim().notEmpty().withMessage('Subject ID is required'),
  body('sectionId').trim().notEmpty().withMessage('Section ID is required'),
  body('date').isISO8601().withMessage('Valid date required'),
], handleValidation, asyncHandler(async (req, res) => {
  const { subjectId, sectionId, date, startTime, endTime } = req.body;

  // Verify faculty has access to this subject+section
  const hasAccess = await verifyFacultyAccess(req.user.id, subjectId, sectionId);
  if (!hasAccess) {
    return res.status(403).json({ error: 'You are not assigned to this subject/section' });
  }

  // Get subject and section details
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!subject || !section) {
    return res.status(400).json({ error: 'Invalid subject or section' });
  }

  // Check for existing session on same date
  const existing = await prisma.attendanceSession.findFirst({
    where: {
      faculty: req.user.id,
      subject: subjectId,
      section: sectionId,
      date: new Date(date)
    }
  });

  if (existing) {
    return res.status(400).json({ error: 'Attendance session already exists for this date/subject/section' });
  }

  // Count enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where: { section: sectionId, status: 'active' }
  });

  const session = await prisma.attendanceSession.create({
    data: {
      college: req.user.college,
      faculty: req.user.id,
      subject: subjectId,
      subjectName: subject.name,
      section: sectionId,
      sectionName: section.name,
      date: new Date(date),
      startTime: startTime || '',
      endTime: endTime || '',
      status: 'open',
      totalStudents: enrollments.length,
      presentCount: 0,
      absentCount: 0
    }
  });

  res.status(201).json({ session });
}));

/**
 * GET /api/attendance/sessions
 * Get faculty's attendance sessions
 */
router.get('/sessions', requireFaculty, asyncHandler(async (req, res) => {
  const { status, date, subjectId, sectionId } = req.query;

  const where = { faculty: req.user.id };
  if (status) where.status = status;
  if (subjectId) where.subject = subjectId;
  if (sectionId) where.section = sectionId;
  if (date) {
    const d = new Date(date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    where.date = { gte: d, lt: nextDay };
  }

  const sessions = await prisma.attendanceSession.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: 50
  });

  res.json({ sessions });
}));

/**
 * GET /api/attendance/sessions/:id
 * Get a specific attendance session with student records
 */
router.get('/sessions/:id', requireFaculty, asyncHandler(async (req, res) => {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: req.params.id }
  });

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.faculty !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Get enrolled students for this section
  const enrollments = await prisma.enrollment.findMany({
    where: { section: session.section, status: 'active' }
  });

  const studentIds = enrollments.map(e => e.student);

  // Get student details
  const students = studentIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, name: true, email: true }
      })
    : [];

  // Get existing attendance records for this session
  const records = await prisma.attendanceRecord.findMany({
    where: { session: session.id }
  });

  const recordMap = new Map(records.map(r => [r.student, r]));

  // Merge students with their attendance status
  const studentList = students.map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    status: recordMap.get(s.id)?.status || null,
    remarks: recordMap.get(s.id)?.remarks || '',
    recordId: recordMap.get(s.id)?.id || null
  }));

  res.json({ session, students: studentList });
}));

/**
 * POST /api/attendance/sessions/:id/mark
 * Faculty marks attendance for a session (bulk mark)
 */
router.post('/sessions/:id/mark', requireFaculty, [
  body('records').isArray({ min: 1 }).withMessage('At least one record required'),
  body('records.*.studentId').trim().notEmpty().withMessage('Student ID required'),
  body('records.*.status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid status'),
], handleValidation, asyncHandler(async (req, res) => {
  const { records } = req.body;

  const session = await prisma.attendanceSession.findUnique({
    where: { id: req.params.id }
  });

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.faculty !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the assigned faculty can mark attendance' });
  }

  if (session.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot mark attendance for a cancelled session' });
  }

  // Verify all students are enrolled in this section
  const enrollments = await prisma.enrollment.findMany({
    where: { section: session.section, status: 'active' },
    select: { student: true }
  });
  const enrolledIds = new Set(enrollments.map(e => e.student));

  const invalidStudents = records.filter(r => !enrolledIds.has(r.studentId));
  if (invalidStudents.length > 0) {
    return res.status(400).json({
      error: 'Some students are not enrolled in this section',
      invalidStudents: invalidStudents.map(s => s.studentId)
    });
  }

  // Upsert attendance records
  let presentCount = 0;
  let absentCount = 0;

  for (const record of records) {
    const { studentId, status, remarks } = record;

    await prisma.attendanceRecord.upsert({
      where: {
        session_student: { session: session.id, student: studentId }
      },
      update: { status, remarks: remarks || '', markedBy: req.user.id },
      create: { session: session.id, student: studentId, status, remarks: remarks || '', markedBy: req.user.id }
    });

    if (['present', 'late'].includes(status)) presentCount++;
    else absentCount++;
  }

  // Update session counts
  await prisma.attendanceSession.update({
    where: { id: session.id },
    data: {
      presentCount,
      absentCount,
      totalStudents: records.length,
      status: 'closed'
    }
  });

  res.json({ message: 'Attendance marked successfully', presentCount, absentCount });
}));

/**
 * POST /api/attendance/sessions/:id/mark-all-present
 * Quick action: mark all students as present
 */
router.post('/sessions/:id/mark-all-present', requireFaculty, asyncHandler(async (req, res) => {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: req.params.id }
  });

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.faculty !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { section: session.section, status: 'active' }
  });

  const studentIds = enrollments.map(e => e.student);

  // Mark all present
  for (const studentId of studentIds) {
    await prisma.attendanceRecord.upsert({
      where: {
        session_student: { session: session.id, student: studentId }
      },
      update: { status: 'present', markedBy: req.user.id },
      create: { session: session.id, student: studentId, status: 'present', markedBy: req.user.id }
    });
  }

  await prisma.attendanceSession.update({
    where: { id: session.id },
    data: {
      presentCount: studentIds.length,
      absentCount: 0,
      totalStudents: studentIds.length,
      status: 'closed'
    }
  });

  res.json({ message: 'All students marked present', count: studentIds.length });
}));

/**
 * POST /api/attendance/sessions/:id/cancel
 * Cancel an attendance session
 */
router.post('/sessions/:id/cancel', requireFaculty, asyncHandler(async (req, res) => {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: req.params.id }
  });

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.faculty !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  await prisma.attendanceSession.update({
    where: { id: session.id },
    data: { status: 'cancelled' }
  });

  res.json({ message: 'Session cancelled' });
}));

/**
 * PATCH /api/attendance/sessions/:id/records/:recordId
 * Correct a specific attendance record (faculty only, authorized cases)
 */
router.patch('/sessions/:id/records/:recordId', requireFaculty, asyncHandler(async (req, res) => {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: req.params.id }
  });

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.faculty !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only assigned faculty can correct attendance' });
  }

  const record = await prisma.attendanceRecord.findUnique({
    where: { id: req.params.recordId }
  });

  if (!record || record.session !== session.id) {
    return res.status(404).json({ error: 'Record not found' });
  }

  const { status, remarks } = req.body;
  const updateData = {};
  if (status) {
    if (!['present', 'absent', 'late', 'excused'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    updateData.status = status;
  }
  if (remarks !== undefined) updateData.remarks = remarks;
  updateData.markedBy = req.user.id;

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: updateData
  });

  // Recalculate session counts
  const allRecords = await prisma.attendanceRecord.findMany({
    where: { session: session.id }
  });
  const presentCount = allRecords.filter(r => ['present', 'late'].includes(r.status)).length;
  const absentCount = allRecords.filter(r => !['present', 'late'].includes(r.status)).length;

  await prisma.attendanceSession.update({
    where: { id: session.id },
    data: { presentCount, absentCount }
  });

  res.json({ record: updated });
}));

/**
 * GET /api/attendance/history
 * Get attendance history for faculty's assigned sections
 */
router.get('/history', requireFaculty, asyncHandler(async (req, res) => {
  const { subjectId, sectionId, from, to } = req.query;

  const where = { faculty: req.user.id };
  if (subjectId) where.subject = subjectId;
  if (sectionId) where.section = sectionId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      where.date.lt = toDate;
    }
  }

  const sessions = await prisma.attendanceSession.findMany({
    where,
    orderBy: [{ date: 'desc' }],
    take: 100
  });

  // Calculate summary stats
  const totalSessions = sessions.length;
  const closedSessions = sessions.filter(s => s.status === 'closed');
  const totalPresent = closedSessions.reduce((sum, s) => sum + s.presentCount, 0);
  const totalAbsent = closedSessions.reduce((sum, s) => sum + s.absentCount, 0);
  const totalMarked = totalPresent + totalAbsent;
  const averageAttendance = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  // Per-subject breakdown
  const subjectStats = {};
  for (const session of closedSessions) {
    if (!subjectStats[session.subject]) {
      subjectStats[session.subject] = { name: session.subjectName, sessions: 0, present: 0, absent: 0 };
    }
    subjectStats[session.subject].sessions++;
    subjectStats[session.subject].present += session.presentCount;
    subjectStats[session.subject].absent += session.absentCount;
  }

  // Add percentage to each subject
  Object.values(subjectStats).forEach(s => {
    const total = s.present + s.absent;
    s.percentage = total > 0 ? Math.round((s.present / total) * 100) : 0;
  });

  res.json({
    sessions,
    summary: {
      totalSessions,
      closedSessions: closedSessions.length,
      totalPresent,
      totalAbsent,
      averageAttendance
    },
    subjectStats: Object.values(subjectStats)
  });
}));

/**
 * GET /api/attendance/reports/:sectionId
 * Get attendance report for a specific section
 */
router.get('/reports/:sectionId', requireFaculty, asyncHandler(async (req, res) => {
  const { subjectId, from, to } = req.query;

  const where = {
    faculty: req.user.id,
    section: req.params.sectionId
  };
  if (subjectId) where.subject = subjectId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      where.date.lt = toDate;
    }
  }

  const sessions = await prisma.attendanceSession.findMany({
    where,
    orderBy: { date: 'asc' }
  });

  // Get enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where: { section: req.params.sectionId, status: 'active' }
  });
  const studentIds = enrollments.map(e => e.student);

  // Get student records
  const students = studentIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, name: true, email: true }
      })
    : [];

  // Get all attendance records for these students in these sessions
  const sessionIds = sessions.map(s => s.id);
  const records = sessionIds.length > 0 && studentIds.length > 0
    ? await prisma.attendanceRecord.findMany({
        where: { session: { in: sessionIds }, student: { in: studentIds } }
      })
    : [];

  // Calculate per-student attendance
  const studentStats = students.map(student => {
    const studentRecords = records.filter(r => r.student === student.id);
    const total = studentRecords.length;
    const present = studentRecords.filter(r => ['present', 'late'].includes(r.status)).length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      totalClasses: total,
      present,
      absent: total - present,
      percentage,
      status: percentage >= 75 ? 'good' : percentage >= 60 ? 'warning' : 'critical'
    };
  });

  // Overall stats
  const totalPresent = records.filter(r => ['present', 'late'].includes(r.status)).length;
  const totalRecords = records.length;
  const overallPercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

  // Low attendance students (< 75%)
  const lowAttendance = studentStats.filter(s => s.percentage < 75 && s.totalClasses > 0);

  res.json({
    section: req.params.sectionId,
    totalSessions: sessions.length,
    totalStudents: students.length,
    overallPercentage,
    studentStats,
    lowAttendance,
    records
  });
}));

module.exports = router;
