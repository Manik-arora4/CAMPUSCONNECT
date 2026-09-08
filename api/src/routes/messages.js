const { Router } = require('express');
const prisma = require('../lib/prisma');
const { authenticate, asyncHandler } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: req.user.id }, { receiverId: req.user.id }] },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json({ messages });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;
  if (!receiverId || !content) return res.status(400).json({ error: 'receiverId and content required' });
  const message = await prisma.message.create({
    data: { senderId: req.user.id, receiverId, content }
  });
  res.status(201).json({ message });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  await prisma.message.updateMany({ where: { id: req.params.id, receiverId: req.user.id }, data: { read: true } });
  res.json({ ok: true });
}));

module.exports = router;
