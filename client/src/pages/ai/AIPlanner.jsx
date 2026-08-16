import { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  CalendarDays,
  Coffee,
  BookOpen,
  Rocket,
  Sun,
  ClipboardList,
  AlarmClock,
  ListChecks,
  GraduationCap,
  Flame,
} from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, Card, ProgressBar } from '../../components/UI';
import { useAsync } from '../../components/UI';
import { fmtTime } from '../../lib/format';

const TYPE_META = {
  class: { icon: CalendarDays, chip: 'bg-brand-100 text-brand-700', ring: 'from-brand-400 to-indigo-500', glow: 'shadow-glow-sm' },
  task: { icon: ClipboardList, chip: 'bg-amber-100 text-amber-700', ring: 'from-amber-400 to-orange-500', glow: 'shadow-glow-sm' },
  break: { icon: Coffee, chip: 'bg-emerald-100 text-emerald-700', ring: 'from-emerald-400 to-teal-500', glow: 'shadow-glow-sm' },
  study: { icon: BookOpen, chip: 'bg-violet-100 text-violet-700', ring: 'from-violet-400 to-purple-500', glow: 'shadow-glow-violet' },
  career: { icon: Rocket, chip: 'bg-pink-100 text-pink-700', ring: 'from-pink-400 to-rose-500', glow: 'shadow-glow-sm' },
  free: { icon: Sun, chip: 'bg-slate-100 text-slate-600', ring: 'from-slate-300 to-slate-400', glow: '' },
  deadline: { icon: AlarmClock, chip: 'bg-red-100 text-red-700', ring: 'from-red-400 to-rose-500', glow: 'shadow-glow-sm' },
  other: { icon: Sparkles, chip: 'bg-slate-100 text-slate-600', ring: 'from-slate-300 to-slate-400', glow: '' },
};

function typeMeta(type) {
  return TYPE_META[type] || TYPE_META.other;
}

