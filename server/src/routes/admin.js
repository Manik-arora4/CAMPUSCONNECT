import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';
import { College } from '../models/College.js';
import { Department } from '../models/Department.js';
import { Subject } from '../models/Subject.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { Opportunity } from '../models/Opportunity.js';
import { Application } from '../models/Application.js';
import { Notice } from '../models/Notice.js';
import { Event } from '../models/Event.js';
import { Club } from '../models/Club.js';
import { RecommendationEvent } from '../models/RecommendationEvent.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();
router.use(auth, requireAdmin);

// GET /api/admin/analytics — enterprise overview
router.get('/analytics', asyncHandler(async (req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const [students, faculty, colleges, opportunities, applications, notices, events, clubs, activeUsers, eventsWeek, applicationsWeek] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'faculty' }),
    College.countDocuments(),
    Opportunity.countDocuments(),
    Application.countDocuments(),
    Notice.countDocuments(),
    Event.countDocuments(),
    Club.countDocuments(),
    User.countDocuments({ lastLoginAt: { $gte: weekAgo } }),
    RecommendationEvent.countDocuments({ createdAt: { $gte: weekAgo } }),
    Application.countDocuments({ updatedAt: { $gte: weekAgo } }),
  ]);
  const oppByStatus = await Opportunity.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const appByStatus = await Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const oppByCategory = await Opportunity.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  const engagementByDay = await RecommendationEvent.aggregate([
    { $match: { createdAt: { $gte: weekAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.json({
    totals: { students, faculty, colleges, opportunities, notices, events, clubs, applications },
    engagement: { activeUsers, eventsWeek, applicationsWeek },
    oppByStatus,
    appByStatus,
    oppByCategory,
    engagementByDay,
  });
}));

// ---------------- Students ----------------
router.get('/students', asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 15 } = req.query;
  const filter = { role: 'student' };
  if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .populate('college', 'name')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  const userIds = users.map((u) => u._id);
  const profiles = await StudentProfile.find({ user: { $in: userIds } });
  const profileMap = new Map(profiles.map((p) => [String(p.user), p]));
  res.json({
    students: users.map((u) => ({ ...u.toSafeJSON(), profile: profileMap.get(String(u._id)) })),
    total,
    page: Number(page),
  });
}));

router.patch('/students/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Student not found');
  if (req.body.active !== undefined) user.active = req.body.active;
  if (req.body.role) user.role = req.body.role;
  if (req.body.college) user.college = req.body.college;
  await user.save();
  res.json({ user: user.toSafeJSON() });
}));

router.delete('/students/:id', asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  await StudentProfile.deleteOne({ user: req.params.id });
  res.json({ message: 'Student deleted' });
}));

// ---------------- Faculty ----------------
router.get('/faculty', asyncHandler(async (req, res) => {
  const faculty = await User.find({ role: 'faculty' }).populate('college', 'name').sort({ name: 1 });
  res.json({ faculty: faculty.map((f) => f.toSafeJSON()) });
}));

router.post(
  '/faculty',
  [body('name').trim().notEmpty().withMessage('Name is required'), body('email').isEmail().withMessage('Valid email required')],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password = 'faculty1234', designation, college } = req.body;
    if (await User.findOne({ email: email.toLowerCase() })) throw ApiError.conflict('User with this email already exists');
    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), password, role: 'faculty', designation: designation || '', college: college || req.user.college });
    res.status(201).json({ user: user.toSafeJSON() });
  })
);

router.patch('/faculty/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Faculty not found');
  if (req.body.designation !== undefined) user.designation = req.body.designation;
  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.active !== undefined) user.active = req.body.active;
  await user.save();
  res.json({ user: user.toSafeJSON() });
}));

router.delete('/faculty/:id', asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Faculty deleted' });
}));

// ---------------- Departments ----------------
router.get('/departments', asyncHandler(async (req, res) => {
  const departments = await Department.find({ college: req.user.college }).populate('head', 'name');
  res.json({ departments });
}));

router.post('/departments', asyncHandler(async (req, res) => {
  const { name, code, head } = req.body;
  const dep = await Department.create({ college: req.user.college, name, code, head });
  res.status(201).json({ department: dep });
}));

router.patch('/departments/:id', asyncHandler(async (req, res) => {
  const dep = await Department.findById(req.params.id);
  if (!dep) throw ApiError.notFound('Department not found');
  if (req.body.name !== undefined) dep.name = req.body.name;
  if (req.body.head !== undefined) dep.head = req.body.head;
  await dep.save();
  res.json({ department: dep });
}));

router.delete('/departments/:id', asyncHandler(async (req, res) => {
  await Department.findByIdAndDelete(req.params.id);
  res.json({ message: 'Department deleted' });
}));

// ---------------- Subjects ----------------
router.get('/subjects', asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ college: req.user.college }).populate('faculty', 'name');
  res.json({ subjects });
}));

router.post('/subjects', asyncHandler(async (req, res) => {
  const { name, code, semester, faculty, department, credits } = req.body;
  const subject = await Subject.create({ college: req.user.college, name, code, semester: Number(semester) || 1, faculty, department, credits });
  res.status(201).json({ subject });
}));

router.patch('/subjects/:id', asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw ApiError.notFound('Subject not found');
  const allowed = ['name', 'code', 'semester', 'faculty', 'department', 'credits'];
  allowed.forEach((k) => { if (req.body[k] !== undefined) subject[k] = req.body[k]; });
  await subject.save();
  res.json({ subject });
}));

router.delete('/subjects/:id', asyncHandler(async (req, res) => {
  await Subject.findByIdAndDelete(req.params.id);
  res.json({ message: 'Subject deleted' });
}));

// ---------------- Colleges ----------------
router.get('/colleges', asyncHandler(async (req, res) => {
  const colleges = await College.find().sort({ name: 1 });
  res.json({ colleges });
}));

router.post('/colleges', asyncHandler(async (req, res) => {
  const { name, code, city, state, website, contactEmail, contactPhone } = req.body;
  const college = await College.create({ name, code, city, state, website, contactEmail, contactPhone });
  res.status(201).json({ college });
}));

// ---------------- Opportunity moderation ----------------
router.get('/pending-opportunities', asyncHandler(async (req, res) => {
  const opportunities = await Opportunity.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(50);
  res.json({ opportunities });
}));

// ---------------- Engagement broadcast ----------------
router.post('/broadcast', asyncHandler(async (req, res) => {
  const { title, message, category = 'college', link = '' } = req.body;
  if (!title || !message) throw ApiError.badRequest('title and message are required');
  const students = await User.find({ role: 'student' }).distinct('_id');
  await Promise.all(students.map((s) => createNotification(s, { category, title, message, link, icon: 'megaphone', priority: 'high' })));
  res.json({ message: `Broadcast sent to ${students.length} students` });
}));

export default router;
