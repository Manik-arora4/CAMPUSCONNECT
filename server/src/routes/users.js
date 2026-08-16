import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UserPreference } from '../models/UserPreference.js';
import { profileStrength } from '../services/profileService.js';
import { StudentProfile } from '../models/StudentProfile.js';

const router = Router();
router.use(auth);

// GET /api/users/me
router.get('/me', asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
}));

// PATCH /api/users/me
router.patch(
  '/me',
  [body('name').optional().trim().isLength({ min: 2 }), body('phone').optional().trim(), body('avatar').optional().trim(), body('bio').optional().trim().isLength({ max: 500 })],
  validate,
  asyncHandler(async (req, res) => {
    const allowed = ['name', 'phone', 'avatar', 'bio', 'designation'];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) req.user[k] = req.body[k];
    });
    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  })
);

// GET /api/users/profile-strength
router.get('/profile-strength', asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id });
  if (!profile) return res.json({ score: 0, completed: [], missing: [] });
  res.json(profileStrength(profile));
}));

// GET /api/users/preferences
router.get('/preferences', asyncHandler(async (req, res) => {
  let pref = await UserPreference.findOne({ user: req.user._id });
  if (!pref) pref = await UserPreference.create({ user: req.user._id });
  res.json(pref);
}));

// PATCH /api/users/preferences
router.patch('/preferences', asyncHandler(async (req, res) => {
  const pref = await UserPreference.findOneAndUpdate(
    { user: req.user._id },
    { $set: req.body },
    { new: true, upsert: true }
  );
  res.json(pref);
}));

export default router;
