/**
 * Data fix: reassign users stuck on fake colleges (college-ID-saved-as-name bug)
 * and delete the fake colleges. Safe to re-run.
 * Run: node scripts/fix-fake-colleges.mjs
 */
import { PrismaClient } from '../server/node_modules/@prisma/client/index.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../server/.env') });
const directUrl = process.env.DATABASE_URL?.replace(':6543', ':5432')?.replace('6543', '5432');
const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });

const CUID_LIKE = /^c[a-z0-9]{20,}$/i;

async function main() {
  // Fake colleges: college's NAME exactly equals some college's ID (the bug:
  // frontend sent college ID, old ensureCollege() saved it as a new college name)
  const colleges = await prisma.college.findMany();
  const idSet = new Set(colleges.map((c) => c.id));
  const fakes = colleges.filter((c) => idSet.has(c.name) && c.name !== c.id);
  console.log(`Fake colleges found: ${fakes.length}`);
  if (!fakes.length) return console.log('Nothing to fix ✅');

  for (const fake of fakes) {
    const real = await prisma.college.findUnique({ where: { id: fake.name } });
    if (!real) {
      console.log(`⚠️  Fake "${fake.name.slice(0, 12)}…" has no matching real college (id ${fake.name}) — skipping`);
      continue;
    }
    console.log(`\n🔧 Fake "${fake.name}" (id ${fake.id}) → real "${real.name}" (${real.code})`);

    const users = await prisma.user.findMany({ where: { college: fake.id }, select: { id: true, name: true, email: true } });
    for (const u of users) {
      await prisma.user.update({ where: { id: u.id }, data: { college: real.id } });
      await prisma.studentProfile.updateMany({ where: { user: u.id }, data: { college: real.id } });
      console.log(`   ✅ ${u.name} <${u.email}> → ${real.name}`);
    }

    // Move any stray rows referencing the fake college, then delete it
    const movedSubjects = await prisma.subject.updateMany({ where: { college: fake.id }, data: { college: real.id } });
    const movedNotices = await prisma.notice.updateMany({ where: { college: fake.id }, data: { college: real.id } });
    const movedEvents = await prisma.event.updateMany({ where: { college: fake.id }, data: { college: real.id } });
    await prisma.department.deleteMany({ where: { college: fake.id } });
    const remainingUsers = await prisma.user.count({ where: { college: fake.id } });
    if (remainingUsers === 0) {
      await prisma.college.delete({ where: { id: fake.id } }).catch(() => {});
      console.log(`   🗑️  Fake college deleted (moved: ${movedSubjects.count} subjects, ${movedNotices.count} notices, ${movedEvents.count} events)`);
    } else {
      console.log(`   ⚠️  ${remainingUsers} users still on fake college — not deleted`);
    }
  }

  console.log('\n✅ Data fix complete');
}

main().catch((e) => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());
