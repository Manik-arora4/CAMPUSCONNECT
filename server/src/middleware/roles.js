import { ApiError } from '../utils/ApiError.js';

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) throw ApiError.unauthorized();
  if (!roles.includes(req.user.role)) {
    throw ApiError.forbidden('You do not have permission to perform this action.');
  }
  next();
};

export const requireStudent = requireRole('student');
export const requireFaculty = requireRole('faculty', 'admin');
export const requireAdmin = requireRole('admin');
