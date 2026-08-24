// Vercel Serverless Function — Express app handler
const mod = require('./_app.cjs');
const app = mod.default || mod;

module.exports = async function handler(req, res) {
  return app(req, res);
};
