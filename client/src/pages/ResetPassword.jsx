import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Spinner } from '../components/UI';

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="card p-8 text-center max-w-md">
          <AlertCircle size={40} className="text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold">Invalid link</h2>
          <p className="text-sm text-slate-500 mt-2">This reset link is missing or broken. Request a new one.</p>
          <Link to="/forgot-password" className="btn-primary mt-6">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="card p-8">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900">Password updated!</h2>
              <p className="text-sm text-slate-500 mt-2">You can now log in with your new password.</p>
              <Link to="/login" className="btn-primary mt-6">
                Go to login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900">Set a new password</h2>
              <p className="text-sm text-slate-500 mt-1 mb-6">Choose a strong password you haven't used before.</p>
              {error ? <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4">{error}</div> : null}
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="label">New password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="input pl-10" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <Spinner size={18} className="text-white" /> : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
