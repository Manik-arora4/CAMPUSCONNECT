const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { handleValidation, asyncHandler, JWT_SECRET } = require('../middleware/auth');

const router = Router();

async function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, college: user.college },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * POST /api/auth/register
 */
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['student', 'faculty', 'admin']).withMessage('Invalid role'),
], handleValidation, asyncHandler(async (req, res) => {
  const { name, email, password, role, college, phone } = req.body;

  // Check existing user
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: await hashPassword(password),
      role: role || 'student',
      college: college || null,
      phone: phone || '',
      emailVerified: false,
      approved: role === 'student', // auto-approve students
      active: true
    },
    select: { id: true, name: true, email: true, role: true, college: true, createdAt: true }
  });

  // Create student profile if role is student
  if (user.role === 'student') {
    await prisma.studentProfile.create({
      data: { user: user.id, college: college || null }
    });
  }

  const token = generateToken(user);
  res.status(201).json({ user, token });
}));

/**
 * POST /api/auth/login
 */
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
], handleValidation, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!user.active) {
    return res.status(403).json({ error: 'Account has been deactivated' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  const token = generateToken(user);
  const { password: _, ...safeUser } = user;

  res.json({ user: safeUser, token });
}));

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, name: true, email: true, role: true, college: true, avatar: true, phone: true, onboarded: true, designation: true, active: true }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get role-specific profile
  let profile = null;
  if (user.role === 'student') {
    profile = await prisma.studentProfile.findUnique({ where: { user: user.id } });
  } else if (user.role === 'faculty') {
    profile = await prisma.facultyProfile.findUnique({ where: { user: user.id } });
  }

  res.json({ user, profile });
}));

/**
 * PUT /api/auth/me
 * Update current user profile
 */
router.put('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const allowed = ['name', 'phone', 'avatar', 'college', 'onboarded'];
  const updateData = {};
  allowed.forEach(field => {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
  });

  const user = await prisma.user.update({
    where: { id: decoded.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, college: true, avatar: true, phone: true, onboarded: true }
  });

  res.json({ user });
}));

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email required'),
], handleValidation, asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (!user) {
    // Don't reveal if email exists
    return res.json({ message: 'If the email exists, a reset link has been sent' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry }
  });

  // In production, send email here
  res.json({ message: 'If the email exists, a reset link has been sent', resetToken });
}));

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], handleValidation, asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gte: new Date() }
    }
  });

  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await hashPassword(password),
      resetToken: null,
      resetTokenExpiry: null
    }
  });

  res.json({ message: 'Password reset successful' });
}));

module.exports = router;
