import { Router } from 'express';
import { auth, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /api/colleges?search=
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { search } = req.query;
  const where = search ? { name: { contains: search, mode: 'insensitive' } } : {};
  const colleges = await prisma.college.findMany({ where, orderBy: { name: 'asc' }, take: 30 });
  res.json({ colleges });
}));

// GET /api/colleges/my — college ecosystem data for the logged-in user
router.get('/my', auth, asyncHandler(async (req, res) => {
  if (!req.user.college) return res.json({ college: null, counts: {} });
  const college = await prisma.college.findUnique({ where: { id: req.user.college } });
  if (!college) return res.json({ college: null, counts: {} });
  const [notices, events, clubs, faculty, subjects] = await Promise.all([
    prisma.notice.findMany({ where: { college: college.id }, orderBy: { date: 'desc' }, take: 20 }),
    prisma.event.findMany({ where: { college: college.id, date: { gte: new Date() } }, orderBy: { date: 'asc' }, take: 20 }),
    prisma.club.findMany({ where: { college: college.id }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { college: college.id, role: 'faculty' }, select: { id: true, name: true, email: true, designation: true }, take: 50 }),
    prisma.subject.findMany({ where: { college: college.id }, select: { id: true, name: true, code: true, semester: true, faculty: true }, take: 100 }),
  ]);
  res.json({
    college,
    counts: { notices: notices.length, events: events.length, clubs: clubs.length, faculty: faculty.length, subjects: subjects.length },
    notices,
    events,
    clubs,
    faculty,
    subjects,
  });
}));

export default router;
