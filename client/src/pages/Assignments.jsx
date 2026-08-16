import { useState } from 'react';
import { ClipboardList, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, Badge, Modal, Field, EmptyState, ConfirmModal, ErrorBanner } from '../components/UI';
import { useAsync } from '../components/UI';
import PulsatingButton from '../components/PulsatingButton';
import { fmtDate, relativeDay } from '../lib/format';
import { useAuth } from '../context/AuthContext';

const PRIORITY_STYLE = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
};

export default function Assignments() {
  const { isStudent, isFaculty, isAdmin, user } = useAuth();
  const userId = user?.id;
  const { data, loading, error, reload } = useAsync(() => api.get('/assignments'));
  const [filter, setFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  if (loading) return <PageLoader />;
  if (error) return <div className="card p-8 text-center text-slate-500">{error.message}</div>;

  const assignments = data?.assignments || [];
  const canManage = isFaculty || isAdmin;

  const visible = assignments.filter((a) => {
    if (filter === 'all') return true;
    const sub = a.submissions?.find((s) => String(s.student) === String(userId));
    const done = sub && ['submitted', 'graded'].includes(sub.status);
    return filter === 'done' ? done : !done;
  });

  const submitAssignment = async (id) => {
    await api.patch(`/assignments/${id}/submit`, {});
    reload();
  };

  const remove = async (id) => {
    await api.delete(`/assignments/${id}`);
    reload();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Assignments</h1>
          <p className="page-subtitle">Everything due, sorted by deadline.</p>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'pending', 'done'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium capitalize transition ${
                filter === f ? 'bg-brand-600 text-white' : 'bg-white/60 backdrop-blur-md text-slate-600 border border-white/60 hover:bg-white/80'
              }`}
            >
              {f}
            </button>
          ))}
          {canManage ? (
            <PulsatingButton onClick={() => setCreateOpen(true)}>
              + New
            </PulsatingButton>
          ) : null}
        </div>
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState icon={ClipboardList} title="No assignments here" message="When your teachers post assignments, they'll appear here with deadlines and submission status." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((a) => {
            const sub = a.submissions?.find((s) => String(s.student) === String(userId));
            const done = sub && ['submitted', 'graded'].includes(sub.status);
            const overdue = !done && new Date(a.dueDate) < new Date();
            return (
              <Card key={a._id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={PRIORITY_STYLE[a.priority] || PRIORITY_STYLE.medium}>{a.priority}</Badge>
                  <Badge className="bg-slate-100 text-slate-600">{a.type}</Badge>
                </div>
                <h3 className="font-semibold text-slate-900 leading-snug">{a.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {a.subjectName} · Sem {a.semester}
                </p>
                {a.description ? <p className="text-sm text-slate-600 mt-2 line-clamp-2 flex-1">{a.description}</p> : <div className="flex-1" />}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm">
                    {overdue ? (
                      <AlertTriangle size={16} className="text-red-500" />
                    ) : done ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <Clock size={16} className="text-slate-400" />
                    )}
                    <span className={overdue ? 'text-red-600 font-semibold' : done ? 'text-emerald-600 font-semibold' : 'text-slate-600'}>
                      {done ? 'Submitted' : relativeDay(a.dueDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage ? (
                      <button onClick={() => setConfirm(a)} className="text-xs text-red-600 hover:text-red-700 font-medium">
                        Delete
                      </button>
                    ) : done ? (
                      <span className="text-xs text-slate-400">Max {a.maxMarks}</span>
                    ) : (
                      <button onClick={() => submitAssignment(a._id)} className="btn-primary !py-1.5 !px-3 text-xs">
                        Mark submitted
                      </button>
                    )}
                  </div>
                </div>
                {a.faculty?.name ? <p className="text-[11px] text-slate-400 mt-2">by {a.faculty.name}</p> : null}
              </Card>
            );
          })}
        </div>
      )}

      {canManage ? <CreateAssignmentModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} /> : null}
      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm._id)}
        title="Delete assignment?"
        message={confirm ? `Delete "${confirm.title}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function CreateAssignmentModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', subjectName: '', type: 'assignment', dueDate: '', priority: 'medium', semester: 1, maxMarks: 100 });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/assignments', { ...form, dueDate: new Date(form.dueDate).toISOString() });
      onClose();
      onCreated();
      setForm({ title: '', description: '', subjectName: '', type: 'assignment', dueDate: '', priority: 'medium', semester: 1, maxMarks: 100 });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New assignment" wide>
      <ErrorBanner error={error} />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <input required className="input" value={form.title} onChange={set('title')} placeholder="e.g. DBMS ER Diagram" />
        </Field>
        <Field label="Description">
          <textarea className="input min-h-[80px]" value={form.description} onChange={set('description')} placeholder="What should students do?" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Subject">
            <input className="input" value={form.subjectName} onChange={set('subjectName')} placeholder="e.g. DBMS" />
          </Field>
          <Field label="Type">
            <select className="input" value={form.type} onChange={set('type')}>
              <option value="assignment">Assignment</option>
              <option value="project">Project</option>
              <option value="quiz">Quiz</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Due date">
            <input type="date" required className="input" value={form.dueDate} onChange={set('dueDate')} />
          </Field>
          <Field label="Priority">
            <select className="input" value={form.priority} onChange={set('priority')}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Semester">
            <input type="number" min="1" className="input" value={form.semester} onChange={set('semester')} />
          </Field>
          <Field label="Max marks">
            <input type="number" min="1" className="input" value={form.maxMarks} onChange={set('maxMarks')} />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
