import { Router } from 'express';
import { body, query } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireFaculty } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';

const router = Router();
router.use(auth, requireFaculty);

// ─────────────────────────────────────────────────────────
// GET /api/faculty-attendance/courses — Faculty's assigned courses via FacultyAssignment
// ─────────────────────────────────────────────────────────
router.get('/courses', asyncHandler(async (req, res) => {
  const facultyId = req.user.id;

  // Get assignments from FacultyAssignment table
  const assignments = await prisma.facultyAssignment.findMany({
    where: { faculty: facultyId, active: true },
  });

  // Resolve course/section/subject names
  const courseIds = [...new Set(assignments.map(a => a.course))];
  const sectionIds = [...new Set(assignments.map(a => a.section).filter(Boolean))];
  const subjectIds = [...new Set(assignments.map(a => a.subject).filter(Boolean))];

  const [courses, sections, subjects] = await Promise.all([
    prisma.course.findMany({ where: { id: { in: courseIds } } }),
    sectionIds.length ? prisma.section.findMany({ where: { id: { in: sectionIds } } }) : [],
    subjectIds.length ? prisma.subject.findMany({ where: { id: { in: subjectIds } } }) : [],
  ]);

  const courseMap = new Map(courses.map(c => [c.id, c]));
  const sectionMap = new Map(sections.map(s => [s.id, s]));
  const subjectMap = new Map(subjects.map(s => [s.id, s]));

  const enriched = assignments.map(a => ({
    ...a,
    courseDetails: courseMap.get(a.course) || null,
    sectionDetails: sectionMap.get(a.section) || null,
    subjectDetails: subjectMap.get(a.subject) || null,
  }));

  res.json({ assignments: enriched, courses, sections, subjects });
}));

// ─────────────────────────────────────────────────────────
// GET /api/faculty-attendance/today — Today's classes for this faculty
// Returns subjects assigned via FacultyAssignment (with course+section info)
// ─────────────────────────────────────────────────────────
router.get('/today', asyncHandler(async (req, res) => {
  const facultyId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get faculty's assignments from FacultyAssignment
  const assignments = await prisma.facultyAssignment.findMany({
    where: { faculty: facultyId, active: true },
  });

  // Resolve names
  const courseIds = [...new Set(assignments.map(a => a.course))];
  const sectionIds = [...new Set(assignments.map(a => a.section).filter(Boolean))];
  const subjectIds = [...new Set(assignments.map(a => a.subject).filter(Boolean))];

  const [courses, sections, subjects] = await Promise.all([
    prisma.course.findMany({ where: { id: { in: courseIds } } }),
    sectionIds.length ? prisma.section.findMany({ where: { id: { in: sectionIds } } }) : [],
    subjectIds.length ? prisma.subject.findMany({ where: { id: { in: subjectIds } } }) : [],
  ]);

  const courseMap = new Map(courses.map(c => [c.id, c]));
  const sectionMap = new Map(sections.map(s => [s.id, s]));
  const subjectMap = new Map(subjects.map(s => [s.id, s]));

  // Build "subjects" list for the frontend (unique by subject+course+section)
  const subjectList = assignments.map(a => ({
    id: a.subject,
    name: subjectMap.get(a.subject)?.name || 'Unknown Subject',
    code: subjectMap.get(a.subject)?.code || '',
    color: subjectMap.get(a.subject)?.color || '#6366f1',
    semester: a.semester,
    course: a.course,
    courseName: courseMap.get(a.course)?.name || '',
    section: a.section,
    sectionName: sectionMap.get(a.section)?.name || '',
    assignmentId: a.id,
  }));

  // Get today's attendance sessions created by this faculty
  const todaySessions = await prisma.attendanceSession.findMany({
    where: {
      faculty: facultyId,
      date: { gte: today, lt: tomorrow },
    },
    orderBy: { startTime: 'asc' },
  });

  // Calculate which subjects already have sessions today
  const sessionSubjectIds = new Set(todaySessions.map(s => s.subject));
  const pendingSubjects = subjectList.filter(s => !sessionSubjectIds.has(s.id));

  res.json({
    subjects: subjectList,
    todaySessions,
    pendingSubjects,
    totalSubjects: subjectList.length,
    completedSessions: todaySessions.length,
    pendingSessions: pendingSubjects.length,
  });
}));

