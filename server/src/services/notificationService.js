import { prisma } from '../lib/prisma.js';

const CATEGORY_PREF_MAP = {
  college: 'collegeAnnouncements',
  academic: 'deadlineReminders',
  attendance: 'attendanceAlerts',
  opportunity: 'deadlineReminders',
  career: 'aiRecommendations',
  ai: 'aiRecommendations',
  system: null,
};

export async function createNotification(userId, { category = 'system', title, message = '', link = '', icon = 'bell', priority = 'medium' }) {
  try {
    // Respect user preferences
    const pref = await prisma.userPreference.findUnique({ where: { user: userId } });
    const prefKey = CATEGORY_PREF_MAP[category];
    if (pref && prefKey && pref.notifications?.[prefKey] === false) {
      return null;
    }
    return await prisma.notification.create({ data: { user: userId, category, title, message, link, icon, priority } });
  } catch (err) {
    console.error('[notifications] create failed', err.message);
    return null;
  }
}

export async function notifyMany(userIds, payload) {
  const results = await Promise.all(userIds.map((id) => createNotification(id, payload)));
  return results.filter(Boolean);
}
