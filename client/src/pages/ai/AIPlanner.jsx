import { useState } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, Circle, Clock, AlarmClock, XCircle, CalendarDays } from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, Card, Badge } from '../../components/UI';
import { useAsync } from '../../components/UI';
import { fmtTime, relativeDay } from '../../lib/format';

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
    await api.patch(`/ai/daily-plan/${plan._id}`, { items: next, itemIndex: idx, status });
    reload();
  };

  const accept = async () => {
    await api.patch(`/ai/daily-plan/${plan._id}`, { accepted: true });
    reload();
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">AI Daily Planner</h1>
          <p className="page-subtitle">{dateStr || 'Today'} — built from your timetable, tasks and deadlines.</p>
        </div>
        <button className="btn-primary" onClick={generate} disabled={generating}>
          <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generating…' : 'Regenerate'}
        </button>
      </div>

      {error ? <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div> : null}

      {!plan ? (
        <Card className="text-center py-10">
          <Sparkles size={32} className="text-brand-500 mx-auto mb-3" />
          <p className="font-semibold text-slate-800">No plan yet</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">Generate today's plan and your AI will sequence your day.</p>
          <button className="btn-primary" onClick={generate} disabled={generating}>
            <Sparkles size={16} /> Generate today's plan
          </button>
        </Card>
      ) : (
        <div className="space-y-5">
          {plan.summary ? (
            <Card className="bg-gradient-to-br from-violet-50 to-brand-50 border-violet-200">
              <p className="text-sm text-violet-900 leading-relaxed">
                <span className="font-semibold">🧠 Today's focus: </span>
                {plan.summary}
              </p>
            </Card>
          ) : null}

          {plan.accepted === false ? (
            <Card className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600">Does this plan look good? Accept it to lock it in for today.</p>
              <button className="btn-primary shrink-0" onClick={accept}>
                <CheckCircle2 size={16} /> Accept plan
              </button>
            </Card>
          ) : null}

          {/* Timeline */}
          <Card>
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-brand-600" /> Your day
            </h3>
            {pending.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">All done! 🎉 Enjoy the rest of your day.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200" />
                <div className="space-y-3">
                  {[...pending, ...done]
                    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                    .map((item, i) => (
                      <div key={i} className="flex gap-3 relative">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border-2 z-10 ${
                            item.status === 'done'
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : item.type === 'class'
                                ? 'bg-brand-100 border-brand-300 text-brand-700'
                                : item.type === 'deadline'
                                  ? 'bg-red-100 border-red-300 text-red-600'
                                  : 'bg-violet-100 border-violet-300 text-violet-700'
                          }`}
                        >
                          {item.status === 'done' ? (
                            <CheckCircle2 size={16} />
                          ) : item.type === 'class' ? (
                            <CalendarDays size={15} />
                          ) : item.type === 'deadline' ? (
                            <AlarmClock size={15} />
                          ) : (
                            <Sparkles size={15} />
                          )}
                        </div>
                        <div className={`flex-1 rounded-xl border px-4 py-3 ${item.status === 'done' ? 'border-slate-100 bg-slate-50/60' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`text-sm font-medium ${item.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.title}</p>
                              {item.detail ? <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p> : null}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.time ? <span className="text-xs font-semibold text-slate-500">{fmtTime(item.time)}</span> : null}
                              {item.priority ? (
                                <Badge className={item.priority === 'high' ? 'bg-red-100 text-red-700' : item.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}>
                                  {item.priority}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {item.status === 'done' ? (
                              <button onClick={() => updateItem(i, 'todo')} className="text-xs text-slate-400 hover:text-slate-600 font-medium">
                                Undo
                              </button>
                            ) : (
                              <>
                                <button onClick={() => updateItem(i, 'done')} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                                  <CheckCircle2 size={13} /> Complete
                                </button>
                                <button onClick={() => updateItem(i, 'snoozed')} className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600">
                                  <XCircle size={13} /> Snooze
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
