import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireStudent } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { buildAttendanceReport, forecastMessage } from '../services/attendanceService.js';
import { aiService } from '../services/ai/index.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();
router.use(auth, requireStudent);

async function buildReport(userId) {
  const records = await prisma.attendance.findMany({ where: { student: userId }, orderBy: { date: 'asc' } });
  const groups = {};
  for (const r of records) (groups[r.subjectName] = groups[r.subjectName] || []).push(r);
  const report = buildAttendanceReport(groups);
  return { records, report };
}

// GET /api/attendance — full intelligence report
router.get('/', asyncHandler(async (req, res) => {
  const { records, report } = await buildReport(req.user.id);
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  const subjects = await prisma.subject.findMany({ where: { college: req.user.college, semester: profile?.semester || 1 } });
  res.json({ ...report, records, subjects });
}));

// GET /api/attendance/forecast
router.get('/forecast', asyncHandler(async (req, res) => {
  const { report } = await buildReport(req.user.id);
  res.json({
    overall: report.overall,
    forecast: report.overall.total ? report.overall.subjects || [] : [],
    message: forecastMessage(report.overall),
  });
}));

// POST /api/attendance — mark attendance for a class session
router.post(
  '/',
  [
    body('subjectName').trim().notEmpty().withMessage('Subject is required'),
    body('date').isISO8601().withMessage('Valid date required'),
    body('status').isIn(['present', 'absent', 'holiday']).withMessage('Invalid status'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { subjectName, subject, date, status } = req.body;
    const dateObj = new Date(date);
    const existing = await prisma.attendance.findFirst({ where: { student: req.user.id, subjectName, date: dateObj } });
    if (existing) {
      const record = await prisma.attendance.update({ where: { id: existing.id }, data: { status } });
      return res.json({ record });
    }
    const record = await prisma.attendance.create({
      data: {
        student: req.user.id,
        subject: subject || undefined,
        subjectName: subjectName.trim(),
        date: dateObj,
        status,
        markedBy: req.user.id,
      },
    });
    res.status(201).json({ record });
  })
);

// PATCH /api/attendance/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const record = await prisma.attendance.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!record) throw ApiError.notFound('Attendance record not found');
  let data = {};
  if (req.body.status) {
    if (!['present', 'absent', 'holiday'].includes(req.body.status)) throw ApiError.badRequest('Invalid status');
    data = { status: req.body.status };
  }
  const updated = await prisma.attendance.update({ where: { id: record.id }, data });
  res.json({ record: updated });
}));

// DELETE /api/attendance/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const res2 = await prisma.attendance.deleteMany({ where: { id: req.params.id, student: req.user.id } });
  if (!res2.count) throw ApiError.notFound('Attendance record not found');
  res.json({ message: 'Record deleted' });
}));

// POST /api/attendance/advice — AI explanation of attendance health
router.post('/advice', asyncHandler(async (req, res) => {
  const { report } = await buildReport(req.user.id);
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  const gemini = await aiService.chat(`My attendance is ${report.overall.percentage}%. What should I do?`, {
    attendance: { overall: report.overall },
    student: profile,
  });
  res.json({ advice: gemini.reply, overall: report.overall, message: forecastMessage(report.overall) });
}));

// POST /api/attendance/alert-if-low — internal helper to create notifications
export async function checkAndAlertAttendance(userId) {
  const records = await prisma.attendance.findMany({ where: { student: userId } });
  const groups = {};
  for (const r of records) (groups[r.subjectName] = groups[r.subjectName] || []).push(r);
  const report = buildAttendanceReport(groups);
  if (report.overall.total && report.overall.health !== 'safe') {
    await createNotification(userId, {
      category: 'attendance',
      title: `Attendance at ${report.overall.percentage}%`,
      message: `Attend the next ${report.overall.needed || 1} classes to reach your ${report.overall.target}% target.`,
      link: '/attendance',
      icon: 'percent',
      priority: report.overall.health === 'critical' ? 'high' : 'medium',
    });
  }
}

export default router;
