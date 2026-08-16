import { useState } from 'react';
import { Users, Megaphone, UserPlus, UserCheck, Bell, BellOff, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, Badge, Modal, Field, EmptyState, ErrorBanner } from '../components/UI';
import { useAsync } from '../components/UI';
import PulsatingButton from '../components/PulsatingButton';
import { useAuth } from '../context/AuthContext';

const CATEGORY_STYLE = {
  technical: 'bg-brand-100 text-brand-700',
  cultural: 'bg-pink-100 text-pink-700',
  sports: 'bg-emerald-100 text-emerald-700',
  literary: 'bg-amber-100 text-amber-700',
  other: 'bg-slate-100 text-slate-600',
};

export default function Clubs() {
  const { user, isFaculty, isAdmin } = useAuth();
  const { data, loading, reload } = useAsync(() => api.get('/clubs'));
  const [createOpen, setCreateOpen] = useState(false);

  if (loading) return <PageLoader />;

  const clubs = data?.clubs || [];
  const canManage = isFaculty || isAdmin;

  const join = async (id) => {
    await api.post(`/clubs/${id}/join`);
    reload();
  };
  const follow = async (id) => {
    await api.post(`/clubs/${id}/follow`);
    reload();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Clubs</h1>
          <p className="page-subtitle">Join communities, follow announcements, find your people.</p>
        </div>
        {canManage ? (
          <PulsatingButton onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> New club
          </PulsatingButton>
        ) : null}
      </div>

      {clubs.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No clubs yet" message="Clubs will appear here once they're created." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clubs.map((c) => (
            <Card key={c._id} className="flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
                  {c.name.slice(0, 1).toUpperCase()}
                </div>
                <Badge className={CATEGORY_STYLE[c.category] || CATEGORY_STYLE.other}>{c.category}</Badge>
              </div>
              <h3 className="font-semibold text-slate-900">{c.name}</h3>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{c.description}</p>
              {c.facultyAdvisor ? <p className="text-xs text-slate-400 mt-1.5">Advisor: {c.facultyAdvisor}</p> : null}
              <p className="text-xs text-slate-400 mt-1">
                {c.members?.length || 0} members · {c.followers?.length || 0} followers
              </p>

              {c.announcements?.length ? (
                <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1 mb-1">
                    <Megaphone size={14} /> Latest announcement
                  </p>
                  <p className="text-xs text-slate-600 font-medium line-clamp-1">{c.announcements[0].title}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{c.announcements[0].content}</p>
                </div>
              ) : null}

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => join(c._id)}
                  className={c.isMember ? 'btn-secondary !py-1.5 !px-3 text-xs !text-emerald-700 !border-emerald-300 !bg-emerald-50' : 'btn-primary !py-1.5 !px-3 text-xs'}
                >
                  {c.isMember ? <UserCheck size={14} /> : <UserPlus size={14} />}
                  {c.isMember ? 'Member' : 'Join'}
                </button>
                <button onClick={() => follow(c._id)} className="btn-secondary !py-1.5 !px-3 text-xs">
                  {c.isFollowing ? <BellOff size={14} /> : <Bell size={14} />}
                  {c.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateClubModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
    </div>
  );
}

function CreateClubModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', category: 'technical', facultyAdvisor: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/clubs', form);
      onClose();
      onCreated();
      setForm({ name: '', description: '', category: 'technical', facultyAdvisor: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create club">
      <ErrorBanner error={error} />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name">
          <input required className="input" value={form.name} onChange={set('name')} placeholder="e.g. Robotics Club" />
        </Field>
        <Field label="Description">
          <textarea className="input min-h-[70px]" value={form.description} onChange={set('description')} placeholder="What does the club do?" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select className="input" value={form.category} onChange={set('category')}>
              {['technical', 'cultural', 'sports', 'literary', 'other'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Faculty advisor">
            <input className="input" value={form.facultyAdvisor} onChange={set('facultyAdvisor')} placeholder="Prof. Mehta" />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create club'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
