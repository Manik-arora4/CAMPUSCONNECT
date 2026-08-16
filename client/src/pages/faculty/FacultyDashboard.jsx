import { useState } from 'react';
import { BookOpen, ClipboardList, Megaphone, Users, Plus, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, Card, StatCard, Badge, Modal, Field, EmptyState, ErrorBanner, Tabs } from '../../components/UI';
import { useAsync } from '../../components/UI';
import PulsatingButton from '../../components/PulsatingButton';
import { fmtDate, relativeDay } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { data, loading, reload } = useAsync(() => api.get('/faculty/dashboard'));
  const [tab, setTab] = useState('overview');
  const [noticeOpen, setNoticeOpen] = useState(false);

  if (loading) return <PageLoader />;

  const { stats, subjects, assignments, notices, events } = data;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Faculty Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]} — manage your classes and announcements.</p>
        </div>
        <PulsatingButton onClick={() => setNoticeOpen(true)}>
          <Megaphone size={16} /> Announce
        </PulsatingButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Classes you teach" value={stats.classes} tone="brand" />
        <StatCard icon={ClipboardList} label="Assignments" value={stats.assignments} tone="violet" />
        <StatCard icon={Megaphone} label="Notices posted" value={stats.notices} tone="amber" />
        <StatCard icon={Users} label="College students" value={stats.students} tone="emerald" />
      </div>

      <Tabs
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'classes', label: `My classes (${subjects.length})` },
          { key: 'assignments', label: `Assignments (${assignments.length})` },
          { key: 'notices', label: 'My notices' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <h3 className="font-semibold text-slate-800 mb-4">My classes</h3>
            {subjects.length === 0 ? (
              <p className="text-sm text-slate-400">No subjects assigned yet.</p>
            ) : (
              <div className="space-y-2.5">
                {subjects.map((s) => (
                  <div key={s._id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3.5 py-2.5">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: s.color || '#6366f1' }}>
                      {s.name.slice(0, 1)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400">
                        {s.code} · Sem {s.semester}
                      </p>
                    </div>
                    <Badge className="bg-slate-100 text-slate-500">Sem {s.semester}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <h3 className="font-semibold text-slate-800 mb-4">Upcoming events</h3>
            {events.length === 0 ? (
              <p className="text-sm text-slate-400">No events scheduled.</p>
            ) : (
              <div className="space-y-2.5">
                {events.slice(0, 5).map((e) => (
                  <div key={e._id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-2.5">
                    <p className="text-sm font-medium text-slate-700 truncate">{e.title}</p>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">{relativeDay(e.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {tab === 'classes' ? (
        <Card>
          {subjects.length === 0 ? (
            <EmptyState icon={BookOpen} title="No classes assigned" message="Your assigned subjects will appear here." />
          ) : (
            <div className="space-y-2.5">
              {subjects.map((s) => (
                <div key={s._id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: s.color || '#6366f1' }}>
                    {s.name.slice(0, 1)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-400">
                      {s.code} · Semester {s.semester} · {s.department?.name || ''}
                    </p>
                  </div>
                  <a href="/assignments" className="btn-secondary !py-1.5 !px-3 text-xs">
                    Manage
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      {tab === 'assignments' ? (
        <Card>
          {assignments.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No assignments yet"
              action={
                <a href="/assignments" className="btn-primary">
                  Create one
                </a>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {assignments.map((a) => (
                <div key={a._id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-400">
                      {a.subjectName} · Sem {a.semester} · Max {a.maxMarks}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold shrink-0 ${new Date(a.dueDate) < new Date() ? 'text-red-600' : 'text-slate-500'}`}>
                    {relativeDay(a.dueDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      {tab === 'notices' ? (
        <Card>
          {notices.length === 0 ? (
            <EmptyState icon={Megaphone} title="No notices yet" message="Post your first announcement." />
          ) : (
            <div className="space-y-2.5">
              {notices.map((n) => (
                <div key={n._id} className="rounded-xl border border-slate-100 px-4 py-3">
                  <p className="font-medium text-slate-800">
                    {n.important ? <span className="text-red-500 mr-1">●</span> : null}
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.content}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{fmtDate(n.date)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      <AnnounceModal open={noticeOpen} onClose={() => setNoticeOpen(false)} onCreated={reload} />
    </div>
  );
}

function AnnounceModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', content: '', category: 'general', important: false });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/faculty/announcements', form);
      onClose();
      onCreated();
      setForm({ title: '', content: '', category: 'general', important: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Post announcement" wide>
      <ErrorBanner error={error} />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <input required className="input" value={form.title} onChange={set('title')} placeholder="e.g. Class cancelled tomorrow" />
        </Field>
        <Field label="Content">
          <textarea required className="input min-h-[100px]" value={form.content} onChange={set('content')} placeholder="Announcement details…" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select className="input" value={form.category} onChange={set('category')}>
              {['general', 'exam', 'event', 'placement', 'holiday', 'fee'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Important">
            <select className="input" value={String(form.important)} onChange={(e) => setForm((f) => ({ ...f, important: e.target.value === 'true' }))}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Posting…' : 'Post announcement'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
