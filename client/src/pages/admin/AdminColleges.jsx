import { useState } from 'react';
import { Plus, School, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, Card, Badge, Modal, Field, EmptyState, ConfirmModal, ErrorBanner } from '../../components/UI';
import { useAsync } from '../../components/UI';
import PulsatingButton from '../../components/PulsatingButton';

export default function AdminColleges() {
  const { data, loading, reload } = useAsync(() => api.get('/admin/colleges'));
  const [createOpen, setCreateOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  if (loading) return <PageLoader />;

  const colleges = data?.colleges || [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Colleges</h1>
          <p className="page-subtitle">All institutions on the platform.</p>
        </div>
        <PulsatingButton onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Add college
        </PulsatingButton>
      </div>

      {colleges.length === 0 ? (
        <Card>
          <EmptyState icon={School} title="No colleges yet" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {colleges.map((c) => (
            <Card key={c._id}>
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <School size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{c.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.city}, {c.state}
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <Badge className="bg-slate-100 text-slate-600">{c.code}</Badge>
                    {c.website ? (
                      <a href={c.website} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                        Website
                      </a>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Est. {c.establishedYear || '—'} · {c.contactEmail || 'no email'}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateCollegeModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
    </div>
  );
}

function CreateCollegeModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', code: '', city: '', state: '', website: '', contactEmail: '', contactPhone: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/admin/colleges', form);
      onClose();
      onCreated();
      setForm({ name: '', code: '', city: '', state: '', website: '', contactEmail: '', contactPhone: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add college">
      <ErrorBanner error={error} />
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name">
            <input required className="input" value={form.name} onChange={set('name')} placeholder="IIIT Ropar" />
          </Field>
          <Field label="Code">
            <input className="input" value={form.code} onChange={set('code')} placeholder="NIT" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="City">
            <input className="input" value={form.city} onChange={set('city')} placeholder="Rupnagar" />
          </Field>
          <Field label="State">
            <input className="input" value={form.state} onChange={set('state')} placeholder="Punjab" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Website">
            <input className="input" value={form.website} onChange={set('website')} placeholder="https://…" />
          </Field>
          <Field label="Contact email">
            <input type="email" className="input" value={form.contactEmail} onChange={set('contactEmail')} placeholder="office@college.edu" />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Adding…' : 'Add college'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
