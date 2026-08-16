import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireStudent } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { User } from '../models/User.js';
import { TimetableSlot } from '../models/TimetableSlot.js';
import { Attendance } from '../models/Attendance.js';
import { Task } from '../models/Task.js';
import { Assignment } from '../models/Assignment.js';
import { Exam } from '../models/Exam.js';
import { Notice } from '../models/Notice.js';
import { Event } from '../models/Event.js';
import { Opportunity } from '../models/Opportunity.js';
import { Application } from '../models/Application.js';
import { AIPlan } from '../models/AIPlan.js';
import { aiService } from '../services/ai/index.js';
import { buildAttendanceReport } from '../services/attendanceService.js';
import { rankOpportunities } from '../services/matchingEngine.js';
import { groupDeadlines } from '../services/deadlineEngine.js';
import { startOfToday, timeToMinutes, daysBetween } from '../utils/helpers.js';

const router = Router();
router.use(auth, requireStudent);

async function gatherContext(userId) {
  const [profile, user] = await Promise.all([
    StudentProfile.findOne({ user: userId }),
    User.findById(userId).select('name'),
  ]);
  const collegeId = profile?.college;
  const today = new Date();
  const [slots, attendanceRecords, tasks, assignments, exams, notices, events, opportunities] = await Promise.all([
    TimetableSlot.find({ student: userId }),
    Attendance.find({ student: userId }),
    Task.find({ user: userId }).sort({ createdAt: -1 }),
    collegeId ? Assignment.find({ college: collegeId, semester: profile?.semester }).sort({ dueDate: 1 }) : [],
    collegeId ? Exam.find({ college: collegeId, semester: profile?.semester, date: { $gte: new Date() } }).sort({ date: 1 }) : [],
    collegeId ? Notice.find({ college: collegeId }).sort({ date: -1 }).limit(5) : [],
    collegeId ? Event.find({ college: collegeId, date: { $gte: new Date() } }).sort({ date: 1 }).limit(5) : [],
    Opportunity.find({ status: 'verified', deadline: { $gte: new Date() } }).limit(60).lean(),
  ]);

  const groups = {};
  for (const r of attendanceRecords) (groups[r.subjectName] = groups[r.subjectName] || []).push(r);
  const attendance = buildAttendanceReport(groups);

  const deadlineItems = [];
  assignments.forEach((a) => {
    if (a.dueDate >= new Date(Date.now() - 86400000)) deadlineItems.push({ label: `Assignment: ${a.title}`, date: a.dueDate });
  });
  exams.forEach((e) => deadlineItems.push({ label: `Exam: ${e.title}`, date: e.date }));
  tasks.filter((t) => t.status !== 'done' && t.dueDate).forEach((t) => deadlineItems.push({ label: `Task: ${t.title}`, date: t.dueDate }));
  const deadlines = groupDeadlines(deadlineItems);
  const allDeadlines = [...deadlines.overdue, ...deadlines.today, ...deadlines.tomorrow, ...deadlines.week, ...deadlines.later].slice(0, 8);

  const ranked = profile ? rankOpportunities(profile, opportunities, 5) : [];

  return {
    profile,
    student: { name: user?.name, course: profile?.course, semester: profile?.semester },
    timetable: slots,
    attendance: { overall: attendance.overall, trend: attendance.trend },
    tasks: tasks.slice(0, 5),
    deadlines: allDeadlines,
    opportunities: ranked,
    notices: notices.slice(0, 3),
    events: events.slice(0, 3),
  };
}

// POST /api/ai/chat — context-aware AI agent
router.post(
  '/chat',
  [body('message').trim().notEmpty().withMessage('Message is required')],
  validate,
  asyncHandler(async (req, res) => {
    const ctx = await gatherContext(req.user._id);
    const result = await aiService.chat(req.body.message, ctx);
    res.json(result);
  })
);

// POST /api/ai/daily-plan — generate today's plan
router.post(
  '/daily-plan',
  [body('date').optional().isISO8601()],
  validate,
  asyncHandler(async (req, res) => {
    const date = req.body.date ? new Date(req.body.date) : new Date();
    date.setHours(0, 0, 0, 0);
    const ctx = await gatherContext(req.user._id);
    const topOpportunity = ctx.opportunities?.[0];
    const attendanceWarning = ctx.attendance?.overall?.total > 0 && ctx.attendance.overall.health !== 'safe';
    const planData = await aiService.dailyPlan({
      date: date.toISOString().slice(0, 10),
      timetable: ctx.timetable,
      tasks: ctx.tasks,
      deadlines: ctx.deadlines,
      topOpportunity: topOpportunity ? { ...topOpportunity.opportunity, score: topOpportunity.score } : null,
      attendanceWarning,
    });
    const plan = await AIPlan.findOneAndUpdate(
      { student: req.user._id, date },
      { $set: { items: planData.items, summary: planData.summary, source: 'daily' } },
      { new: true, upsert: true }
    );
    res.json({ plan, fromAI: planData.fromAI === true });
  })
);

