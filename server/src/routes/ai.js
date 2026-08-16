import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireStudent } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { aiService } from '../services/ai/index.js';
import { buildAttendanceReport } from '../services/attendanceService.js';
import { rankOpportunities } from '../services/matchingEngine.js';
import { groupDeadlines } from '../services/deadlineEngine.js';
import { startOfToday, timeToMinutes, daysBetween } from '../utils/helpers.js';

const router = Router();
router.use(auth, requireStudent);

async function gatherContext(userId) {
  const [profile, user] = await Promise.all([
    prisma.studentProfile.findFirst({ where: { user: userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } }),
  ]);
  const collegeId = profile?.college;
  const today = new Date();
  const [slots, attendanceRecords, tasks, assignments, exams, notices, events, opportunities] = await Promise.all([
    prisma.timetableSlot.findMany({ where: { student: userId } }),
    prisma.attendance.findMany({ where: { student: userId } }),
    prisma.task.findMany({ where: { user: userId }, orderBy: { createdAt: 'desc' } }),
    collegeId ? prisma.assignment.findMany({ where: { college: collegeId, semester: profile?.semester }, orderBy: { dueDate: 'asc' } }) : [],
    collegeId ? prisma.exam.findMany({ where: { college: collegeId, semester: profile?.semester, date: { gte: new Date() } }, orderBy: { date: 'asc' } }) : [],
    collegeId ? prisma.notice.findMany({ where: { college: collegeId }, orderBy: { date: 'desc' }, take: 5 }) : [],
    collegeId ? prisma.event.findMany({ where: { college: collegeId, date: { gte: new Date() } }, orderBy: { date: 'asc' }, take: 5 }) : [],
    prisma.opportunity.findMany({ where: { status: 'verified', deadline: { gte: new Date() } }, take: 60 }),
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
    const ctx = await gatherContext(req.user.id);
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
    const ctx = await gatherContext(req.user.id);
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
    const plan = await prisma.aIPlan.upsert({
      where: { student_date: { student: req.user.id, date } },
      update: { items: planData.items, summary: planData.summary, source: 'daily' },
      create: { student: req.user.id, date, items: planData.items, summary: planData.summary, source: 'daily' },
    });
    res.json({ plan, fromAI: planData.fromAI === true });
  })
);

// GET /api/ai/daily-plan — today's plan
router.get('/daily-plan', asyncHandler(async (req, res) => {
  const date = startOfToday();
  let plan = await prisma.aIPlan.findFirst({ where: { student: req.user.id, date } });
  if (!plan) {
    // auto-generate lazily
    const ctx = await gatherContext(req.user.id);
    const topOpportunity = ctx.opportunities?.[0];
    const planData = await aiService.dailyPlan({
      date: date.toISOString().slice(0, 10),
      timetable: ctx.timetable,
      tasks: ctx.tasks,
      deadlines: ctx.deadlines,
      topOpportunity: topOpportunity ? { ...topOpportunity.opportunity, score: topOpportunity.score } : null,
      attendanceWarning: ctx.attendance?.overall?.total > 0 && ctx.attendance.overall.health !== 'safe',
    });
    plan = await prisma.aIPlan.create({ data: { student: req.user.id, date, items: planData.items, summary: planData.summary } });
  }
  res.json({ plan });
}));

// PATCH /api/ai/daily-plan/:id — accept / edit / complete / snooze / dismiss items
router.patch('/daily-plan/:id', asyncHandler(async (req, res) => {
  const plan = await prisma.aIPlan.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!plan) throw ApiError.notFound('Plan not found');
  const data = {};
  if (req.body.accepted !== undefined) data.accepted = req.body.accepted;
  if (req.body.summary !== undefined) data.summary = req.body.summary;
  if (Array.isArray(req.body.items)) data.items = req.body.items;
  if (req.body.itemIndex !== undefined && req.body.status) {
    const idx = Number(req.body.itemIndex);
    const items = [...(plan.items || [])];
    if (items[idx]) {
      if (req.body.status === 'snoozed') {
        items.splice(idx, 1); // remove from today's plan
        data.items = items;
      } else {
        items[idx] = { ...items[idx], status: req.body.status };
        data.items = items;
      }
    }
  }
  const updated = await prisma.aIPlan.update({ where: { id: plan.id }, data });
  res.json({ plan: updated });
}));

// POST /api/ai/skill-gap
router.post('/skill-gap', asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  if (!profile) throw ApiError.notFound('Complete your profile first');
  const careerGoal = req.body.careerGoal || profile.careerGoal;
  if (!careerGoal) throw ApiError.badRequest('Set a career goal first');
  const result = await aiService.skillGap(profile, careerGoal);
  res.json(result);
}));

// POST /api/ai/roadmap — generate and save roadmap to profile
router.post('/roadmap', asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  if (!profile) throw ApiError.notFound('Complete your profile first');
  const careerGoal = req.body.careerGoal || profile.careerGoal;
  if (!careerGoal) throw ApiError.badRequest('Set a career goal first');
  const steps = await aiService.roadmap(careerGoal, profile.skills);
  // merge with existing roadmap statuses
  const existing = new Map((profile.roadmap || []).map((r) => [r.skill.toLowerCase(), r.status]));
  const merged = steps.map((s, i) => ({ skill: s.skill, status: existing.get(s.skill.toLowerCase()) || s.status || 'Not Started', order: i }));
  await prisma.studentProfile.update({ where: { id: profile.id }, data: { roadmap: merged, careerGoal } });
  res.json({ roadmap: merged });
}));

// POST /api/ai/projects
router.post('/projects', asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  if (!profile) throw ApiError.notFound('Complete your profile first');
  const projects = await aiService.projects(profile);
  res.json({ projects });
}));

// POST /api/ai/profile-insights
router.post('/profile-insights', asyncHandler(async (req, res) => {
  let profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  if (!profile) throw ApiError.notFound('Complete your profile first');
  if (profile.resume) {
    const resume = await prisma.resume.findUnique({ where: { id: profile.resume } });
    if (resume) profile.resume = resume;
  }
  const result = await aiService.profileInsights(profile);
  res.json(result);
}));

// GET /api/ai/proactive-alerts — rule-driven urgent actions from real stored data
router.get('/proactive-alerts', asyncHandler(async (req, res) => {
  const ctx = await gatherContext(req.user.id);
  const apps = await prisma.application.findMany({ where: { student: req.user.id }, select: { opportunity: true } });
  const applications = apps.map((a) => a.opportunity);
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
