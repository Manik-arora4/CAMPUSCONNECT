import { useState } from 'react';
import { Plus, Copy, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, Modal, Field, EmptyState, ConfirmModal, ErrorBanner } from '../components/UI';
import { useAsync } from '../components/UI';
import PulsatingButton from '../components/PulsatingButton';
import { fmtTime, DAYS, todayIndex } from '../lib/format';
import { CalendarDays } from 'lucide-react';

const TYPE_STYLES = {
  class: 'border-l-4',
  lab: 'border-l-4 border-dashed',
  free: 'border-l-4 opacity-60',
  other: 'border-l-4',
};

export default function Timetable() {
  const { data, loading, error, reload } = useAsync(() => api.get('/timetable'));
  const [modalOpen, setModalOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [formError, setFormError] = useState('');

  if (loading) return <PageLoader />;

  const slots = data?.slots || [];
  const conflicts = data?.conflicts || [];
  const today = todayIndex();

  const saveSlot = async (form) => {
    setFormError('');
    try {
      await api.post('/timetable', form);
      setModalOpen(false);
      reload();
    } catch (e) {
      setFormError(e.message);
      throw e;
    }
  };

  const duplicate = async (slot) => {
    const day = (slot.day + 1) % 7;
    await api.post(`/timetable/${slot._id}/duplicate`, { day });
    reload();
  };

  const remove = async (id) => {
    await api.delete(`/timetable/${id}`);
    reload();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Timetable</h1>
          <p className="page-subtitle">Your weekly class schedule. Tap a day to see classes.</p>
        </div>
        <PulsatingButton onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add class
        </PulsatingButton>
      </div>

      {conflicts.length > 0 ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{conflicts.length} time conflict{conflicts.length > 1 ? 's' : ''} detected</p>
            <p className="text-sm text-amber-700">
              {conflicts.map((c) => `${DAYS[c.day]} · ${c.a.subjectName} ${c.a.startTime}–${c.a.endTime} overlaps ${c.b.subjectName}`).join(' · ')}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {DAYS.map((day, idx) => {
          const daySlots = slots.filter((s) => s.day === idx).sort((a, b) => a.startTime.localeCompare(b.startTime));
          const isToday = idx === today;
          return (
            <Card key={day} className={isToday ? 'ring-2 ring-brand-500' : ''}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold ${isToday ? 'text-brand-700' : 'text-slate-800'}`}>
                  {day}
                  {isToday ? <span className="ml-2 text-[10px] font-bold uppercase tracking-wide bg-brand-100 text-brand-700 rounded-full px-2 py-0.5">Today</span> : null}
                </h3>
                <span className="text-xs text-slate-400">{daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}</span>
              </div>
              {daySlots.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No classes</p>
              ) : (
                <div className="space-y-2">
                  {daySlots.map((s) => (
                    <div
                      key={s._id}
                      className={`rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 ${TYPE_STYLES[s.type] || TYPE_STYLES.class}`}
                      style={{ borderLeftColor: s.color || '#6366f1' }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{s.subjectName}</p>
                          <p className="text-xs text-slate-500">
                            {fmtTime(s.startTime)} – {fmtTime(s.endTime)}
                            {s.room ? ` · ${s.room}` : ''}
                          </p>
                          {s.teacherName ? <p className="text-[11px] text-slate-400 mt-0.5 truncate">{s.teacherName}</p> : null}
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={() => duplicate(s)} className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-white transition" title="Copy to next day">
                            <Copy size={14} />
                          </button>
                          <button onClick={() => setConfirm(s)} className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <SlotModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={saveSlot} error={formError} />

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm._id)}
        title="Delete this class?"
        message={confirm ? `Remove "${confirm.subjectName}" (${DAYS[confirm.day]}, ${fmtTime(confirm.startTime)}) from your timetable?` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function SlotModal({ open, onClose, onSave, error }) {
  const [form, setForm] = useState({ subjectName: '', teacherName: '', room: '', day: todayIndex(), startTime: '09:00', endTime: '10:00', color: '#6366f1', type: 'class' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      setForm({ subjectName: '', teacherName: '', room: '', day: todayIndex(), startTime: '09:00', endTime: '10:00', color: '#6366f1', type: 'class' });
    } catch {
      /* error shown via prop */
    } finally {
      setSaving(false);
    }
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#64748b'];

  return (
    <Modal open={open} onClose={onClose} title="Add class to timetable">
      <ErrorBanner error={error} />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Subject">
          <input required className="input" value={form.subjectName} onChange={set('subjectName')} placeholder="e.g. Data Structures" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Teacher (optional)">
            <input className="input" value={form.teacherName} onChange={set('teacherName')} placeholder="Prof. Mehta" />
          </Field>
          <Field label="Room (optional)">
            <input className="input" value={form.room} onChange={set('room')} placeholder="Room 103" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Day">
            <select className="input" value={form.day} onChange={set('day')}>
              {DAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Type">
            <select className="input" value={form.type} onChange={set('type')}>
              <option value="class">Class</option>
              <option value="lab">Lab</option>
              <option value="free">Free period</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start">
            <input type="time" required className="input" value={form.startTime} onChange={set('startTime')} />
          </Field>
          <Field label="End">
            <input type="time" required className="input" value={form.endTime} onChange={set('endTime')} />
          </Field>
        </div>
        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className={`h-8 w-8 rounded-full transition ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Add class'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
