import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireStudent } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { buildAttendanceReport, forecastMessage } from '../services/attendanceService.js';
import { computeMatch, rankOpportunities } from '../services/matchingEngine.js';
import { groupDeadlines } from '../services/deadlineEngine.js';
import { aiService } from '../services/ai/index.js';
import { relativeDay, timeToMinutes, daysBetween } from '../utils/helpers.js';

const router = Router();
router.use(auth, requireStudent);

function getProfile(userId) {
  return prisma.studentProfile.findFirst({ where: { user: userId } });
}

// GET /api/students/me/profile
router.get('/me/profile', asyncHandler(async (req, res) => {
  let profile = await getProfile(req.user.id);
  if (!profile) {
    profile = await prisma.studentProfile.create({ data: { user: req.user.id, college: req.user.college } });
  }
  if (profile.resume) {
    const resume = await prisma.resume.findUnique({ where: { id: profile.resume } });
    if (resume) profile.resume = resume;
  }
  res.json(profile);
}));

// PATCH /api/students/me/profile — full onboarding + edits
router.patch('/me/profile', asyncHandler(async (req, res) => {
  const existing = await getProfile(req.user.id);
  let profile = existing;
  const allowed = [
    'college', 'course', 'semester', 'section', 'enrollmentNumber', 'bio', 'linkedin', 'github', 'portfolio',
    'skills', 'interests', 'careerGoal', 'preferredLocation', 'remotePreference', 'weeklyLearningHours',
    'preferredOpportunityTypes', 'experienceYears', 'roadmap',
  ];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  if (existing) {
    profile = await prisma.studentProfile.update({ where: { id: existing.id }, data });
  } else {
    profile = await prisma.studentProfile.create({
      data: { user: req.user.id, college: req.user.college, ...data },
    });
  }
  if (req.body.completeOnboarding) {
    await prisma.user.update({ where: { id: req.user.id }, data: { onboarded: true } });
  }
  res.json(profile);
}));

// GET /api/students/dashboard — the personalized command center
router.get('/dashboard', asyncHandler(async (req, res) => {
  const profile = await getProfile(req.user.id);
  if (!profile) throw ApiError.notFound('Student profile not found. Complete onboarding first.');
  const userId = req.user.id;
  const collegeId = req.user.college;
  const today = new Date();
  const dayIndex = today.getDay();

  const [slots, attendanceRecords, tasks, assignments, exams, notices, events, applications] = await Promise.all([
    prisma.timetableSlot.findMany({ where: { student: userId }, orderBy: { startTime: 'asc' } }),
    prisma.attendance.findMany({ where: { student: userId }, orderBy: { date: 'asc' } }),
    prisma.task.findMany({ where: { user: userId } }),
    prisma.assignment.findMany({ where: { college: collegeId, semester: profile.semester }, orderBy: { dueDate: 'asc' } }),
    prisma.exam.findMany({ where: { college: collegeId, semester: profile.semester, date: { gte: new Date(Date.now() - 86400000) } }, orderBy: { date: 'asc' } }),
    prisma.notice.findMany({ where: { college: collegeId }, orderBy: { date: 'desc' }, take: 5 }),
    prisma.event.findMany({ where: { college: collegeId, date: { gte: new Date() } }, orderBy: { date: 'asc' }, take: 5 }),
    prisma.application.findMany({ where: { student: userId } }),
  ]);

  // Attach opportunity docs to applications (populate replacement)
  const oppIds = [...new Set(applications.map((a) => a.opportunity).filter(Boolean))];
  if (oppIds.length) {
    const opps = await prisma.opportunity.findMany({ where: { id: { in: oppIds } } });
    const oppMap = new Map(opps.map((o) => [o.id, o]));
    for (const app of applications) {
      if (oppMap.has(app.opportunity)) app.opportunity = oppMap.get(app.opportunity);
    }
  }

  // Attendance report
  const groups = {};
  for (const r of attendanceRecords) {
    (groups[r.subjectName] = groups[r.subjectName] || []).push(r);
  }
  const attendance = buildAttendanceReport(groups);

  // Deadlines across everything
  const deadlineItems = [];
  for (const a of assignments) {
    if (a.dueDate >= new Date(Date.now() - 86400000)) {
      const sub = a.submissions?.find((s) => String(s.student) === String(userId));
      if (!sub || sub.status === 'pending') deadlineItems.push({ label: `Assignment: ${a.title}`, date: a.dueDate, ref: `assignment:${a.id}`, link: '/assignments', type: 'assignment' });
    }
  }
  for (const e of exams) deadlineItems.push({ label: `Exam: ${e.title}`, date: e.date, ref: `exam:${e.id}`, link: '/college', type: 'exam' });
  for (const t of tasks) {
    if (t.status !== 'done' && t.dueDate) deadlineItems.push({ label: `Task: ${t.title}`, date: t.dueDate, ref: `task:${t.id}`, link: '/tasks', type: 'task' });
  }
  for (const app of applications) {
    if (app.opportunity?.deadline && app.status !== 'rejected' && app.status !== 'selected') {
      deadlineItems.push({ label: `Application: ${app.opportunity.title}`, date: app.opportunity.deadline, ref: `opportunity:${app.opportunity.id}`, link: `/opportunities/${app.opportunity.id}`, type: 'opportunity' });
    }
  }
  const deadlines = groupDeadlines(deadlineItems);

  // Opportunity matching
  const verifiedOpps = await prisma.opportunity.findMany({ where: { status: 'verified', deadline: { gte: new Date() } }, take: 80 });
  const ranked = rankOpportunities(profile, verifiedOpps, 8);
  const topOpportunity = ranked[0];

  // Needs attention
  const needsAttention = [];
  if (attendance.overall.total && attendance.overall.health !== 'safe') {
    needsAttention.push({ severity: attendance.overall.health === 'critical' ? 'critical' : 'warning', title: `Attendance is ${attendance.overall.percentage}%`, message: `Attend the next ${attendance.overall.needed || 1} classes to reach the ${attendance.overall.target}% target.`, link: '/attendance' });
  }
  if (deadlines.tomorrow.length) needsAttention.push({ severity: 'warning', title: `${deadlines.tomorrow.length} deadline${deadlines.tomorrow.length > 1 ? 's' : ''} tomorrow`, message: deadlines.tomorrow.map((d) => d.label).join(', '), link: '/tasks' });
  if (deadlines.today.length) needsAttention.push({ severity: 'critical', title: `${deadlines.today.length} deadline${deadlines.today.length > 1 ? 's' : ''} today`, message: deadlines.today.map((d) => d.label).join(', '), link: '/tasks' });
  if (topOpportunity && topOpportunity.score >= 80 && daysBetween(new Date(), topOpportunity.opportunity.deadline) <= 3) {
    needsAttention.push({ severity: 'critical', title: `${topOpportunity.opportunity.title} closes in ${daysBetween(new Date(), topOpportunity.opportunity.deadline)} day(s)`, message: `You have a ${topOpportunity.score}% match — complete the application today.`, link: `/opportunities/${topOpportunity.opportunity.id}` });
  }
  const importantNotice = notices.find((n) => n.important);
  if (importantNotice) needsAttention.push({ severity: 'info', title: importantNotice.title, message: 'New important college notice', link: '/college' });
  if (attendance.overall.total && attendance.overall.health === 'safe' && needsAttention.length === 0) {
    needsAttention.push({ severity: 'info', title: 'All caught up! 🎉', message: 'No urgent issues. A good day to learn a new skill or apply to an opportunity.', link: '/opportunities' });
  }

  // AI recommendation
  let aiRecommendation = { text: '', opportunity: null };
  if (topOpportunity && topOpportunity.score >= 70) {
    const explanation = await aiService.matchExplanation(profile, topOpportunity.opportunity, topOpportunity);
    aiRecommendation = { text: explanation, opportunity: topOpportunity.opportunity, score: topOpportunity.score };
  } else {
    aiRecommendation.text = `No high-match opportunities right now. ${attendance.overall.total ? `Keep attendance above ${attendance.overall.target}% ` : ''}and complete pending tasks — I'll alert you when something relevant opens up.`;
  }

  // Stats
  const todaySlots = slots.filter((s) => s.day === dayIndex && s.type !== 'free');
  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const activeApplications = applications.filter((a) => ['applied', 'shortlisted', 'interview'].includes(a.status));

  res.json({
    profile,
    todaySchedule: slots.filter((s) => s.day === dayIndex).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    stats: {
      todayClasses: todaySlots.length,
      attendancePercentage: attendance.overall.percentage,
      attendanceHealth: attendance.overall.health,
      pendingTasks: pendingTasks.length,
      upcomingDeadlines: deadlines.today.length + deadlines.tomorrow.length + deadlines.week.length,
      opportunityMatches: ranked.filter((r) => r.score >= 70).length,
      activeApplications: activeApplications.length,
    },
    attendance: { overall: attendance.overall, trend: attendance.trend, forecast: forecastMessage(attendance.overall) },
    deadlines: { today: deadlines.today, tomorrow: deadlines.tomorrow, week: deadlines.week },
    needsAttention,
    aiRecommendation,
    topOpportunities: ranked.slice(0, 3),
    recentNotices: notices,
    upcomingEvents: events,
  });
}));

