import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Notification } from '../models/Notification.js';

const router = Router();
router.use(auth);

// GET /api/notifications?page=&limit=&category=&unread=
router.get('/', asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const filter = { user: req.user._id };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.unread === 'true') filter.read = false;
  const total = await Notification.countDocuments(filter);
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  res.json({ notifications, total, page, limit });
}));

// GET /api/notifications/unread-count
router.get('/unread-count', asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ count });
}));

// PATCH /api/notifications/:id/read
router.patch('/:id/read', asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notif) throw ApiError.notFound('Notification not found');
  res.json({ notification: notif });
}));

// POST /api/notifications/read-all
router.post('/read-all', asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: 'All notifications marked as read' });
}));

// DELETE /api/notifications/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ message: 'Notification deleted' });
}));

export default router;
