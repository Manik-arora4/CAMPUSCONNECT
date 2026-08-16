import { useState } from 'react';
import { Sparkles, UserCheck } from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, Badge, ProgressBar } from '../components/UI';
import { useAsync } from '../components/UI';
import { fmtDate, relativeDay, healthColor } from '../lib/format';

export default function Attendance() {
  const { data, loading, error, reload } = useAsync(() => api.get('/attendance'));
  const [advice, setAdvice] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  if (loading) return <PageLoader />;
  if (error) return <div className="card p-8 text-center text-slate-500">{error.message}</div>;

  const { overall, subjects, records } = data;

  const getAdvice = async () => {
    setAdviceLoading(true);
    try {
      const res = await api.post('/attendance/advice', {});
      setAdvice(res);
    } finally {
      setAdviceLoading(false);
    }
  };

  const last20 = records.slice(-20).reverse();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Track your classes, spot warnings early and stay above target.</p>
        </div>
        <button className="btn-secondary" onClick={getAdvice} disabled={adviceLoading}>
          <Sparkles size={16} className="text-violet-600" />
          {adviceLoading ? 'Thinking…' : 'Ask AI for advice'}
        </button>
      </div>

      {advice ? (
        <Card className="bg-gradient-to-br from-violet-50 to-brand-50 border-violet-200">
          <p className="text-sm text-violet-900 leading-relaxed">
            <span className="font-semibold">🤖 AI advice: </span>
            {advice.advice}
          </p>
        </Card>
      ) : null}

      {/* Overall */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-5 shrink-0">
            <div className="relative h-28 w-28">
              <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={overall?.health === 'safe' ? '#10b981' : overall?.health === 'warning' ? '#f59e0b' : '#ef4444'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(overall?.percentage || 0) * 3.267} 326.7`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">{overall?.percentage || 0}%</span>
                <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">overall</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Target: <span className="font-semibold">{overall?.target}%</span>
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {overall?.total ?? 0} classes · {overall?.present ?? 0} present · {overall?.absent ?? 0} absent
              </p>
              <p className={`text-sm font-semibold mt-1 ${healthColor(overall?.health)}`}>
                {overall?.health === 'safe' ? '✅ On track' : overall?.health === 'warning' ? '⚠️ Warning zone' : '🚨 Critical — needs action'}
              </p>
              {overall?.needed ? <p className="text-xs text-slate-400 mt-1">Attend next {overall.needed} classes to reach target</p> : null}
            </div>
          </div>
          <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Subject-wise health</h3>
            <div className="space-y-3">
              {subjects.length === 0 ? (
                <p className="text-sm text-slate-400">No attendance records yet.</p>
              ) : (
                subjects.map((s) => (
                  <div key={s.subject}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{s.subject}</span>
                      <span className={`font-semibold ${healthColor(s.health)}`}>
                        {s.percentage}% · {s.present}/{s.total}
                      </span>
                    </div>
                    <ProgressBar
                      value={s.percentage}
                      max={100}
                      color={s.health === 'safe' ? 'bg-emerald-500' : s.health === 'warning' ? 'bg-amber-500' : 'bg-red-500'}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Recent records */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <UserCheck size={18} className="text-brand-600" />
          <h3 className="font-semibold text-slate-800">Recent classes</h3>
        </div>
        {last20.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No records yet. Your attendance will show up here as classes happen.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="py-2.5 pr-4 font-semibold">Subject</th>
                  <th className="py-2.5 pr-4 font-semibold">Date</th>
                  <th className="py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {last20.map((r) => (
                  <tr key={r._id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-slate-800">{r.subjectName}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{fmtDate(r.date)}</td>
                    <td className="py-2.5">
                      <Badge
                        className={
                          r.status === 'present'
                            ? 'bg-emerald-100 text-emerald-700'
                            : r.status === 'absent'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-500'
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
