import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, AlertCircle, User, Mail, Lock, School } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/UI';

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
    <div className="min-h-screen flex bg-slate-50">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2.5 justify-center mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">CAMPUSCONNECT</span>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">Join your college's smart campus in under a minute.</p>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Full name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required value={form.name} onChange={set('name')} placeholder="Aarav Sharma" className="input pl-10" />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" required value={form.email} onChange={set('email')} placeholder="you@college.edu" className="input pl-10" />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="At least 6 characters" className="input pl-10" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">College</label>
                  <div className="relative">
                    <School size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={form.college} onChange={set('college')} placeholder="e.g. Nova Institute of Technology" className="input pl-10" />
                  </div>
                </div>
                <div>
                  <label className="label">Course</label>
                  <input value={form.course} onChange={set('course')} placeholder="e.g. BCA" className="input" />
                </div>
              </div>
              <div>
                <label className="label">Semester</label>
                <select value={form.semester} onChange={set('semester')} className="input">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? <Spinner size={18} className="text-white" /> : 'Create account'}
                {!loading ? <ArrowRight size={16} /> : null}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
