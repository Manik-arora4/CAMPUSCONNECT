import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body } from 'express-validator';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { College } from '../models/College.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { UserPreference } from '../models/UserPreference.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

async function ensureCollege(name) {
  if (!name) return null;
  const trimmed = name.trim();
  let college = await College.findOne({ name: trimmed });
  if (!college) college = await College.create({ name: trimmed, code: trimmed.slice(0, 6).toUpperCase().replace(/\s+/g, '_') });
  return college;
}

async function setupNewUser(user, extra) {
  await UserPreference.findOneAndUpdate({ user: user._id }, { $setOnInsert: { user: user._id } }, { upsert: true });
  if (user.role === 'student') {
    await StudentProfile.findOneAndUpdate(
      { user: user._id },
      {
        $setOnInsert: {
          user: user._id,
          college: user.college,
          course: extra?.course || '',
          semester: Number(extra?.semester) || 1,
          section: extra?.section || '',
        },
      },
      { upsert: true }
    );
  }
  await createNotification(user._id, {
    category: 'system',
    title: `Welcome to CAMPUSCONNECT, ${user.name.split(' ')[0]}! 👋`,
    message: 'Complete your profile and onboarding to unlock AI-powered recommendations.',
    link: '/onboarding',
    icon: 'sparkles',
    priority: 'medium',
  });
}

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password, college: collegeName, course, semester, section, role = 'student' } = req.body;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) throw ApiError.conflict('An account with this email already exists. Please log in.');

    const college = await ensureCollege(collegeName);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role,
      college: college?._id,
    });
    await setupNewUser(user, { course, semester, section });

    const token = signToken(user);
    res.status(201).json({ token, user: user.toSafeJSON(), onboarded: false });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  [body('email').isEmail().withMessage('Valid email is required'), body('password').notEmpty().withMessage('Password is required')],
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw ApiError.unauthorized('Invalid email or password.');
    }
    if (!user.active) throw ApiError.forbidden('This account has been deactivated.');
    user.lastLoginAt = new Date();
    await user.save();
    const token = signToken(user);
    res.json({ token, user: user.toSafeJSON(), onboarded: user.onboarded });
  })
);

// POST /api/auth/google — demo-friendly Google sign-in.
// In production, verify the id_token with Google's tokeninfo endpoint before trusting it.
router.post(
  '/google',
  [body('email').isEmail().withMessage('Valid email is required'), body('name').optional().trim()],
  validate,
  asyncHandler(async (req, res) => {
    const { email, name, college: collegeName, course, semester, section } = req.body;
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const college = await ensureCollege(collegeName);
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: crypto.randomBytes(24).toString('hex'),
        role: 'student',
        college: college?._id,
        emailVerified: true,
      });
      await setupNewUser(user, { course, semester, section });
    }
    user.lastLoginAt = new Date();
    await user.save();
    const token = signToken(user);
    res.json({ token, user: user.toSafeJSON(), onboarded: user.onboarded });
  })
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Do not reveal whether the account exists
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }
    user.resetToken = crypto.randomBytes(32).toString('hex');
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    // Demo: log the reset link (email delivery would be wired to an SMTP provider in production)
    console.log(`[auth] Password reset for ${email}: ${env.PUBLIC_URL}/reset-password?token=${user.resetToken}`);
    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  })
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [body('token').notEmpty().withMessage('Token is required'), body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
  validate,
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date() } });
    if (!user) throw ApiError.badRequest('This reset link is invalid or has expired.');
    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ message: 'Password updated. You can now log in.' });
  })
);

// GET /api/auth/verify-email/:token
router.get(
  '/verify-email/:token',
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) throw ApiError.badRequest('Invalid verification link.');
    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();
    res.json({ message: 'Email verified successfully.' });
  })
);

// GET /api/auth/me
router.get('/me', auth, asyncHandler(async (req, res) => {
  const profile = req.user.role === 'student' ? await StudentProfile.findOne({ user: req.user._id }).populate('resume') : null;
  res.json({ user: req.user.toSafeJSON(), studentProfile: profile });
}));

// POST /api/auth/logout
router.post('/logout', (req, res) => res.json({ message: 'Logged out' }));

export default router;
