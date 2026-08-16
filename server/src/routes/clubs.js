import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireFaculty } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Club } from '../models/Club.js';

const router = Router();
router.use(auth);

// GET /api/clubs
router.get('/', asyncHandler(async (req, res) => {
  const clubs = await Club.find({ college: req.user.college }).sort({ name: 1 });
  const enriched = clubs.map((c) => {
    const obj = c.toObject();
    obj.isMember = c.members.some((m) => String(m) === String(req.user._id));
    obj.isFollowing = c.followers.some((f) => String(f) === String(req.user._id));
    return obj;
  });
  res.json({ clubs: enriched });
}));

// GET /api/clubs/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const club = await Club.findOne({ _id: req.params.id, college: req.user.college });
  if (!club) throw ApiError.notFound('Club not found');
  const obj = club.toObject();
  obj.isMember = club.members.some((m) => String(m) === String(req.user._id));
  obj.isFollowing = club.followers.some((f) => String(f) === String(req.user._id));
  res.json({ club: obj });
}));

// POST /api/clubs/:id/join
router.post('/:id/join', asyncHandler(async (req, res) => {
  const club = await Club.findOne({ _id: req.params.id, college: req.user.college });
  if (!club) throw ApiError.notFound('Club not found');
  if (!club.members.some((m) => String(m) === String(req.user._id))) club.members.push(req.user._id);
  await club.save();
  res.json({ club, isMember: true });
}));

// POST /api/clubs/:id/follow
router.post('/:id/follow', asyncHandler(async (req, res) => {
  const club = await Club.findOne({ _id: req.params.id, college: req.user.college });
  if (!club) throw ApiError.notFound('Club not found');
  const idx = club.followers.findIndex((f) => String(f) === String(req.user._id));
  if (idx === -1) club.followers.push(req.user._id);
  else club.followers.splice(idx, 1);
  await club.save();
  res.json({ club, isFollowing: idx === -1 });
}));

// POST /api/clubs — faculty/admin
router.post(
  '/',
  requireFaculty,
  [body('name').trim().notEmpty().withMessage('Name is required')],
  validate,
  asyncHandler(async (req, res) => {
    const { name, description, category, logo, facultyAdvisor } = req.body;
    const club = await Club.create({
      college: req.user.college,
      name: name.trim(),
      description: description || '',
      category: category || 'technical',
      logo: logo || '',
      facultyAdvisor: facultyAdvisor || '',
    });
    res.status(201).json({ club });
  })
);

// POST /api/clubs/:id/announcements
router.post('/:id/announcements', requireFaculty, asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) throw ApiError.notFound('Club not found');
  const { title, content } = req.body;
  club.announcements.unshift({ title: title || 'Announcement', content: content || '', date: new Date() });
  await club.save();
  res.json({ club });
}));

export default router;
