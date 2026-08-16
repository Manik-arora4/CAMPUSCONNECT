import React from 'react';
import { useAuth } from '../context/AuthContext';

export function Spinner({ size = 20, className = '' }) {
  // Spacious74-style 5-bar equalizer loader, scales with `size`
  const s = Math.max(0.12, size / 100);
  return (
    <div
      className={`loading ${className}`}
      role="status"
      aria-label="Loading"
      style={{
        width: size,
        height: size,
        ['--gap']: `${6 * s}px`,
        ['--bar-w']: `${Math.max(2, 4 * s)}px`,
        ['--bar-h']: `${50 * s}px`,
      }}
    >
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export function LoadingScreen({ label = 'Loading…' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-100">
      <Spinner size={32} />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner size={28} />
    </div>
  );
}

export function Badge({ children, className = 'bg-slate-100 text-slate-700' }) {
  return <span className={`chip border border-slate-200/60 shadow-sm ${className}`}>{children}</span>;
}

export function Card({ children, className = '', ...rest }) {
  return (
    <div className={`card p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, sub, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    sky: 'bg-sky-50 text-sky-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <Card className="flex items-start gap-4">
      <div className={`rounded-xl p-2.5 ${tones[tone] || tones.brand}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {sub ? <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p> : null}
      </div>
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {Icon ? (
        <div className="rounded-2xl bg-slate-100 p-4 mb-4">
          <Icon size={32} className="text-slate-400" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {message ? <p className="text-sm text-slate-500 mt-1 max-w-sm">{message}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-white rounded-2xl shadow-lift w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto animate-fade-in`}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title = 'Are you sure?', message = '', confirmLabel = 'Confirm', danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {message ? <p className="text-sm text-slate-600 mb-4">{message}</p> : null}
      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className={danger ? 'btn-danger' : 'btn-primary'}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function ProgressBar({ value, max = 100, color = 'bg-brand-500' }) {
  const pct = max ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-slate-200 mb-6">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
            active === t.key
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint ? <p className="text-xs text-slate-400 mt-1">{hint}</p> : null}
    </div>
  );
}

export function ErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4">
      {error.message || String(error)}
    </div>
  );
}

export function Avatar({ name = '', size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <div
      className={`${sizes[size] || sizes.md} rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-white flex items-center justify-center font-semibold shrink-0`}
    >
      {initials || '?'}
    </div>
  );
}

export function useAsync(fn, deps = []) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  const reload = React.useCallback(() => setReloadKey((k) => k + 1), []);
  return { data, loading, error, reload };
}

export function useAuthCheck() {
  const { user, loading } = useAuth();
  return { user, loading };
}
