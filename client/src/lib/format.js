export function fmtDate(d, opts = {}) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...opts });
}

export function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function fmtTime(t) {
  if (!t) return '—';
  const [h, m] = String(t).split(':');
  const hour = Number(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m || '00'} ${ampm}`;
}

export function daysBetween(a, b) {
  const ms = new Date(b).setHours(0, 0, 0, 0) - new Date(a).setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

export function relativeDay(d) {
  if (!d) return '—';
  const diff = daysBetween(new Date(), d);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  if (diff < -1 && diff > -7) return `${-diff} days ago`;
  return fmtDate(d);
}

export function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return fmtDate(d);
}

export function dayName(dayIndex) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex] || '';
}

export function todayIndex() {
  return new Date().getDay();
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const CATEGORY_COLORS = {
  internship: 'bg-blue-100 text-blue-700',
  hackathon: 'bg-purple-100 text-purple-700',
  job: 'bg-emerald-100 text-emerald-700',
  scholarship: 'bg-amber-100 text-amber-700',
  training: 'bg-cyan-100 text-cyan-700',
  workshop: 'bg-pink-100 text-pink-700',
  competition: 'bg-orange-100 text-orange-700',
  fellowship: 'bg-teal-100 text-teal-700',
  research: 'bg-indigo-100 text-indigo-700',
  conference: 'bg-slate-200 text-slate-700',
};

export function categoryColor(cat) {
  return CATEGORY_COLORS[cat] || 'bg-slate-100 text-slate-700';
}

export function scoreColor(score) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-slate-500';
}

export function healthColor(health) {
  if (health === 'critical') return 'text-red-600';
  if (health === 'warning') return 'text-amber-600';
  return 'text-emerald-600';
}
