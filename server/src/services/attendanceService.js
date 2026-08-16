import { daysBetween, clamp } from '../utils/helpers.js';

export const ATTENDANCE_TARGET = 75;

/**
 * @param {Array} records attendance records for one subject
 * @returns summary object
 */
export function summarizeSubject(records, target = ATTENDANCE_TARGET) {
  const total = records.length;
  const attended = records.filter((r) => r.status === 'present').length;
  const missed = records.filter((r) => r.status === 'absent').length;
  const percentage = total ? Math.round((attended / total) * 100) : 0;
  const health = percentage >= target ? 'safe' : percentage >= target - 10 ? 'warning' : 'critical';
  return {
    total,
    attended,
    missed,
    percentage,
    target,
    health,
  };
}

/**
 * Classes the student must attend in a row to reach the target, given current totals.
 */
export function classesNeeded(summary) {
  const { attended, total, target } = summary;
  if (total === 0) return 0;
  if ((attended / total) * 100 >= target) return 0;
  // need n more classes: (attended + n) / (total + n) >= target/100
  const n = Math.ceil((target * total - 100 * attended) / (100 - target));
  return Math.max(0, n);
}

/**
 * Forecast: project percentage if the student attends / misses the next `n` classes.
 */
export function forecast(summary, nextClasses) {
  const { attended, total, target } = summary;
  const result = [];
  for (let n = 0; n <= nextClasses; n++) {
    const projected = total + nextClasses;
    const projectedAttended = attended + n;
    const pct = projected ? Math.round((projectedAttended / projected) * 100) : 0;
    result.push({ attendNext: n, projectedPercentage: pct, reachesTarget: pct >= target });
  }
  return result;
}

/**
 * Full per-subject + overall attendance report for a student.
 */
export function buildAttendanceReport(subjectGroups, target = ATTENDANCE_TARGET) {
  const subjects = Object.entries(subjectGroups).map(([subjectName, records]) => {
    const summary = summarizeSubject(records, target);
    return {
      subject: subjectName,
      ...summary,
      needed: classesNeeded(summary),
      forecast: forecast(summary, 5),
    };
  });

  const overall = summarizeSubject(
    Object.values(subjectGroups).flat(),
    target
  );

  const trend = buildTrend(Object.values(subjectGroups).flat());

  return {
    subjects,
    overall: { ...overall, needed: classesNeeded(overall) },
    trend,
    target,
  };
}

/**
 * Weekly attendance percentage trend over the past weeks.
 */
export function buildTrend(records) {
  const buckets = new Map();
  for (const r of records) {
    const d = new Date(r.date);
    const weekStart = new Date(d);
    weekStart.setHours(0, 0, 0, 0);
    const day = (d.getDay() + 6) % 7; // Monday start
    weekStart.setDate(d.getDate() - day);
    const key = weekStart.toISOString().slice(0, 10);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(r);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, recs]) => {
      const present = recs.filter((r) => r.status === 'present').length;
      return { week, percentage: recs.length ? Math.round((present / recs.length) * 100) : 0, total: recs.length };
    });
}

export function healthMeta(health) {
  const meta = {
    safe: { label: 'Safe', color: '#10b981', hint: 'You are above your attendance target. Keep it up!' },
    warning: { label: 'Warning', color: '#f59e0b', hint: 'Attendance is below target — attend the next few classes to recover.' },
    critical: { label: 'Critical', color: '#ef4444', hint: 'Attendance is dangerously low. Prioritize attending classes.' },
  };
  return meta[health] || meta.warning;
}

export function forecastMessage(overall, next = 5) {
  if (!overall.total) return 'No attendance recorded yet.';
  const proj = forecast(overall, next);
  const ifAttendAll = proj.find((p) => p.attendNext === next);
  const msg = [];
  if (ifAttendAll) {
    msg.push(`If you attend your next ${next} classes, your attendance is projected to reach approximately ${ifAttendAll.projectedPercentage}%.`);
  }
  const miss2 = forecast({ ...overall, total: overall.total + 2 }, 0)[0];
  if (miss2) {
    const pct = miss2.projectedPercentage;
    if (pct < overall.target) {
      msg.push(`Missing the next 2 classes may push you below your ${overall.target}% target (${pct}%).`);
    }
  }
  return msg.join(' ');
}
