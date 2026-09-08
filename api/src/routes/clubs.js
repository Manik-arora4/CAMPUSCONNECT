const { Router } = require('express');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireRole, handleValidation, asyncHandler } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const clubs = await prisma.club.findMany({
    where: { college: req.user.college },
    orderBy: { name: 'asc' }
  });
  const enriched = clubs.map(c => ({
    ...c,
    isMember: (c.members || []).some(id => String(id) === String(req.user.id)),
    isFollower: (c.followers || []).some(id => String(id) === String(req.user.id))
  }));
  res.json({ clubs: enriched });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const club = await prisma.club.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!club) return res.status(404).json({ error: 'Club not found' });
  res.json({
    club: {
      ...club,
      isMember: (club.members || []).some(id => String(id) === String(req.user.id)),
      isFollower: (club.followers || []).some(id => String(id) === String(req.user.id))
    }
  });
}));

router.post('/', requireRole('admin', 'faculty'), [
  body('name').trim().notEmpty().withMessage('Club name is required'),
], handleValidation, asyncHandler(async (req, res) => {
  const { name, description, category, logo, facultyAdvisor } = req.body;
  const club = await prisma.club.create({
    data: {
      college: req.user.college,
      name: name.trim(),
      description: description || '',
      category: category || 'technical',
      logo: logo || '',
      facultyAdvisor: facultyAdvisor || '',
      members: [req.user.id]
    }
  });
  res.status(201).json({ club });
}));

router.post('/:id/join', asyncHandler(async (req, res) => {
  const club = await prisma.club.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!club) return res.status(404).json({ error: 'Club not found' });
  const members = club.members || [];
  if (!members.some(id => String(id) === String(req.user.id))) {
    members.push(req.user.id);
  }
  const updated = await prisma.club.update({ where: { id: club.id }, data: { members } });
  res.json({ club: updated, isMember: true });
}));

router.post('/:id/leave', asyncHandler(async (req, res) => {
  const club = await prisma.club.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!club) return res.status(404).json({ error: 'Club not found' });
  const members = (club.members || []).filter(id => String(id) !== String(req.user.id));
  const updated = await prisma.club.update({ where: { id: club.id }, data: { members } });
  res.json({ club: updated, isMember: false });
}));

router.post('/:id/follow', asyncHandler(async (req, res) => {
  const club = await prisma.club.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!club) return res.status(404).json({ error: 'Club not found' });
  const followers = club.followers || [];
  const idx = followers.findIndex(id => String(id) === String(req.user.id));
  idx === -1 ? followers.push(req.user.id) : followers.splice(idx, 1);
  const updated = await prisma.club.update({ where: { id: club.id }, data: { followers } });
  res.json({ club: updated, isFollower: idx === -1 });
}));

router.delete('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  await prisma.club.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Club deleted' });
}));

module.exports = router;
