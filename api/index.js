// Vercel serverless function entry point v2
// Loads the pre-bundled Express app with bcrypt login
const mod = require('./_app.cjs');
// esbuild CJS bundle wraps ESM default export in .default
const app = mod.default || mod;
module.exports = app;
