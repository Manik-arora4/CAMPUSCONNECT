import { useState } from 'react';
import { GraduationCap, Plus, Trash2, MapPin, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, Badge, Modal, Field, EmptyState, ConfirmModal, ErrorBanner } from '../components/UI';
import { useAsync } from '../components/UI';
import { fmtDate, fmtTime, daysBetween, relativeDay } from '../lib/format';
import { useAuth } from '../context/AuthContext';

export default function Exams() {
  const { isFaculty, isAdmin } = useAuth();
  const { data, loading, reload } = useAsync(() => api.get('/exams'));
  const [createOpen, setCreateOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  if (loading) return <PageLoader />;

  const exams = data?.exams || [];
  const canManage = isFaculty || isAdmin;

  const remove = async (id) => {
    await api.delete(`/exams/${id}`);
    reload();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Exams</h1>
          <p className="page-subtitle">Upcoming exams for your semester.</p>
        </div>
        {canManage ? (
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Schedule exam
          </button>
        ) : null}
      </div>

      {exams.length === 0 ? (
        <Card>
          <EmptyState icon={GraduationCap} title="No exams scheduled" message="Exam dates will appear here once announced." />
        </Card>
      ) : (
        <div className="space-y-3">
          {exams.map((e) => {
            const diff = daysBetween(new Date(), e.date);
            const upcoming = diff >= 0;
            return (
              <Card key={e._id} className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div
                  className={`h-14 w-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${
                    upcoming ? (diff <= 5 ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700') : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <span className="text-lg font-bold leading-none">{new Date(e.date).getDate()}</span>
                  <span className="text-[10px] uppercase font-semibold">{new Date(e.date).toLocaleString('en', { month: 'short' })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900">{e.title}</h3>
                    <Badge className="bg-slate-100 text-slate-600">{e.type}</Badge>
                    {!upcoming ? <Badge className="bg-slate-100 text-slate-400">Done</Badge> : null}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {e.subjectName} · Sem {e.semester} · Max marks {e.maxMarks}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} /> {fmtTime(e.startTime)} – {fmtTime(e.endTime)}
                    </span>
                    {e.room ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} /> {e.room}
                      </span>
                    ) : null}
                    <span className="font-medium">{upcoming ? relativeDay(e.date) : `Was ${relativeDay(e.date)}`}</span>
                  </div>
                </div>
                {canManage ? (
                  <button onClick={() => setConfirm(e)} className="btn-ghost !p-2 text-red-600 hover:bg-red-50 shrink-0" aria-label="Delete exam">
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <CreateExamModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm._id)}
        title="Delete exam?"
        message={confirm ? `Delete "${confirm.title}"?` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function CreateExamModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', subjectName: '', type: 'midterm', semester: 1, date: '', startTime: '10:00', endTime: '13:00', room: '', maxMarks: 100 });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/exams', { ...form, date: new Date(form.date).toISOString() });
      onClose();
      onCreated();
      setForm({ title: '', subjectName: '', type: 'midterm', semester: 1, date: '', startTime: '10:00', endTime: '13:00', room: '', maxMarks: 100 });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Schedule exam">
      <ErrorBanner error={error} />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <input required className="input" value={form.title} onChange={set('title')} placeholder="e.g. DBMS Mid-Semester" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Subject">
            <input className="input" value={form.subjectName} onChange={set('subjectName')} placeholder="e.g. DBMS" />
          </Field>
          <Field label="Type">
            <select className="input" value={form.type} onChange={set('type')}>
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="quiz">Quiz</option>
              <option value="practical">Practical</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date">
            <input type="date" required className="input" value={form.date} onChange={set('date')} />
          </Field>
          <Field label="Semester">
            <input type="number" min="1" className="input" value={form.semester} onChange={set('semester')} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Start">
            <input type="time" className="input" value={form.startTime} onChange={set('startTime')} />
          </Field>
          <Field label="End">
            <input type="time" className="input" value={form.endTime} onChange={set('endTime')} />
          </Field>
          <Field label="Max marks">
            <input type="number" min="1" className="input" value={form.maxMarks} onChange={set('maxMarks')} />
          </Field>
        </div>
        <Field label="Room">
          <input className="input" value={form.room} onChange={set('room')} placeholder="Hall A" />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Scheduling…' : 'Schedule exam'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
