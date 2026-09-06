import { PrismaClient } from '../server/node_modules/@prisma/client/index.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../server/.env') });

const directUrl = process.env.DATABASE_URL?.replace(':6543', ':5432')?.replace('6543', '5432');
const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });

async function main() {
  const bcaCourses = await prisma.course.findMany({
    where: { OR: [{ name: { contains: 'bca', mode: 'insensitive' } }, { code: { contains: 'BCA' } }] },
    select: { id: true, name: true, code: true, college: true },
  });

  for (const c of bcaCourses) {
    const college = await prisma.college.findUnique({ where: { id: c.college }, select: { name: true } });
    const sem3Subjects = await prisma.subject.findMany({
      where: { course: c.id, semester: 3 },
      select: { name: true, code: true, faculty: true },
    });
    console.log(`\n📚 ${college?.name} — ${c.name} (${c.code}) [${c.id}]`);
    if (sem3Subjects.length === 0) {
      console.log('   (sem 3: koi subjects nahi)');
    } else {
      for (const s of sem3Subjects) console.log(`   • ${s.name} (${s.code}) — faculty: ${s.faculty ? 'assigned' : 'none'}`);
    }
  }
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
