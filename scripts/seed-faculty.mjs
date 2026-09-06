/**
 * Seed script for CampusConnect Faculty + Attendance module
 * Run: node scripts/seed-faculty.mjs
 */

import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
config({ path: resolve(__dirname, '../server/.env') });

// Use server's Prisma client + direct connection (port 5432)
const directUrl = process.env.DATABASE_URL?.replace('6543', '5432')?.replace('?pgbouncer=true', '');
const prismaPath = pathToFileURL(resolve(__dirname, '../server/node_modules/@prisma/client/index.js')).href;
const { PrismaClient } = await import(prismaPath);
const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('🌱 Seeding CampusConnect database...\n');

  // ═══════════════════════════════════════════════════════════
  // 1. COLLEGE
  // ═══════════════════════════════════════════════════════════
  console.log('📚 Creating college...');
  const college = await prisma.college.upsert({
    where: { code: 'IET_001' },
    update: {},
    create: {
      name: 'Institute of Engineering & Technology',
      code: 'IET_001',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      website: 'https://iet.example.edu',
      contactEmail: 'admin@iet.example.edu',
      contactPhone: '+91-522-1234567',
    },
  });
  console.log(`  ✅ College: ${college.name} (${college.id})`);

  // ═══════════════════════════════════════════════════════════
  // 2. DEPARTMENTS
  // ═══════════════════════════════════════════════════════════
  console.log('\n🏢 Creating departments...');
  const deptCSE = await prisma.department.upsert({
    where: { college_name: { college: college.id, name: 'Computer Science & Engineering' } },
    update: {},
    create: {
      college: college.id,
      name: 'Computer Science & Engineering',
      code: 'CSE',
    },
  });
  const deptIT = await prisma.department.upsert({
    where: { college_name: { college: college.id, name: 'Information Technology' } },
    update: {},
    create: {
      college: college.id,
      name: 'Information Technology',
      code: 'IT',
    },
  });
  console.log(`  ✅ ${deptCSE.name}`);
  console.log(`  ✅ ${deptIT.name}`);

  // ═══════════════════════════════════════════════════════════
  // 3. COURSES
  // ═══════════════════════════════════════════════════════════
  console.log('\n📖 Creating courses...');
  const courseBTech = await prisma.course.upsert({
    where: { unique_course_code: { college: college.id, code: 'BTech-CSE' } },
    update: {},
    create: {
      college: college.id,
      department: deptCSE.id,
      name: 'B.Tech Computer Science & Engineering',
      code: 'BTech-CSE',
      duration: 4,
      totalSemesters: 8,
    },
  });
  const courseBCA = await prisma.course.upsert({
    where: { unique_course_code: { college: college.id, code: 'BCA' } },
    update: {},
    create: {
      college: college.id,
      department: deptCSE.id,
      name: 'Bachelor of Computer Applications',
      code: 'BCA',
      duration: 3,
      totalSemesters: 6,
    },
  });
  console.log(`  ✅ ${courseBTech.name}`);
  console.log(`  ✅ ${courseBCA.name}`);

  // ═══════════════════════════════════════════════════════════
  // 4. SECTIONS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📋 Creating sections...');
  const sections = [];
  for (const course of [courseBTech, courseBCA]) {
    for (const sem of [1, 2, 3, 4]) {
      if (sem > course.totalSemesters) continue;
      for (const sec of ['A', 'B']) {
        const section = await prisma.section.upsert({
          where: { unique_section: { course: course.id, semester: sem, name: `Section ${sec}` } },
          update: {},
          create: {
            course: course.id,
            semester: sem,
            name: `Section ${sec}`,
            code: sec,
            maxStudents: 60,
          },
        });
        sections.push(section);
      }
    }
  }
  console.log(`  ✅ ${sections.length} sections created`);

  // ═══════════════════════════════════════════════════════════
  // 5. SUBJECTS
  // ═══════════════════════════════════════════════════════════
  console.log('\n📝 Creating subjects...');
  const subjectsData = [
    { name: 'Data Structures & Algorithms', code: 'CS101', semester: 3, course: courseBTech.id, color: '#6366f1' },
    { name: 'Database Management Systems', code: 'CS201', semester: 4, course: courseBTech.id, color: '#8b5cf6' },
    { name: 'Operating Systems', code: 'CS301', semester: 4, course: courseBTech.id, color: '#ec4899' },
    { name: 'Computer Networks', code: 'CS401', semester: 5, course: courseBTech.id, color: '#f59e0b' },
    { name: 'Web Development', code: 'CS501', semester: 3, course: courseBCA.id, color: '#10b981' },
    { name: 'Programming in C', code: 'BCA101', semester: 1, course: courseBCA.id, color: '#3b82f6' },
  ];

  const subjects = [];
  for (const s of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { id: `seed-${s.code}` },
      update: {},
      create: {
        id: `seed-${s.code}`,
        college: college.id,
        course: s.course,
        department: deptCSE.id,
        name: s.name,
        code: s.code,
        semester: s.semester,
        color: s.color,
        credits: 4,
      },
    });
    subjects.push(subject);
  }
  console.log(`  ✅ ${subjects.length} subjects created`);

  // ═══════════════════════════════════════════════════════════
  // 6. FACULTY
  // ═══════════════════════════════════════════════════════════
  console.log('\n👨‍🏫 Creating faculty...');
  const facultyPassword = await hashPassword('faculty1234');

  const faculty1 = await prisma.user.upsert({
    where: { email: 'dr.sharma@iet.edu' },
    update: {},
    create: {
      name: 'Dr. Rajesh Sharma',
      email: 'dr.sharma@iet.edu',
      password: facultyPassword,
      role: 'faculty',
      college: college.id,
      designation: 'Professor',
      approved: true,
      active: true,
    },
  });

  const faculty2 = await prisma.user.upsert({
    where: { email: 'prof.gupta@iet.edu' },
    update: {},
    create: {
      name: 'Prof. Ananya Gupta',
      email: 'prof.gupta@iet.edu',
      password: facultyPassword,
      role: 'faculty',
      college: college.id,
      designation: 'Assistant Professor',
      approved: true,
      active: true,
    },
  });

  // Create faculty profiles
  await prisma.facultyProfile.upsert({
    where: { user: faculty1.id },
    update: {},
    create: {
      user: faculty1.id,
      college: college.id,
      employeeId: 'FAC-001',
      department: 'Computer Science & Engineering',
      departmentId: deptCSE.id,
      designation: 'Professor',
      assignedSubjects: [subjects[0].id, subjects[1].id],
      assignedCourses: [courseBTech.id],
      bio: 'Expert in Data Structures and Database Systems',
    },
  });

  await prisma.facultyProfile.upsert({
    where: { user: faculty2.id },
    update: {},
    create: {
      user: faculty2.id,
      college: college.id,
      employeeId: 'FAC-002',
      department: 'Computer Science & Engineering',
      departmentId: deptCSE.id,
      designation: 'Assistant Professor',
      assignedSubjects: [subjects[4].id, subjects[5].id],
      assignedCourses: [courseBCA.id],
      bio: 'Web Development and Programming expert',
    },
  });

  // Assign faculty to subjects
  await prisma.subject.update({ where: { id: subjects[0].id }, data: { faculty: faculty1.id } });
  await prisma.subject.update({ where: { id: subjects[1].id }, data: { faculty: faculty1.id } });
  await prisma.subject.update({ where: { id: subjects[4].id }, data: { faculty: faculty2.id } });
  await prisma.subject.update({ where: { id: subjects[5].id }, data: { faculty: faculty2.id } });

  console.log(`  ✅ ${faculty1.name} (dr.sharma@iet.edu / faculty1234)`);
  console.log(`  ✅ ${faculty2.name} (prof.gupta@iet.edu / faculty1234)`);

  // ═══════════════════════════════════════════════════════════
  // 7. STUDENTS
  // ═══════════════════════════════════════════════════════════
  console.log('\n🎓 Creating students...');
  const studentPassword = await hashPassword('student1234');
  const studentNames = [
    'Amit Kumar', 'Priya Singh', 'Rahul Verma', 'Sneha Patel',
    'Vikash Yadav', 'Neha Sharma', 'Arjun Mehta', 'Pooja Reddy',
    'Sanjay Mishra', 'Kavya Nair', 'Rohit Tiwari', 'Anjali Das',
  ];

  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const name = studentNames[i];
    const email = `student${i + 1}@iet.edu`;
    const course = i < 8 ? courseBTech : courseBCA;
    const sem = i < 4 ? 3 : i < 8 ? 4 : 1;
    const sec = i % 2 === 0 ? 'A' : 'B';

    const student = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        password: studentPassword,
        role: 'student',
        college: college.id,
        approved: true,
        active: true,
      },
    });

    // Create student profile
    await prisma.studentProfile.upsert({
      where: { user: student.id },
      update: {},
      create: {
        user: student.id,
        college: college.id,
        course: course.name,
        semester: sem,
        year: Math.ceil(sem / 2),
        section: sec,
        enrollmentNumber: `EN${(2024 + Math.floor(sem / 2))}${String(i + 1).padStart(3, '0')}`,
      },
    });

    // Create enrollment
    const section = sections.find(s => s.course === course.id && s.semester === sem && s.code === sec);
    if (section) {
      await prisma.enrollment.upsert({
        where: { unique_enrollment: { student: student.id, course: course.id, semester: sem } },
        update: {},
        create: {
          student: student.id,
          course: course.id,
          section: section.id,
          semester: sem,
          year: Math.ceil(sem / 2),
          status: 'active',
          enrollmentNumber: `EN${(2024 + Math.floor(sem / 2))}${String(i + 1).padStart(3, '0')}`,
        },
      });
    }

    students.push(student);
  }
  console.log(`  ✅ ${students.length} students created`);

  // ═══════════════════════════════════════════════════════════
  // 8. ADMIN
  // ═══════════════════════════════════════════════════════════
  console.log('\n👑 Creating admin...');
  const adminPassword = await hashPassword('admin1234');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@iet.edu' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@iet.edu',
      password: adminPassword,
      role: 'admin',
      college: college.id,
      approved: true,
      active: true,
    },
  });
  console.log(`  ✅ Admin (admin@iet.edu / admin1234)`);

  // ═══════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(50));
  console.log('✅ SEED COMPLETE!');
  console.log('═'.repeat(50));
  console.log('\n📋 Test Accounts:');
  console.log('  Admin:    admin@iet.edu / admin1234');
  console.log('  Faculty:  dr.sharma@iet.edu / faculty1234');
  console.log('  Faculty:  prof.gupta@iet.edu / faculty1234');
  console.log('  Student:  student1@iet.edu / student1234');
  console.log('  Student:  student2@iet.edu / student1234');
  console.log('  ... (student3-12@iet.edu / student1234)');
  console.log('\n📊 Database Summary:');
  console.log(`  College:      1`);
  console.log(`  Departments:  2`);
  console.log(`  Courses:      2`);
  console.log(`  Sections:     ${sections.length}`);
  console.log(`  Subjects:     ${subjects.length}`);
  console.log(`  Faculty:      2`);
  console.log(`  Students:     ${students.length}`);
  console.log(`  Admin:        1`);
  console.log('\n🚀 Ready for testing!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
