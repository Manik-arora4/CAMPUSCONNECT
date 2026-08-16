import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireFaculty } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Event } from '../models/Event.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();
router.use(auth);

// GET /api/events?upcoming=true
router.get('/', asyncHandler(async (req, res) => {
  const filter = { college: req.user.college };
  if (req.query.upcoming === 'true') filter.date = { $gte: new Date() };
  const events = await Event.find(filter).sort({ date: 1 }).limit(60);
  res.json({ events });
}));

// GET /api/events/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, college: req.user.college });
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
    const event = await Event.create({
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
      createdBy: req.user._id,
    });
    res.status(201).json({ event });
  })
);

// POST /api/events/:id/register
router.post('/:id/register', asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, college: req.user.college });
  if (!event) throw ApiError.notFound('Event not found');
  if (!event.registeredStudents.some((s) => String(s) === String(req.user._id))) {
    event.registeredStudents.push(req.user._id);
    await event.save();
  }
  res.json({ event, registered: true });
}));

// POST /api/events/:id/save
router.post('/:id/save', asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, college: req.user.college });
  if (!event) throw ApiError.notFound('Event not found');
  const idx = event.savedBy.findIndex((s) => String(s) === String(req.user._id));
  if (idx === -1) event.savedBy.push(req.user._id);
  else event.savedBy.splice(idx, 1);
  await event.save();
  res.json({ event, saved: idx === -1 });
}));

// PATCH /api/events/:id
router.patch('/:id', requireFaculty, asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');
  const allowed = ['title', 'description', 'category', 'date', 'startTime', 'endTime', 'location', 'organizer', 'registrationLink'];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) event[k] = req.body[k];
  });
  await event.save();
  res.json({ event });
}));

// DELETE /api/events/:id
router.delete('/:id', requireFaculty, asyncHandler(async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ message: 'Event deleted' });
}));

export default router;
