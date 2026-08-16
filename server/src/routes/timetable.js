import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireStudent } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { TimetableSlot } from '../models/TimetableSlot.js';
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
            a: { id: a._id, subjectName: a.subjectName, startTime: a.startTime, endTime: a.endTime },
            b: { id: b._id, subjectName: b.subjectName, startTime: b.startTime, endTime: b.endTime },
          });
        }
      }
    }
  }
  return conflicts;
}

// GET /api/timetable — weekly slots
router.get('/', asyncHandler(async (req, res) => {
  const slots = await TimetableSlot.find({ student: req.user._id }).sort({ day: 1, startTime: 1 });
  res.json({ slots, conflicts: detectConflicts(slots) });
}));

// GET /api/timetable/conflicts
router.get('/conflicts', asyncHandler(async (req, res) => {
  const slots = await TimetableSlot.find({ student: req.user._id });
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
    const slot = await TimetableSlot.create({
      student: req.user._id,
      college: req.user.college,
      subject,
      subjectName: subjectName.trim(),
      teacherName,
      room,
      day,
      startTime,
      endTime,
      color,
      type,
    });
    res.status(201).json({ slot });
  })
);

// PATCH /api/timetable/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const slot = await TimetableSlot.findOne({ _id: req.params.id, student: req.user._id });
  if (!slot) throw ApiError.notFound('Timetable slot not found');
  const allowed = ['subjectName', 'subject', 'teacherName', 'room', 'day', 'startTime', 'endTime', 'color', 'type'];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) slot[k] = req.body[k];
  });
  if (slot.endTime && slot.startTime && timeToMinutes(slot.endTime) <= timeToMinutes(slot.startTime)) {
    throw ApiError.badRequest('End time must be after start time');
  }
  await slot.save();
  res.json({ slot });
}));

// POST /api/timetable/:id/duplicate
router.post('/:id/duplicate', asyncHandler(async (req, res) => {
  const slot = await TimetableSlot.findOne({ _id: req.params.id, student: req.user._id });
  if (!slot) throw ApiError.notFound('Timetable slot not found');
  const copy = await TimetableSlot.create({
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
  });
  res.status(201).json({ slot: copy });
}));

// DELETE /api/timetable/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const slot = await TimetableSlot.findOneAndDelete({ _id: req.params.id, student: req.user._id });
  if (!slot) throw ApiError.notFound('Timetable slot not found');
  res.json({ message: 'Slot deleted' });
}));

export default router;
