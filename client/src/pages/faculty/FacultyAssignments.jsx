import { useState } from 'react';
import { Plus, Trash2, ClipboardList } from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, Card, Badge, Modal, Field, EmptyState, ConfirmModal, ErrorBanner } from '../../components/UI';
import { useAsync } from '../../components/UI';
import PulsatingButton from '../../components/PulsatingButton';
import { relativeDay } from '../../lib/format';

export default function FacultyAssignments() {
  const { data, loading, reload } = useAsync(() => api.get('/assignments'));
  const [createOpen, setCreateOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  if (loading) return <PageLoader />;

  const assignments = data?.assignments || [];

  const remove = async (id) => {
    await api.delete(`/assignments/${id}`);
    reload();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Manage Assignments</h1>
          <p className="page-subtitle">Create and track assignments for your college.</p>
        </div>
        <PulsatingButton onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> New assignment
        </PulsatingButton>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <EmptyState icon={ClipboardList} title="No assignments" message="Create your first assignment to get started." />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="py-2.5 pr-4 font-semibold">Title</th>
                  <th className="py-2.5 pr-4 font-semibold">Subject</th>
                  <th className="py-2.5 pr-4 font-semibold">Semester</th>
                  <th className="py-2.5 pr-4 font-semibold">Due</th>
                  <th className="py-2.5 pr-4 font-semibold">Priority</th>
                  <th className="py-2.5 font-semibold">Submissions</th>
                  <th className="py-2.5" />
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const subCount = a.submissions?.length || 0;
                  const submitted = a.submissions?.filter((s) => ['submitted', 'graded'].includes(s.status)).length || 0;
                  return (
                    <tr key={a._id} className="border-b border-slate-50 last:border-0">
                      <td className="py-3 pr-4 font-medium text-slate-800">{a.title}</td>
                      <td className="py-3 pr-4 text-slate-500">{a.subjectName}</td>
                      <td className="py-3 pr-4 text-slate-500">{a.semester}</td>
                      <td className="py-3 pr-4">
                        <span className={new Date(a.dueDate) < new Date() ? 'text-red-600 font-medium' : 'text-slate-500'}>{relativeDay(a.dueDate)}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge className={a.priority === 'high' ? 'bg-red-100 text-red-700' : a.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}>
                          {a.priority}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {submitted}/{subCount}
                      </td>
                      <td className="py-3 text-right">
                        <button onClick={() => setConfirm(a)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition" aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
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

function CreateModal({ open, onClose, onCreated }) {
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
          <textarea className="input min-h-[80px]" value={form.description} onChange={set('description')} placeholder="Instructions for students…" />
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
