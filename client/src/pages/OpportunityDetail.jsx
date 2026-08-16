import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Send,
  Sparkles,
  MapPin,
  Clock,
  CalendarDays,
  Target,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  ListChecks,
} from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, Badge, ProgressBar } from '../components/UI';
import { useAsync } from '../components/UI';
import { categoryColor, scoreColor, fmtDate, fmtTime, daysBetween, relativeDay } from '../lib/format';
import { useAuth } from '../context/AuthContext';

export default function OpportunityDetail() {
  const { id } = useParams();
  const { isStudent, user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => api.get(`/opportunities/${id}`));
  const [ai, setAi] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  if (loading) return <PageLoader />;
  if (error || !data?.opportunity) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-500">{error?.message || 'Opportunity not found'}</p>
        <Link to="/opportunities" className="btn-secondary mt-4">
          <ArrowLeft size={15} /> Back to opportunities
        </Link>
      </div>
    );
  }

  const opp = data.opportunity;
  const match = data.match;
  const application = data.application;
  const diff = daysBetween(new Date(), opp.deadline);

  const loadAnalysis = async () => {
    setAiLoading(true);
    try {
      const res = await api.get(`/opportunities/${id}/ai-analysis`);
      setAi(res);
    } finally {
      setAiLoading(false);
    }
  };

  const save = async () => {
    await api.post(`/opportunities/${id}/save`);
    reload();
  };

  const apply = async () => {
    await api.post(`/opportunities/${id}/apply`);
    reload();
  };

  const statusBadge = application?.status;

  return (
    <div className="space-y-5 animate-fade-in">
      <Link to="/opportunities" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> All opportunities
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <Badge className={categoryColor(opp.category)}>{opp.category}</Badge>
                  {opp.status !== 'verified' ? <Badge className="bg-amber-100 text-amber-700">{opp.status}</Badge> : null}
                  {statusBadge ? <Badge className="bg-brand-100 text-brand-700">Application: {statusBadge}</Badge> : null}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">{opp.title}</h1>
                <p className="text-slate-500 mt-1">{opp.organization}</p>
              </div>
              {match && isStudent ? (
                <div className="text-right shrink-0">
                  <p className={`text-3xl font-bold ${scoreColor(match.score)}`}>{Math.round(match.score)}%</p>
                  <p className="text-xs text-slate-400">match score</p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={16} className="text-slate-400" /> {opp.mode} · {opp.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={16} className="text-slate-400" /> Deadline: <b className={diff <= 3 ? 'text-red-600' : ''}>{relativeDay(opp.deadline)}</b>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap size={16} className="text-slate-400" /> {opp.experienceLevel || 'any'} level
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {opp.stipend ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                  <p className="text-xs font-semibold text-emerald-700 uppercase">Stipend</p>
                  <p className="text-sm font-bold text-emerald-700 mt-0.5">{opp.stipend}</p>
                </div>
              ) : null}
              {opp.prize ? (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                  <p className="text-xs font-semibold text-amber-700 uppercase">Prize / Package</p>
                  <p className="text-sm font-bold text-amber-700 mt-0.5">{opp.prize}</p>
                </div>
              ) : null}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-slate-800 mb-2">About this opportunity</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{opp.description}</p>

            {opp.eligibility ? (
              <>
                <h3 className="font-semibold text-slate-800 mt-5 mb-1.5 text-sm">Eligibility</h3>
                <p className="text-sm text-slate-600">{opp.eligibility}</p>
              </>
            ) : null}

            {opp.skillsRequired?.length ? (
              <>
                <h3 className="font-semibold text-slate-800 mt-5 mb-2 text-sm">Skills required</h3>
                <div className="flex flex-wrap gap-2">
                  {opp.skillsRequired.map((s) => (
                    <span key={s} className="skill-chip text-xs px-3 py-1">
                      {s}
                    </span>
                  ))}
                </div>
              </>
            ) : null}

            {opp.requirements?.length ? (
              <>
                <h3 className="font-semibold text-slate-800 mt-5 mb-2 text-sm">Requirements</h3>
                <ul className="space-y-1">
                  {opp.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" /> {r}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {opp.applicationProcess ? (
              <>
                <h3 className="font-semibold text-slate-800 mt-5 mb-1.5 text-sm">Application process</h3>
                <p className="text-sm text-slate-600">{opp.applicationProcess}</p>
              </>
            ) : null}

            <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-400">
              Posted {fmtDate(opp.postedDate)} · Deadline {fmtDate(opp.deadline)}
            </div>
          </Card>

          {/* AI analysis */}
          {isStudent ? (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Sparkles size={17} className="text-violet-600" /> AI Fit Analysis
                </h2>
                {!ai ? (
                  <button onClick={loadAnalysis} disabled={aiLoading} className="btn-secondary !py-1.5 !px-3 text-xs">
                    {aiLoading ? 'Analyzing…' : 'Run analysis'}
                  </button>
                ) : null}
              </div>
              {ai ? (
                <div className="space-y-3">
                  {ai.explanation ? <p className="text-sm text-slate-600 leading-relaxed">{ai.explanation}</p> : null}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MiniStat label="Match" value={`${ai.match?.score ?? 0}%`} />
                    <MiniStat label="Difficulty" value={ai.difficulty} />
                    <MiniStat label="Urgency" value={ai.urgency} />
                    <MiniStat label="Deadline" value={ai.deadlineInDays > 0 ? `in ${ai.deadlineInDays}d` : 'today'} />
                  </div>
                  {ai.skillGaps?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Skill gaps to close</p>
                      <div className="flex flex-wrap gap-2">
                        {ai.skillGaps.map((s) => (
                          <span key={s} className="text-xs bg-red-50 text-red-700 border border-red-100 rounded-lg px-2.5 py-1">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Get an AI breakdown of how well you fit, your skill gaps, and how urgent this is.</p>
              )}
            </Card>
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {isStudent ? (
            <Card className="sticky top-24">
              <h3 className="font-semibold text-slate-800 mb-3">Take action</h3>
              {match ? (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Profile match</span>
                    <span className={`font-bold ${scoreColor(match.score)}`}>{Math.round(match.score)}%</span>
                  </div>
                  <ProgressBar value={match.score} color={match.score >= 80 ? 'bg-emerald-500' : match.score >= 60 ? 'bg-amber-500' : 'bg-slate-400'} />
                </div>
              ) : null}
              <div className="space-y-2">
                <button onClick={apply} disabled={application?.status === 'applied' || application?.status === 'shortlisted'} className="btn-primary w-full">
                  <Send size={16} />
                  {application?.status === 'applied' ? 'Applied ✓' : application?.status === 'shortlisted' ? 'Shortlisted ✓' : 'Apply now'}
                </button>
                <button onClick={save} className="btn-secondary w-full">
                  <Bookmark size={16} />
                  {application?.status === 'saved' ? 'Saved ✓' : 'Save for later'}
                </button>
                {opp.applyLink ? (
                  <a href={opp.applyLink} target="_blank" rel="noreferrer" className="btn-secondary w-full">
                    <ExternalLink size={16} /> External application
                  </a>
                ) : null}
              </div>
              {application ? (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-2">Your status: <b className="text-slate-700 capitalize">{application.status}</b></p>
                  <Link to="/applications" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                    View all applications →
                  </Link>
                </div>
              ) : null}
            </Card>
          ) : (
            <Card>
              <h3 className="font-semibold text-slate-800 mb-3">Quick info</h3>
              <div className="space-y-2.5 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <MapPin size={16} className="text-slate-400" /> {opp.mode} · {opp.location}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-slate-400" /> Deadline {fmtDate(opp.deadline)}
                </p>
                <p className="flex items-center gap-2">
                  <ListChecks size={14} className="text-slate-400" /> {opp.status} opportunity
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
      <p className="text-base font-bold text-slate-800">{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}
