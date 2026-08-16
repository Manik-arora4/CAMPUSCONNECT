import { useState } from 'react';
import { Plus, Trash2, UserCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, Card, Badge, Avatar, Modal, Field, EmptyState, ConfirmModal, ErrorBanner } from '../../components/UI';
import { useAsync } from '../../components/UI';
import PulsatingButton from '../../components/PulsatingButton';

export default function AdminFaculty() {
  const { data, loading, reload } = useAsync(() => api.get('/admin/faculty'));
  const [createOpen, setCreateOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  if (loading) return <PageLoader />;

  const faculty = data?.faculty || [];

  const remove = async (f) => {
    await api.delete(`/admin/faculty/${f.id}`);
    reload();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Faculty</h1>
          <p className="page-subtitle">Manage faculty accounts ({faculty.length}).</p>
        </div>
        <PulsatingButton onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Add faculty
        </PulsatingButton>
      </div>

      {faculty.length === 0 ? (
        <Card>
          <EmptyState icon={UserCircle2} title="No faculty yet" message="Add faculty members to get started." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {faculty.map((f) => (
            <Card key={f.id}>
              <div className="flex items-start gap-3">
                <Avatar name={f.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{f.name}</p>
                  <p className="text-xs text-slate-400 truncate">{f.email}</p>
                  <p className="text-sm text-slate-500 mt-1">{f.designation || 'Faculty'}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className={f.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{f.active ? 'Active' : 'Disabled'}</Badge>
                    {f.college?.name ? <Badge className="bg-slate-100 text-slate-600">{f.college.name}</Badge> : null}
                  </div>
                </div>
                <button onClick={() => setConfirm(f)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition shrink-0" aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateFacultyModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm)}
        title="Remove faculty?"
        message={confirm ? `Remove ${confirm.name} from the faculty?` : ''}
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}

function CreateFacultyModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', designation: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/admin/faculty', form);
      onClose();
      onCreated();
      setForm({ name: '', email: '', designation: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add faculty">
      <ErrorBanner error={error} />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <input required className="input" value={form.name} onChange={set('name')} placeholder="Prof. Name" />
        </Field>
        <Field label="Email">
          <input type="email" required className="input" value={form.email} onChange={set('email')} placeholder="faculty@college.edu" />
        </Field>
        <Field label="Designation">
          <input className="input" value={form.designation} onChange={set('designation')} placeholder="Assistant Professor" />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Adding…' : 'Add faculty'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
