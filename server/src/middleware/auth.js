import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const auth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized('Authentication required. Please log in.');

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw ApiError.unauthorized('Session expired or invalid. Please log in again.');
  }

  const user = await User.findById(payload.id);
  if (!user) throw ApiError.unauthorized('Account not found.');
  if (!user.active) throw ApiError.forbidden('This account has been deactivated.');

  req.user = user;
  req.token = token;
  next();
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (user && user.active) req.user = user;
  } catch {
    /* ignore */
  }
  next();
});
