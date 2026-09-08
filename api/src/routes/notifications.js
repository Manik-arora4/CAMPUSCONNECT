const { Router } = require('express');
const prisma = require('../lib/prisma');
const { authenticate, asyncHandler } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { user: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  const unread = notifications.filter(n => !n.read).length;
  res.json({ notifications, unread });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { id: req.params.id, user: req.user.id }, data: { read: true } });
  res.json({ ok: true });
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { user: req.user.id, read: false }, data: { read: true } });
  res.json({ ok: true });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.notification.deleteMany({ where: { id: req.params.id, user: req.user.id } });
  res.json({ ok: true });
}));

module.exports = router;