// ─────────────────────────────────────────────────────────
// POST /api/faculty-attendance/session — Create attendance session
// ─────────────────────────────────────────────────────────
router.post(
  '/session',
  [
    body('subjectId').trim().notEmpty().withMessage('Subject is required'),
    body('date').isISO8601().withMessage('Valid date required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { subjectId, date, startTime, endTime, notes, courseId, sectionId } = req.body;
    const facultyId = req.user.id;

    // Find the assignment for this subject
    const assignment = await prisma.facultyAssignment.findFirst({
      where: {
        faculty: facultyId,
        subject: subjectId,
        active: true,
      },
    });
    if (!assignment) throw ApiError.notFound('Subject not found or not assigned to you');

    // Get subject name
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });

    // Use assignment's course/section if not provided
    const course = courseId || assignment.course;
    const section = sectionId || assignment.section;

    // Check if session already exists
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    const existing = await prisma.attendanceSession.findFirst({
      where: {
        faculty: facultyId,
        subject: subjectId,
        date: dateObj,
      },
    });
    if (existing) {
      throw ApiError.conflict('Attendance session already exists for this subject on this date');
    }

    const session = await prisma.attendanceSession.create({
      data: {
        id: crypto.randomBytes(10).toString('base64url').slice(0, 20),
        faculty: facultyId,
        subject: subjectId,
        subjectName: subject?.name || 'Unknown',
        course: course || null,
        section: section || null,
        semester: assignment.semester,
        date: dateObj,
        startTime: startTime || '',
        endTime: endTime || '',
        notes: notes || '',
        status: 'draft',
      },
    });

    res.status(201).json({ session });
  })
);

// ─────────────────────────────────────────────────────────
// GET /api/faculty-attendance/session/:id/students — Get students for attendance
// ─────────────────────────────────────────────────────────
router.get('/session/:id/students', asyncHandler(async (req, res) => {
  const session = await prisma.attendanceSession.findFirst({
    where: { id: req.params.id, faculty: req.user.id },
  });
  if (!session) throw ApiError.notFound('Session not found');

  let students = [];

  if (session.course) {
    // Get students enrolled in this course+section
    const enrollWhere = {
      course: session.course,
      status: 'active',
    };
    if (session.section) {
      enrollWhere.section = session.section;
    }
    // Also filter by semester if set
    if (session.semester) {
      enrollWhere.semester = session.semester;
    }

    const enrollments = await prisma.enrollment.findMany({
      where: enrollWhere,
    });
    const studentIds = enrollments.map(e => e.student);

    if (studentIds.length > 0) {
      students = await prisma.user.findMany({
        where: { id: { in: studentIds }, role: 'student', active: true },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
        },
        orderBy: { name: 'asc' },
      });

      // Attach enrollment info
      const enrollmentMap = new Map(enrollments.map(e => [e.student, e]));
      for (const s of students) {
        s.enrollment = enrollmentMap.get(s.id) || null;
      }
    }
  }

  // Get existing attendance records for this session
  const existingRecords = await prisma.attendance.findMany({
    where: { sessionId: session.id },
  });
  const recordMap = new Map(existingRecords.map(r => [r.student, r]));

  // Attach attendance status to each student
  for (const s of students) {
    const record = recordMap.get(s.id);
    s.attendanceStatus = record ? record.status : null;
    s.attendanceRecordId = record ? record.id : null;
  }

  res.json({
    session,
    students,
    total: students.length,
    marked: existingRecords.length,
    pending: students.length - existingRecords.length,
  });
}));

