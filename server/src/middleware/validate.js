import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  throw ApiError.badRequest('Validation failed', details);
}

export const EMAIL = 'isEmail';
export const requiredString = (field) => `${field} is required`;
