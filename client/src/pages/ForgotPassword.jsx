import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { Spinner } from '../components/UI';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-900 animate-gradient-pan relative overflow-hidden"
      style={{ backgroundSize: '160% 160%' }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl animate-float" />
        <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-fuchsia-500/25 blur-3xl animate-float-slow" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>
      <div className="w-full max-w-md relative">
        <div className="rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-8 animate-scale-in">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4 icon-glow" />
              <h2 className="text-xl font-bold text-white drop-shadow">Check your inbox</h2>
              <p className="text-sm text-white/70 mt-2">
                If <span className="font-medium text-white">{email}</span> is registered, we've sent a password reset link. (In demo mode, the link is printed in the server console.)
              </p>
              <Link to="/login" className="btn-secondary mt-6">
                <ArrowLeft size={16} /> Back to login
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition mb-6">
                <ArrowLeft size={15} /> Back
              </Link>
              <h2 className="text-2xl font-bold text-white drop-shadow">Reset your password</h2>
              <p className="text-sm text-white/70 mt-1 mb-6">Enter your email and we'll send you a reset link.</p>
              {error ? <div className="rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-sm px-4 py-3 mb-4 backdrop-blur">{error}</div> : null}
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:shadow-glow-sm transition" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <Spinner size={18} /> : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