// ─────────────────────────────────────────────────────────
// POST /api/faculty-attendance/session/:id/mark — Mark attendance
// ─────────────────────────────────────────────────────────
router.post(
  '/session/:id/mark',
  [
    body('records').isArray().withMessage('Records array required'),
    body('records.*.studentId').trim().notEmpty().withMessage('Student ID required'),
    body('records.*.status').isIn(['present', 'absent', 'late', 'holiday']).withMessage('Invalid status'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const session = await prisma.attendanceSession.findFirst({
      where: { id: req.params.id, faculty: req.user.id },
    });
    if (!session) throw ApiError.notFound('Session not found');
    if (session.status === 'finalized') {
      throw ApiError.badRequest('Cannot modify finalized attendance');
    }

    const { records } = req.body;
    const results = [];

    for (const record of records) {
      const { studentId, status, notes } = record;

      // Upsert attendance record
      const existing = await prisma.attendance.findFirst({
        where: {
          student: studentId,
          subject: session.subject,
          date: session.date,
        },
      });

      if (existing) {
        const updated = await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status,
            markedBy: req.user.id,
            sessionId: session.id,
            notes: notes || '',
          },
        });
        results.push(updated);
      } else {
        const created = await prisma.attendance.create({
          data: {
            id: crypto.randomBytes(8).toString('base64url').slice(0, 15),
            student: studentId,
            subject: session.subject,
            subjectName: session.subjectName,
            date: session.date,
            status,
            markedBy: req.user.id,
            sessionId: session.id,
            course: session.course,
            section: session.section,
            semester: session.semester,
            notes: notes || '',
          },
        });
        results.push(created);
      }
    }

    // Update session status
    await prisma.attendanceSession.update({
      where: { id: session.id },
      data: { status: 'submitted' },
    });

    res.json({
      message: `Attendance marked for ${results.length} students`,
      records: results,
    });
  })
);

// ─────────────────────────────────────────────────────────
// POST /api/faculty-attendance/session/:id/mark-all — Mark all present
// ─────────────────────────────────────────────────────────
router.post('/session/:id/mark-all', asyncHandler(async (req, res) => {
  const session = await prisma.attendanceSession.findFirst({
    where: { id: req.params.id, faculty: req.user.id },
  });
  if (!session) throw ApiError.notFound('Session not found');
  if (session.status === 'finalized') {
    throw ApiError.badRequest('Cannot modify finalized attendance');
  }

  // Get all students for this session
  let studentIds = [];
  if (session.course) {
    const enrollWhere = { course: session.course, status: 'active' };
    if (session.section) enrollWhere.section = session.section;
    if (session.semester) enrollWhere.semester = session.semester;
    const enrollments = await prisma.enrollment.findMany({ where: enrollWhere });
    studentIds = enrollments.map(e => e.student);
  }

  // Mark all present
  const results = [];
  for (const studentId of studentIds) {
    const existing = await prisma.attendance.findFirst({
      where: {
        student: studentId,
        subject: session.subject,
        date: session.date,
      },
    });

    if (existing) {
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: { status: 'present', markedBy: req.user.id, sessionId: session.id },
      });
      results.push(updated);
    } else {
      const created = await prisma.attendance.create({
        data: {
          id: crypto.randomBytes(8).toString('base64url').slice(0, 15),
          student: studentId,
          subject: session.subject,
          subjectName: session.subjectName,
          date: session.date,
          status: 'present',
          markedBy: req.user.id,
          sessionId: session.id,
          course: session.course,
          section: session.section,
          semester: session.semester,
        },
      });
      results.push(created);
    }
  }

  await prisma.attendanceSession.update({
    where: { id: session.id },
    data: { status: 'submitted' },
  });

  res.json({
    message: `All ${results.length} students marked present`,
    records: results,
  });
}));

// ─────────────────────────────────────────────────────────
// POST /api/faculty-attendance/session/:id/finalize
// ─────────────────────────────────────────────────────────
router.post('/session/:id/finalize', asyncHandler(async (req, res) => {
  const session = await prisma.attendanceSession.findFirst({
    where: { id: req.params.id, faculty: req.user.id },
  });
  if (!session) throw ApiError.notFound('Session not found');

  const updated = await prisma.attendanceSession.update({
    where: { id: session.id },
    data: { status: 'finalized' },
  });

  res.json({ session: updated, message: 'Attendance finalized' });
}));

