const { Router } = require('express');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, handleValidation, asyncHandler } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

function toMinutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }

function findConflicts(slots) {
  const conflicts = [];
  const byDay = {};
  for (const s of slots) (byDay[s.day] = byDay[s.day] || []).push(s);
  for (const [, daySlots] of Object.entries(byDay)) {
    const sorted = [...daySlots].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (toMinutes(sorted[j].startTime) < toMinutes(sorted[i].endTime)) {
          conflicts.push({ day: Number(sorted[i].day), a: sorted[i], b: sorted[j] });
        }
      }
    }
  }
  return conflicts;
}

router.get('/', asyncHandler(async (req, res) => {
  const slots = await prisma.timetableSlot.findMany({
    where: { student: req.user.id },
    orderBy: [{ day: 'asc' }, { startTime: 'asc' }]
  });
  res.json({ slots, conflicts: findConflicts(slots) });
}));

router.post('/', [
  body('subjectName').trim().notEmpty().withMessage('Subject is required'),
  body('day').isInt({ min: 0, max: 6 }).withMessage('Day must be 0-6'),
  body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('Start time must be HH:MM'),
  body('endTime').matches(/^\d{2}:\d{2}$/).withMessage('End time must be HH:MM'),
], handleValidation, asyncHandler(async (req, res) => {
  const { subjectName, subject, teacherName, room, day, startTime, endTime, color, type } = req.body;
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }
  const slot = await prisma.timetableSlot.create({
    data: {
      student: req.user.id, college: req.user.college,
      subject: subject || undefined, subjectName: subjectName.trim(),
      teacherName: teacherName || '', room: room || '',
      day: Number(day), startTime, endTime,
      color: color || '#6366f1', type: type || 'class'
    }
  });
  res.status(201).json({ slot });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const slot = await prisma.timetableSlot.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!slot) return res.status(404).json({ error: 'Slot not found' });
  const allowed = ['subjectName', 'subject', 'teacherName', 'room', 'day', 'startTime', 'endTime', 'color', 'type'];
  const data = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
  if (data.endTime && data.startTime && toMinutes(data.endTime) <= toMinutes(data.startTime)) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }
  const updated = await prisma.timetableSlot.update({ where: { id: slot.id }, data });
  res.json({ slot: updated });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await prisma.timetableSlot.deleteMany({ where: { id: req.params.id, student: req.user.id } });
  if (!result.count) return res.status(404).json({ error: 'Slot not found' });
  res.json({ message: 'Slot deleted' });
}));

module.exports = router;
