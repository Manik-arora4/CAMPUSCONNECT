import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LifeBuoy,
  Search,
  ChevronDown,
  ChevronRight,
  Send,
  Mail,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, Field, ErrorBanner, Badge, Tabs, EmptyState, Modal, PageLoader } from '../components/UI';
import { Reveal, Stagger } from '../components/motion';
import PulsatingButton from '../components/PulsatingButton';

const SUPPORT_EMAIL = 'campusconnect.ia@gmail.com';

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

const CATEGORY_ICONS = {
  account: '👤',
  academic: '🎓',
  opportunity: '💼',
  ai: '✨',
  technical: '🔧',
  general: '❓',
};

export default function Support() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('help');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'tickets') loadTickets();
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      const [catRes, faqRes] = await Promise.all([
        api.get('/support/categories'),
        api.get('/support/faqs'),
      ]);
      setCategories(catRes.categories);
      setFaqs(faqRes.faqs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      const res = await api.get('/support/tickets');
      setTickets(res.tickets);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchCategory = !selectedCategory || faq.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <LifeBuoy size={24} className="text-brand-600" /> Help & Support
          </h1>
          <p className="page-subtitle">Find answers, get help, or contact our support team.</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <Mail size={16} /> Contact Email
          </a>
          <PulsatingButton onClick={() => setTicketModalOpen(true)}>
            <Send size={16} /> New Ticket
          </PulsatingButton>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { key: 'help', label: 'Help Center' },
          { key: 'tickets', label: 'My Tickets' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'help' ? (
        <HelpCenter
          faqs={filteredFaqs}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onNewTicket={() => setTicketModalOpen(true)}
        />
      ) : (
        <TicketList tickets={tickets} onRefresh={loadTickets} />
      )}

      <NewTicketModal
        open={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        onCreated={() => {
          setTicketModalOpen(false);
          loadTickets();
          setActiveTab('tickets');
        }}
        categories={categories}
      />
    </div>
  );
}

// ─── Help Center ───
function HelpCenter({ faqs, categories, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery, onNewTicket }) {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="space-y-5">
      {/* Search */}
      <Reveal>
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </Reveal>

      {/* Categories */}
      <Reveal delay={60}>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
              !selectedCategory
                ? 'bg-brand-600 text-white shadow-glow-sm'
                : 'bg-white/60 text-slate-600 hover:bg-white border border-slate-200/60'
            }`}
          >
            All Topics
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-brand-600 text-white shadow-glow-sm'
                  : 'bg-white/60 text-slate-600 hover:bg-white border border-slate-200/60'
              }`}
            >
              {CATEGORY_ICONS[cat.id]} {cat.label}
            </button>
          ))}
        </div>
      </Reveal>

      {/* FAQs */}
      <Stagger step={60} className="space-y-3">
        {faqs.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No articles found"
            message="Try a different search or category, or submit a support ticket."
            action={
              <button onClick={onNewTicket} className="btn-primary text-sm">
                <Send size={16} /> Submit a Ticket
              </button>
            }
          />
        ) : (
          faqs.map((faq) => (
            <Card key={faq.id} className="overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{CATEGORY_ICONS[faq.category] || '❓'}</span>
                  <span className="font-medium text-slate-800">{faq.question}</span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 transition-transform ${openFaq === faq.id ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === faq.id && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </Card>
          ))
        )}
      </Stagger>

      {/* Contact Section */}
      <Reveal delay={120}>
        <Card className="bg-gradient-to-r from-brand-50 to-violet-50 border-brand-200/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="rounded-2xl bg-brand-100 p-3">
              <MessageSquare size={24} className="text-brand-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800">Still need help?</h3>
              <p className="text-sm text-slate-600 mt-0.5">
                Our support team is available Monday–Friday, 9 AM – 6 PM IST.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Email: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-600 hover:underline font-medium">{SUPPORT_EMAIL}</a>
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Support%20Request%20-%20CampusConnect`}
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                <Mail size={16} /> Email Us
              </a>
            </div>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}

// ─── Ticket List ───
function TicketList({ tickets, onRefresh }) {
  const navigate = useNavigate();

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={LifeBuoy}
        title="No support tickets yet"
        message="If you need help, submit a support ticket and our team will assist you."
      />
    );
  }

  return (
    <Stagger step={60} className="space-y-3">
      {tickets.map((ticket) => {
        const StatusIcon = STATUS_ICONS[ticket.status] || AlertCircle;
        return (
          <Card
            key={ticket.id}
            className="cursor-pointer hover:shadow-lift transition group"
            onClick={() => navigate(`/support/tickets/${ticket.id}`)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-800 group-hover:text-brand-600 transition truncate">
                    {ticket.subject}
                  </h3>
                  <Badge className={STATUS_COLORS[ticket.status]}>
                    <StatusIcon size={12} className="mr-1" />
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={PRIORITY_COLORS[ticket.priority]}>
                    {ticket.priority}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ticket.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    {CATEGORY_ICONS[ticket.category]} {ticket.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-500 transition shrink-0 mt-1" />
            </div>
          </Card>
        );
      })}
    </Stagger>
  );
}

// ─── New Ticket Modal ───
function NewTicketModal({ open, onClose, onCreated, categories }) {
  const [form, setForm] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/support/tickets', form);
      setForm({ subject: '', description: '', category: 'general', priority: 'medium' });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Submit Support Ticket" wide>
      <ErrorBanner error={error} />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Subject">
          <input
            required
            className="input"
            value={form.subject}
            onChange={set('subject')}
            placeholder="Brief description of your issue"
          />
        </Field>
        <Field label="Category">
          <select className="input" value={form.category} onChange={set('category')}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {CATEGORY_ICONS[c.id]} {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select className="input" value={form.priority} onChange={set('priority')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </Field>
        <Field label="Description" hint="Please provide as much detail as possible">
          <textarea
            required
            className="input min-h-[120px]"
            value={form.description}
            onChange={set('description')}
            placeholder="Describe your issue in detail..."
          />
        </Field>
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">
            You'll receive a notification when we respond.{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-600 hover:underline">
              Or email us directly
            </a>
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <PulsatingButton type="submit" disabled={saving}>
              <Send size={16} /> {saving ? 'Submitting…' : 'Submit Ticket'}
            </PulsatingButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}
