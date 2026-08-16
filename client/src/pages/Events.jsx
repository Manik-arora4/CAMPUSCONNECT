import { useState } from 'react';
import { CalendarClock, MapPin, Users, ExternalLink, Plus, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, Badge, Modal, Field, EmptyState, ErrorBanner } from '../components/UI';
import { useAsync } from '../components/UI';
import { fmtDate, fmtTime, relativeDay } from '../lib/format';
import { useAuth } from '../context/AuthContext';

const CATEGORY_STYLE = {
  workshop: 'bg-purple-100 text-purple-700',
  hackathon: 'bg-violet-100 text-violet-700',
  talk: 'bg-sky-100 text-sky-700',
  fest: 'bg-pink-100 text-pink-700',
  sports: 'bg-emerald-100 text-emerald-700',
  cultural: 'bg-amber-100 text-amber-700',
  general: 'bg-slate-100 text-slate-600',
};

export default function Events() {
  const { isFaculty, isAdmin, user } = useAuth();
  const { data, loading, reload } = useAsync(() => api.get('/events', { upcoming: 'true' }));
  const [createOpen, setCreateOpen] = useState(false);

  if (loading) return <PageLoader />;

  const events = data?.events || [];
  const canManage = isFaculty || isAdmin;

  const register = async (id) => {
    await api.post(`/events/${id}/register`);
    reload();
  };

  const save = async (id) => {
    await api.post(`/events/${id}/save`);
    reload();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">Workshops, hackathons, talks and fests on campus.</p>
        </div>
        {canManage ? (
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Create event
          </button>
        ) : null}
      </div>

      {events.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarClock} title="No upcoming events" message="Events will appear here once they're announced." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((e) => {
            const registered = e.registeredStudents?.some((s) => String(s) === String(user?.id));
            const saved = e.savedBy?.some((s) => String(s) === String(user?.id));
            return (
              <Card key={e._id} className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={CATEGORY_STYLE[e.category] || CATEGORY_STYLE.general}>{e.category}</Badge>
                  <span className="text-xs text-slate-400">{relativeDay(e.date)}</span>
                </div>
                <h3 className="font-semibold text-slate-900 leading-snug">{e.title}</h3>
                {e.description ? <p className="text-sm text-slate-600 mt-1.5 line-clamp-3 flex-1">{e.description}</p> : <div className="flex-1" />}
                <div className="space-y-1 mt-3 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <CalendarClock size={14} className="text-slate-400" /> {fmtDate(e.date)} · {fmtTime(e.startTime)}–{fmtTime(e.endTime)}
                  </p>
                  {e.location ? (
                    <p className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-400" /> {e.location}
                    </p>
                  ) : null}
                  {e.organizer ? (
                    <p className="flex items-center gap-1.5">
                      <Users size={14} className="text-slate-400" /> {e.organizer}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  {!canManage ? (
                    <>
                      <button onClick={() => register(e._id)} className={registered ? 'btn-secondary !py-1.5 !px-3 text-xs' : 'btn-primary !py-1.5 !px-3 text-xs'}>
                        {registered ? <CheckCircle2 size={14} /> : null}
                        {registered ? 'Registered' : 'Register'}
                      </button>
                      <button onClick={() => save(e._id)} className={`btn-secondary !py-1.5 !px-3 text-xs ${saved ? '!text-brand-700 !border-brand-300 !bg-brand-50' : ''}`}>
                        {saved ? 'Saved' : 'Save'}
                      </button>
                    </>
                  ) : null}
                  {e.registrationLink ? (
                    <a href={e.registrationLink} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                      Register link <ExternalLink size={14} />
                    </a>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateEventModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
    </div>
  );
}

function CreateEventModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'workshop', date: '', startTime: '10:00', endTime: '16:00', location: '', organizer: '', registrationLink: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/events', { ...form, date: new Date(form.date).toISOString() });
      onClose();
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create event" wide>
      <ErrorBanner error={error} />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <input required className="input" value={form.title} onChange={set('title')} placeholder="e.g. AI & ML Workshop" />
        </Field>
        <Field label="Description">
          <textarea className="input min-h-[80px]" value={form.description} onChange={set('description')} placeholder="What's the event about?" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select className="input" value={form.category} onChange={set('category')}>
              {['workshop', 'hackathon', 'talk', 'fest', 'sports', 'cultural', 'general'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" required className="input" value={form.date} onChange={set('date')} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start">
            <input type="time" className="input" value={form.startTime} onChange={set('startTime')} />
          </Field>
          <Field label="End">
            <input type="time" className="input" value={form.endTime} onChange={set('endTime')} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Location">
            <input className="input" value={form.location} onChange={set('location')} placeholder="Seminar Hall" />
          </Field>
          <Field label="Organizer">
            <input className="input" value={form.organizer} onChange={set('organizer')} placeholder="AI/ML Club" />
          </Field>
        </div>
        <Field label="Registration link">
          <input className="input" value={form.registrationLink} onChange={set('registrationLink')} placeholder="https://…" />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create event'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
