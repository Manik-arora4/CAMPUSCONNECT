/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        lift: '0 10px 25px -5px rgb(0 0 0 / 0.12), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'glow-sm': '0 0 14px -4px rgb(99 102 241 / 0.5)',
        glow: '0 0 28px -6px rgb(99 102 241 / 0.55)',
        'glow-violet': '0 0 28px -6px rgb(139 92 246 / 0.55)',
        'card-hover': '0 18px 40px -12px rgb(0 0 0 / 0.18), 0 6px 12px -6px rgb(0 0 0 / 0.08)',
      },
      transitionTimingFunction: {
        // Apple-style expo out — the signature "premium" easing curve
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-expo': 'cubic-bezier(0.7, 0, 0.84, 0)',
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '0.9' },
        },
        spinSlow: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'blink-cursor': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        'blur-in': {
          '0%': { opacity: '0', filter: 'blur(10px)' },
          '100%': { opacity: '1', filter: 'blur(0px)' },
        },
        'rise-in': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in-soft': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bar-grow': {
          '0%': { transform: 'scaleY(0)' },
          '100%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'float-slow': 'float 11s ease-in-out infinite',
        'fade-up': 'fade-up 0.55s ease-out both',
        'scale-in': 'scale-in 0.4s ease-out both',
        shimmer: 'shimmer 2.4s linear infinite',
        'gradient-pan': 'gradient-pan 8s ease infinite',
        'pulse-soft': 'pulse-soft 3.5s ease-in-out infinite',
        'spin-slow': 'spinSlow 14s linear infinite',
        'blink-cursor': 'blink-cursor 1.2s step-end infinite',
        'blur-in': 'blur-in 0.6s ease-out-expo both',
        'rise-in': 'rise-in 0.6s ease-out-expo both',
        'scale-in-soft': 'scale-in-soft 0.45s ease-out-expo both',
        'slide-in-right': 'slide-in-right 0.5s ease-out-expo both',
        'slide-down': 'slide-down 0.4s ease-out-expo both',
        'bar-grow': 'bar-grow 0.6s ease-out-expo both',
      },
    },
  },
  plugins: [],
};
