import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireFaculty } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(auth);

// GET /api/events?upcoming=true
router.get('/', asyncHandler(async (req, res) => {
  const where = { college: req.user.college };
  if (req.query.upcoming === 'true') where.date = { gte: new Date() };
  const events = await prisma.event.findMany({ where, orderBy: { date: 'asc' }, take: 60 });
  res.json({ events });
}));

// GET /api/events/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const event = await prisma.event.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!event) throw ApiError.notFound('Event not found');
  res.json({ event });
}));

// POST /api/events — faculty/admin
router.post(
  '/',
  requireFaculty,
  [body('title').trim().notEmpty().withMessage('Title is required'), body('date').isISO8601().withMessage('Valid date required')],
  validate,
  asyncHandler(async (req, res) => {
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
        createdBy: req.user.id,
      },
    });
    res.status(201).json({ event });
  })
);

// POST /api/events/:id/register
router.post('/:id/register', asyncHandler(async (req, res) => {
  const event = await prisma.event.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!event) throw ApiError.notFound('Event not found');
  const registeredStudents = event.registeredStudents || [];
  if (!registeredStudents.some((s) => String(s) === String(req.user.id))) {
    registeredStudents.push(req.user.id);
  }
  const updated = await prisma.event.update({ where: { id: event.id }, data: { registeredStudents } });
  res.json({ event: updated, registered: true });
}));

// POST /api/events/:id/save
router.post('/:id/save', asyncHandler(async (req, res) => {
  const event = await prisma.event.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!event) throw ApiError.notFound('Event not found');
  const savedBy = [...(event.savedBy || [])];
  const idx = savedBy.findIndex((s) => String(s) === String(req.user.id));
  if (idx === -1) savedBy.push(req.user.id);
  else savedBy.splice(idx, 1);
  const updated = await prisma.event.update({ where: { id: event.id }, data: { savedBy } });
  res.json({ event: updated, saved: idx === -1 });
}));

// PATCH /api/events/:id
router.patch('/:id', requireFaculty, asyncHandler(async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) throw ApiError.notFound('Event not found');
  const allowed = ['title', 'description', 'category', 'date', 'startTime', 'endTime', 'location', 'organizer', 'registrationLink'];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  const updated = await prisma.event.update({ where: { id: event.id }, data });
  res.json({ event: updated });
}));

// DELETE /api/events/:id
router.delete('/:id', requireFaculty, asyncHandler(async (req, res) => {
  await prisma.event.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Event deleted' });
}));

export default router;
