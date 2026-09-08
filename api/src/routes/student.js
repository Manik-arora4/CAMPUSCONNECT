const { Router } = require('express');
const prisma = require('../lib/prisma');
const { authenticate, asyncHandler } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

// Dashboard cache
const dashCache = new Map();
function getCached(key, maxAge = 20000) {
  const entry = dashCache.get(key);
  return entry && Date.now() - entry.ts < maxAge ? entry.data : null;
}
function setCache(key, data) { dashCache.set(key, { data, ts: Date.now() }); }

// Attendance helper
async function getAttendanceReport(studentId) {
  const records = await prisma.attendance.findMany({ where: { student: studentId }, orderBy: { date: 'asc' } });
  const bySubject = {};
  for (const r of records) (bySubject[r.subjectName] = bySubject[r.subjectName] || []).push(r);
  const subjects = Object.entries(bySubject).map(([name, recs]) => {
    const total = recs.length;
    const present = recs.filter(r => r.status === 'present').length;
    return { name, total, present, absent: total - present, percentage: total > 0 ? Math.round(present / total * 100) : 0 };
  });
  const totalAll = records.length;
  const presentAll = records.filter(r => r.status === 'present').length;
  const percentage = totalAll > 0 ? Math.round(presentAll / totalAll * 100) : 0;
  const target = 75;
  const needed = percentage < target ? Math.ceil((target * totalAll / 100) - presentAll) : 0;
  const health = percentage >= 75 ? 'safe' : percentage >= 60 ? 'warning' : 'critical';
  return { overall: { total: totalAll, present: presentAll, absent: totalAll - presentAll, percentage, target, needed, health }, subjects, records };
}

// Deadline helper
function categorizeDeadlines(assignments, exams, tasks, apps) {
  const now = new Date();
  const today = new Date(now); today.setHours(23, 59, 59);
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(23, 59, 59);
  const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);

  const items = [];
  for (const a of assignments) items.push({ label: `Assignment: ${a.title}`, date: a.dueDate, type: 'assignment', link: '/assignments' });
  for (const e of exams) items.push({ label: `Exam: ${e.title}`, date: e.date, type: 'exam', link: '/college' });
  for (const t of tasks) if (t.status !== 'done' && t.dueDate) items.push({ label: `Task: ${t.title}`, date: t.dueDate, type: 'task', link: '/tasks' });

  return {
    today: items.filter(i => i.date <= today),
    tomorrow: items.filter(i => i.date > today && i.date <= tomorrow),
    week: items.filter(i => i.date > tomorrow && i.date <= weekEnd)
  };
}

router.get('/me/profile', asyncHandler(async (req, res) => {
  let profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  if (!profile) {
    profile = await prisma.studentProfile.create({ data: { user: req.user.id, college: req.user.college } });
  }
  if (profile.resume) {
    const resume = await prisma.resume.findUnique({ where: { id: profile.resume } });
    if (resume) profile = { ...profile, resume };
  }
  res.json(profile);
}));

router.put('/me/profile', asyncHandler(async (req, res) => {
  let profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  const allowed = ['college', 'degree', 'course', 'semester', 'year', 'section', 'enrollmentNumber', 'bio', 'linkedin', 'github', 'portfolio', 'skills', 'interests', 'careerGoal', 'preferredLocation', 'remotePreference', 'weeklyLearningHours', 'preferredOpportunityTypes', 'experienceYears', 'roadmap'];
  const data = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });

  if (profile) {
    profile = await prisma.studentProfile.update({ where: { id: profile.id }, data });
  } else {
    profile = await prisma.studentProfile.create({ data: { user: req.user.id, college: req.user.college, ...data } });
  }

  if (req.body.completeOnboarding) {
    await prisma.user.update({ where: { id: req.user.id }, data: { onboarded: true } });
  }
  dashCache.delete(`dashboard:${req.user.id}`);
  res.json(profile);
}));

router.get('/dashboard', asyncHandler(async (req, res) => {
  const cacheKey = `dashboard:${req.user.id}`;
  const cached = getCached(cacheKey, 20000);
  if (cached) return res.json(cached);

  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  if (!profile) return res.status(404).json({ error: 'Student profile not found. Complete onboarding first.' });

  const today = new Date().getDay();
  const [timetable, attendance, tasks, assignments, exams, notices, events, applications] = await Promise.all([
    prisma.timetableSlot.findMany({ where: { student: req.user.id }, orderBy: { startTime: 'asc' } }),
    prisma.attendance.findMany({ where: { student: req.user.id }, orderBy: { date: 'asc' } }),
    prisma.task.findMany({ where: { user: req.user.id } }),
    prisma.assignment.findMany({ where: { college: req.user.college, semester: profile.semester }, orderBy: { dueDate: 'asc' } }),
    prisma.exam.findMany({ where: { college: req.user.college, semester: profile.semester, date: { gte: new Date(Date.now() - 864e5) } }, orderBy: { date: 'asc' } }),
    prisma.notice.findMany({ where: { college: req.user.college }, orderBy: { date: 'desc' }, take: 5 }),
    prisma.event.findMany({ where: { college: req.user.college, date: { gte: new Date() } }, orderBy: { date: 'asc' }, take: 5 }),
    prisma.application.findMany({ where: { student: req.user.id } })
  ]);

  const attReport = await getAttendanceReport(req.user.id);
  const deadlines = categorizeDeadlines(assignments, exams, tasks.filter(t => t.status !== 'done'), applications);

  const dashboard = {
    profile,
    todaySchedule: timetable.filter(s => s.day === today).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    stats: {
      todayClasses: timetable.filter(s => s.day === today && s.type !== 'free').length,
      attendancePercentage: attReport.overall.percentage,
      attendanceHealth: attReport.overall.health,
      pendingTasks: tasks.filter(t => t.status !== 'done').length,
      upcomingDeadlines: deadlines.today.length + deadlines.tomorrow.length + deadlines.week.length,
      activeApplications: applications.filter(a => ['applied', 'shortlisted', 'interview'].includes(a.status)).length
    },
    attendance: attReport,
    deadlines,
    recentNotices: notices,
    upcomingEvents: events
  };

  setCache(cacheKey, dashboard);
  res.json(dashboard);
}));

module.exports = router;
