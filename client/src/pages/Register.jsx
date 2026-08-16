import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, AlertCircle, User, Mail, Lock, School } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/UI';

const INPUT_CLS =
  'w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:shadow-glow-sm transition';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', college: '', course: '', semester: 1 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await register(form);
      navigate(data.user?.role === 'student' ? '/profile' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-lg relative">
          <div className="flex items-center gap-2.5 justify-center mb-8 animate-fade-up">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
              <GraduationCap size={22} className="text-white icon-glow" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight drop-shadow">CAMPUSCONNECT</span>
          </div>

          <div className="rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-8 animate-scale-in">
            <h2 className="text-2xl font-bold text-white drop-shadow">Create your account</h2>
            <p className="text-sm text-white/70 mt-1 mb-6">Join your college's smart campus in under a minute.</p>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-sm px-4 py-3 mb-4 animate-fade-in backdrop-blur">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Full name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                  <input required value={form.name} onChange={set('name')} placeholder="Aarav Sharma" className={INPUT_CLS} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                  <input type="email" required value={form.email} onChange={set('email')} placeholder="you@college.edu" className={INPUT_CLS} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                  <input type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="At least 6 characters" className={INPUT_CLS} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">College</label>
                  <div className="relative">
                    <School size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                    <input value={form.college} onChange={set('college')} placeholder="e.g. Nova Institute of Technology" className={INPUT_CLS} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">Course</label>
                  <input value={form.course} onChange={set('course')} placeholder="e.g. BCA" className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur px-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 transition" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Semester</label>
                <select value={form.semester} onChange={set('semester')} className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 transition [&>option]:text-slate-900">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? <Spinner size={18} /> : 'Create account'}
                {!loading ? <ArrowRight size={16} /> : null}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-white/70 mt-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-white hover:text-brand-200 transition">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