// ─────────────────────────────────────────────────────────
// GET /api/faculty-attendance/history
// ─────────────────────────────────────────────────────────
router.get('/history', asyncHandler(async (req, res) => {
  const { subjectId, startDate, endDate, page = 1, limit = 20 } = req.query;
  const facultyId = req.user.id;

  const where = { faculty: facultyId };
  if (subjectId) where.subject = subjectId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const total = await prisma.attendanceSession.count({ where });
  const sessions = await prisma.attendanceSession.findMany({
    where,
    orderBy: { date: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  });

  // Get attendance stats for each session
  const sessionsWithStats = await Promise.all(
    sessions.map(async (session) => {
      const records = await prisma.attendance.findMany({
        where: { sessionId: session.id },
      });
      const present = records.filter(r => r.status === 'present').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const late = records.filter(r => r.status === 'late').length;
      const total = records.length;

      return {
        ...session,
        stats: {
          total,
          present,
          absent,
          late,
          percentage: total ? Math.round((present / total) * 100) : 0,
        },
      };
    })
  );

  res.json({
    sessions: sessionsWithStats,
    total,
    page: Number(page),
  });
}));

// ─────────────────────────────────────────────────────────
// PATCH /api/faculty-attendance/record/:id — Correct a record
// ─────────────────────────────────────────────────────────
router.patch(
  '/record/:id',
  [
    body('status').isIn(['present', 'absent', 'late', 'holiday']).withMessage('Invalid status'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const record = await prisma.attendance.findUnique({
      where: { id: req.params.id },
    });
    if (!record) throw ApiError.notFound('Attendance record not found');

    if (record.sessionId) {
      const session = await prisma.attendanceSession.findFirst({
        where: { id: record.sessionId, faculty: req.user.id },
      });
      if (!session) throw ApiError.forbidden('You can only correct your own attendance records');
    }

    const { status, notes } = req.body;
    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        status,
        notes: notes || record.notes,
        markedBy: req.user.id,
      },
    });

    res.json({ record: updated });
  })
);

// ─────────────────────────────────────────────────────────
// GET /api/faculty-attendance/report — Attendance report
// ─────────────────────────────────────────────────────────
router.get('/report', asyncHandler(async (req, res) => {
  const { subjectId, startDate, endDate } = req.query;
  const facultyId = req.user.id;

  if (!subjectId) throw ApiError.badRequest('subjectId is required');

  // Verify faculty has assignment for this subject
  const assignment = await prisma.facultyAssignment.findFirst({
    where: { faculty: facultyId, subject: subjectId, active: true },
  });
  if (!assignment) throw ApiError.notFound('Subject not found or not assigned to you');

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });

  // Get all attendance records for this subject
  const where = { subject: subjectId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const records = await prisma.attendance.findMany({
    where,
    orderBy: { date: 'asc' },
  });

  // Group by student
  const studentMap = {};
  for (const record of records) {
    if (!studentMap[record.student]) {
      studentMap[record.student] = {
        student: record.student,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        holiday: 0,
      };
    }
    studentMap[record.student].total++;
    if (record.status === 'present') studentMap[record.student].present++;
    else if (record.status === 'absent') studentMap[record.student].absent++;
    else if (record.status === 'late') studentMap[record.student].late++;
    else if (record.status === 'holiday') studentMap[record.student].holiday++;
  }

  // Get student names
  const studentIds = Object.keys(studentMap);
  const users = studentIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, name: true, email: true },
  }) : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  const report = studentIds.map(id => {
    const stats = studentMap[id];
    const user = userMap.get(id);
    return {
      ...stats,
      name: user?.name || 'Unknown',
      email: user?.email || '',
      percentage: stats.total ? Math.round((stats.present / stats.total) * 100) : 0,
    };
  });

  report.sort((a, b) => a.name.localeCompare(b.name));

  const totalClasses = records.length > 0
    ? new Set(records.map(r => r.date.toISOString().slice(0, 10))).size
    : 0;
  const overallPresent = records.filter(r => r.status === 'present').length;
  const overallTotal = records.length;

  res.json({
    subject: { id: subject.id, name: subject.name, code: subject.code },
    report,
    summary: {
      totalStudents: report.length,
      totalClasses,
      overallPercentage: overallTotal ? Math.round((overallPresent / overallTotal) * 100) : 0,
      averageAttendance: report.length
        ? Math.round(report.reduce((sum, r) => sum + r.percentage, 0) / report.length)
        : 0,
      lowAttendance: report.filter(r => r.percentage < 75).length,
    },
  });
}));

export default router;
