const { Router } = require('express');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireRole, handleValidation, asyncHandler } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const { category, mode, status, search, deadline } = req.query;
  const where = {};
  if (category) where.category = category;
  if (mode) where.mode = mode;
  if (status) where.status = status;
  else where.status = 'verified';
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { organization: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (deadline === 'soon') where.deadline = { gte: new Date(), lte: new Date(Date.now() + 7 * 864e5) };

  const opportunities = await prisma.opportunity.findMany({
    where,
    orderBy: { deadline: 'asc' },
    take: 60
  });
  res.json({ opportunities });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const opportunity = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
  // Check if user has applied
  const application = await prisma.application.findFirst({
    where: { student: req.user.id, opportunity: opportunity.id }
  });
  res.json({ opportunity, application });
}));

router.post('/', requireRole('admin'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('organization').trim().notEmpty().withMessage('Organization is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('deadline').isISO8601().withMessage('Valid deadline required'),
], handleValidation, asyncHandler(async (req, res) => {
  const opportunity = await prisma.opportunity.create({
    data: {
      ...req.body,
      title: req.body.title.trim(),
      organization: req.body.organization.trim(),
      deadline: new Date(req.body.deadline),
      status: 'pending',
      createdBy: req.user.id
    }
  });
  res.status(201).json({ opportunity });
}));

router.patch('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const opportunity = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
  const allowed = ['title', 'organization', 'category', 'description', 'skillsRequired', 'location', 'mode', 'stipend', 'deadline', 'status', 'applyLink', 'requirements'];
  const data = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
  const updated = await prisma.opportunity.update({ where: { id: opportunity.id }, data });
  res.json({ opportunity: updated });
}));

router.post('/:id/apply', asyncHandler(async (req, res) => {
  const opportunity = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });

  const existing = await prisma.application.findFirst({
    where: { student: req.user.id, opportunity: opportunity.id }
  });
  if (existing) return res.status(400).json({ error: 'Already applied' });

  const application = await prisma.application.create({
    data: {
      student: req.user.id,
      opportunity: opportunity.id,
      status: 'applied',
      appliedDate: new Date(),
      timeline: [{ status: 'applied', at: new Date() }]
    }
  });
  res.status(201).json({ application });
}));

router.post('/:id/save', asyncHandler(async (req, res) => {
  const opportunity = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });

  const existing = await prisma.application.findFirst({
    where: { student: req.user.id, opportunity: opportunity.id }
  });
  if (existing) {
    await prisma.application.update({ where: { id: existing.id }, data: { status: 'saved' } });
  } else {
    await prisma.application.create({
      data: { student: req.user.id, opportunity: opportunity.id, status: 'saved' }
    });
  }
  res.json({ saved: true });
}));

module.exports = router;
