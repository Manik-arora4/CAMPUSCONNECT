import { connectDB, disconnectDB } from '../src/config/db.js';
import { ensureSeed } from '../src/services/seedService.js';

async function main() {
  const force = process.argv.includes('--force');
  await connectDB();
  await ensureSeed({ force });
  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
