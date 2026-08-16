import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { ensureSeed } from './services/seedService.js';
import { startScheduledJobs } from './services/scheduler.js';

async function main() {
  await connectDB();
  await ensureSeed();
  startScheduledJobs();
  app.listen(env.PORT, () => {
    console.log(`\n🚀 CAMPUSCONNECT server running at http://localhost:${env.PORT}`);
    console.log(`   API: http://localhost:${env.PORT}/api`);
    console.log(`   AI mode: ${env.GEMINI_API_KEY ? 'Gemini (live)' : 'offline fallbacks (set GEMINI_API_KEY to enable Gemini)'}\n`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
