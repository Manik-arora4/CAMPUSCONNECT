import { Router } from 'express';
import { auth, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { College } from '../models/College.js';
import { Notice } from '../models/Notice.js';
import { Event } from '../models/Event.js';
import { Club } from '../models/Club.js';
import { User } from '../models/User.js';
import { Subject } from '../models/Subject.js';

const router = Router();

// GET /api/colleges?search=
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { search } = req.query;
  const q = search ? { name: { $regex: search, $options: 'i' } } : {};
  const colleges = await College.find(q).sort({ name: 1 }).limit(30);
  res.json({ colleges });
}));

// GET /api/colleges/my — college ecosystem data for the logged-in user
router.get('/my', auth, asyncHandler(async (req, res) => {
  if (!req.user.college) return res.json({ college: null, counts: {} });
  const college = await College.findById(req.user.college);
  if (!college) return res.json({ college: null, counts: {} });
  const [notices, events, clubs, faculty, subjects] = await Promise.all([
    Notice.find({ college: college._id }).sort({ date: -1 }).limit(20),
    Event.find({ college: college._id, date: { $gte: new Date() } }).sort({ date: 1 }).limit(20),
    Club.find({ college: college._id }).sort({ name: 1 }),
    User.find({ college: college._id, role: 'faculty' }).select('name email designation').limit(50),
    Subject.find({ college: college._id }).select('name code semester faculty').limit(100),
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
