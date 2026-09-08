const { Router } = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireRole, asyncHandler } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/tickets', asyncHandler(async (req, res) => {
  const tickets = await prisma.supportTicket.findMany({
    where: { user: req.user.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ tickets });
}));

router.post('/tickets', asyncHandler(async (req, res) => {
  const { subject, category, description, priority } = req.body;
  if (!subject || !description) return res.status(400).json({ error: 'Subject and description required' });
  const ticket = await prisma.supportTicket.create({
    data: {
      user: req.user.id,
      subject,
      category: category || 'general',
      description,
      priority: priority || 'medium',
      userRole: req.user.role
    }
  });
  res.status(201).json({ ticket });
}));

router.get('/faq', asyncHandler(async (req, res) => {
  const faqs = await prisma.fAQ.findMany({ where: { active: true }, orderBy: { order: 'asc' } });
  res.json({ faqs });
}));

module.exports = router;
