import { Opportunity } from '../models/Opportunity.js';
import { Assignment } from '../models/Assignment.js';
import { Exam } from '../models/Exam.js';
import { Application } from '../models/Application.js';
import { Notification } from '../models/Notification.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { createNotification } from './notificationService.js';

const HOUR = 3600 * 1000;

async function archiveExpiredOpportunities() {
  const res = await Opportunity.updateMany(
    { status: 'verified', deadline: { $lt: new Date() } },
    { $set: { status: 'expired' } }
  );
  if (res.modifiedCount) console.log(`[scheduler] Archived ${res.modifiedCount} expired opportunities`);
}

async function reminderExists(userId, title) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Notification.exists({ user: userId, title, createdAt: { $gte: d } });
}

async function sendDeadlineReminders() {
  const tomorrow = new Date(Date.now() + 24 * HOUR);
  const tomorrowStart = new Date(tomorrow); tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart); tomorrowEnd.setDate(tomorrowStart.getDate() + 1);
  const todayEnd = new Date(); todayEnd.setHours(0, 0, 0, 0); todayEnd.setDate(todayEnd.getDate() + 1);

  const profiles = await StudentProfile.find({}).distinct('user');
  for (const studentId of profiles) {
    const profile = await StudentProfile.findOne({ user: studentId });
    if (!profile?.college) continue;

    const [assignments, exams, applications] = await Promise.all([
      Assignment.find({ college: profile.college, semester: profile.semester, dueDate: { $gte: todayEnd, $lt: tomorrowEnd } }),
      Exam.find({ college: profile.college, semester: profile.semester, date: { $gte: todayEnd, $lt: tomorrowEnd } }),
      Application.find({ student: studentId }).populate('opportunity'),
    ]);

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
        await createNotification(studentId, { category: 'opportunity', title, message: `"${app.opportunity.title}" at ${app.opportunity.organization} closes tomorrow.`, link: `/opportunities/${app.opportunity._id}`, icon: 'rocket', priority: 'high' });
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
