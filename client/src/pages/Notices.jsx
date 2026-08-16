import { useState } from 'react';
import { Megaphone, Plus, Sparkles, Trash2, Paperclip } from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, Badge, Modal, Field, EmptyState, ConfirmModal, ErrorBanner } from '../components/UI';
import { useAsync } from '../components/UI';
import { fmtDate, timeAgo } from '../lib/format';
import { useAuth } from '../context/AuthContext';

const CATEGORY_STYLE = {
  exam: 'bg-red-100 text-red-700',
  event: 'bg-purple-100 text-purple-700',
  general: 'bg-slate-100 text-slate-600',
  placement: 'bg-emerald-100 text-emerald-700',
  holiday: 'bg-sky-100 text-sky-700',
  fee: 'bg-amber-100 text-amber-700',
};

export default function Notices() {
  const { isFaculty, isAdmin } = useAuth();
  const { data, loading, reload } = useAsync(() => api.get('/notices'));
  const [category, setCategory] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [summarizing, setSummarizing] = useState(null);

  if (loading) return <PageLoader />;

  const notices = data?.notices || [];
  const canManage = isFaculty || isAdmin;
  const cats = ['all', ...new Set(notices.map((n) => n.category))];

  const visible = category === 'all' ? notices : notices.filter((n) => n.category === category);

  const summarize = async (n) => {
    setSummarizing(n._id);
    try {
      await api.post(`/notices/${n._id}/summarize`);
      reload();
    } finally {
      setSummarizing(null);
    }
  };

  const remove = async (id) => {
    await api.delete(`/notices/${id}`);
    reload();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Notices</h1>
          <p className="page-subtitle">Official announcements from your college.</p>
        </div>
        {canManage ? (
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Post notice
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition ${
              category === c ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState icon={Megaphone} title="No notices" message="College announcements will appear here." />
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((n) => (
            <Card key={n._id} className={n.important ? 'border-red-200 ring-1 ring-red-100' : ''}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                    n.important ? 'bg-red-50 text-red-500' : 'bg-brand-50 text-brand-600'
                  }`}
                >
                  <Megaphone size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900">{n.title}</h3>
                    {n.important ? <Badge className="bg-red-100 text-red-700">Important</Badge> : null}
                    <Badge className={CATEGORY_STYLE[n.category] || 'bg-slate-100 text-slate-600'}>{n.category}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-1.5 whitespace-pre-line">{n.content}</p>

                  {n.aiSummary?.summary ? (
                    <div className="mt-3 rounded-xl bg-violet-50 border border-violet-200 px-4 py-3">
                      <p className="text-xs font-semibold text-violet-700 mb-1">🤖 AI Summary</p>
                      <p className="text-sm text-violet-900">{n.aiSummary.summary}</p>
                      {n.aiSummary.importantDates?.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {n.aiSummary.importantDates.map((d, i) => (
                            <span key={i} className="text-xs bg-white rounded-lg px-2 py-1 text-violet-700 border border-violet-200">
                              📅 {d}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {n.aiSummary.deadline ? (
                        <p className="text-xs mt-1.5 text-violet-700">
                          <span className="font-semibold">Deadline:</span> {n.aiSummary.deadline}
                        </p>
                      ) : null}
                      {n.aiSummary.actionRequired ? (
                        <p className="text-xs mt-1 text-violet-700">
                          <span className="font-semibold">Action:</span> {n.aiSummary.actionRequired}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {n.attachments?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {n.attachments.map((a, i) => (
                        <a key={i} href={a} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                          <Paperclip size={14} /> Attachment
                        </a>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                    <p className="text-xs text-slate-400">
                      {fmtDate(n.date)} {n.createdBy?.name ? `· by ${n.createdBy.name}` : ''}
                    </p>
                    <div className="flex items-center gap-2">
                      {canManage && !n.aiSummary?.summary ? (
                        <button onClick={() => summarize(n)} disabled={summarizing === n._id} className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700">
                          <Sparkles size={14} /> {summarizing === n._id ? 'Summarizing…' : 'AI summarize'}
                        </button>
                      ) : null}
                      {canManage ? (
                        <button onClick={() => setConfirm(n)} className="p-1 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition" aria-label="Delete">
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateNoticeModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm._id)}
        title="Delete notice?"
        message={confirm ? `Delete "${confirm.title}"?` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function CreateNoticeModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', content: '', category: 'general', important: false });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/notices', form);
      onClose();
      onCreated();
      setForm({ title: '', content: '', category: 'general', important: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Post notice" wide>
      <ErrorBanner error={error} />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <input required className="input" value={form.title} onChange={set('title')} placeholder="e.g. Exam schedule announced" />
        </Field>
        <Field label="Content">
          <textarea required className="input min-h-[120px]" value={form.content} onChange={set('content')} placeholder="Full notice text…" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select className="input" value={form.category} onChange={set('category')}>
              {['general', 'exam', 'event', 'placement', 'holiday', 'fee'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mark important">
            <select className="input" value={String(form.important)} onChange={(e) => setForm((f) => ({ ...f, important: e.target.value === 'true' }))}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Posting…' : 'Post notice'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
