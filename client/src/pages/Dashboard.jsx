import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowRight,
  Clock,
  Target,
  Megaphone,
  CalendarClock,
  UserCheck,
} from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, StatCard, Badge, ProgressBar } from '../components/UI';
import { useAsync } from '../components/UI';
import { fmtTime, relativeDay, categoryColor, scoreColor } from '../lib/format';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(() => api.get('/students/dashboard'));

  if (loading) return <PageLoader />;
  if (error)
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-500">Couldn't load your dashboard — {error.message}</p>
      </div>
    );

  const { stats, todaySchedule, needsAttention, aiRecommendation, topOpportunities, recentNotices, upcomingEvents, attendance, deadlines } = data;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · Here's your campus at a glance.
          </p>
        </div>
        <Link to="/ai/chat" className="btn-primary shrink-0">
          <Sparkles size={16} /> Ask your AI assistant
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Classes today" value={stats.todayClasses} tone="brand" />
        <StatCard icon={UserCheck} label="Attendance" value={`${stats.attendancePercentage}%`} sub={stats.attendanceHealth} tone={stats.attendanceHealth === 'safe' ? 'emerald' : stats.attendanceHealth === 'warning' ? 'amber' : 'red'} />
        <StatCard icon={CheckSquare} label="Pending tasks" value={stats.pendingTasks} tone="sky" />
        <StatCard icon={Target} label="Opportunity matches" value={stats.opportunityMatches} sub={`${stats.activeApplications} active apps`} tone="violet" />
      </div>

      {/* AI recommendation + needs attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-gradient-to-br from-brand-600 to-violet-700 border-0 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="flex items-start gap-3 mb-3">
            <div className="rounded-xl bg-white/15 p-2">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="font-semibold">AI Recommendation</p>
              <p className="text-xs text-brand-100">
                {aiRecommendation.opportunity ? `${aiRecommendation.score}% match` : 'Based on your profile'}
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-white/90">{aiRecommendation.text}</p>
          {aiRecommendation.opportunity ? (
            <Link
              to={`/opportunities/${aiRecommendation.opportunity._id}`}
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold bg-white/15 hover:bg-white/25 rounded-xl px-4 py-2 transition"
            >
              View opportunity <ArrowRight size={15} />
            </Link>
          ) : null}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="font-semibold text-slate-800">Needs attention</h3>
          </div>
          {needsAttention.length === 0 ? (
            <p className="text-sm text-slate-500">All clear! 🎉</p>
          ) : (
            <div className="space-y-2.5">
              {needsAttention.map((n, i) => (
                <Link
                  key={i}
                  to={n.link}
                  className={`block rounded-xl border px-3.5 py-2.5 transition hover:shadow-sm ${
                    n.severity === 'critical'
                      ? 'border-red-200 bg-red-50'
                      : n.severity === 'warning'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <p className={`text-sm font-semibold ${n.severity === 'critical' ? 'text-red-700' : n.severity === 'warning' ? 'text-amber-700' : 'text-slate-700'}`}>
                    {n.severity === 'critical' ? <AlertTriangle size={13} className="inline -mt-0.5 mr-1" /> : <Info size={13} className="inline -mt-0.5 mr-1" />}
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's schedule */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-brand-600" />
              <h3 className="font-semibold text-slate-800">Today's schedule</h3>
            </div>
            <Link to="/timetable" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Full timetable
            </Link>
          </div>
          {todaySchedule.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No classes today 🎉</p>
          ) : (
            <div className="space-y-2.5">
              {todaySchedule.map((s) => (
                <div key={s._id} className="flex items-center gap-3">
                  <div
                    className="w-1 self-stretch rounded-full"
                    style={{ backgroundColor: s.color || '#6366f1' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.subjectName}</p>
                    <p className="text-xs text-slate-500">
                      {fmtTime(s.startTime)} – {fmtTime(s.endTime)} {s.room ? `· ${s.room}` : ''}
                    </p>
                  </div>
                  {s.type === 'free' ? <Badge className="bg-slate-100 text-slate-500">Free</Badge> : null}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Deadlines */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              <h3 className="font-semibold text-slate-800">Upcoming deadlines</h3>
            </div>
            <Link to="/tasks" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          {(() => {
            const all = [...(deadlines.today || []), ...(deadlines.tomorrow || []), ...(deadlines.week || [])];
            if (all.length === 0) return <p className="text-sm text-slate-500 text-center py-6">Nothing due soon 🎉</p>;
            return (
              <div className="space-y-2.5">
                {all.slice(0, 6).map((d, i) => (
                  <Link key={i} to={d.link || '/tasks'} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3.5 py-2.5 hover:border-slate-200 hover:bg-slate-50 transition">
                    <p className="text-sm text-slate-700 truncate">{d.label}</p>
                    <span className={`text-xs font-semibold shrink-0 ${relativeDay(d.date) === 'Today' ? 'text-red-600' : relativeDay(d.date) === 'Tomorrow' ? 'text-amber-600' : 'text-slate-400'}`}>
                      {relativeDay(d.date)}
                    </span>
                  </Link>
                ))}
              </div>
            );
          })()}
        </Card>

        {/* Attendance health */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <UserCheckIcon />
            <h3 className="font-semibold text-slate-800">Attendance health</h3>
          </div>
          <div className="flex items-end justify-between mb-2">
            <p className="text-3xl font-bold text-slate-900">{attendance?.overall?.percentage ?? 0}%</p>
            <Badge
              className={
                attendance?.overall?.health === 'safe'
                  ? 'bg-emerald-100 text-emerald-700'
                  : attendance?.overall?.health === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
              }
            >
              {attendance?.overall?.health}
            </Badge>
          </div>
          <ProgressBar
            value={attendance?.overall?.percentage ?? 0}
            max={100}
            color={attendance?.overall?.health === 'safe' ? 'bg-emerald-500' : attendance?.overall?.health === 'warning' ? 'bg-amber-500' : 'bg-red-500'}
          />
          <p className="text-xs text-slate-500 mt-3">{attendance?.forecast}</p>
          <Link to="/attendance" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
            Detailed report <ArrowRight size={14} />
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top opportunities */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-violet-600" />
              <h3 className="font-semibold text-slate-800">Best matches for you</h3>
            </div>
            <Link to="/opportunities" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Browse all
            </Link>
          </div>
          {topOpportunities.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No matching opportunities right now.</p>
          ) : (
            <div className="space-y-2.5">
              {topOpportunities.map(({ opportunity: opp, score }) => (
                <Link key={opp._id} to={`/opportunities/${opp._id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3.5 py-3 hover:border-slate-200 hover:bg-slate-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{opp.title}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {opp.organization} · {opp.category}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${scoreColor(score)}`}>{score}%</p>
                    <p className="text-[11px] text-slate-400">{relativeDay(opp.deadline)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Notices + events */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone size={18} className="text-orange-500" />
              <h3 className="font-semibold text-slate-800">Latest from campus</h3>
            </div>
            <Link to="/college" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              All notices
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentNotices.slice(0, 3).map((n) => (
              <Link key={n._id} to="/college" className="block rounded-xl border border-slate-100 px-3.5 py-2.5 hover:border-slate-200 hover:bg-slate-50 transition">
                <p className="text-sm font-medium text-slate-800 line-clamp-1">
                  {n.important ? <span className="text-red-500 mr-1">●</span> : null}
                  {n.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.content}</p>
              </Link>
            ))}
            {upcomingEvents.slice(0, 2).map((e) => (
              <Link key={e._id} to="/events" className="flex items-center gap-3 rounded-xl border border-slate-100 px-3.5 py-2.5 hover:border-slate-200 hover:bg-slate-50 transition">
                <CalendarClock size={16} className="text-brand-500 shrink-0" />
                <p className="text-sm text-slate-700 flex-1 truncate">{e.title}</p>
                <span className="text-xs text-slate-400 shrink-0">{relativeDay(e.date)}</span>
              </Link>
            ))}
            {recentNotices.length === 0 && upcomingEvents.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Nothing new on campus.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

function UserCheckIcon() {
  return <UserCheck size={18} className="text-emerald-600" />;
}
