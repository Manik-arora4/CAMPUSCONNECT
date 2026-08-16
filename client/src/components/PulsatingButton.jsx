/**
 * Magic-UI style pulsating button — a soft glow ring pulses outward.
 * Adapted to project colors (brand gradient fill).
 */
export default function PulsatingButton({ children, className = '', pulseColor = '#818cf8', duration = '1.5s', ...props }) {
  return (
    <button
      className={`relative flex cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:from-brand-700 hover:to-violet-700 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ '--pulse-color': pulseColor, '--duration': duration }}
      {...props}
    >
      <div className="relative z-10 flex items-center gap-2">{children}</div>
      <div className="absolute left-1/2 top-1/2 size-full -translate-x-1/2 -translate-y-1/2 animate-pulsating rounded-xl bg-inherit" />
    </button>
  );
}
