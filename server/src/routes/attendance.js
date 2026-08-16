import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireStudent } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Attendance } from '../models/Attendance.js';
import { Subject } from '../models/Subject.js';
import { buildAttendanceReport, forecastMessage } from '../services/attendanceService.js';
import { aiService } from '../services/ai/index.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();
router.use(auth, requireStudent);

async function buildReport(userId) {
  const records = await Attendance.find({ student: userId }).sort({ date: 1 });
  const groups = {};
  for (const r of records) (groups[r.subjectName] = groups[r.subjectName] || []).push(r);
  const report = buildAttendanceReport(groups);
  return { records, report };
}

// GET /api/attendance — full intelligence report
router.get('/', asyncHandler(async (req, res) => {
  const { records, report } = await buildReport(req.user._id);
  const subjects = await Subject.find({ college: req.user.college, semester: (await StudentProfile.findOne({ user: req.user._id }))?.semester || 1 });
  res.json({ ...report, records, subjects });
}));

// GET /api/attendance/forecast
router.get('/forecast', asyncHandler(async (req, res) => {
  const { report } = await buildReport(req.user._id);
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
    const existing = await Attendance.findOne({ student: req.user._id, subjectName, date: new Date(date) });
    if (existing) {
      existing.status = status;
      await existing.save();
      return res.json({ record: existing });
    }
    const record = await Attendance.create({
      student: req.user._id,
      subject: subject || undefined,
      subjectName: subjectName.trim(),
      date: new Date(date),
      status,
      markedBy: req.user._id,
    });
    res.status(201).json({ record });
  })
);

// PATCH /api/attendance/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const record = await Attendance.findOne({ _id: req.params.id, student: req.user._id });
  if (!record) throw ApiError.notFound('Attendance record not found');
  if (req.body.status) {
    if (!['present', 'absent', 'holiday'].includes(req.body.status)) throw ApiError.badRequest('Invalid status');
    record.status = req.body.status;
  }
  await record.save();
  res.json({ record });
}));

// DELETE /api/attendance/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const record = await Attendance.findOneAndDelete({ _id: req.params.id, student: req.user._id });
  if (!record) throw ApiError.notFound('Attendance record not found');
  res.json({ message: 'Record deleted' });
}));

// POST /api/attendance/advice — AI explanation of attendance health
router.post('/advice', asyncHandler(async (req, res) => {
  const { report } = await buildReport(req.user._id);
  const profile = await StudentProfile.findOne({ user: req.user._id });
  const gemini = await aiService.chat(`My attendance is ${report.overall.percentage}%. What should I do?`, {
    attendance: { overall: report.overall },
    student: profile,
  });
  res.json({ advice: gemini.reply, overall: report.overall, message: forecastMessage(report.overall) });
}));

// POST /api/attendance/alert-if-low — internal helper to create notifications
export async function checkAndAlertAttendance(userId) {
  const records = await Attendance.find({ student: userId });
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
