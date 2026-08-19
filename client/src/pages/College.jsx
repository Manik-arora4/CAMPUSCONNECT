import { Link } from 'react-router-dom';
import { School, Users, BookOpen, Megaphone, CalendarClock, Mail, MapPin, Globe, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, Badge, EmptyState, Avatar, useAsync } from '../components/UI';
import { CountUp } from '../components/motion';
import { fmtDate, timeAgo } from '../lib/format';

export default function College() {
  const { data, loading } = useAsync(() => api.get('/colleges/my'));
  if (loading) return <PageLoader />;

  const { college, counts = {}, faculty = [], subjects = [], notices = [], events = [], clubs = [] } = data || {};
  if (!college) {
    return (
      <Card>
        <EmptyState
          icon={School}
          title="No college linked"
          message="Your account is not linked to a college yet. Ask your admin to add you, or complete onboarding in your profile."
        />
      </Card>
    );
  }

  const stats = [
    { label: 'Notices', value: counts.notices || 0, icon: Megaphone, tone: 'from-red-500 to-rose-500', to: '/college' },
    { label: 'Events', value: counts.events || 0, icon: CalendarClock, tone: 'from-sky-500 to-indigo-500', to: '/events' },
    { label: 'Clubs', value: counts.clubs || 0, icon: Sparkles, tone: 'from-fuchsia-500 to-purple-500', to: '/clubs' },
    { label: 'Faculty', value: counts.faculty || 0, icon: Users, tone: 'from-emerald-500 to-teal-500', to: '/college-info' },
    { label: 'Subjects', value: counts.subjects || 0, icon: BookOpen, tone: 'from-amber-500 to-orange-500', to: '/college-info' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">My College</h1>
          <p className="page-subtitle">Your campus — faculty, subjects and everything happening around you.</p>
        </div>
        {college.code ? <Badge className="bg-brand-50 text-brand-700">{college.code}</Badge> : null}
      </div>

      {/* College hero */}
      <Card className="overflow-hidden !p-0 animate-scale-in">
        <div className="h-24 bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-600 relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="px-6 pb-6 -mt-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-end gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white shadow-lift border border-white/70 flex items-center justify-center">
                <School size={30} className="text-brand-600" />
              </div>
              <div className="pt-4">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{college.name}</h2>
                <p className="text-sm text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                  {college.city || college.state ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} /> {[college.city, college.state].filter(Boolean).join(', ')}
                    </span>
                  ) : null}
                  {college.establishedYear ? <span>· Est. {college.establishedYear}</span> : null}
                </p>
              </div>
            </div>
            {college.website ? (
              <a href={college.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
                <Globe size={15} /> Website
              </a>
            ) : null}
          </div>
          {college.contactEmail ? (
            <p className="text-sm text-slate-500 mt-3 inline-flex items-center gap-1.5">
              <Mail size={14} /> {college.contactEmail}
            </p>
          ) : null}
        </div>
      </Card>

      {/* Stats — count-up numbers + staggered entrance */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(({ label, value, icon: Icon, tone, to }, i) => (
          <Link
            key={label}
            to={to}
            className="card card-hover p-4 flex items-center gap-3 animate-fade-up"
            style={{ animationDelay: `${0.05 + i * 0.06}s` }}
          >
            <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${tone} text-white flex items-center justify-center shadow-glow-sm`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 leading-none tabular-nums">
                <CountUp value={value} />
              </p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Faculty */}
        <Card className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-brand-600" /> Faculty
            </h3>
            <Badge className="bg-slate-100 text-slate-600">{faculty.length} teachers</Badge>
          </div>
          {faculty.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No faculty added yet.</p>
          ) : (
            <div className="space-y-3">
              {faculty.map((f, i) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:border-slate-200 hover:bg-slate-50/60 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 animate-fade-up"
                  style={{ animationDelay: `${0.16 + i * 0.05}s` }}
                >
                  <Avatar name={f.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{f.name}</p>
                    <p className="text-xs text-slate-500 truncate">{f.designation || 'Faculty'}</p>
                  </div>
                  {f.email ? (
                    <a href={`mailto:${f.email}`} className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0 hidden sm:block">
                      {f.email}
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Subjects */}
        <Card className="animate-fade-up" style={{ animationDelay: '0.16s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen size={18} className="text-brand-600" /> Subjects
            </h3>
            <Badge className="bg-slate-100 text-slate-600">{subjects.length} offered</Badge>
          </div>
          {subjects.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No subjects added yet.</p>
          ) : (
            <div className="space-y-2">
              {subjects.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 px-3.5 py-2.5 hover:border-slate-200 hover:translate-x-0.5 hover:shadow-sm transition-all duration-300 animate-fade-up"
                  style={{ animationDelay: `${0.22 + i * 0.05}s` }}
                >
                  <span className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: s.color || '#6366f1' }}>
                    {s.code ? s.code.slice(0, 3).toUpperCase() : 'SUB'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                    {s.faculty ? <p className="text-xs text-slate-500 truncate">Taught by faculty</p> : null}
                  </div>
                  {s.semester ? <Badge className="bg-indigo-50 text-indigo-700">Sem {s.semester}</Badge> : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Notices */}
        <Card className="animate-fade-up" style={{ animationDelay: '0.24s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Megaphone size={18} className="text-red-500" /> Recent notices
            </h3>
            <Link to="/college" className="text-xs font-medium text-brand-600 hover:text-brand-700">View all</Link>
          </div>
          {notices.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No notices yet.</p>
          ) : (
            <div className="space-y-3">
              {notices.slice(0, 4).map((n) => (
                <Link key={n.id} to="/college" className="block rounded-xl border border-slate-100 px-3.5 py-3 hover:border-slate-200 hover:bg-slate-50/60 transition">
                  <p className="text-sm font-medium text-slate-800 line-clamp-1">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.content}</p>
                  <p className="text-[11px] text-slate-400 mt-1.5">{timeAgo(n.date)}</p>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Events */}
        <Card className="animate-fade-up" style={{ animationDelay: '0.32s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <CalendarClock size={18} className="text-sky-500" /> Upcoming events
            </h3>
            <Link to="/events" className="text-xs font-medium text-brand-600 hover:text-brand-700">View all</Link>
          </div>
          {events.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No upcoming events.</p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 4).map((e) => (
                <Link key={e.id} to="/events" className="block rounded-xl border border-slate-100 px-3.5 py-3 hover:border-slate-200 hover:bg-slate-50/60 transition">
                  <p className="text-sm font-medium text-slate-800 line-clamp-1">{e.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{fmtDate(e.date)}{e.location ? ` · ${e.location}` : ''}</p>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Clubs */}
        <Card className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-fuchsia-500" /> Clubs
            </h3>
            <Link to="/clubs" className="text-xs font-medium text-brand-600 hover:text-brand-700">View all</Link>
          </div>
          {clubs.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No clubs yet.</p>
          ) : (
            <div className="space-y-3">
              {clubs.slice(0, 4).map((c) => (
                <Link key={c.id} to="/clubs" className="block rounded-xl border border-slate-100 px-3.5 py-3 hover:border-slate-200 hover:bg-slate-50/60 transition">
                  <p className="text-sm font-medium text-slate-800 line-clamp-1">{c.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.description}</p>
                  {c.facultyAdvisor ? <p className="text-[11px] text-slate-400 mt-1.5">Advisor: {c.facultyAdvisor}</p> : null}
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
