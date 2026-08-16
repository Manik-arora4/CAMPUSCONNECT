import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireStudent } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { timeToMinutes } from '../utils/helpers.js';

const router = Router();
router.use(auth, requireStudent);

function detectConflicts(slots) {
  const conflicts = [];
  const byDay = {};
  for (const s of slots) (byDay[s.day] = byDay[s.day] || []).push(s);
  for (const [day, list] of Object.entries(byDay)) {
    const sorted = [...list].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        if (timeToMinutes(b.startTime) < timeToMinutes(a.endTime)) {
          conflicts.push({
            day: Number(day),
            a: { id: a.id, subjectName: a.subjectName, startTime: a.startTime, endTime: a.endTime },
            b: { id: b.id, subjectName: b.subjectName, startTime: b.startTime, endTime: b.endTime },
          });
        }
      }
    }
  }
  return conflicts;
}

// GET /api/timetable — weekly slots
router.get('/', asyncHandler(async (req, res) => {
  const slots = await prisma.timetableSlot.findMany({ where: { student: req.user.id }, orderBy: [{ day: 'asc' }, { startTime: 'asc' }] });
  res.json({ slots, conflicts: detectConflicts(slots) });
}));

// GET /api/timetable/conflicts
router.get('/conflicts', asyncHandler(async (req, res) => {
  const slots = await prisma.timetableSlot.findMany({ where: { student: req.user.id } });
  res.json({ conflicts: detectConflicts(slots) });
}));

// POST /api/timetable
router.post(
  '/',
  [
    body('subjectName').trim().notEmpty().withMessage('Subject is required'),
    body('day').isInt({ min: 0, max: 6 }).withMessage('Day must be 0-6'),
    body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('Start time must be HH:MM'),
    body('endTime').matches(/^\d{2}:\d{2}$/).withMessage('End time must be HH:MM'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { subjectName, subject, teacherName, room, day, startTime, endTime, color, type = 'class' } = req.body;
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) throw ApiError.badRequest('End time must be after start time');
    const slot = await prisma.timetableSlot.create({
      data: {
        student: req.user.id,
        college: req.user.college,
        subject: subject || undefined,
        subjectName: subjectName.trim(),
        teacherName: teacherName || '',
        room: room || '',
        day: Number(day),
        startTime,
        endTime,
        color: color || '#6366f1',
        type,
      },
    });
    res.status(201).json({ slot });
  })
);

// PATCH /api/timetable/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const slot = await prisma.timetableSlot.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!slot) throw ApiError.notFound('Timetable slot not found');
  const allowed = ['subjectName', 'subject', 'teacherName', 'room', 'day', 'startTime', 'endTime', 'color', 'type'];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  if (data.endTime && data.startTime && timeToMinutes(data.endTime) <= timeToMinutes(data.startTime)) {
    throw ApiError.badRequest('End time must be after start time');
  }
  const updated = await prisma.timetableSlot.update({ where: { id: slot.id }, data });
  res.json({ slot: updated });
}));

// POST /api/timetable/:id/duplicate
router.post('/:id/duplicate', asyncHandler(async (req, res) => {
  const slot = await prisma.timetableSlot.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!slot) throw ApiError.notFound('Timetable slot not found');
  const copy = await prisma.timetableSlot.create({
    data: {
      student: slot.student,
      college: slot.college,
      subject: slot.subject,
      subjectName: slot.subjectName,
      teacherName: slot.teacherName,
      room: slot.room,
      day: Number(req.body.day ?? slot.day),
      startTime: slot.startTime,
      endTime: slot.endTime,
      color: slot.color,
      type: slot.type,
    },
  });
  res.status(201).json({ slot: copy });
}));

// DELETE /api/timetable/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const res2 = await prisma.timetableSlot.deleteMany({ where: { id: req.params.id, student: req.user.id } });
  if (!res2.count) throw ApiError.notFound('Timetable slot not found');
  res.json({ message: 'Slot deleted' });
}));

export default router;
