// Vercel Serverless Function — Express app handler
// Loads the pre-bundled Express server and forwards all requests to it.

let _app;

function getApp() {
  if (!_app) {
    const mod = require('./_app.cjs');
    _app = mod.default || mod;
  }
  return _app;
}

module.exports = async function handler(req, res) {
  try {
    const app = getApp();
    return app(req, res);
  } catch (err) {
    console.error('[vercel] Failed to load app:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server initialization failed', details: err.message });
    }
  }
};
