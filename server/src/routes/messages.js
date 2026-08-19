import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();
router.use(auth);

// GET /api/messages/contacts — who you can message (same college, other role)
router.get('/contacts', asyncHandler(async (req, res) => {
  if (!req.user.college) return res.json({ contacts: [] });
  const otherRole = req.user.role === 'student' ? 'faculty' : req.user.role === 'faculty' ? 'student' : null;
  if (!otherRole) return res.json({ contacts: [] });
  const users = await prisma.user.findMany({
    where: { college: req.user.college, role: otherRole, active: true },
    select: { id: true, name: true, email: true, designation: true, role: true },
    orderBy: { name: 'asc' },
    take: 100,
  });
  res.json({ contacts: users });
}));

// GET /api/messages/conversations — grouped threads with last message + unread counts
router.get('/conversations', asyncHandler(async (req, res) => {
  const me = req.user.id;
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: me }, { receiverId: me }] },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  const convos = new Map();
  for (const m of messages) {
    const otherId = m.senderId === me ? m.receiverId : m.senderId;
    if (!convos.has(otherId)) {
      convos.set(otherId, { otherId, lastMessage: m.content, lastAt: m.createdAt, unread: 0 });
    }
    if (m.receiverId === me && !m.read) convos.get(otherId).unread++;
  }
  const ids = [...convos.keys()];
  const users = ids.length
    ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, designation: true, role: true } })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));
  const conversations = [...convos.values()]
    .map((c) => ({ ...c, _id: c.otherId, user: userMap.get(c.otherId) || null }))
    .filter((c) => c.user)
    .sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  res.json({ conversations });
}));

// GET /api/messages/:userId — full thread with another user (marks incoming as read)
router.get('/:userId', asyncHandler(async (req, res) => {
  const me = req.user.id;
  const other = await prisma.user.findUnique({
    where: { id: req.params.userId },
    select: { id: true, name: true, designation: true, role: true, email: true },
  });
  if (!other) throw ApiError.notFound('User not found');
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: me, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: me },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });
  await prisma.message.updateMany({
    where: { senderId: req.params.userId, receiverId: me, read: false },
    data: { read: true },
  });
  res.json({ user: other, messages });
}));

// POST /api/messages — send a message
router.post(
  '/',
  [
    body('receiverId').notEmpty().withMessage('Receiver is required'),
    body('content').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }).withMessage('Message is too long'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { receiverId, content } = req.body;
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) throw ApiError.notFound('User not found');
    if (receiver.id === req.user.id) throw ApiError.badRequest('You cannot message yourself');
    if (req.user.role !== 'admin' && receiver.college !== req.user.college) {
      throw ApiError.forbidden('You can only message people in your college');
    }
    const message = await prisma.message.create({
      data: { senderId: req.user.id, receiverId, content: content.trim() },
    });
    await createNotification(receiverId, {
      category: 'message',
      title: `${req.user.name.split(' ')[0]} messaged you`,
      message: content.trim().slice(0, 80),
      link: '/messages',
      icon: 'message',
      priority: 'medium',
    });
    res.status(201).json({ message });
  })
);

export default router;
