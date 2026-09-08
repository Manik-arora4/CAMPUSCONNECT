const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireRole, handleValidation, asyncHandler } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

// Enrich notices with creator info
async function enrichNotices(notices) {
  if (!notices.length) return notices;
  const creatorIds = [...new Set(notices.map(n => n.createdBy).filter(Boolean))];
  if (!creatorIds.length) return notices;
  const creators = await prisma.user.findMany({
    where: { id: { in: creatorIds } },
    select: { id: true, name: true, role: true }
  });
  const creatorMap = new Map(creators.map(c => [c.id, c]));
  return notices.map(n => ({
    ...n,
    createdBy: creatorMap.get(n.createdBy) || n.createdBy
  }));
}

router.get('/', asyncHandler(async (req, res) => {
  const where = { college: req.user.college };
  if (req.query.important === 'true') where.important = true;
  if (req.query.category) where.category = req.query.category;

  const notices = await prisma.notice.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 60
  });
  res.json({ notices: await enrichNotices(notices) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const notice = await prisma.notice.findFirst({
    where: { id: req.params.id, college: req.user.college }
  });
  if (!notice) return res.status(404).json({ error: 'Notice not found' });
  const [enriched] = await enrichNotices([notice]);
  res.json({ notice: enriched });
}));

router.post('/', requireRole('admin', 'faculty'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
], handleValidation, asyncHandler(async (req, res) => {
  const { title, content, category, important, expiryDate } = req.body;
  const notice = await prisma.notice.create({
    data: {
      college: req.user.college,
      title: title.trim(),
      content: content.trim(),
      category: category || 'general',
      important: important === 'true' || important === true,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      createdBy: req.user.id
    }
  });
  res.status(201).json({ notice });
}));

router.put('/:id', requireRole('admin', 'faculty'), asyncHandler(async (req, res) => {
  const notice = await prisma.notice.findFirst({
    where: { id: req.params.id, college: req.user.college }
  });
  if (!notice) return res.status(404).json({ error: 'Notice not found' });

  const allowed = ['title', 'content', 'category', 'important', 'expiryDate'];
  const updateData = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

  const updated = await prisma.notice.update({ where: { id: notice.id }, data: updateData });
  res.json({ notice: updated });
}));

router.delete('/:id', requireRole('admin', 'faculty'), asyncHandler(async (req, res) => {
  await prisma.notice.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Notice deleted' });
}));

module.exports = router;