// GET /api/students/weekly-review
router.get('/weekly-review', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const [records, tasks, applications, events] = await Promise.all([
    prisma.attendance.findMany({ where: { student: userId, date: { gte: weekAgo } } }),
    prisma.task.findMany({ where: { user: userId, updatedAt: { gte: weekAgo } } }),
    prisma.application.findMany({ where: { student: userId, updatedAt: { gte: weekAgo } } }),
    prisma.recommendationEvent.findMany({ where: { user: userId, createdAt: { gte: weekAgo } } }),
  ]);
  const classesTotal = records.length;
  const classesAttended = records.filter((r) => r.status === 'present').length;
  const tasksCompleted = tasks.filter((t) => t.status === 'done').length;
  const skillsPracticed = [...new Set(tasks.filter((t) => t.status === 'done' && t.subject).map((t) => t.subject))];
  const data = {
    classesAttended,
    classesTotal,
    tasksCompleted,
    tasksTotal: tasksCompleted + tasks.filter((t) => t.status !== 'done').length,
    opportunitiesViewed: events.filter((e) => e.type === 'viewed').length,
    applications: applications.length,
    skillsPracticed,
  };
  const review = await aiService.weeklyReview(data);
  res.json({ ...data, insight: review.insight, fromAI: review.fromAI });
}));

// POST /api/students/recommendation-event — feedback signal
router.post('/recommendation-event', asyncHandler(async (req, res) => {
  const { type, opportunity, category, metadata } = req.body;
  if (!['viewed', 'saved', 'applied', 'dismissed', 'not-interested', 'searched', 'clicked'].includes(type)) {
    throw ApiError.badRequest('Invalid event type');
  }
  await prisma.recommendationEvent.create({ data: { user: req.user.id, type, opportunity, category, metadata: metadata || {} } });
  res.status(201).json({ ok: true });
}));

// GET /api/students/today-plan
router.get('/today-plan', asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const plan = await prisma.aIPlan.findFirst({ where: { student: req.user.id, date: today } });
  res.json({ plan });
}));

export default router;
