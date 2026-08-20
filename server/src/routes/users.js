import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { prisma } from '../lib/prisma.js';
import { toSafeUser } from '../utils/userUtils.js';
import { profileStrength } from '../services/profileService.js';
import { upload } from '../utils/upload.js';
import fs from 'fs';
import path from 'path';
import { uploadsDirPath } from '../utils/upload.js';

const router = Router();
router.use(auth);

// GET /api/users/me
router.get('/me', asyncHandler(async (req, res) => {
  res.json({ user: toSafeUser(req.user) });
}));

// PATCH /api/users/me
router.patch(
  '/me',
  [body('name').optional().trim().isLength({ min: 2 }), body('phone').optional().trim(), body('avatar').optional().trim(), body('bio').optional().trim().isLength({ max: 500 })],
  validate,
  asyncHandler(async (req, res) => {
    const allowed = ['name', 'phone', 'avatar', 'bio', 'designation'];
    const data = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) data[k] = req.body[k];
    });
    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json({ user: toSafeUser(user) });
  })
);

// POST /api/users/avatar — upload profile picture
router.post('/avatar', upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) throw new Error('No file uploaded');
  // Delete old avatar file if exists
  if (req.user.avatar) {
    const oldPath = path.join(uploadsDirPath, req.user.avatar);
    try { fs.unlinkSync(oldPath); } catch { /* ignore */ }
  }
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { avatar: req.file.filename } });
  res.json({ user: toSafeUser(user), avatar: req.file.filename });
}));

// GET /api/users/profile-strength
router.get('/profile-strength', asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  if (!profile) return res.json({ score: 0, completed: [], missing: [] });
  res.json(profileStrength(profile));
}));

// GET /api/users/preferences
router.get('/preferences', asyncHandler(async (req, res) => {
  let pref = await prisma.userPreference.findUnique({ where: { user: req.user.id } });
  if (!pref) pref = await prisma.userPreference.create({ data: { user: req.user.id } });
  res.json(pref);
}));

// PATCH /api/users/preferences
router.patch('/preferences', asyncHandler(async (req, res) => {
  const { notifications, defaultView, weeklyDigest } = req.body;
  const data = {};
  if (notifications !== undefined) data.notifications = notifications;
  if (defaultView !== undefined) data.defaultView = defaultView;
  if (weeklyDigest !== undefined) data.weeklyDigest = weeklyDigest;
  const pref = await prisma.userPreference.upsert({
    where: { user: req.user.id },
    update: data,
    create: { user: req.user.id, ...data },
  });
  res.json(pref);
}));

export default router;
