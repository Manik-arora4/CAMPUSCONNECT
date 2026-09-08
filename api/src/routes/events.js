const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireRole, handleValidation, asyncHandler } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const where = { college: req.user.college };
  if (req.query.upcoming === 'true') where.date = { gte: new Date() };
  const events = await prisma.event.findMany({ where, orderBy: { date: 'asc' }, take: 60 });
  res.json({ events });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const event = await prisma.event.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json({ event });
}));

router.post('/', requireRole('admin', 'faculty'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('date').isISO8601().withMessage('Valid date required'),
], handleValidation, asyncHandler(async (req, res) => {
  const { title, description, category, date, startTime, endTime, location, organizer, registrationLink } = req.body;
  const event = await prisma.event.create({
    data: {
      college: req.user.college,
      title: title.trim(),
      description: description || '',
      category: category || 'general',
      date: new Date(date),
      startTime: startTime || '10:00',
      endTime: endTime || '16:00',
      location: location || '',
      organizer: organizer || '',
      registrationLink: registrationLink || '',
      createdBy: req.user.id
    }
  });
  res.status(201).json({ event });
}));

router.post('/:id/register', asyncHandler(async (req, res) => {
  const event = await prisma.event.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  const registered = event.registeredStudents || [];
  if (!registered.some(id => String(id) === String(req.user.id))) {
    registered.push(req.user.id);
  }
  const updated = await prisma.event.update({ where: { id: event.id }, data: { registeredStudents: registered } });
  res.json({ event: updated, registered: true });
}));

router.post('/:id/save', asyncHandler(async (req, res) => {
  const event = await prisma.event.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  const saved = [...(event.savedBy || [])];
  const idx = saved.findIndex(id => String(id) === String(req.user.id));
  idx === -1 ? saved.push(req.user.id) : saved.splice(idx, 1);
  const updated = await prisma.event.update({ where: { id: event.id }, data: { savedBy: saved } });
  res.json({ event: updated, saved: idx === -1 });
}));

router.put('/:id', requireRole('admin', 'faculty'), asyncHandler(async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  const allowed = ['title', 'description', 'category', 'date', 'startTime', 'endTime', 'location', 'organizer', 'registrationLink'];
  const data = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
  const updated = await prisma.event.update({ where: { id: event.id }, data });
  res.json({ event: updated });
}));

router.delete('/:id', requireRole('admin', 'faculty'), asyncHandler(async (req, res) => {
  await prisma.event.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Event deleted' });
}));

module.exports = router;
