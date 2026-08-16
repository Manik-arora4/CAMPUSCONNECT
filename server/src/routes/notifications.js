import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(auth);

// GET /api/notifications?page=&limit=&category=&unread=
router.get('/', asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const where = { user: req.user.id };
  if (req.query.category) where.category = req.query.category;
  if (req.query.unread === 'true') where.read = false;
  const total = await prisma.notification.count({ where });
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });
  res.json({ notifications, total, page, limit });
}));

// GET /api/notifications/unread-count
router.get('/unread-count', asyncHandler(async (req, res) => {
  const count = await prisma.notification.count({ where: { user: req.user.id, read: false } });
  res.json({ count });
}));

// PATCH /api/notifications/:id/read
router.patch('/:id/read', asyncHandler(async (req, res) => {
  const res2 = await prisma.notification.updateMany({ where: { id: req.params.id, user: req.user.id }, data: { read: true } });
  if (!res2.count) throw ApiError.notFound('Notification not found');
  const notif = await prisma.notification.findUnique({ where: { id: req.params.id } });
  res.json({ notification: notif });
}));

// POST /api/notifications/read-all
router.post('/read-all', asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { user: req.user.id, read: false }, data: { read: true } });
  res.json({ message: 'All notifications marked as read' });
}));

// DELETE /api/notifications/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.notification.deleteMany({ where: { id: req.params.id, user: req.user.id } });
  res.json({ message: 'Notification deleted' });
}));

export default router;
