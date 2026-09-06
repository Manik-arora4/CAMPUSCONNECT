// Security: Block console output in production to prevent data leaks
if (import.meta.env.PROD) {
  const noop = () => {};
  const originalConsole = { ...console };

  // Block info/debug/trace (keep error/warn for critical issues only)
  console.log = noop;
  console.info = noop;
  console.debug = noop;
  console.trace = noop;
  console.table = noop;
  console.dir = noop;
  console.dirxml = noop;
  console.group = noop;
  console.groupEnd = noop;
  console.groupCollapsed = noop;
  console.time = noop;
  console.timeEnd = noop;
  console.timeLog = noop;
  console.count = noop;
  console.countReset = noop;
  console.assert = noop;
  console.profile = noop;
  console.profileEnd = noop;

  // Warn/error — only log message string, never objects/arrays (prevents data leak)
  console.warn = (...args) => originalConsole.warn('[WARN]', ...args.map(a => typeof a === 'object' ? '[redacted]' : a));
  console.error = (...args) => originalConsole.error('[ERR]', ...args.map(a => typeof a === 'object' ? '[redacted]' : a));

  // Block window.__NEXT_DATA__ and similar debug globals
  Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', { value: null });
  Object.defineProperty(window, '__VUE_DEVTOOLS_GLOBAL_HOOK__', { value: null });

  // Override JSON.stringify to redact sensitive keys if accidentally logged
  const _origStringify = JSON.stringify;
  JSON.stringify = function (value, replacer, space) {
    return _origStringify.call(this, value, (key, val) => {
      if (typeof key === 'string' && /password|token|secret|api.?key|database.?url|jwt/i.test(key)) return '[REDACTED]';
      return replacer ? replacer(key, val) : val;
    }, space);
  };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
