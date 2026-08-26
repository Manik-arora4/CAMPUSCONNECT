import { useState } from 'react';
import { Plus, Trash2, FileText, Link, Video, BookOpen, ExternalLink, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, Card, Badge, Modal, Field, EmptyState, ConfirmModal, ErrorBanner } from '../../components/UI';
import { useAsync } from '../../components/UI';
import PulsatingButton from '../../components/PulsatingButton';
import { fmtDate } from '../../lib/format';

const TYPE_ICONS = {
  pdf: FileText,
  link: Link,
  video: Video,
  notes: BookOpen,
  document: FileText,
};

const TYPE_COLORS = {
  pdf: 'bg-red-100 text-red-600',
  link: 'bg-blue-100 text-blue-600',
  video: 'bg-purple-100 text-purple-600',
  notes: 'bg-emerald-100 text-emerald-600',
  document: 'bg-amber-100 text-amber-600',
};

export default function FacultyResources() {
  const { data, loading, reload } = useAsync(() => api.get('/faculty/resources'));
  const [createOpen, setCreateOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');

  if (loading) return <PageLoader />;

  const resources = data?.resources || [];

  const filtered = resources.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.title?.toLowerCase().includes(q) ||
      r.subjectName?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  });

  const remove = async (id) => {
    await api.delete(`/faculty/resources/${id}`);
    reload();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Shared Resources</h1>
          <p className="page-subtitle">Share study materials, notes, and links with your students.</p>
        </div>
        <PulsatingButton onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Share resource
        </PulsatingButton>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search resources by title, subject, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No resources yet"
            message="Share your first study material with students."
            action={
              <button className="btn-primary" onClick={() => setCreateOpen(true)}>
                Share resource
              </button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((r) => {
            const Icon = TYPE_ICONS[r.type] || FileText;
            const colorClass = TYPE_COLORS[r.type] || 'bg-slate-100 text-slate-600';
            return (
              <Card key={r._id} className="flex flex-col">
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-2.5 shrink-0 ${colorClass}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800 truncate">{r.title}</h3>
                      <Badge className="bg-slate-100 text-slate-600 text-[10px]">{r.type}</Badge>
                    </div>
                    {r.description && (
                      <p className="text-sm text-slate-500 line-clamp-2 mb-2">{r.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {r.subjectName && <span>📚 {r.subjectName}</span>}
                      {r.semester && <span>Sem {r.semester}</span>}
                      <span>{fmtDate(r.createdAt)}</span>
                    </div>
                    {r.faculty?.name && (
                      <p className="text-xs text-slate-400 mt-1">By {r.faculty.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  {r.url ? (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1"
                    >
                      <ExternalLink size={12} /> Open
                    </a>
                  ) : null}
                  <div className="flex-1" />
                  <button
                    onClick={() => setConfirm(r)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition"
                    aria-label="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm._id)}
        title="Delete resource?"
        message={confirm ? `Delete "${confirm.title}"? Students will no longer see this.` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function CreateModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    subjectName: '',
    semester: 1,
    url: '',
    type: 'link',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/faculty/resources', form);
      onClose();
      onCreated();
      setForm({ title: '', description: '', subjectName: '', semester: 1, url: '', type: 'link' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share resource" wide>
      <ErrorBanner error={error} />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <input
            required
            className="input"
            value={form.title}
            onChange={set('title')}
            placeholder="e.g. DBMS Chapter 5 Notes"
          />
        </Field>
        <Field label="Description">
          <textarea
            className="input min-h-[80px]"
            value={form.description}
            onChange={set('description')}
            placeholder="Brief description of the resource..."
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Subject">
            <input
              className="input"
              value={form.subjectName}
              onChange={set('subjectName')}
              placeholder="e.g. DBMS"
            />
          </Field>
          <Field label="Type">
            <select className="input" value={form.type} onChange={set('type')}>
              <option value="link">Link</option>
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
              <option value="notes">Notes</option>
              <option value="document">Document</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="URL / Link">
            <input
              className="input"
              value={form.url}
              onChange={set('url')}
              placeholder="https://drive.google.com/..."
            />
          </Field>
          <Field label="Semester">
            <input
              type="number"
              min="1"
              className="input"
              value={form.semester}
              onChange={set('semester')}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Sharing...' : 'Share resource'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
