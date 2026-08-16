import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Spinner } from '../components/UI';
import InteractiveHoverButton from '../components/InteractiveHoverButton';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-900 animate-gradient-pan relative overflow-hidden"
        style={{ backgroundSize: '160% 160%' }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-fuchsia-500/25 blur-3xl animate-float-slow" />
        </div>
        <div className="rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-8 text-center max-w-md relative animate-scale-in">
          <AlertCircle size={40} className="text-amber-400 mx-auto mb-3 icon-glow" />
          <h2 className="text-xl font-bold text-white drop-shadow">Invalid link</h2>
          <p className="text-sm text-white/70 mt-2">This reset link is missing or broken. Request a new one.</p>
          <Link to="/forgot-password" className="btn-primary mt-6">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

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
          {done ? (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4 icon-glow" />
              <h2 className="text-xl font-bold text-white drop-shadow">Password updated!</h2>
              <p className="text-sm text-white/70 mt-2">You can now log in with your new password.</p>
              <Link to="/login" className="btn-primary mt-6">
                Go to login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white drop-shadow">Set a new password</h2>
              <p className="text-sm text-white/70 mt-1 mb-6">Choose a strong password you haven't used before.</p>
              {error ? <div className="rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-sm px-4 py-3 mb-4 backdrop-blur">{error}</div> : null}
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">New password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                    <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:shadow-glow-sm transition" />
                  </div>
                </div>
                <InteractiveHoverButton type="submit" disabled={loading} className="w-full">
                  {loading ? <Spinner size={18} /> : 'Update password'}
                </InteractiveHoverButton>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
