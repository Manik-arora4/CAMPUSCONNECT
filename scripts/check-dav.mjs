import { PrismaClient } from '../server/node_modules/@prisma/client/index.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../server/.env') });

const directUrl = process.env.DATABASE_URL?.replace(':6543', ':5432')?.replace('6543', '5432');
const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });

async function main() {
  const college = await prisma.college.findFirst({ where: { code: 'DAV-AMR' } });
  const courses = await prisma.course.findMany({ where: { college: college.id } });
  const depts = await prisma.department.findMany({ where: { college: college.id } });

  console.log('Departments:', depts.map(d => `${d.name} (${d.code})`).join(', '));
  for (const c of courses) {
    const subjects = await prisma.subject.findMany({ where: { course: c.id }, select: { name: true, code: true, semester: true, faculty: true } });
    console.log(`\n📚 ${c.name} (${c.code}) [${c.id}]`);
    const bySem = {};
    for (const s of subjects) { (bySem[s.semester] ||= []).push(s); }
    for (const sem of Object.keys(bySem).sort()) {
      console.log(`  Sem ${sem}: ${bySem[sem].map(s => `${s.name}${s.faculty ? ' 👤' : ''}`).join(', ')}`);
    }
  }
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
