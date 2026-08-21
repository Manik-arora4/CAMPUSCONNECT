import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, PageLoader, ErrorBanner } from '../components/UI';
import { Reveal } from '../components/motion';

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

const CATEGORY_LABELS = {
  account: 'Account & Login',
  academic: 'Academic Features',
  opportunity: 'Opportunities & Applications',
  ai: 'AI Assistant',
  technical: 'Technical Issues',
  general: 'General Inquiry',
};

export default function SupportTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    try {
      const res = await api.get(`/support/tickets/${id}`);
      setTicket(res.ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <div className="py-12"><ErrorBanner error={error} /></div>;
  if (!ticket) return null;

  const StatusIcon = STATUS_ICONS[ticket.status] || AlertCircle;

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      {/* Back button */}
      <button
        onClick={() => navigate('/support')}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-600 transition"
      >
        <ArrowLeft size={16} /> Back to Support
      </button>

      {/* Ticket Header */}
      <Reveal>
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge className={STATUS_COLORS[ticket.status]}>
                  <StatusIcon size={12} className="mr-1" />
                  {ticket.status.replace('_', ' ')}
                </Badge>
                <Badge className={PRIORITY_COLORS[ticket.priority]}>
                  {ticket.priority} priority
                </Badge>
                <Badge className="bg-slate-100 text-slate-600">
                  {CATEGORY_LABELS[ticket.category] || ticket.category}
                </Badge>
              </div>
              <h1 className="text-xl font-bold text-slate-900">{ticket.subject}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <User size={14} /> Ticket by you
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} /> Created {new Date(ticket.createdAt).toLocaleString()}
            </span>
            {ticket.userRole && (
              <span className="text-xs text-slate-400 capitalize">({ticket.userRole})</span>
            )}
          </div>
        </Card>
      </Reveal>

      {/* Description */}
      <Reveal delay={60}>
        <Card>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <MessageSquare size={16} className="text-brand-600" /> Description
          </h3>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </div>
        </Card>
      </Reveal>

      {/* Admin Response */}
      {ticket.response && (
        <Reveal delay={120}>
          <Card className="bg-gradient-to-r from-brand-50/80 to-violet-50/80 border-brand-200/50">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" /> Support Team Response
            </h3>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {ticket.response}
            </div>
            {ticket.responseAt && (
              <p className="text-xs text-slate-400 mt-3">
                Responded on {new Date(ticket.responseAt).toLocaleString()}
              </p>
            )}
          </Card>
        </Reveal>
      )}

      {/* Contact Section */}
      <Reveal delay={180}>
        <Card className="bg-slate-50 border-slate-200/60">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">Need further assistance?</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Contact our support team directly via email.
              </p>
            </div>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Re:%20${encodeURIComponent(ticket.subject)}%20(Ticket%20${ticket.id.slice(0, 8)})`}
              className="btn-secondary text-sm inline-flex items-center gap-2"
            >
              <Mail size={16} /> Reply via Email
            </a>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
