import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  UserCheck,
  ClipboardList,
  CheckSquare,
  GraduationCap,
  Megaphone,
  CalendarClock,
  Users,
  Briefcase,
  Send,
  FileText,
  Sparkles,
  Bell,
  UserCircle2,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  School,
  MessageSquare,
  LifeBuoy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationPermissionPrompt from './NotificationPermissionPrompt';
import { api } from '../lib/api';
import { Avatar, Spinner } from './UI';
import { initials } from '../lib/format';

const STUDENT_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/attendance', label: 'Attendance', icon: UserCheck },
  { to: '/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/exams', label: 'Exams', icon: GraduationCap },
  { to: '/college', label: 'Notices', icon: Megaphone },
  { to: '/college-info', label: 'My College', icon: School },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/events', label: 'Events', icon: CalendarClock },
  { to: '/clubs', label: 'Clubs', icon: Users },
  { to: '/opportunities', label: 'Opportunities', icon: Briefcase },
  { to: '/applications', label: 'Applications', icon: Send },
  { to: '/resumes', label: 'Resumes', icon: FileText },
  { to: '/support', label: 'Help & Support', icon: LifeBuoy },
];

const FACULTY_NAV = [
  { to: '/faculty', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/faculty/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/college', label: 'Notices', icon: Megaphone },
  { to: '/college-info', label: 'My College', icon: School },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/opportunities', label: 'Opportunities', icon: Briefcase },
  { to: '/support', label: 'Help & Support', icon: LifeBuoy },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/faculty', label: 'Faculty', icon: UserCircle2 },
  { to: '/admin/opportunities', label: 'Opportunities', icon: Briefcase },
  { to: '/admin/colleges', label: 'Colleges', icon: School },
  { to: '/admin/support', label: 'Support', icon: LifeBuoy },
  { to: '/support', label: 'Help Center', icon: LifeBuoy },
];

const AI_NAV = [
  { to: '/ai/chat', label: 'AI Assistant', icon: Sparkles },
  { to: '/ai/planner', label: 'Daily Planner', icon: CalendarClock },
  { to: '/ai/skills', label: 'Skill Roadmap', icon: GraduationCap },
];

function NavSection({ title, items }) {
  return (
    <div className="mb-1">
      {title ? (
        <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      ) : null}
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard' || item.to === '/faculty' || item.to === '/admin' || item.to === '/ai/chat'}
              className={({ isActive }) =>
                `flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-glow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`nav-icon-tile ${isActive ? 'active' : ''}`}>
                    <Icon size={18} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    api
      .get('/notifications/unread-count')
      .then((d) => setCount(d.count))
      .catch(() => {});
    api
      .get('/notifications', { limit: 6 })
      .then((d) => setItems(d.notifications))
      .catch(() => {});
    const t = setInterval(() => {
      api
        .get('/notifications/unread-count')
        .then((d) => setCount(d.count))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, [user]);

  const markAllRead = async () => {
    await api.post('/notifications/read-all');
    setCount(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
        aria-label="Notifications"
      >
        <Bell size={22} className="icon-glow" />
        {count > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white/80 backdrop-blur-2xl rounded-2xl shadow-lift border border-white/60 z-40 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Notifications</p>
              {count > 0 ? (
                <button onClick={markAllRead} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  Mark all read
                </button>
              ) : null}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No notifications yet</p>
              ) : (
                items.map((n) => (
                  <Link
                    key={n._id}
                    to={n.link || '/notifications'}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 hover:bg-slate-50 transition border-b border-slate-50 ${n.read ? '' : 'bg-brand-50/40'}`}
                  >
                    <p className="text-sm font-medium text-slate-800 line-clamp-2">{n.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                  </Link>
                ))
              )}
            </div>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-sm font-medium text-brand-600 py-3 hover:bg-slate-50 border-t border-slate-100"
            >
              View all notifications
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function Layout() {
  const { user, isStudent, isFaculty, isAdmin, logout, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  const nav = isStudent ? STUDENT_NAV : isFaculty ? FACULTY_NAV : ADMIN_NAV;
  const showAI = isStudent;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/60 to-violet-50/60 flex relative overflow-x-hidden">
      {/* Ambient background orbs — rich colour so the glass blur has something to show */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-24 right-1/4 h-[26rem] w-[26rem] rounded-full bg-brand-400/35 blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -left-24 h-[22rem] w-[22rem] rounded-full bg-violet-400/35 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 right-10 h-[26rem] w-[26rem] rounded-full bg-fuchsia-400/30 blur-3xl animate-pulse-soft" />
        <div className="absolute top-1/4 left-1/3 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl animate-float" style={{ animationDelay: '3.5s' }} />
        <div className="absolute bottom-1/4 left-1/2 h-80 w-80 rounded-full bg-sky-300/25 blur-3xl animate-float-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 fixed inset-y-0 left-0 z-40">
        <SidebarContent nav={nav} showAI={showAI} user={user} onLogout={handleLogout} isStudent={isStudent} />
      </aside>

      {/* Sidebar (mobile) */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-900 flex flex-col animate-fade-in">
            <div className="flex items-center justify-between p-4">
              <Logo />
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white p-1" aria-label="Close menu">
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-6">
              <SidebarContent nav={nav} showAI={showAI} user={user} onLogout={handleLogout} isStudent={isStudent} />
            </div>
          </aside>
        </div>
      ) : null}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0 relative z-10">
        <header className="sticky top-0 z-30 bg-white/50 backdrop-blur-xl border-b border-white/60">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
              <div className="lg:hidden">
                <Logo />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isStudent ? (
                <NavLink to="/ai/chat" className="hidden sm:inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 transition">
                  <Sparkles size={18} className="icon-glow" />
                  Ask AI
                </NavLink>
              ) : null}
              <NotificationBell />
              <NotificationPermissionPrompt />
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <NavLink to={isStudent ? '/profile' : '/account'} className="flex items-center gap-2 hover:opacity-80 transition">
              <Avatar name={user?.name} size="sm" src={user?.avatar} />
              <span className="hidden md:block text-sm font-medium text-slate-700 max-w-[120px] truncate">{user?.name?.split(' ')[0]}</span>
                </NavLink>
                <button onClick={handleLogout} className="rounded-xl p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition" aria-label="Logout" title="Logout">
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl w-full mx-auto">
          {/* Keyed by pathname so each navigation replays the entrance */}
          <div key={location.pathname} className="animate-route">
            <Outlet />
          </div>
        </main>
        <footer className="px-6 py-4 text-center text-xs text-slate-400 space-y-1">
          <p>CAMPUSCONNECT — Your College. Your Career. Your AI Assistant.</p>
          <div className="flex items-center justify-center gap-3">
            <NavLink to="/support" className="hover:text-brand-600 transition">Help & Support</NavLink>
            <span>·</span>
            <a href={`mailto:${'campusconnect.ia@gmail.com'}?subject=Problem%20Report`} className="hover:text-brand-600 transition">Report a Problem</a>
            <span>·</span>
            <a href={`mailto:${'campusconnect.ia@gmail.com'}`} className="hover:text-brand-600 transition">Contact Us</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Logo() {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="flex items-center gap-2.5">
      {!imgError ? (
        <img
          src="/campusconnect-logo.png"
          alt="CampusConnect"
          className="h-10 w-10 rounded-xl object-cover shadow-sm"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-sm">
          <GraduationCap size={22} className="text-white icon-glow" />
        </div>
      )}
      <div className="leading-tight">
        <p className="text-white font-bold text-sm tracking-tight">CAMPUSCONNECT</p>
        <p className="text-[10px] text-slate-400">College · Career · AI</p>
      </div>
    </div>
  );
}

function SidebarContent({ nav, showAI, user, onLogout, isStudent }) {
  return (
    <>
      <div className="p-4">
        <Logo />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-3">
        <NavSection title="Main" items={nav} />
        {showAI ? (
          <div>
            <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">AI Assistant</p>
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-3 space-y-0.5">
              {AI_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/ai/chat'}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-glow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`nav-icon-tile violet ${isActive ? 'active' : ''}`}>
                          <Icon size={18} />
                        </span>
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ) : null}
      </nav>
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-slate-800/60">
          <Avatar name={user?.name} size="sm" src={user?.avatar} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-400 capitalize truncate">{user?.role}</p>
          </div>
          <ChevronRight size={18} className="text-slate-500 shrink-0" />
        </div>
      </div>
    </>
  );
}
