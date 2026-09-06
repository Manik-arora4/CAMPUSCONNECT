import { PrismaClient } from '../server/node_modules/@prisma/client/index.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../server/.env') });

const directUrl = process.env.DATABASE_URL?.replace(':6543', ':5432')?.replace('6543', '5432');
const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });

async function main() {
  const colleges = await prisma.college.findMany({ select: { id: true, name: true, code: true } });
  for (const c of colleges) {
    const [users, subjects] = await Promise.all([
      prisma.user.count({ where: { college: c.id } }),
      prisma.subject.count({ where: { college: c.id } }),
    ]);
    if (users > 0) console.log(`${users} users | ${subjects} subjects | ${c.name} (${c.code})`);
  }

  // Faculty list bhi dekh lo
  const faculty = await prisma.user.findMany({ where: { role: 'faculty' }, select: { name: true, email: true, college: true } });
  console.log('\nExisting faculty:');
  for (const f of faculty) {
    const col = colleges.find(c => c.id === f.college);
    console.log(`  • ${f.name} <${f.email}> @ ${col?.name || 'no college'}`);
  }
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
