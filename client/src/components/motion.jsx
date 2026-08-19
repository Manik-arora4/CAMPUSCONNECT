import { useEffect, useRef, useState } from 'react';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * useInView — reports when an element enters the viewport (once).
 * Backed by IntersectionObserver with a sensible default threshold.
 */
export function useInView({ threshold = 0.01, rootMargin = '0px 0px -12px 0px', once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}

/**
 * Reveal — fades content up as it scrolls into view.
 * Apple-like: expo easing, blur + translate, subtle duration.
 */
export function Reveal({ children, delay = 0, as: Tag = 'div', className = '', ...rest }) {
  const { ref, inView } = useInView();
  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'reveal-visible' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Stagger — reveals children one after another once the container is in view.
 * `step` is the ms gap between each child's reveal.
 */
export function Stagger({ children, step = 80, startDelay = 0, className = '', ...rest }) {
  const { ref, inView } = useInView({ threshold: 0.01 });
  return (
    <div ref={ref} className={`${inView ? 'stagger-visible' : ''} ${className}`} {...rest}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              className="stagger-item"
              style={{ '--reveal-delay': `${startDelay + i * step}ms` }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}

/**
 * CountUp — animates a number from 0 to `value` when scrolled into view.
 * AI-SaaS style stat ticker. Renders a <span> with the formatted number.
 */
export function CountUp({ value, duration = 1000, delay = 0, decimals = 0, className = '' }) {
  const { ref, inView } = useInView({ threshold: 0.4 });
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);

  useEffect(() => {
    if (!inView) return;
    let raf;
    const start = () => {
      startRef.current = performance.now();
      const tick = (now) => {
        const elapsed = now - startRef.current - delay;
        if (elapsed < 0) {
          raf = requestAnimationFrame(tick);
          return;
        }
        const t = Math.min(1, elapsed / duration);
        // easeOutExpo — fast start, graceful landing
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        setDisplay(value * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const timeout = setTimeout(start, 50);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [inView, value, duration, delay]);

  const formatted = display.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className}>
      {formatted}
    </span>
  );
}
