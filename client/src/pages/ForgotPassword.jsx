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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="card p-8">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900">Check your inbox</h2>
              <p className="text-sm text-slate-500 mt-2">
                If <span className="font-medium text-slate-700">{email}</span> is registered, we've sent a password reset link. (In demo mode, the link is printed in the server console.)
              </p>
              <Link to="/login" className="btn-secondary mt-6">
                <ArrowLeft size={16} /> Back to login
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
                <ArrowLeft size={15} /> Back
              </Link>
              <h2 className="text-2xl font-bold text-slate-900">Reset your password</h2>
              <p className="text-sm text-slate-500 mt-1 mb-6">Enter your email and we'll send you a reset link.</p>
              {error ? <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4">{error}</div> : null}
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" className="input pl-10" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <Spinner size={18} className="text-white" /> : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
