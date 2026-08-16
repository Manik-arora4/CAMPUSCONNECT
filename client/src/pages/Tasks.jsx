import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Sparkles, CheckSquare } from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, Badge, Modal, Field, EmptyState, ConfirmModal, ErrorBanner } from '../components/UI';
import { useAsync } from '../components/UI';
import { fmtDate, relativeDay } from '../lib/format';

const PRIORITY_STYLE = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
};

const CATEGORY_STYLE = {
  study: 'bg-brand-100 text-brand-700',
  assignment: 'bg-violet-100 text-violet-700',
  career: 'bg-emerald-100 text-emerald-700',
  personal: 'bg-sky-100 text-sky-700',
};

export default function Tasks() {
  const { data, loading, reload } = useAsync(() => api.get('/tasks'));
  const [modalOpen, setModalOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  if (loading) return <PageLoader />;

  const tasks = data?.tasks || [];
  const pending = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');

  const toggle = async (t) => {
    await api.patch(`/tasks/${t._id}`, { status: t.status === 'done' ? 'todo' : 'done' });
    reload();
  };

  const remove = async (id) => {
    await api.delete(`/tasks/${id}`);
    reload();
  };

  const prioritize = async () => {
    setAiLoading(true);
    try {
      const res = await api.get('/tasks/prioritized');
      // API returns sorted tasks; just reload to reflect (priorities persist on server)
      reload();
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Your to-dos across study, assignments and career.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={prioritize} disabled={aiLoading}>
            <Sparkles size={16} className="text-violet-600" />
            {aiLoading ? 'Prioritizing…' : 'AI prioritize'}
          </button>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending */}
        <Card>
          <h3 className="font-semibold text-slate-800 mb-4">
            To do <span className="text-slate-400 font-normal text-sm">({pending.length})</span>
          </h3>
          {pending.length === 0 ? (
            <EmptyState icon={CheckSquare} title="All done!" message="No pending tasks. Add one or enjoy the free time." />
          ) : (
            <div className="space-y-2">
              {pending.map((t) => (
                <TaskRow key={t._id} t={t} onToggle={toggle} onDelete={() => setConfirm(t)} />
              ))}
            </div>
          )}
        </Card>

        {/* Completed */}
        <Card>
          <h3 className="font-semibold text-slate-800 mb-4">
            Completed <span className="text-slate-400 font-normal text-sm">({done.length})</span>
          </h3>
          {done.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nothing completed yet" message="Check off a task and it will land here." />
          ) : (
            <div className="space-y-2">
              {done.map((t) => (
                <TaskRow key={t._id} t={t} onToggle={toggle} onDelete={() => setConfirm(t)} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={reload} />
      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm._id)}
        title="Delete task?"
        message={confirm ? `Delete "${confirm.title}"?` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function TaskRow({ t, onToggle, onDelete }) {
  const overdue = t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date();
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 transition ${t.status === 'done' ? 'border-slate-100 bg-slate-50/50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
      <button onClick={() => onToggle(t)} className="mt-0.5 text-slate-300 hover:text-brand-600 transition shrink-0" aria-label="Toggle">
        {t.status === 'done' ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Circle size={20} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${t.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{t.title}</p>
        {t.description ? <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{t.description}</p> : null}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <Badge className={CATEGORY_STYLE[t.category] || 'bg-slate-100 text-slate-600'}>{t.category}</Badge>
          <Badge className={PRIORITY_STYLE[t.priority] || PRIORITY_STYLE.medium}>{t.priority}</Badge>
          {t.subject ? <Badge className="bg-slate-100 text-slate-600">{t.subject}</Badge> : null}
          {t.dueDate ? (
            <span className={`text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
              {overdue ? 'Overdue · ' : ''}
              {relativeDay(t.dueDate)}
            </span>
          ) : null}
        </div>
      </div>
      <button onClick={onDelete} className="p-1 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition shrink-0" aria-label="Delete">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function TaskModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', subject: '', category: 'study', dueDate: '', priority: 'medium' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/tasks', form);
      onClose();
      onCreated();
      setForm({ title: '', description: '', subject: '', category: 'study', dueDate: '', priority: 'medium' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New task">
      <ErrorBanner error={error} />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <input required className="input" value={form.title} onChange={set('title')} placeholder="e.g. Finish DBMS assignment" />
        </Field>
        <Field label="Description (optional)">
          <input className="input" value={form.description} onChange={set('description')} placeholder="Details…" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select className="input" value={form.category} onChange={set('category')}>
              <option value="study">Study</option>
              <option value="assignment">Assignment</option>
              <option value="career">Career</option>
              <option value="personal">Personal</option>
            </select>
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
          <Field label="Subject (optional)">
            <input className="input" value={form.subject} onChange={set('subject')} placeholder="e.g. DBMS" />
          </Field>
          <Field label="Due date">
            <input type="date" className="input" value={form.dueDate} onChange={set('dueDate')} />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Add task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