// GET /api/ai/daily-plan — today's plan
router.get('/daily-plan', asyncHandler(async (req, res) => {
  const date = startOfToday();
  let plan = await AIPlan.findOne({ student: req.user._id, date });
  if (!plan) {
    // auto-generate lazily
    const ctx = await gatherContext(req.user._id);
    const topOpportunity = ctx.opportunities?.[0];
    const planData = await aiService.dailyPlan({
      date: date.toISOString().slice(0, 10),
      timetable: ctx.timetable,
      tasks: ctx.tasks,
      deadlines: ctx.deadlines,
      topOpportunity: topOpportunity ? { ...topOpportunity.opportunity, score: topOpportunity.score } : null,
      attendanceWarning: ctx.attendance?.overall?.total > 0 && ctx.attendance.overall.health !== 'safe',
    });
    plan = await AIPlan.create({ student: req.user._id, date, items: planData.items, summary: planData.summary });
  }
  res.json({ plan });
}));

// PATCH /api/ai/daily-plan/:id — accept / edit / complete / snooze / dismiss items
router.patch('/daily-plan/:id', asyncHandler(async (req, res) => {
  const plan = await AIPlan.findOne({ _id: req.params.id, student: req.user._id });
  if (!plan) throw ApiError.notFound('Plan not found');
  if (req.body.accepted !== undefined) plan.accepted = req.body.accepted;
  if (req.body.summary !== undefined) plan.summary = req.body.summary;
  if (Array.isArray(req.body.items)) plan.items = req.body.items;
  if (req.body.itemIndex !== undefined && req.body.status) {
    const idx = Number(req.body.itemIndex);
    if (plan.items[idx]) {
      if (req.body.status === 'snoozed') {
        plan.items.splice(idx, 1); // remove from today's plan
      } else {
        plan.items[idx].status = req.body.status;
      }
    }
  }
  await plan.save();
  res.json({ plan });
}));

// POST /api/ai/skill-gap
router.post('/skill-gap', asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.notFound('Complete your profile first');
  const careerGoal = req.body.careerGoal || profile.careerGoal;
  if (!careerGoal) throw ApiError.badRequest('Set a career goal first');
  const result = await aiService.skillGap(profile, careerGoal);
  res.json(result);
}));

// POST /api/ai/roadmap — generate and save roadmap to profile
router.post('/roadmap', asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.notFound('Complete your profile first');
  const careerGoal = req.body.careerGoal || profile.careerGoal;
  if (!careerGoal) throw ApiError.badRequest('Set a career goal first');
  const steps = await aiService.roadmap(careerGoal, profile.skills);
  // merge with existing roadmap statuses
  const existing = new Map((profile.roadmap || []).map((r) => [r.skill.toLowerCase(), r.status]));
  const merged = steps.map((s, i) => ({ skill: s.skill, status: existing.get(s.skill.toLowerCase()) || s.status || 'Not Started', order: i }));
  profile.roadmap = merged;
  profile.careerGoal = careerGoal;
  await profile.save();
  res.json({ roadmap: merged });
}));

// POST /api/ai/projects
router.post('/projects', asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.notFound('Complete your profile first');
  const projects = await aiService.projects(profile);
  res.json({ projects });
}));

// POST /api/ai/profile-insights
router.post('/profile-insights', asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id }).populate('resume');
  if (!profile) throw ApiError.notFound('Complete your profile first');
  const result = await aiService.profileInsights(profile);
  res.json(result);
}));

// GET /api/ai/proactive-alerts — rule-driven urgent actions from real stored data
router.get('/proactive-alerts', asyncHandler(async (req, res) => {
  const ctx = await gatherContext(req.user._id);
  const applications = await Application.find({ student: req.user._id }).distinct('opportunity');
  const actions = aiService.proactiveActions({
    deadlines: ctx.deadlines,
    topOpportunities: ctx.opportunities,
    attendance: ctx.attendance,
    applications,
  });
  res.json({ actions });
}));

// GET /api/ai/status — whether Gemini is live
router.get('/status', (req, res) => {
  res.json({ mode: aiService.mode });
});

export default router;
