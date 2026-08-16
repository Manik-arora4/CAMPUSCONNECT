import { prisma } from '../lib/prisma.js';
import { createNotification } from './notificationService.js';

const HOUR = 3600 * 1000;

async function archiveExpiredOpportunities() {
  const res = await prisma.opportunity.updateMany({
    where: { status: 'verified', deadline: { lt: new Date() } },
    data: { status: 'expired' },
  });
  if (res.count) console.log(`[scheduler] Archived ${res.count} expired opportunities`);
}

async function reminderExists(userId, title) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const found = await prisma.notification.findFirst({ where: { user: userId, title, createdAt: { gte: d } }, select: { id: true } });
  return Boolean(found);
}

async function sendDeadlineReminders() {
  const tomorrow = new Date(Date.now() + 24 * HOUR);
  const tomorrowStart = new Date(tomorrow); tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart); tomorrowEnd.setDate(tomorrowStart.getDate() + 1);
  const todayEnd = new Date(); todayEnd.setHours(0, 0, 0, 0); todayEnd.setDate(todayEnd.getDate() + 1);

  const profiles = await prisma.studentProfile.findMany({ select: { user: true }, distinct: ['user'] });
  for (const { user: studentId } of profiles) {
    const profile = await prisma.studentProfile.findFirst({ where: { user: studentId } });
    if (!profile?.college) continue;

    const [assignments, exams, applications] = await Promise.all([
      prisma.assignment.findMany({ where: { college: profile.college, semester: profile.semester, dueDate: { gte: todayEnd, lt: tomorrowEnd } } }),
      prisma.exam.findMany({ where: { college: profile.college, semester: profile.semester, date: { gte: todayEnd, lt: tomorrowEnd } } }),
      prisma.application.findMany({ where: { student: studentId } }),
    ]);

    // Attach opportunity docs
    const oppIds = [...new Set(applications.map((a) => a.opportunity).filter(Boolean))];
    const oppMap = new Map();
    if (oppIds.length) {
      const opps = await prisma.opportunity.findMany({ where: { id: { in: oppIds } } });
      for (const o of opps) oppMap.set(o.id, o);
    }
    for (const app of applications) {
      if (oppMap.has(app.opportunity)) app.opportunity = oppMap.get(app.opportunity);
    }

    for (const a of assignments) {
      const title = `⏰ Deadline tomorrow: ${a.title}`;
      if (await reminderExists(studentId, title)) continue;
      await createNotification(studentId, { category: 'academic', title, message: `Your assignment "${a.title}" is due tomorrow.`, link: '/assignments', icon: 'alarm-clock', priority: 'high' });
    }
    for (const e of exams) {
      const title = `📝 Exam tomorrow: ${e.title}`;
      if (await reminderExists(studentId, title)) continue;
      await createNotification(studentId, { category: 'academic', title, message: `${e.subjectName || e.title} at ${e.startTime} in ${e.room || 'TBA'}`, link: '/college', icon: 'graduation-cap', priority: 'high' });
    }
    for (const app of applications) {
      if (!app.opportunity?.deadline || app.status === 'selected' || app.status === 'rejected') continue;
      const diff = Math.round((new Date(app.opportunity.deadline) - Date.now()) / HOUR);
      if (diff <= 24 && diff >= 0) {
        const title = `🚨 Opportunity deadline tomorrow: ${app.opportunity.title}`;
        if (await reminderExists(studentId, title)) continue;
        await createNotification(studentId, { category: 'opportunity', title, message: `"${app.opportunity.title}" at ${app.opportunity.organization} closes tomorrow.`, link: `/opportunities/${app.opportunity.id}`, icon: 'rocket', priority: 'high' });
      }
    }
  }
}

export function startScheduledJobs() {
  const run = async () => {
    try {
      await archiveExpiredOpportunities();
      await sendDeadlineReminders();
    } catch (err) {
      console.error('[scheduler] job failed:', err.message);
    }
  };
  run();
  setInterval(run, HOUR);
  console.log('[scheduler] Hourly jobs started (opportunity archiving + deadline reminders)');
}
