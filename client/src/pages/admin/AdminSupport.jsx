import { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Send,
  Trash2,
  Edit3,
  Plus,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Card, Field, ErrorBanner, Badge, Tabs, StatCard, Modal, EmptyState, PageLoader } from '../../components/UI';
import { Reveal, Stagger } from '../../components/motion';
import PulsatingButton from '../../components/PulsatingButton';

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  open: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
};

const STATUS_ICONS = {
  open: AlertCircle,
  in_progress: Loader2,
  resolved: CheckCircle2,
  closed: CheckCircle2,
};

const CATEGORY_LABELS = {
  account: 'Account & Login',
  academic: 'Academic Features',
  opportunity: 'Opportunities & Applications',
  ai: 'AI Assistant',
  technical: 'Technical Issues',
  general: 'General Inquiry',
};

export default function AdminSupport() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/support/admin/stats');
      setStats(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <LifeBuoy size={24} className="text-brand-600" /> Support Dashboard
        </h1>
        <p className="page-subtitle">Manage support tickets, respond to users, and maintain FAQs.</p>
      </div>

      <Tabs
        tabs={[
          { key: 'dashboard', label: 'Overview' },
          { key: 'tickets', label: 'Tickets' },
          { key: 'faqs', label: 'FAQs' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'dashboard' && stats && <DashboardOverview stats={stats} />}
      {activeTab === 'tickets' && <TicketManager />}
      {activeTab === 'faqs' && <FAQManager />}
    </div>
  );
}

// ─── Dashboard Overview ───
function DashboardOverview({ stats }) {
  return (
    <div className="space-y-5">
      <Stagger step={80} className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={LifeBuoy} label="Total Tickets" value={stats.total} tone="brand" />
        <StatCard icon={AlertCircle} label="Open" value={stats.open} tone="sky" />
        <StatCard icon={Loader2} label="In Progress" value={stats.inProgress} tone="amber" />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} tone="emerald" />
        <StatCard icon={CheckCircle2} label="Closed" value={stats.closed} tone="violet" />
      </Stagger>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Reveal delay={120}>
          <Card>
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-orange-600" /> By Priority
            </h3>
            <div className="space-y-3">
              {['low', 'medium', 'high', 'urgent'].map((p) => {
                const item = stats.byPriority.find((x) => x._id === p);
                const count = item?.count || 0;
                return (
                  <div key={p}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-slate-600">{p}</span>
                      <span className="font-semibold text-slate-800">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${p === 'urgent' ? 'bg-red-500' : p === 'high' ? 'bg-orange-500' : p === 'medium' ? 'bg-amber-500' : 'bg-slate-400'}`}
                        style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Reveal>

        <Reveal delay={180}>
          <Card>
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-brand-600" /> By Category
            </h3>
            <div className="space-y-2">
              {stats.byCategory.map((c) => (
                <div key={c._id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{CATEGORY_LABELS[c._id] || c._id}</span>
                  <Badge className="bg-slate-100 text-slate-700">{c.count}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}

// ─── Ticket Manager ───
function TicketManager() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '', search: '' });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [respondModal, setRespondModal] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [filter.status, filter.priority]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      if (filter.search) params.search = filter.search;
      const res = await api.get('/support/admin/tickets', params);
      setTickets(res.tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/support/admin/tickets', { search: filter.search, status: filter.status, priority: filter.priority });
      setTickets(res.tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Reveal>
        <Card className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={filter.search}
              onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && searchTickets()}
              className="input pl-9 w-full"
            />
          </div>
          <select
            className="input w-auto"
            value={filter.status}
            onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            className="input w-auto"
            value={filter.priority}
            onChange={(e) => setFilter((f) => ({ ...f, priority: e.target.value }))}
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </Card>
      </Reveal>

      {/* Tickets */}
      {loading ? (
        <PageLoader />
      ) : tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets found" message="No tickets match your filters." />
      ) : (
        <Stagger step={60} className="space-y-3">
          {tickets.map((ticket) => {
            const StatusIcon = STATUS_ICONS[ticket.status] || AlertCircle;
            return (
              <Card key={ticket.id} className="hover:shadow-lift transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800 truncate">{ticket.subject}</h3>
                      <Badge className={STATUS_COLORS[ticket.status]}>
                        <StatusIcon size={12} className="mr-1" />
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={PRIORITY_COLORS[ticket.priority]}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      {ticket._user && (
                        <span className="flex items-center gap-1">
                          <User size={12} /> {ticket._user.name} ({ticket._user.email})
                        </span>
                      )}
                      <span>{CATEGORY_LABELS[ticket.category] || ticket.category}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => { setSelectedTicket(ticket); setRespondModal(true); }}
                      className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
                      title="Respond"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </Stagger>
      )}

      {/* Respond Modal */}
      {respondModal && selectedTicket && (
        <RespondModal
          ticket={selectedTicket}
          onClose={() => { setRespondModal(false); setSelectedTicket(null); }}
          onUpdated={() => { setRespondModal(false); setSelectedTicket(null); loadTickets(); }}
        />
      )}
    </div>
  );
}

// ─── Respond Modal ───
function RespondModal({ ticket, onClose, onUpdated }) {
  const [form, setForm] = useState({ status: ticket.status, response: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.patch(`/support/admin/tickets/${ticket.id}`, form);
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Respond to: ${ticket.subject}`} wide>
      <ErrorBanner error={error} />
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{ticket.description}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Status">
            <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </Field>
          <Field label="Response" hint="This will be visible to the user and they'll receive a notification.">
            <textarea
              className="input min-h-[120px]"
              value={form.response}
              onChange={(e) => setForm((f) => ({ ...f, response: e.target.value }))}
              placeholder="Write your response..."
            />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <PulsatingButton type="submit" disabled={saving}>
              <Send size={16} /> {saving ? 'Sending…' : 'Send Response'}
            </PulsatingButton>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ─── FAQ Manager ───
function FAQManager() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editFaq, setEditFaq] = useState(null);

  useEffect(() => { loadFaqs(); }, []);

  const loadFaqs = async () => {
    try {
      const res = await api.get('/support/faqs');
      setFaqs(res.faqs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      await api.delete(`/support/admin/faqs/${id}`);
      setFaqs((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <Reveal>
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">{faqs.length} FAQ(s)</p>
          <PulsatingButton onClick={() => { setEditFaq(null); setModalOpen(true); }}>
            <Plus size={16} /> Add FAQ
          </PulsatingButton>
        </div>
      </Reveal>

      <Stagger step={60} className="space-y-3">
        {faqs.map((faq) => (
          <Card key={faq.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-slate-800">{faq.question}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{faq.answer}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-slate-100 text-slate-600">{faq.category}</Badge>
                  {!faq.active && <Badge className="bg-red-100 text-red-600">Inactive</Badge>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => { setEditFaq(faq); setModalOpen(true); }}
                  className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
                  title="Edit"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(faq.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </Stagger>

      {modalOpen && (
        <FAQModal
          faq={editFaq}
          onClose={() => { setModalOpen(false); setEditFaq(null); }}
          onSaved={() => { setModalOpen(false); setEditFaq(null); loadFaqs(); }}
        />
      )}
    </div>
  );
}

// ─── FAQ Modal ───
function FAQModal({ faq, onClose, onSaved }) {
  const [form, setForm] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    category: faq?.category || 'general',
    order: faq?.order || 0,
    active: faq?.active !== undefined ? faq.active : true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, order: Number(form.order) };
      if (faq) {
        await api.patch(`/support/admin/faqs/${faq.id}`, payload);
      } else {
        await api.post('/support/admin/faqs', payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={faq ? 'Edit FAQ' : 'Add FAQ'} wide>
      <ErrorBanner error={error} />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Question">
          <input required className="input" value={form.question} onChange={set('question')} />
        </Field>
        <Field label="Answer">
          <textarea required className="input min-h-[120px]" value={form.answer} onChange={set('answer')} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select className="input" value={form.category} onChange={set('category')}>
              {['general', 'account', 'academic', 'opportunity', 'ai', 'technical'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Order">
            <input type="number" className="input" value={form.order} onChange={set('order')} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.active} onChange={set('active')} className="rounded" />
          Active (visible to users)
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <PulsatingButton type="submit" disabled={saving}>
            {saving ? 'Saving…' : (faq ? 'Update FAQ' : 'Add FAQ')}
          </PulsatingButton>
        </div>
      </form>
    </Modal>
  );
}
