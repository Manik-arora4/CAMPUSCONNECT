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
  const subjects = await prisma.subject.findMany({
    where: { college: college.id, semester: 3 },
  });
  console.log('DAV Amritsar — BCA Sem 3 subjects:');
  for (const s of subjects) {
    const f = s.faculty ? await prisma.user.findUnique({ where: { id: s.faculty } }) : null;
    const fa = await prisma.facultyAssignment.findMany({ where: { subject: s.id, active: true } });
    console.log(`  • ${s.name} (${s.code}) → ${f?.name} <${f?.email}> | assignments: ${fa.length}`);
  }
  const users = await prisma.user.findMany({ where: { college: college.id, role: 'faculty' }, select: { name: true, email: true, approved: true, active: true } });
  console.log('\nFaculty users @ DAV:', users.length);
  for (const u of users) console.log(`  • ${u.name} <${u.email}> approved:${u.approved} active:${u.active}`);
}

main().catch((e) => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());
