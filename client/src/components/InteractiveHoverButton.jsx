import { ArrowRight } from 'lucide-react';

/**
 * Magic-UI style interactive hover button.
 * On hover the dot expands to fill the pill, the label slides out,
 * and the label + arrow slide in over the filled background.
 */
export default function InteractiveHoverButton({ children, className = '', ...props }) {
  return (
    <button
      className={`group relative w-auto cursor-pointer overflow-hidden rounded-full border border-slate-300 bg-white p-2 px-6 text-center font-semibold text-slate-800 shadow-sm transition-all duration-300 hover:shadow-lift disabled:opacity-60 disabled:pointer-events-none ${className}`}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-brand-500 to-violet-600 transition-all duration-300 group-hover:scale-[100.8]" />
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">{children}</span>
      </div>
      <div className="absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-white opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100">
        <span>{children}</span>
        <ArrowRight size={16} />
      </div>
    </button>
  );
}