export default function AIPlanner() {
  const { data, loading, reload } = useAsync(() => api.get('/ai/daily-plan'));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  if (loading) return <PageLoader />;

  const plan = data?.plan;
  const items = plan?.items || [];
  const pending = items.filter((i) => i.status !== 'done' && i.status !== 'snoozed');
  const done = items.filter((i) => i.status === 'done');
  const dateStr = plan?.date ? new Date(plan.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  const classes = pending.filter((i) => i.type === 'class').length;
  const tasks = pending.filter((i) => i.type === 'task').length;
  const donePct = items.length ? Math.round((done.length / items.length) * 100) : 0;
  const sorted = [...pending, ...done].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const generate = async () => {
    setGenerating(true);
    setError('');
    try {
      await api.post('/ai/daily-plan', {});
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const updateItem = async (idx, status) => {
    const next = items.map((it, i) => (i === idx ? { ...it, status } : it));
    await api.patch(`/ai/daily-plan/${plan.id}`, { items: next, itemIndex: idx, status });
    reload();
  };

  const accept = async () => {
    await api.patch(`/ai/daily-plan/${plan.id}`, { accepted: true });
    reload();
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto pb-10">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 p-6 sm:p-8 text-white shadow-lift">
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/15 blur-2xl animate-float" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-fuchsia-400/25 blur-2xl animate-float-slow" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 px-3 py-1 text-xs font-semibold tracking-wide">
              <Sparkles size={13} className="text-amber-300" />
              AI DAILY PLANNER
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mt-3 leading-tight">{dateStr || "Today's plan"}</h1>
            <p className="text-white/80 text-sm mt-1">Built from your timetable, tasks and deadlines.</p>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-brand-700 px-4 py-2.5 text-sm font-bold transition hover:bg-brand-50 hover:scale-[1.03] disabled:opacity-60 shrink-0 shadow-lift"
          >
            <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Generating…' : 'Regenerate plan'}
          </button>
        </div>
      </div>

      {error ? <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 animate-fade-in">{error}</div> : null}

      {!plan ? (
        <Card className="text-center py-14 animate-scale-in">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-glow mb-4">
            <Sparkles size={30} className="text-white" />
          </div>
          <p className="text-lg font-bold text-slate-900">No plan yet</p>
          <p className="text-sm text-slate-500 mt-1 mb-5 max-w-sm mx-auto">Generate today's plan and your AI will sequence your classes, tasks and breaks.</p>
          <button className="btn-primary" onClick={generate} disabled={generating}>
            <Sparkles size={16} /> Generate today's plan
          </button>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: ListChecks, label: 'Plan items', value: sorted.length, tone: 'from-brand-500 to-indigo-500' },
              { icon: GraduationCap, label: 'Classes', value: classes, tone: 'from-violet-500 to-purple-500' },
              { icon: ClipboardList, label: 'Tasks', value: tasks, tone: 'from-amber-500 to-orange-500' },
              { icon: Flame, label: 'Completed', value: `${donePct}%`, tone: 'from-emerald-500 to-teal-500' },
            ].map(({ icon: Icon, label, value, tone }, i) => (
              <div key={label} className="card p-4 flex items-center gap-3 animate-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className={`rounded-xl p-2.5 bg-gradient-to-br ${tone} text-white shadow-glow-sm shrink-0`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
                  <p className="text-[11px] font-medium text-slate-500 truncate">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {plan.summary ? (
            <Card className="border-transparent bg-gradient-to-br from-violet-50 via-brand-50 to-fuchsia-50 p-5 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-sm text-violet-900 leading-relaxed flex items-start gap-2">
                <span className="mt-0.5 shrink-0">🧠</span>
                <span>
                  <span className="font-bold">Today's focus: </span>
                  {plan.summary}
                </span>
              </p>
              {items.length ? (
                <div className="mt-3">
                  <ProgressBar value={done.length} max={items.length} color="bg-gradient-to-r from-brand-500 to-violet-500" />
                  <p className="text-[11px] text-violet-700/70 mt-1.5 font-medium">{done.length} of {items.length} items done</p>
                </div>
              ) : null}
            </Card>
          ) : null}

          {plan.accepted === false ? (
            <Card className="flex flex-col sm:flex-row items-center justify-between gap-3 border-brand-200 bg-brand-50/60 animate-fade-up" style={{ animationDelay: '0.28s' }}>
              <p className="text-sm text-brand-900 font-medium">✨ This plan looks ready — accept it to lock it in for today.</p>
              <button className="btn-primary shrink-0" onClick={accept}>
                <CheckCircle2 size={16} /> Accept plan
              </button>
            </Card>
          ) : null}

          {/* Timeline */}
          <Card className="p-6 animate-fade-up" style={{ animationDelay: '0.34s' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 p-1.5 text-white shadow-glow-sm">
                  <Clock size={16} />
                </span>
                Your day
              </h3>
              <span className="chip bg-slate-100 text-slate-500">{pending.length} remaining</span>
            </div>
            {pending.length === 0 ? (
              <div className="text-center py-10">
                <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-glow-sm mb-3">
                  <CheckCircle2 size={26} className="text-white" />
                </div>
                <p className="font-semibold text-slate-800">All done! 🎉</p>
                <p className="text-sm text-slate-500 mt-1">Enjoy the rest of your day — you earned it.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-brand-200 via-violet-200 to-slate-100" />
                <div className="space-y-4">
                  {sorted.map((item, i) => {
                    const meta = typeMeta(item.type);
                    const Icon = meta.icon;
                    const isDone = item.status === 'done';
                    return (
                      <div key={i} className="flex gap-4 relative animate-fade-up" style={{ animationDelay: `${0.05 + i * 0.04}s` }}>
                        <div className="relative z-10">
                          <div
                            className={`h-10 w-10 rounded-full bg-gradient-to-br ${meta.ring} flex items-center justify-center text-white border-2 border-white ${meta.glow} ${isDone ? 'opacity-90' : ''}`}
                          >
                            {isDone ? <CheckCircle2 size={18} /> : <Icon size={17} />}
                          </div>
                        </div>
                        <div
                          className={`flex-1 rounded-2xl border px-4 py-3.5 transition duration-300 ${
                            isDone
                              ? 'border-slate-100 bg-slate-50/70'
                              : 'border-slate-100 bg-white hover:border-brand-200 hover:shadow-lift hover:-translate-y-0.5'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.title}</p>
                              {item.detail ? <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p> : null}
                              <span className={`inline-flex items-center gap-1 chip mt-2 ${meta.chip}`}>
                                <Icon size={11} />
                                {item.type === 'break' ? 'Break' : item.type === 'free' ? 'Free time' : item.type === 'study' ? 'Study' : item.type === 'career' ? 'Career' : item.type === 'deadline' ? 'Deadline' : item.type === 'class' ? 'Class' : 'Focus'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.time ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                                  <Clock size={11} /> {fmtTime(item.time)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-slate-50">
                            {isDone ? (
                              <button onClick={() => updateItem(i, 'todo')} className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition">
                                ↩ Undo
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => updateItem(i, 'done')}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg px-2.5 py-1.5 transition"
                                >
                                  <CheckCircle2 size={13} /> Complete
                                </button>
                                <button
                                  onClick={() => updateItem(i, 'snoozed')}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 transition"
                                >
                                  Snooze
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
