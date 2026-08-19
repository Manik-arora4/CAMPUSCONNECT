import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { ensureSeed } from './services/seedService.js';
import { startScheduledJobs } from './services/scheduler.js';

// Supabase free-tier / IPv6 connections can blip — retry before giving up
async function connectWithRetry(attempts = 8, delayMs = 4000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await connectDB();
      return;
    } catch (err) {
      const msg = String(err?.message || err).split('\n')[0];
      console.error(`[db] connection attempt ${i}/${attempts} failed: ${msg}`);
      if (i === attempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function main() {
  await connectWithRetry();
  await ensureSeed();
  startScheduledJobs();
  app.listen(env.PORT, () => {
    console.log(`\n🚀 CAMPUSCONNECT server running at http://localhost:${env.PORT}`);
    console.log(`   API: http://localhost:${env.PORT}/api`);
    console.log(`   AI mode: ${env.GROQ_API_KEY ? 'Groq / GPT-OSS 20B (live)' : env.GEMINI_API_KEY ? 'Gemini (live)' : 'offline fallbacks (set GROQ_API_KEY or GEMINI_API_KEY)'}\n`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
