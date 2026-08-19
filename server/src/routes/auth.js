import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body } from 'express-validator';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword, comparePassword, toSafeUser } from '../utils/userUtils.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

async function ensureCollege(name) {
  if (!name) return null;
  const trimmed = name.trim();
  let college = await prisma.college.findFirst({ where: { name: trimmed } });
  if (!college) {
    college = await prisma.college.create({
      data: { name: trimmed, code: trimmed.slice(0, 6).toUpperCase().replace(/\s+/g, '_') },
    });
  }
  return college;
}

async function setupNewUser(user, extra) {
  await prisma.userPreference.upsert({
    where: { user: user.id },
    update: {},
    create: { user: user.id },
  });
  if (user.role === 'student') {
    await prisma.studentProfile.upsert({
      where: { user: user.id },
      update: {},
      create: {
        user: user.id,
        college: user.college,
        degree: extra?.degree || '',
        course: extra?.course || '',
        semester: Number(extra?.semester) || 1,
        year: Number(extra?.year) || 1,
        section: extra?.section || '',
      },
    });
  }
  if (user.role === 'faculty') {
    await prisma.facultyProfile.upsert({
      where: { user: user.id },
      update: {},
      create: {
        user: user.id,
        college: user.college,
        employeeId: extra?.employeeId || '',
        department: extra?.department || '',
        designation: extra?.designation || '',
        subjects: extra?.subjects || [],
        classes: extra?.classes || [],
      },
    });
  }
  await createNotification(user.id, {
    category: 'system',
    title: `Welcome to CAMPUSCONNECT, ${user.name.split(' ')[0]}! 👋`,
    message: user.role === 'student'
      ? 'Complete your profile and onboarding to unlock AI-powered recommendations.'
      : user.role === 'faculty'
        ? 'Set up your faculty profile to manage classes and assignments.'
        : 'Admin access approved. Manage your campus from the dashboard.',
    link: user.role === 'student' ? '/profile' : '/dashboard',
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
    body('role').isIn(['student', 'faculty', 'admin']).withMessage('Role must be student, faculty, or admin'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const {
      name, email, password, college: collegeName, role = 'student',
      // Student fields
      degree, course, semester, year, section,
      // Faculty fields
      employeeId, department, designation, subjects, classes,
      // Admin fields
      inviteCode,
    } = req.body;
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) throw ApiError.conflict('An account with this email already exists. Please log in.');

    // Admin registration requires a valid invite code
    if (role === 'admin') {
      const validCode = process.env.ADMIN_INVITE_CODE || 'CAMPUS-ADMIN-2026';
      if (inviteCode !== validCode) {
        throw ApiError.forbidden('Invalid admin invite code. Admin registration requires authorization.');
      }
    }

    const college = await ensureCollege(collegeName);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: await hashPassword(password),
        role,
        college: college?.id,
        approved: role === 'student' ? true : false, // students auto-approved, faculty/admin need approval
      },
    });
    await setupNewUser(user, { degree, course, semester, year, section, employeeId, department, designation, subjects, classes });

    const token = signToken(user);
    res.status(201).json({ token, user: toSafeUser(user), onboarded: false });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  [body('email').isEmail().withMessage('Valid email is required'), body('password').notEmpty().withMessage('Password is required')],
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await comparePassword(password, user.password))) {
      throw ApiError.unauthorized('Invalid email or password.');
    }
    if (!user.active) throw ApiError.forbidden('This account has been deactivated.');
    if ((user.role === 'faculty' || user.role === 'admin') && !user.approved) {
      throw ApiError.forbidden('Your account is pending admin approval. Please contact your college administrator.');
    }
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = signToken(user);
    res.json({ token, user: toSafeUser(user), onboarded: user.onboarded });
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
    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      const college = await ensureCollege(collegeName);
      user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          password: await hashPassword(crypto.randomBytes(24).toString('hex')),
          role: 'student',
          college: college?.id,
          emailVerified: true,
        },
      });
      await setupNewUser(user, { course, semester, section });
    }
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = signToken(user);
    res.json({ token, user: toSafeUser(user), onboarded: user.onboarded });
  })
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Do not reveal whether the account exists
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) },
    });
    // Demo: log the reset link (email delivery would be wired to an SMTP provider in production)
    console.log(`[auth] Password reset for ${email}: ${env.PUBLIC_URL}/reset-password?token=${resetToken}`);
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
    const user = await prisma.user.findFirst({ where: { resetToken: token, resetTokenExpiry: { gt: new Date() } } });
    if (!user) throw ApiError.badRequest('This reset link is invalid or has expired.');
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(password), resetToken: null, resetTokenExpiry: null },
    });
    res.json({ message: 'Password updated. You can now log in.' });
  })
);

// GET /api/auth/verify-email/:token
router.get(
  '/verify-email/:token',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findFirst({ where: { verificationToken: req.params.token } });
    if (!user) throw ApiError.badRequest('Invalid verification link.');
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, verificationToken: null } });
    res.json({ message: 'Email verified successfully.' });
  })
);

// GET /api/auth/me
router.get('/me', auth, asyncHandler(async (req, res) => {
  let profile = null;
  if (req.user.role === 'student') {
    profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
    if (profile?.resume) {
      const resume = await prisma.resume.findUnique({ where: { id: profile.resume } });
      if (resume) profile.resume = resume;
    }
  } else if (req.user.role === 'faculty') {
    profile = await prisma.facultyProfile.findFirst({ where: { user: req.user.id } });
  }
  res.json({ user: toSafeUser(req.user), studentProfile: profile });
}));

// POST /api/auth/logout
router.post('/logout', (req, res) => res.json({ message: 'Logged out' }));

export default router;
