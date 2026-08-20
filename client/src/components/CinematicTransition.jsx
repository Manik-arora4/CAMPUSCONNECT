import { useState, useEffect, useRef } from 'react';

const PARTICLE_COUNT = 28;
const RING_COUNT = 3;

function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 70,
    y: 50 + (Math.random() - 0.5) * 70,
    size: 1.5 + Math.random() * 3,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 1.5,
    opacity: 0.3 + Math.random() * 0.5,
  }));
}

export default function CinematicTransition({ onComplete }) {
  const [phase, setPhase] = useState('zoomOut'); // zoomOut → reveal → burst → done
  const [tagline, setTagline] = useState('');
  const [particles] = useState(generateParticles);
  const fullTagline = 'Your campus. Your opportunities. One place.';
  const timerRef = useRef(null);

  useEffect(() => {
    // Phase 1: zoom out login page (0-600ms)
    timerRef.current = setTimeout(() => setPhase('reveal'), 600);
    return () => clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (phase !== 'reveal') return;
    // Typewriter effect for tagline
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTagline(fullTagline.slice(0, i));
      if (i >= fullTagline.length) {
        clearInterval(interval);
        // After tagline finishes, start burst
        timerRef.current = setTimeout(() => setPhase('burst'), 800);
      }
    }, 35);
    return () => {
      clearInterval(interval);
      clearTimeout(timerRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'burst') return;
    timerRef.current = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 700);
    return () => clearTimeout(timerRef.current);
  }, [phase, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999]"
      style={{
        pointerEvents: phase === 'done' ? 'none' : 'all',
        opacity: phase === 'zoomOut' ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
      }}
    >
      {/* Dark cinematic background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, #1a0533 0%, #0d0015 50%, #000000 100%)',
          opacity: phase === 'reveal' || phase === 'burst' ? 1 : 0,
          transition: 'opacity 0.6s ease-out',
        }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, rgba(168,130,255,0.9), rgba(139,92,246,0.3))',
            boxShadow: '0 0 6px 2px rgba(168,130,255,0.4)',
            opacity: phase === 'reveal' ? p.opacity : 0,
            animation: phase === 'reveal' || phase === 'burst'
              ? `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite alternate`
              : 'none',
            transition: 'opacity 0.5s ease-out',
          }}
        />
      ))}

      {/* Glowing rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {Array.from({ length: RING_COUNT }, (_, i) => (
          <div
            key={`ring-${i}`}
            className="absolute rounded-full border"
            style={{
              width: 180 + i * 80,
              height: 180 + i * 80,
              borderColor: `rgba(${139 + i * 20}, ${92 + i * 15}, 246, ${0.25 - i * 0.06})`,
              boxShadow: `0 0 ${20 + i * 10}px rgba(139,92,246,${0.15 - i * 0.03}), inset 0 0 ${15 + i * 8}px rgba(168,130,255,${0.08 - i * 0.02})`,
              opacity: phase === 'reveal' ? 1 : 0,
              animation: phase === 'reveal' || phase === 'burst'
                ? `ringPulse ${3 + i * 0.7}s ease-in-out ${i * 0.3}s infinite alternate`
                : 'none',
              transform: phase === 'reveal' ? 'scale(1)' : 'scale(0.5)',
              transition: `opacity 0.7s ease-out ${i * 0.15}s, transform 0.7s ease-out ${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* Orbiting elements */}
      <div className="absolute inset-0 flex items-center justify-center">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={`orbit-${i}`}
            className="absolute"
            style={{
              width: 220 + i * 50,
              height: 220 + i * 50,
              opacity: phase === 'reveal' ? 0.6 : 0,
              transition: `opacity 0.6s ease-out ${0.3 + i * 0.1}s`,
              animation: phase === 'reveal' || phase === 'burst'
                ? `orbitSpin ${8 + i * 3}s linear ${i % 2 === 0 ? 'normal' : 'reverse'} infinite`
                : 'none',
            }}
          >
            {/* Dot on the orbit path */}
            <div
              className="absolute rounded-full"
              style={{
                width: 4 + (i % 2) * 2,
                height: 4 + (i % 2) * 2,
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                background: `linear-gradient(135deg, rgba(192,132,252,0.9), rgba(236,72,153,0.7))`,
                boxShadow: '0 0 8px 3px rgba(192,132,252,0.4)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Light streaks */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={`streak-${i}`}
            className="absolute"
            style={{
              width: 2,
              height: 300 + i * 40,
              background: `linear-gradient(to bottom, transparent, rgba(168,130,255,${0.12 + i * 0.02}), transparent)`,
              opacity: phase === 'reveal' ? 1 : 0,
              transform: `rotate(${i * 36}deg)`,
              transition: `opacity 0.6s ease-out ${0.4 + i * 0.1}s`,
              animation: phase === 'reveal' || phase === 'burst'
                ? `streakPulse ${2.5 + i * 0.5}s ease-in-out ${i * 0.4}s infinite alternate`
                : 'none',
            }}
          />
        ))}
      </div>

      {/* Central glow pulse */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full"
          style={{
            width: 120,
            height: 120,
            background: 'radial-gradient(circle, rgba(168,130,255,0.3), transparent 70%)',
            opacity: phase === 'reveal' ? 1 : 0,
            transition: 'opacity 0.5s ease-out',
            animation: phase === 'reveal' || phase === 'burst'
              ? 'glowPulse 2s ease-in-out infinite alternate'
              : 'none',
          }}
        />
      </div>

      {/* Logo + Tagline container */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          opacity: phase === 'reveal' || phase === 'burst' ? 1 : 0,
          transform: phase === 'reveal' ? 'scale(1)' : phase === 'burst' ? 'scale(1.8)' : 'scale(0.6)',
          transition: phase === 'burst'
            ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-in'
            : 'transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s ease-out',
        }}
      >
        {/* Logo */}
        <div className="relative mb-6">
          <img
            src="/campusconnect-logo.png"
            alt="CampusConnect"
            className="w-24 h-24 rounded-3xl object-cover"
            style={{
              boxShadow: '0 0 40px rgba(139,92,246,0.5), 0 0 80px rgba(168,130,255,0.25)',
              filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.4))',
            }}
          />
          {/* Glow behind logo */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(168,130,255,0.2), transparent 70%)',
              transform: 'scale(2.5)',
              zIndex: -1,
              animation: phase === 'reveal' ? 'glowPulse 1.5s ease-in-out infinite alternate' : 'none',
            }}
          />
        </div>

        {/* Brand name */}
        <h1
          className="text-white text-2xl font-bold tracking-widest mb-3"
          style={{
            textShadow: '0 0 20px rgba(168,130,255,0.6), 0 0 40px rgba(139,92,246,0.3)',
            opacity: phase === 'reveal' ? 1 : 0,
            transition: 'opacity 0.5s ease-out 0.3s',
          }}
        >
          CAMPUSCONNECT
        </h1>

        {/* Tagline with typewriter */}
        <p
          className="text-white/70 text-base tracking-wide font-light"
          style={{
            minHeight: '1.5em',
            textShadow: '0 0 10px rgba(168,130,255,0.3)',
          }}
        >
          {tagline}
          {phase === 'reveal' && tagline.length < fullTagline.length && (
            <span
              className="inline-block w-[2px] h-[1em] bg-white/80 ml-0.5 align-middle"
              style={{ animation: 'blink 0.6s step-end infinite' }}
            />
          )}
        </p>
      </div>

      {/* Burst flash overlay */}
      {phase === 'burst' && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.7), rgba(168,130,255,0.3), transparent 70%)',
            animation: 'burstFlash 0.7s ease-out forwards',
          }}
        />
      )}

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes particleFloat {
          0% { transform: translateY(0) translateX(0); opacity: var(--particle-opacity, 0.4); }
          50% { opacity: calc(var(--particle-opacity, 0.4) * 1.5); }
          100% { transform: translateY(-30px) translateX(15px); opacity: var(--particle-opacity, 0.4); }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.25; }
          50% { opacity: 0.45; }
          100% { transform: scale(1.08); opacity: 0.25; }
        }
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes streakPulse {
          0% { opacity: 0.08; }
          100% { opacity: 0.25; }
        }
        @keyframes glowPulse {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes burstFlash {
          0% { opacity: 0; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}
