// Vercel serverless function entry point
// Loads the pre-bundled Express app
const mod = require('./_app.cjs');
// esbuild CJS bundle wraps ESM default export in .default
const app = mod.default || mod;
module.exports = app;
