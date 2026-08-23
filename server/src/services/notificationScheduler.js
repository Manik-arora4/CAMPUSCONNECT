/**
 * Notification Scheduler — periodically checks for deadlines,
 * attendance warnings, new opportunities, and sends notifications.
 *
 * Runs every 15 minutes via setInterval in server/src/index.js
 */

import { prisma } from '../lib/prisma.js';
import { sendPushToUser } from '../routes/push.js';
import { startOfToday, daysBetween } from '../utils/helpers.js';

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600_000);
}

// ── 1. Assignment deadline reminders ──
async function checkDeadlines() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Assignments due today or tomorrow
  const dueSoon = await prisma.assignment.findMany({
    where: {
      dueDate: { gte: now, lte: new Date(now.getTime() + 2 * 86400_000) },
    },
  });

  let created = 0;
  for (const a of dueSoon) {
    const diffDays = daysBetween(now, a.dueDate);
    const urgency = diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : `in ${diffDays} days`;

    // Get students in this college+semester
    const students = await prisma.studentProfile.findMany({
      where: { college: a.college, semester: a.semester },
      select: { user: true },
    });

    for (const s of students) {
      // Skip if already notified for this assignment in last 12h
      const existing = await prisma.notification.findFirst({
        where: {
          user: s.user,
          title: { contains: a.title },
          category: 'deadline',
          createdAt: { gte: hoursAgo(12) },
        },
      });
      if (existing) continue;

      await prisma.notification.create({
        data: {
          user: s.user,
          category: 'deadline',
          title: `⏰ Assignment: ${a.title}`,
          message: `Due ${urgency}${a.subjectName ? ` (${a.subjectName})` : ''}. Priority: ${a.priority}.`,
          link: '/assignments',
          icon: 'clock',
          priority: diffDays <= 1 ? 'high' : 'medium',
        },
      });

      await sendPushToUser(s.user, {
        title: `⏰ ${a.title} — Due ${urgency}`,
        body: `${a.subjectName || 'Assignment'} — Priority: ${a.priority}`,
        url: '/assignments',
        tag: `deadline-${a.id}`,
      });

      created++;
    }
  }
  if (created) console.log(`[scheduler] ${created} deadline notifications created`);
  return created;
}

// ── 2. Attendance warnings ──
async function checkAttendance() {
  const students = await prisma.studentProfile.findMany({
    select: { user: true, college: true },
  });

  let created = 0;
  for (const s of students) {
    const records = await prisma.attendance.findMany({
      where: { student: s.user },
      orderBy: { date: 'desc' },
      take: 50,
    });

    if (records.length < 5) continue;

    const groups = {};
    for (const r of records) {
      groups[r.subjectName] = groups[r.subjectName] || [];
      groups[r.subjectName].push(r);
    }

    for (const [subject, subjRecords] of Object.entries(groups)) {
      const total = subjRecords.length;
      const present = subjRecords.filter((r) => r.status === 'present').length;
      const pct = Math.round((present / total) * 100);

      if (pct < 75 && total >= 5) {
        const existing = await prisma.notification.findFirst({
          where: {
            user: s.user,
            title: { contains: subject },
            category: 'attendance',
            createdAt: { gte: hoursAgo(24) },
          },
        });
        if (existing) continue;

        await prisma.notification.create({
          data: {
            user: s.user,
            category: 'attendance',
            title: `⚠️ Low Attendance: ${subject}`,
            message: `Your attendance is ${pct}% (${present}/${total}). Attend next class to improve.`,
            link: '/attendance',
            icon: 'alert',
            priority: pct < 60 ? 'high' : 'medium',
          },
        });

        await sendPushToUser(s.user, {
          title: `⚠️ ${subject}: ${pct}% attendance`,
          body: `Only ${present}/${total} classes attended. Attend next class!`,
          url: '/attendance',
          tag: `attendance-${subject}`,
        });

        created++;
      }
    }
  }
  if (created) console.log(`[scheduler] ${created} attendance notifications created`);
  return created;
}

