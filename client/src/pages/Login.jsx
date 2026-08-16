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
  { role: 'student', label: '🎓 Student', active: 'border-brand-400 bg-brand-500/15 text-brand-200', glow: 'hover:shadow-glow-sm' },
  { role: 'faculty', label: '👨‍🏫 Faculty', active: 'border-violet-400 bg-violet-500/15 text-violet-200', glow: 'hover:shadow-glow-violet' },
  { role: 'admin', label: '🛡️ Admin', active: 'border-emerald-400 bg-emerald-500/15 text-emerald-200', glow: 'hover:shadow-glow-sm' },
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
    <div className="min-h-screen flex bg-slate-950">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Animated orbs */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl animate-float" />
        <div className="absolute top-1/3 -left-24 h-80 w-80 rounded-full bg-brand-400/20 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-32 -right-10 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center shadow-lift">
              <GraduationCap size={24} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">CAMPUSCONNECT</span>
          </div>
        </div>

        <div className="relative space-y-7">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
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
          <p className="text-brand-100/80 text-lg max-w-md animate-fade-up" style={{ animationDelay: '0.46s' }}>
            Timetable, attendance, assignments, opportunities and a personal AI copilot — everything a student needs, in one place.
          </p>
          <div className="flex flex-wrap gap-2.5 animate-fade-up" style={{ animationDelay: '0.58s' }}>
            {FEATURES.map(({ icon: Icon, label, color }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full glass px-3.5 py-2 text-sm text-white/90 transition duration-300 hover:bg-white/20 hover:scale-105 cursor-default"
              >
                <Icon size={14} className={color} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-brand-200/60 animate-fade-up" style={{ animationDelay: '0.7s' }}>
          © 2026 CAMPUSCONNECT · Nova Institute of Technology
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
        {/* Soft ambient glow */}
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }} />

        <div className="w-full max-w-md relative">
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8 animate-fade-up">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-glow-sm">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">CAMPUSCONNECT</span>
          </div>

          <div className="card p-8 animate-scale-in">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back 👋</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">Log in to your campus dashboard.</p>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4 animate-fade-in">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" className="input pl-10" />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input pl-10" />
                </div>
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                  Forgot password?
                </Link>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? <Spinner size={18} className="text-white" /> : 'Log in'}
                {!loading ? <ArrowRight size={16} /> : null}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Demo accounts</p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ROLES.map(({ role, label, active, glow }) => (
                  <button
                    key={role}
                    onClick={() => fillDemo(role)}
                    className={`rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-white ${active} ${glow}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Click to fill credentials — password is <code className="font-mono">demo1234</code></p>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            New here?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
              Create an account <Sparkles size={13} className="text-brand-500" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
