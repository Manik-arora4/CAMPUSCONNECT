import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Sparkles, ArrowRight, Mail, Lock, AlertCircle, CalendarDays, Target, BrainCircuit, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/UI';

const FEATURES = [
  { icon: CalendarDays, label: 'Smart timetable', color: 'text-sky-300' },
  { icon: Target, label: 'Opportunity matching', color: 'text-emerald-300' },
  { icon: BrainCircuit, label: 'AI daily planner', color: 'text-violet-300' },
  { icon: FileText, label: 'Resume analysis', color: 'text-amber-300' },
];

const DEMO_ROLES = [
  { role: 'student', label: '🎓 Student', active: 'border-brand-300/60 bg-brand-400/20 text-brand-100' },
  { role: 'faculty', label: '👨‍🏫 Faculty', active: 'border-violet-300/60 bg-violet-400/20 text-violet-100' },
  { role: 'admin', label: '🛡️ Admin', active: 'border-emerald-300/60 bg-emerald-400/20 text-emerald-100' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      const role = data.user?.role;
      navigate(role === 'student' ? '/dashboard' : role === 'faculty' ? '/faculty' : '/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const demos = {
      student: ['student@demo.campusconnect', 'demo1234'],
      faculty: ['faculty@demo.campusconnect', 'demo1234'],
      admin: ['admin@demo.campusconnect', 'demo1234'],
    };
    setEmail(demos[role][0]);
    setPassword(demos[role][1]);
  };

  return (
    <div
      className="min-h-screen flex bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-900 animate-gradient-pan"
      style={{ backgroundSize: '160% 160%' }}
    >
      {/* Aurora orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[32rem] w-[32rem] rounded-full bg-violet-600/30 blur-3xl animate-float" />
        <div className="absolute top-1/4 -right-40 h-[36rem] w-[36rem] rounded-full bg-fuchsia-500/25 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-40 left-1/4 h-[34rem] w-[34rem] rounded-full bg-brand-500/25 blur-3xl animate-float" style={{ animationDelay: '2.5s' }} />
        <div className="absolute top-1/2 left-1/2 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl animate-pulse-soft" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative">
        <div className="relative animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shadow-lift">
              <GraduationCap size={24} className="text-white icon-glow" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight drop-shadow">CAMPUSCONNECT</span>
          </div>
        </div>

        <div className="relative space-y-7">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight drop-shadow-lg">
            <span className="block animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Your College.
            </span>
            <span className="block animate-fade-up" style={{ animationDelay: '0.22s' }}>
              Your Career.
            </span>
            <span className="block animate-fade-up" style={{ animationDelay: '0.34s' }}>
              <span className="shimmer-text animate-shimmer font-extrabold">Your AI Assistant.</span>
            </span>
          </h1>
          <p className="text-white/75 text-lg max-w-md animate-fade-up drop-shadow" style={{ animationDelay: '0.46s' }}>
            Timetable, attendance, assignments, opportunities and a personal AI copilot — everything a student needs, in one place.
          </p>
          <div className="flex flex-wrap gap-2.5 animate-fade-up" style={{ animationDelay: '0.58s' }}>
            {FEATURES.map(({ icon: Icon, label, color }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full glass px-3.5 py-2 text-sm text-white/90 transition duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-glow-sm cursor-default"
              >
                <Icon size={15} className={color} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-white/50 animate-fade-up" style={{ animationDelay: '0.7s' }}>
          © 2026 CAMPUSCONNECT · Nova Institute of Technology
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md relative">
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8 animate-fade-up">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight drop-shadow">CAMPUSCONNECT</span>
          </div>

          {/* Glass card */}
          <div className="rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-8 animate-scale-in">
            <div className="absolute -top-10 -right-8 h-40 w-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <h2 className="text-2xl font-bold text-white drop-shadow">Welcome back 👋</h2>
            <p className="text-sm text-white/70 mt-1 mb-6">Log in to your campus dashboard.</p>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-sm px-4 py-3 mb-4 animate-fade-in backdrop-blur">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:shadow-glow-sm transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:shadow-glow-sm transition"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm font-medium text-white/80 hover:text-white transition">
                  Forgot password?
                </Link>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? <Spinner size={18} /> : 'Log in'}
                {!loading ? <ArrowRight size={16} /> : null}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/15">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-3">Demo accounts</p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ROLES.map(({ role, label, active }) => (
                  <button
                    key={role}
                    onClick={() => fillDemo(role)}
                    className={`rounded-xl border border-white/15 bg-white/10 backdrop-blur px-2 py-2 text-xs font-medium text-white/80 transition duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-white/20 hover:shadow-glow-sm ${active}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-white/50 mt-2">
                Click to fill credentials — password is <code className="font-mono text-white/80">demo1234</code>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-white/70 mt-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            New here?{' '}
            <Link to="/register" className="font-semibold text-white hover:text-brand-200 inline-flex items-center gap-1 transition">
              Create an account <Sparkles size={13} className="text-brand-300 icon-glow" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
