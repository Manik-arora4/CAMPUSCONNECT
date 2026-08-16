import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireFaculty } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(auth);

// GET /api/clubs
router.get('/', asyncHandler(async (req, res) => {
  const clubs = await prisma.club.findMany({ where: { college: req.user.college }, orderBy: { name: 'asc' } });
  const enriched = clubs.map((c) => ({
    ...c,
    isMember: (c.members || []).some((m) => String(m) === String(req.user.id)),
    isFollowing: (c.followers || []).some((f) => String(f) === String(req.user.id)),
  }));
  res.json({ clubs: enriched });
}));

// GET /api/clubs/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const club = await prisma.club.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!club) throw ApiError.notFound('Club not found');
  res.json({
    club: {
      ...club,
      isMember: (club.members || []).some((m) => String(m) === String(req.user.id)),
      isFollowing: (club.followers || []).some((f) => String(f) === String(req.user.id)),
    },
  });
}));

// POST /api/clubs/:id/join
router.post('/:id/join', asyncHandler(async (req, res) => {
  const club = await prisma.club.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!club) throw ApiError.notFound('Club not found');
  const members = [...(club.members || [])];
  if (!members.some((m) => String(m) === String(req.user.id))) members.push(req.user.id);
  const updated = await prisma.club.update({ where: { id: club.id }, data: { members } });
  res.json({ club: updated, isMember: true });
}));

// POST /api/clubs/:id/follow
router.post('/:id/follow', asyncHandler(async (req, res) => {
  const club = await prisma.club.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!club) throw ApiError.notFound('Club not found');
  const followers = [...(club.followers || [])];
  const idx = followers.findIndex((f) => String(f) === String(req.user.id));
  if (idx === -1) followers.push(req.user.id);
  else followers.splice(idx, 1);
  const updated = await prisma.club.update({ where: { id: club.id }, data: { followers } });
  res.json({ club: updated, isFollowing: idx === -1 });
}));

// POST /api/clubs — faculty/admin
router.post(
  '/',
  requireFaculty,
  [body('name').trim().notEmpty().withMessage('Name is required')],
  validate,
  asyncHandler(async (req, res) => {
    const { name, description, category, logo, facultyAdvisor } = req.body;
    const club = await prisma.club.create({
      data: {
        college: req.user.college,
        name: name.trim(),
        description: description || '',
        category: category || 'technical',
        logo: logo || '',
        facultyAdvisor: facultyAdvisor || '',
      },
    });
    res.status(201).json({ club });
  })
);

// POST /api/clubs/:id/announcements
router.post('/:id/announcements', requireFaculty, asyncHandler(async (req, res) => {
  const club = await prisma.club.findUnique({ where: { id: req.params.id } });
  if (!club) throw ApiError.notFound('Club not found');
  const { title, content } = req.body;
  const announcements = [{ title: title || 'Announcement', content: content || '', date: new Date() }, ...(club.announcements || [])];
  const updated = await prisma.club.update({ where: { id: club.id }, data: { announcements } });
  res.json({ club: updated });
}));

export default router;
