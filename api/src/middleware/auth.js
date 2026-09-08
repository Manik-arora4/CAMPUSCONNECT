const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'campusconnect-secret-key';

/**
 * Extract user from JWT token in Authorization header
 */
function extractUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Authentication middleware — requires valid JWT
 * Sets req.user with decoded token payload
 */
async function authenticate(req, res, next) {
  const payload = extractUser(req);
  if (!payload) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Fetch fresh user data
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, name: true, email: true, role: true, college: true, active: true, onboarded: true, approved: true }
  });

  if (!user || !user.active) {
    return res.status(401).json({ error: 'Account not found or deactivated' });
  }

  req.user = user;
  next();
}

/**
 * Role-based access control middleware
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'faculty', 'student')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * College access middleware — ensures user belongs to a college
 */
function requireCollege(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!req.user.college) {
    return res.status(400).json({ error: 'No college assigned. Please complete profile setup.' });
  }
  next();
}

/**
 * Faculty access middleware — requires faculty role + completed setup
 */
async function requireFaculty(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Faculty access required' });
  }
  if (!req.user.college) {
    return res.status(400).json({ error: 'No college assigned. Complete profile setup first.' });
  }
  next();
}

/**
 * Validation error handler for express-validator
 */
function handleValidation(req, res, next) {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

/**
 * Async route wrapper — catches errors and forwards to Express error handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  authenticate,
  requireRole,
  requireCollege,
  requireFaculty,
  handleValidation,
  asyncHandler,
  JWT_SECRET,
  extractUser
};