// ── 3. New opportunity alerts ──
async function checkOpportunities() {
  const recentOpps = await prisma.opportunity.findMany({
    where: {
      status: 'verified',
      deadline: { gte: new Date() },
      postedDate: { gte: hoursAgo(24) },
    },
  });

  if (recentOpps.length === 0) return 0;

  const students = await prisma.studentProfile.findMany({
    select: { user: true, college: true, semester: true, skills: true, course: true },
  });

  let created = 0;
  for (const opp of recentOpps) {
    for (const s of students) {
      // Basic eligibility check
      if (opp.courseRestrictions.length > 0 && !opp.courseRestrictions.includes(s.course)) continue;
      if (s.semester < opp.semesterMin || s.semester > opp.semesterMax) continue;

      const existing = await prisma.notification.findFirst({
        where: {
          user: s.user,
          title: { contains: opp.title },
          category: 'opportunity',
          createdAt: { gte: hoursAgo(24) },
        },
      });
      if (existing) continue;

      await prisma.notification.create({
        data: {
          user: s.user,
          category: 'opportunity',
          title: `💼 New: ${opp.title}`,
          message: `${opp.organization} — ${opp.category}${opp.stipend ? ` (Stipend: ${opp.stipend})` : ''}. Apply before ${opp.deadline?.toLocaleDateString?.() || 'deadline'}.`,
          link: `/opportunities/${opp.id}`,
          icon: 'briefcase',
          priority: 'medium',
        },
      });

      await sendPushToUser(s.user, {
        title: `💼 ${opp.title}`,
        body: `${opp.organization} — ${opp.category}`,
        url: `/opportunities/${opp.id}`,
        tag: `opp-${opp.id}`,
      });

      created++;
    }
  }
  if (created) console.log(`[scheduler] ${created} opportunity notifications created`);
  return created;
}

// ── 4. Exam reminders ──
async function checkExams() {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 86400_000);

  const upcomingExams = await prisma.exam.findMany({
    where: { date: { gte: now, lte: nextWeek } },
  });

  let created = 0;
  for (const exam of upcomingExams) {
    const diffDays = daysBetween(now, exam.date);
    const urgency = diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : `in ${diffDays} days`;

    const students = await prisma.studentProfile.findMany({
      where: { college: exam.college, semester: exam.semester },
      select: { user: true },
    });

    for (const s of students) {
      const existing = await prisma.notification.findFirst({
        where: {
          user: s.user,
          title: { contains: exam.title },
          category: 'exam',
          createdAt: { gte: hoursAgo(12) },
        },
      });
      if (existing) continue;

      await prisma.notification.create({
        data: {
          user: s.user,
          category: 'exam',
          title: `📚 Exam: ${exam.title}`,
          message: `${exam.subjectName || exam.type} — ${urgency}. Time: ${exam.startTime}-${exam.endTime}.`,
          link: '/exams',
          icon: 'book',
          priority: diffDays <= 2 ? 'high' : 'medium',
        },
      });

      await sendPushToUser(s.user, {
        title: `📚 ${exam.title} — ${urgency}`,
        body: `${exam.startTime}-${exam.endTime} | ${exam.type}`,
        url: '/exams',
        tag: `exam-${exam.id}`,
      });

      created++;
    }
  }
  if (created) console.log(`[scheduler] ${created} exam notifications created`);
  return created;
}

// ── Main scheduler ──
let _running = false;

export async function runNotificationChecks() {
  if (_running) return;
  _running = true;
  try {
    await checkDeadlines();
    await checkAttendance();
    await checkOpportunities();
    await checkExams();
  } catch (err) {
    console.error('[scheduler] Error:', err.message);
  } finally {
    _running = false;
  }
}

/**
 * Start the notification scheduler. Call once from server/src/index.js.
 * Runs immediately + every 15 minutes.
 */
export function startNotificationScheduler() {
  console.log('[scheduler] Notification scheduler started (every 15 min)');
  // Run once after 30s (let server start up)
  setTimeout(() => runNotificationChecks(), 30_000);
  // Then every 15 min
  setInterval(runNotificationChecks, 15 * 60_000);
}
