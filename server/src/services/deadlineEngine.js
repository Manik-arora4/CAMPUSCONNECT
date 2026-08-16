import { daysBetween } from '../utils/helpers.js';

export function groupDeadlines(items) {
  const groups = { today: [], tomorrow: [], week: [], later: [], overdue: [] };
  for (const item of items) {
    if (!item.date) continue;
    const diff = daysBetween(new Date(), item.date);
    if (diff < 0) groups.overdue.push({ ...item, diff });
    else if (diff === 0) groups.today.push({ ...item, diff });
    else if (diff === 1) groups.tomorrow.push({ ...item, diff });
    else if (diff <= 7) groups.week.push({ ...item, diff });
    else groups.later.push({ ...item, diff });
  }
  const sortByDate = (a, b) => new Date(a.date) - new Date(b.date);
  Object.values(groups).forEach((g) => g.sort(sortByDate));
  return groups;
}

export function urgencyLevel(diff) {
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff <= 7) return 'week';
  return 'later';
}
