/**
 * Seed: DAV College Amritsar — BCA Sem 3 faculty + subjects
 * Run: node scripts/seed-dav-bca-sem3.mjs
 *
 * Faculty:
 *   Puneet Sharma           — Computer Architecture
 *   Harsimran Singh Anand   — Operating System
 *   Sandeep Sharma          — Information System
 *   Renu Sharma             — Cybersecurity
 *   Vikram Sharma           — DSA
 */
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../server/node_modules/@prisma/client/index.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../server/.env') });

const directUrl = process.env.DATABASE_URL?.replace(':6543', ':5432')?.replace('6543', '5432');
const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });

const ACADEMIC_YEAR = '2026-2027';

const DATA = [
  { name: 'Puneet Sharma', email: 'puneet.sharma@davamritsar.edu', subject: 'Computer Architecture', code: 'BCA301', color: '#6366f1' },
  { name: 'Harsimran Singh Anand', email: 'harsimran.anand@davamritsar.edu', subject: 'Operating System', code: 'BCA302', color: '#ec4899' },
  { name: 'Sandeep Sharma', email: 'sandeep.sharma@davamritsar.edu', subject: 'Information System', code: 'BCA303', color: '#f59e0b' },
  { name: 'Renu Sharma', email: 'renu.sharma@davamritsar.edu', subject: 'Cybersecurity', code: 'BCA304', color: '#ef4444' },
  { name: 'Vikram Sharma', email: 'vikram.sharma@davamritsar.edu', subject: 'Data Structures & Algorithms', code: 'BCA305', color: '#10b981' },
];

async function main() {
  const college = await prisma.college.findFirst({ where: { code: 'DAV-AMR' } });
  if (!college) throw new Error('DAV-AMR college not found');
  console.log(`🏫 College: ${college.name} (${college.id})`);

  const course = await prisma.course.findFirst({ where: { college: college.id, code: 'BCA' } });
  if (!course) throw new Error('BCA course not found in DAV');
  console.log(`📚 Course: ${course.name} (${course.id})`);

  const dept = await prisma.department.findFirst({ where: { college: college.id, name: { contains: 'Computer' } } });

  // BCA Sem 3 sections (A, B) — create if missing
  const sections = [];
  for (const name of ['Section A', 'Section B']) {
    const section = await prisma.section.upsert({
      where: { unique_section: { course: course.id, semester: 3, name } },
      update: {},
      create: { course: course.id, semester: 3, name, code: name.replace('Section ', ''), maxStudents: 60 },
    });
    sections.push(section);
  }
  console.log(`📋 Sections: ${sections.map(s => s.name).join(', ')} (sem 3)`);

  // Existing codes in this college — avoid duplicates
  const existingSubjects = await prisma.subject.findMany({ where: { college: college.id }, select: { code: true } });
  const usedCodes = new Set(existingSubjects.map(s => s.code));

  const password = await bcrypt.hash('faculty1234', 12);
  let facultyCount = 0, subjectCount = 0, assignmentCount = 0;

  for (let i = 0; i < DATA.length; i++) {
    const d = DATA[i];

    // 1. Faculty user
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: { role: 'faculty', college: college.id, approved: true, active: true, name: d.name },
      create: {
        name: d.name,
        email: d.email,
        password,
        role: 'faculty',
        college: college.id,
        designation: 'Assistant Professor',
        approved: true,
        active: true,
      },
    });

    // 2. Subject (unique code per college)
    let code = d.code;
    if (usedCodes.has(code) && code.length) {
      // Only skip collision if it's THIS exact subject already (idempotent re-run)
      const mine = await prisma.subject.findFirst({ where: { college: college.id, code, name: d.subject } });
      if (!mine) code = `${d.code}-S3`;
    }
    const subject = await prisma.subject.upsert({
      where: { id: `dav-bca3-${d.code}` },
      update: { faculty: user.id, course: course.id, semester: 3 },
      create: {
        id: `dav-bca3-${d.code}`,
        college: college.id,
        course: course.id,
        department: dept?.id,
        name: d.subject,
        code,
        semester: 3,
        faculty: user.id,
        color: d.color,
        credits: 4,
      },
    });
    subjectCount++;

    // 3. FacultyProfile
    await prisma.facultyProfile.upsert({
      where: { user: user.id },
      update: {
        assignedSubjects: { set: [subject.id] },
        assignedCourses: { set: [course.id] },
        department: dept?.name || 'Computer Science',
        departmentId: dept?.id,
      },
      create: {
        user: user.id,
        college: college.id,
        employeeId: `DAV-FAC-${String(i + 10).padStart(3, '0')}`,
        department: dept?.name || 'Computer Science',
        departmentId: dept?.id,
        designation: 'Assistant Professor',
        assignedSubjects: [subject.id],
        assignedCourses: [course.id],
        bio: `${d.subject} — BCA Semester 3`,
      },
    });

    // 4. FacultyAssignment for each sem-3 section (attendance flow uses this)
    for (const section of sections) {
      await prisma.facultyAssignment.upsert({
        where: {
          unique_faculty_assignment: {
            faculty: user.id, course: course.id, section: section.id,
            subject: subject.id, semester: 3, academicYear: ACADEMIC_YEAR,
          },
        },
        update: { active: true },
        create: {
          faculty: user.id,
          course: course.id,
          section: section.id,
          subject: subject.id,
          semester: 3,
          academicYear: ACADEMIC_YEAR,
          college: college.id,
          active: true,
        },
      });
      assignmentCount++;
    }

    facultyCount++;
    console.log(`✅ ${d.name} — ${d.subject} (${code}) <${d.email}>`);
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`🎉 Done: ${facultyCount} faculty, ${subjectCount} subjects, ${assignmentCount} assignments`);
  console.log('Login: <email> / faculty1234');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
