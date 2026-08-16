import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Sparkles, Trash2, TrendingUp, FileText } from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, Badge, EmptyState, ConfirmModal } from '../components/UI';
import { useAsync } from '../components/UI';
import { fmtDate, relativeDay, categoryColor } from '../lib/format';

const STATUS_FLOW = ['saved', 'planning', 'applied', 'shortlisted', 'interview', 'selected', 'rejected'];
const STATUS_STYLE = {
  saved: 'bg-slate-100 text-slate-600',
  planning: 'bg-sky-100 text-sky-700',
  applied: 'bg-brand-100 text-brand-700',
  shortlisted: 'bg-violet-100 text-violet-700',
  interview: 'bg-amber-100 text-amber-700',
  selected: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function Applications() {
  const { data: listData, loading, reload } = useAsync(() => api.get('/applications'));
  const { data: analytics } = useAsync(() => api.get('/applications/analytics'));
  const [confirm, setConfirm] = useState(null);
  const [assisting, setAssisting] = useState(null);
  const [filter, setFilter] = useState('all');

  if (loading) return <PageLoader />;

  const applications = listData?.applications || [];
  const visible = filter === 'all' ? applications : applications.filter((a) => a.status === filter);

  const updateStatus = async (id, status) => {
    await api.patch(`/applications/${id}`, { status });
    reload();
  };

  const remove = async (id) => {
    await api.delete(`/applications/${id}`);
    reload();
  };

  const aiAssist = async (app) => {
    setAssisting(app._id);
    try {
      await api.post(`/applications/${app._id}/ai-assist`);
      reload();
    } finally {
      setAssisting(null);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Applications</h1>
        <p className="page-subtitle">Track every opportunity you've saved or applied to.</p>
      </div>

      {/* Analytics */}
      {analytics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="!p-4">
            <p className="text-2xl font-bold text-slate-900">{analytics.total}</p>
            <p className="text-xs text-slate-500">Total tracked</p>
          </Card>
          <Card className="!p-4">
            <p className="text-2xl font-bold text-brand-600">{analytics.active}</p>
            <p className="text-xs text-slate-500">Active applications</p>
          </Card>
          <Card className="!p-4">
            <p className="text-2xl font-bold text-emerald-600">{analytics.successRate}%</p>
            <p className="text-xs text-slate-500">Success rate</p>
          </Card>
          <Card className="!p-4">
            <p className="text-2xl font-bold text-violet-600">{analytics.counts?.shortlisted || 0}</p>
            <p className="text-xs text-slate-500">Shortlisted</p>
          </Card>
        </div>
      ) : null}

      {/* Funnel */}
      {analytics ? (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-brand-600" />
            <h3 className="font-semibold text-slate-800">Your journey</h3>
          </div>
          <div className="flex flex-wrap items-end gap-1">
            {STATUS_FLOW.map((s) => (
              <div key={s} className="flex-1 min-w-[70px] text-center">
                <div
                  className="rounded-t-lg mx-0.5 transition-all"
                  style={{
                    height: `${Math.max(8, ((analytics.counts?.[s] || 0) / Math.max(1, analytics.total)) * 90)}px`,
                    backgroundColor: s === 'selected' ? '#10b981' : s === 'rejected' ? '#ef4444' : '#6366f1',
                    opacity: analytics.counts?.[s] ? 1 : 0.25,
                  }}
                />
                <p className="text-[10px] font-medium text-slate-500 mt-1 capitalize">{s}</p>
                <p className="text-xs font-bold text-slate-700">{analytics.counts?.[s] || 0}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {['all', ...STATUS_FLOW].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
              filter === s ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={Send}
            title="No applications here"
            message="Save or apply to opportunities and track them here."
            action={
              <Link to="/opportunities" className="btn-primary">
                Browse opportunities
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((app) => (
            <Card key={app._id}>
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/opportunities/${app.opportunity?._id}`} className="font-semibold text-slate-900 hover:text-brand-700 transition">
                      {app.opportunity?.title || 'Opportunity'}
                    </Link>
                    <Badge className={categoryColor(app.opportunity?.category)}>{app.opportunity?.category}</Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{app.opportunity?.organization}</p>
                  {app.notes ? <p className="text-xs text-slate-400 mt-1 line-clamp-1">📝 {app.notes}</p> : null}
                  {app.aiAssist?.coverLetter ? (
                    <div className="mt-2 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2">
                      <p className="text-[11px] font-semibold text-violet-600 mb-1">🤖 AI cover letter ready</p>
                      <p className="text-xs text-violet-800 line-clamp-2">{app.aiAssist.coverLetter}</p>
                    </div>
                  ) : null}
                  <p className="text-[11px] text-slate-400 mt-1.5">Updated {fmtDate(app.updatedAt)}</p>
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 items-start lg:items-end">
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app._id, e.target.value)}
                    className={`input !w-auto !py-1.5 text-xs font-medium ${STATUS_STYLE[app.status] || ''} !border-transparent`}
                  >
                    {STATUS_FLOW.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => aiAssist(app)}
                      disabled={assisting === app._id}
                      className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 disabled:opacity-50"
                    >
                      <Sparkles size={13} /> {assisting === app._id ? 'Generating…' : 'AI assist'}
                    </button>
                    <button onClick={() => setConfirm(app)} className="p-1 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition" aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm._id)}
        title="Remove application?"
        message="This will remove the application from your tracker."
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}
