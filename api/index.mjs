// Vercel Serverless Function — ESM with static import for proper dependency tracing
import app from '../server/src/app.js';

export default async function handler(req, res) {
  return app(req, res);
}
