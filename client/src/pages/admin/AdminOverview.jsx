import { useState } from 'react';
import { Users, UserCircle2, Briefcase, Send, Megaphone, CalendarClock, Users2, Activity, CheckCircle2, MessageSquare } from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, Card, StatCard, Badge, Modal, Field, ErrorBanner } from '../../components/UI';
import { useAsync } from '../../components/UI';
import PulsatingButton from '../../components/PulsatingButton';
import { categoryColor } from '../../lib/format';

export default function AdminOverview() {
  const { data, loading, reload } = useAsync(() => api.get('/admin/analytics'));
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  if (loading) return <PageLoader />;

  const { totals, engagement, oppByStatus, appByStatus, oppByCategory, engagementByDay } = data;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Admin Overview</h1>
          <p className="page-subtitle">Campus-wide analytics at a glance.</p>
        </div>
        <PulsatingButton onClick={() => setBroadcastOpen(true)}>
          <MessageSquare size={16} /> Broadcast
        </PulsatingButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Students" value={totals.students} tone="brand" />
        <StatCard icon={UserCircle2} label="Faculty" value={totals.faculty} tone="violet" />
        <StatCard icon={Briefcase} label="Opportunities" value={totals.opportunities} tone="emerald" />
        <StatCard icon={Send} label="Applications" value={totals.applications} tone="sky" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Megaphone} label="Notices" value={totals.notices} tone="amber" />
        <StatCard icon={CalendarClock} label="Events" value={totals.events} tone="pink" />
        <StatCard icon={Users2} label="Clubs" value={totals.clubs} tone="teal" />
        <StatCard icon={Activity} label="Active this week" value={engagement.activeUsers} tone="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Opportunity status */}
        <Card>
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Briefcase size={18} className="text-brand-600" /> Opportunities by status
          </h3>
          <div className="space-y-3">
            {['verified', 'pending', 'rejected'].map((s) => {
              const item = oppByStatus.find((o) => o._id === s);
              const count = item?.count || 0;
              return (
                <div key={s}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-slate-600">{s}</span>
                    <span className="font-semibold text-slate-800">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${s === 'verified' ? 'bg-emerald-500' : s === 'pending' ? 'bg-amber-500' : 'bg-red-400'}`}
                      style={{ width: `${totals.opportunities ? (count / totals.opportunities) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">Engagement this week: {engagement.eventsWeek} events · {engagement.applicationsWeek} application updates</p>
          </div>
        </Card>

        {/* Applications by status */}
        <Card>
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Send size={18} className="text-violet-600" /> Applications by status
          </h3>
          <div className="space-y-3">
            {['saved', 'applied', 'shortlisted', 'interview', 'selected', 'rejected'].map((s) => {
              const item = appByStatus.find((o) => o._id === s);
              const count = item?.count || 0;
              return (
                <div key={s} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-slate-600">{s}</span>
                  <span className="font-semibold text-slate-800">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Category breakdown */}
        <Card>
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Users2 size={18} className="text-emerald-600" /> Opportunities by category
          </h3>
          <div className="flex flex-wrap gap-2">
            {oppByCategory.map((c) => (
              <Badge key={c._id} className={categoryColor(c._id)}>
                {c._id} · {c.count}
              </Badge>
            ))}
          </div>
          {engagementByDay?.length ? (
            <div className="mt-5">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Activity last 7 days</p>
              <div className="flex items-end gap-1.5 h-20">
                {engagementByDay.map((d) => (
                  <div key={d._id} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-brand-500 to-violet-500"
                      style={{ height: `${Math.max(4, (d.count / Math.max(1, ...engagementByDay.map((x) => x.count))) * 60)}px` }}
                    />
                    <span className="text-[9px] text-slate-400">{new Date(d._id).getDate()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <BroadcastModal open={broadcastOpen} onClose={() => setBroadcastOpen(false)} onSent={reload} />
    </div>
  );
}

function BroadcastModal({ open, onClose, onSent }) {
  const [form, setForm] = useState({ title: '', message: '', category: 'college' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult('');
    setSaving(true);
    try {
      const res = await api.post('/admin/broadcast', form);
      setResult(res.message);
      onSent();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Broadcast to all students">
      <ErrorBanner error={error} />
      {result ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 mb-4">
          <CheckCircle2 size={16} /> {result}
        </div>
      ) : null}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <input required className="input" value={form.title} onChange={set('title')} placeholder="e.g. Placement drive announcement" />
        </Field>
        <Field label="Message">
          <textarea required className="input min-h-[80px]" value={form.message} onChange={set('message')} placeholder="What do all students need to know?" />
        </Field>
        <Field label="Category">
          <select className="input" value={form.category} onChange={set('category')}>
            {['college', 'academic', 'opportunity', 'event', 'system'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Sending…' : 'Send broadcast'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
