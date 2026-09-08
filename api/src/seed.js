// CampusConnect Seed Script
// Creates test data: colleges, courses, sections, subjects, admin, faculty, students
// Run: node src/seed.js

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// ========== HELPERS ==========

function hashPassword(password) {
  // Simple hash for seed data — in production use bcrypt
  return crypto.createHash('sha256').update(password).digest('hex');
}

function randomId() {
  return crypto.randomBytes(8).toString('hex');
}

// ========== SEED DATA ==========

const COLLEGES = [
  {
    name: 'Government Engineering College, Ajmer',
    code: 'GECA',
    address: 'Kekri Road, Ajmer',
    city: 'Ajmer',
    state: 'Rajasthan',
    website: 'https://gecajmer.ac.in',
    contactEmail: 'info@gecajmer.ac.in',
    contactPhone: '+91-145-2692000',
    establishedYear: 1997
  },
  {
    name: 'University Institute of Technology, RGPV',
    code: 'UITRGPV',
    address: 'Govindpura, Bhopal',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    website: 'https://uitrgpv.ac.in',
    contactEmail: 'info@uitrgpv.ac.in',
    contactPhone: '+91-755-2678000',
    establishedYear: 1999
  },
  {
    name: 'DAV College, Amritsar',
    code: 'DAVAMR',
    address: 'Grand Trunk Rd, Amritsar',
    city: 'Amritsar',
    state: 'Punjab',
    website: 'https://davcollege.edu.in',
    contactEmail: 'info@davamritsar.ac.in',
    contactPhone: '+91-183-2223456',
    establishedYear: 1948
  }
];

const COURSES = [
  // GECA courses
  { collegeCode: 'GECA', name: 'B.Tech Computer Science', code: 'BTCS', degree: 'B.Tech', totalSemesters: 8, duration: 4 },
  { collegeCode: 'GECA', name: 'B.Tech Electronics', code: 'BTEC', degree: 'B.Tech', totalSemesters: 8, duration: 4 },
  { collegeCode: 'GECA', name: 'BCA', code: 'BCA', degree: 'BCA', totalSemesters: 6, duration: 3 },
  // UITRGPV courses
  { collegeCode: 'UITRGPV', name: 'B.Tech Computer Science', code: 'BTCS', degree: 'B.Tech', totalSemesters: 8, duration: 4 },
  { collegeCode: 'UITRGPV', name: 'B.Tech IT', code: 'BTIT', degree: 'B.Tech', totalSemesters: 8, duration: 4 },
  // DAV Amritsar courses
  { collegeCode: 'DAVAMR', name: 'BCA', code: 'BCA', degree: 'BCA', totalSemesters: 6, duration: 3 },
];

const SECTIONS_PER_COURSE = ['A', 'B', 'C'];

const SUBJECTS = {
  'BTCS-GECA': [
    { name: 'Data Structures & Algorithms', code: 'CS201', semester: 3, credits: 4, color: '#6366f1' },
    { name: 'Operating Systems', code: 'CS301', semester: 5, credits: 4, color: '#8b5cf6' },
    { name: 'Database Management Systems', code: 'CS302', semester: 5, credits: 4, color: '#ec4899' },
    { name: 'Computer Networks', code: 'CS401', semester: 7, credits: 3, color: '#f59e0b' },
    { name: 'Software Engineering', code: 'CS303', semester: 5, credits: 3, color: '#10b981' },
    { name: 'Web Development', code: 'CS202', semester: 3, credits: 3, color: '#3b82f6' },
    { name: 'Machine Learning', code: 'CS402', semester: 7, credits: 3, color: '#ef4444' },
    { name: 'Theory of Computation', code: 'CS304', semester: 5, credits: 3, color: '#64748b' },
  ],
  'BCA-GECA': [
    { name: 'Programming in C', code: 'BCA101', semester: 1, credits: 4, color: '#6366f1' },
    { name: 'Data Structures', code: 'BCA201', semester: 3, credits: 4, color: '#8b5cf6' },
    { name: 'Operating Systems', code: 'BCA301', semester: 5, credits: 3, color: '#ec4899' },
    { name: 'Database Systems', code: 'BCA302', semester: 5, credits: 3, color: '#f59e0b' },
    { name: 'Web Technologies', code: 'BCA401', semester: 5, credits: 3, color: '#10b981' },
    { name: 'Java Programming', code: 'BCA202', semester: 3, credits: 4, color: '#3b82f6' },
  ],
  'BTCS-UITRGPV': [
    { name: 'Discrete Mathematics', code: 'CS101', semester: 1, credits: 4, color: '#6366f1' },
    { name: 'OOP using C++', code: 'CS102', semester: 1, credits: 4, color: '#8b5cf6' },
    { name: 'Data Structures', code: 'CS201', semester: 3, credits: 4, color: '#ec4899' },
    { name: 'Computer Architecture', code: 'CS301', semester: 5, credits: 3, color: '#f59e0b' },
    { name: 'DBMS', code: 'CS302', semester: 5, credits: 4, color: '#10b981' },
  ],
  'BCA-DAVAMR': [
    { name: 'Data Structures & Algorithms', code: 'DAVBCA301', semester: 3, credits: 4, color: '#6366f1' },
    { name: 'Computer Architecture', code: 'DAVBCA302', semester: 3, credits: 4, color: '#8b5cf6' },
    { name: 'Operating System', code: 'DAVBCA303', semester: 3, credits: 4, color: '#ec4899' },
    { name: 'Information System', code: 'DAVBCA304', semester: 3, credits: 3, color: '#f59e0b' },
    { name: 'Cybersecurity', code: 'DAVBCA305', semester: 3, credits: 3, color: '#10b981' },
  ],
};

const USERS = {
  admin: [
    { name: 'Dr. Rajesh Kumar', email: 'admin@geca.ac.in', college: 'GECA' },
    { name: 'Prof. Sunita Verma', email: 'admin@uitrgpv.ac.in', college: 'UITRGPV' },
    { name: 'Dr. Harpreet Singh', email: 'admin@davamritsar.ac.in', college: 'DAVAMR' },
  ],
  faculty: [
    { name: 'Dr. Amit Sharma', email: 'amit.sharma@geca.ac.in', college: 'GECA', department: 'Computer Science', designation: 'Professor', employeeId: 'F001' },
    { name: 'Dr. Priya Gupta', email: 'priya.gupta@geca.ac.in', college: 'GECA', department: 'Computer Science', designation: 'Asst Professor', employeeId: 'F002' },
    { name: 'Prof. Vikram Singh', email: 'vikram.singh@geca.ac.in', college: 'GECA', department: 'Electronics', designation: 'Professor', employeeId: 'F003' },
    { name: 'Dr. Neha Jain', email: 'neha.jain@uitrgpv.ac.in', college: 'UITRGPV', department: 'Computer Science', designation: 'Asst Professor', employeeId: 'F004' },
    { name: 'Prof. Rahul Mehta', email: 'rahul.mehta@uitrgpv.ac.in', college: 'UITRGPV', department: 'IT', designation: 'Professor', employeeId: 'F005' },
    // DAV Amritsar BCA Sem 3 Faculty
    { name: 'Puneet Sharma', email: 'puneet.sharma@davamritsar.ac.in', college: 'DAVAMR', department: 'Computer Science', designation: 'Professor', employeeId: 'F006' },
    { name: 'Harsimran Singh Anand', email: 'harsimran.anand@davamritsar.ac.in', college: 'DAVAMR', department: 'Computer Science', designation: 'Asst Professor', employeeId: 'F007' },
    { name: 'Sandeep Sharma', email: 'sandeep.sharma@davamritsar.ac.in', college: 'DAVAMR', department: 'Information Technology', designation: 'Asst Professor', employeeId: 'F008' },
    { name: 'Renu Sharma', email: 'renu.sharma@davamritsar.ac.in', college: 'DAVAMR', department: 'Computer Science', designation: 'Asst Professor', employeeId: 'F009' },
    { name: 'Vikram Sharma', email: 'vikram.sharma@davamritsar.ac.in', college: 'DAVAMR', department: 'Computer Science', designation: 'Professor', employeeId: 'F010' },
  ],
  students: [
    // GECA BTCS Semester 5 students
    { name: 'Aarav Patel', email: 'aarav@student.geca.ac.in', college: 'GECA', degree: 'B.Tech', course: 'BTCS', semester: 5, section: 'A', year: 3, enrollment: 'GECA-CS-2023-001' },
    { name: 'Diya Mehta', email: 'diya@student.geca.ac.in', college: 'GECA', degree: 'B.Tech', course: 'BTCS', semester: 5, section: 'A', year: 3, enrollment: 'GECA-CS-2023-002' },
    { name: 'Rohan Verma', email: 'rohan@student.geca.ac.in', college: 'GECA', degree: 'B.Tech', course: 'BTCS', semester: 5, section: 'A', year: 3, enrollment: 'GECA-CS-2023-003' },
    { name: 'Ananya Singh', email: 'ananya@student.geca.ac.in', college: 'GECA', degree: 'B.Tech', course: 'BTCS', semester: 5, section: 'A', year: 3, enrollment: 'GECA-CS-2023-004' },
    { name: 'Kabir Joshi', email: 'kabir@student.geca.ac.in', college: 'GECA', degree: 'B.Tech', course: 'BTCS', semester: 5, section: 'B', year: 3, enrollment: 'GECA-CS-2023-005' },
    { name: 'Ishita Sharma', email: 'ishita@student.geca.ac.in', college: 'GECA', degree: 'B.Tech', course: 'BTCS', semester: 5, section: 'B', year: 3, enrollment: 'GECA-CS-2023-006' },
    // GECA BCA Semester 5 students
    { name: 'Priyanshu Khandelwal', email: 'priyanshu@student.geca.ac.in', college: 'GECA', degree: 'BCA', course: 'BCA', semester: 5, section: 'A', year: 3, enrollment: 'GECA-BCA-2023-001' },
    { name: 'Shreya Bansal', email: 'shreya@student.geca.ac.in', college: 'GECA', degree: 'BCA', course: 'BCA', semester: 5, section: 'A', year: 3, enrollment: 'GECA-BCA-2023-002' },
    // UITRGPV BTCS Semester 1 students (freshers)
    { name: 'Aditya Tiwari', email: 'aditya@student.uitrgpv.ac.in', college: 'UITRGPV', degree: 'B.Tech', course: 'BTCS', semester: 1, section: 'A', year: 1, enrollment: 'UIT-CS-2025-001' },
    { name: 'Sakshi Dubey', email: 'sakshi@student.uitrgpv.ac.in', college: 'UITRGPV', degree: 'B.Tech', course: 'BTCS', semester: 1, section: 'A', year: 1, enrollment: 'UIT-CS-2025-002' },
    { name: 'Vivek Pandey', email: 'vivek@student.uitrgpv.ac.in', college: 'UITRGPV', degree: 'B.Tech', course: 'BTCS', semester: 1, section: 'A', year: 1, enrollment: 'UIT-CS-2025-003' },
    { name: 'Nandini Rai', email: 'nandini@student.uitrgpv.ac.in', college: 'UITRGPV', degree: 'B.Tech', course: 'BTCS', semester: 1, section: 'B', year: 1, enrollment: 'UIT-CS-2025-004' },
  ]
};

// ========== MAIN SEED ==========

async function seed() {
  console.log('🌱 Starting CampusConnect seed...\n');

  // Track created IDs
  const collegeMap = {}; // code -> id
  const courseMap = {};   // collegeCode-courseCode -> id
  const sectionMap = {};  // collegeCode-courseCode-semester-sectionName -> id
  const subjectMap = {};  // collegeCode-courseCode-subjectCode -> id
  const userMap = {};     // email -> id

  try {
    // ===== 1. COLLEGES =====
    console.log('📚 Creating colleges...');
    for (const college of COLLEGES) {
      const existing = await prisma.college.findFirst({ where: { code: college.code } });
      if (existing) {
        collegeMap[college.code] = existing.id;
        console.log(`  ⏭ College "${college.name}" already exists`);
        continue;
      }
      const created = await prisma.college.create({ data: college });
      collegeMap[college.code] = created.id;
      console.log(`  ✅ College: ${college.name}`);
    }
    console.log('');

    // ===== 2. COURSES =====
    console.log('🎓 Creating courses...');
    for (const course of COURSES) {
      const collegeId = collegeMap[course.collegeCode];
      if (!collegeId) {
        console.log(`  ⚠️  College ${course.collegeCode} not found, skipping course ${course.name}`);
        continue;
      }
      const existing = await prisma.course.findFirst({
        where: { college: collegeId, code: course.code }
      });
      if (existing) {
        courseMap[`${course.collegeCode}-${course.code}`] = existing.id;
        console.log(`  ⏭ Course "${course.name}" already exists`);
        continue;
      }
      const created = await prisma.course.create({
        data: {
          college: collegeId,
          name: course.name,
          code: course.code,
          degree: course.degree,
          totalSemesters: course.totalSemesters,
          duration: course.duration
        }
      });
      courseMap[`${course.collegeCode}-${course.code}`] = created.id;
      console.log(`  ✅ Course: ${course.name} (${course.code})`);
    }
    console.log('');

    // ===== 3. SECTIONS =====
    console.log('📋 Creating sections...');
    // Create sections for relevant courses/semesters
    const sectionConfig = [
      { collegeCode: 'GECA', courseCode: 'BTCS', semesters: [3, 5] },
      { collegeCode: 'GECA', courseCode: 'BCA', semesters: [1, 3, 5] },
      { collegeCode: 'UITRGPV', courseCode: 'BTCS', semesters: [1] },
      { collegeCode: 'DAVAMR', courseCode: 'BCA', semesters: [3] },
    ];

    for (const config of sectionConfig) {
      const courseId = courseMap[`${config.collegeCode}-${config.courseCode}`];
      if (!courseId) continue;
      const collegeId = collegeMap[config.collegeCode];

      for (const semester of config.semesters) {
        for (const sectionName of SECTIONS_PER_COURSE) {
          const key = `${config.collegeCode}-${config.courseCode}-${semester}-${sectionName}`;
          const existing = await prisma.section.findFirst({
            where: { college: collegeId, course: courseId, semester, name: sectionName }
          });
          if (existing) {
            sectionMap[key] = existing.id;
            console.log(`  ⏭ Section ${config.courseCode} Sem ${semester} ${sectionName} already exists`);
            continue;
          }
          const created = await prisma.section.create({
            data: {
              college: collegeId,
              course: courseId,
              courseName: config.courseCode,
              semester,
              year: Math.ceil(semester / 2),
              name: sectionName,
              capacity: 60
            }
          });
          sectionMap[key] = created.id;
          console.log(`  ✅ Section: ${config.courseCode} Sem ${semester} ${sectionName}`);
        }
      }
    }
    console.log('');

    // ===== 4. SUBJECTS =====
    console.log('📖 Creating subjects...');
    for (const [key, subjects] of Object.entries(SUBJECTS)) {
      const [courseCode, collegeCode] = key.split('-');
      const collegeId = collegeMap[collegeCode];
      if (!collegeId) continue;

      for (const sub of subjects) {
        const existing = await prisma.subject.findFirst({
          where: { college: collegeId, code: sub.code }
        });
        if (existing) {
          subjectMap[`${collegeCode}-${sub.code}`] = existing.id;
          console.log(`  ⏭ Subject "${sub.name}" already exists`);
          continue;
        }
        const created = await prisma.subject.create({
          data: {
            college: collegeId,
            name: sub.name,
            code: sub.code,
            semester: sub.semester,
            credits: sub.credits,
            color: sub.color
          }
        });
        subjectMap[`${collegeCode}-${sub.code}`] = created.id;
        console.log(`  ✅ Subject: ${sub.name} (${sub.code})`);
      }
    }
    console.log('');

    // ===== 5. USERS =====
    console.log('👤 Creating users...');
    const password = hashPassword('password123');

    // Admin users
    for (const admin of USERS.admin) {
      const existing = await prisma.user.findUnique({ where: { email: admin.email } });
      if (existing) {
        userMap[admin.email] = existing.id;
        console.log(`  ⏭ Admin "${admin.name}" already exists`);
        continue;
      }
      const collegeId = collegeMap[admin.college];
      const created = await prisma.user.create({
        data: {
          name: admin.name,
          email: admin.email,
          password,
          role: 'admin',
          college: collegeId,
          emailVerified: true,
          approved: true,
          onboarded: true,
          active: true
        }
      });
      userMap[admin.email] = created.id;
      console.log(`  ✅ Admin: ${admin.name}`);
    }

    // Faculty users
    for (const faculty of USERS.faculty) {
      const existing = await prisma.user.findUnique({ where: { email: faculty.email } });
      if (existing) {
        userMap[faculty.email] = existing.id;
        console.log(`  ⏭ Faculty "${faculty.name}" already exists`);
        continue;
      }
      const collegeId = collegeMap[faculty.college];
      const created = await prisma.user.create({
        data: {
          name: faculty.name,
          email: faculty.email,
          password,
          role: 'faculty',
          college: collegeId,
          designation: faculty.designation,
          emailVerified: true,
          approved: true,
          onboarded: true,
          active: true
        }
      });
      userMap[faculty.email] = created.id;

      // Create faculty profile
      await prisma.facultyProfile.create({
        data: {
          user: created.id,
          college: collegeId,
          employeeId: faculty.employeeId,
          department: faculty.department,
          designation: faculty.designation,
          setupComplete: true
        }
      });
      console.log(`  ✅ Faculty: ${faculty.name} (${faculty.designation})`);
    }

    // Student users
    for (const student of USERS.students) {
      const existing = await prisma.user.findUnique({ where: { email: student.email } });
      if (existing) {
        userMap[student.email] = existing.id;
        console.log(`  ⏭ Student "${student.name}" already exists`);
        continue;
      }
      const collegeId = collegeMap[student.college];
      const created = await prisma.user.create({
        data: {
          name: student.name,
          email: student.email,
          password,
          role: 'student',
          college: collegeId,
          emailVerified: true,
          approved: true,
          onboarded: true,
          active: true
        }
      });
      userMap[student.email] = created.id;

      // Create student profile
      await prisma.studentProfile.create({
        data: {
          user: created.id,
          college: collegeId,
          degree: student.degree,
          course: student.course,
          semester: student.semester,
          year: student.year,
          section: student.section,
          enrollmentNumber: student.enrollment
        }
      });
      console.log(`  ✅ Student: ${student.name} (${student.enrollment})`);
    }
    console.log('');

    // ===== 6. ENROLLMENTS =====
    console.log('📝 Creating enrollments...');
    for (const student of USERS.students) {
      const userId = userMap[student.email];
      const collegeId = collegeMap[student.college];
      const courseId = courseMap[`${student.college}-${student.course}`];
      const sectionKey = `${student.college}-${student.course}-${student.semester}-${student.section}`;
      const sectionId = sectionMap[sectionKey];

      if (!userId || !collegeId || !courseId || !sectionId) {
        console.log(`  ⚠️  Skipping enrollment for ${student.name} — missing refs`);
        continue;
      }

      const existing = await prisma.enrollment.findFirst({
        where: { student: userId, section: sectionId, semester: student.semester }
      });
      if (existing) {
        console.log(`  ⏭ Enrollment for ${student.name} already exists`);
        continue;
      }

      await prisma.enrollment.create({
        data: {
          student: userId,
          section: sectionId,
          college: collegeId,
          course: courseId,
          semester: student.semester,
          year: student.year,
          status: 'active'
        }
      });
      console.log(`  ✅ Enrollment: ${student.name} → ${student.course} Sem ${student.semester} Sec ${student.section}`);
    }
    console.log('');

    // ===== 7. FACULTY ASSIGNMENTS =====
    console.log('👨‍🏫 Creating faculty assignments...');
    const assignments = [
      // Dr. Amit Sharma teaches DSA and OS in GECA BTCS Sem 5 Section A
      { facultyEmail: 'amit.sharma@geca.ac.in', collegeCode: 'GECA', subjectCode: 'CS301', courseCode: 'BTCS', semester: 5, section: 'A' },
      { facultyEmail: 'amit.sharma@geca.ac.in', collegeCode: 'GECA', subjectCode: 'CS201', courseCode: 'BTCS', semester: 3, section: 'A' },
      // Dr. Priya Gupta teaches DBMS and SE in GECA BTCS Sem 5 Section B
      { facultyEmail: 'priya.gupta@geca.ac.in', collegeCode: 'GECA', subjectCode: 'CS302', courseCode: 'BTCS', semester: 5, section: 'B' },
      { facultyEmail: 'priya.gupta@geca.ac.in', collegeCode: 'GECA', subjectCode: 'CS303', courseCode: 'BTCS', semester: 5, section: 'B' },
      // Dr. Priya Gupta teaches BCA subjects too
      { facultyEmail: 'priyanshu@student.geca.ac.in', collegeCode: 'GECA', subjectCode: 'BCA301', courseCode: 'BCA', semester: 5, section: 'A' },
      // Dr. Neha Jain teaches at UITRGPV
      { facultyEmail: 'neha.jain@uitrgpv.ac.in', collegeCode: 'UITRGPV', subjectCode: 'CS101', courseCode: 'BTCS', semester: 1, section: 'A' },
      { facultyEmail: 'neha.jain@uitrgpv.ac.in', collegeCode: 'UITRGPV', subjectCode: 'CS201', courseCode: 'BTCS', semester: 1, section: 'A' },
    ];

    // Fix: BCA subject assignment should be to a faculty, not a student
    // Let's reassign BCA301 to Dr. Amit Sharma
    assignments[4] = { facultyEmail: 'amit.sharma@geca.ac.in', collegeCode: 'GECA', subjectCode: 'BCA301', courseCode: 'BCA', semester: 5, section: 'A' };
    // DAV Amritsar BCA Sem 3 Faculty Assignments
    assignments.push(
      { facultyEmail: 'puneet.sharma@davamritsar.ac.in', collegeCode: 'DAVAMR', subjectCode: 'DAVBCA302', courseCode: 'BCA', semester: 3, section: 'A' },
      { facultyEmail: 'harsimran.anand@davamritsar.ac.in', collegeCode: 'DAVAMR', subjectCode: 'DAVBCA303', courseCode: 'BCA', semester: 3, section: 'A' },
      { facultyEmail: 'sandeep.sharma@davamritsar.ac.in', collegeCode: 'DAVAMR', subjectCode: 'DAVBCA304', courseCode: 'BCA', semester: 3, section: 'A' },
      { facultyEmail: 'renu.sharma@davamritsar.ac.in', collegeCode: 'DAVAMR', subjectCode: 'DAVBCA305', courseCode: 'BCA', semester: 3, section: 'A' },
      { facultyEmail: 'vikram.sharma@davamritsar.ac.in', collegeCode: 'DAVAMR', subjectCode: 'DAVBCA301', courseCode: 'BCA', semester: 3, section: 'A' },
    );

    for (const a of assignments) {
      const facultyId = userMap[a.facultyEmail];
      const collegeId = collegeMap[a.collegeCode];
      const subjectId = subjectMap[`${a.collegeCode}-${a.subjectCode}`];
      const courseId = courseMap[`${a.collegeCode}-${a.courseCode}`];
      const sectionId = sectionMap[`${a.collegeCode}-${a.courseCode}-${a.semester}-${a.section}`];

      if (!facultyId || !collegeId || !subjectId || !sectionId) {
        console.log(`  ⚠️  Skipping assignment — missing refs for ${a.facultyEmail}`);
        continue;
      }

      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });

      const existing = await prisma.facultyAssignment.findFirst({
        where: { faculty: facultyId, subject: subjectId, section: sectionId, semester: a.semester }
      });
      if (existing) {
        console.log(`  ⏭ Assignment already exists for ${a.facultyEmail}`);
        continue;
      }

      await prisma.facultyAssignment.create({
        data: {
          college: collegeId,
          faculty: facultyId,
          subject: subjectId,
          subjectName: subject?.name || '',
          section: sectionId,
          semester: a.semester,
          academicYear: '2025-2026'
        }
      });
      console.log(`  ✅ Assignment: ${a.facultyEmail} → ${a.subjectCode} in ${a.courseCode} Sem ${a.semester} Sec ${a.section}`);
    }
    console.log('');

    // ===== 8. LINK FACULTY TO SUBJECTS (set Subject.faculty for display) =====
    console.log('🔗 Linking faculty to subjects for display...');
    for (const a of assignments) {
      const facultyId = userMap[a.facultyEmail];
      const subjectId = subjectMap[`${a.collegeCode}-${a.subjectCode}`];
      if (!facultyId || !subjectId) continue;
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (subject && !subject.faculty) {
        await prisma.subject.update({ where: { id: subjectId }, data: { faculty: facultyId } });
        console.log(`  ✅ Linked ${a.facultyEmail} → ${a.subjectCode}`);
      }
    }
    console.log('');

    // ===== SUMMARY =====
    console.log('═══════════════════════════════════════');
    console.log('🎉 SEED COMPLETE!');
    console.log('═══════════════════════════════════════');
    console.log(`  📚 Colleges:  ${COLLEGES.length}`);
    console.log(`  🎓 Courses:   ${COURSES.length}`);
    console.log(`  📋 Sections:  ${Object.keys(sectionMap).length}`);
    console.log(`  📖 Subjects:  ${Object.values(subjectMap).length}`);
    console.log(`  👤 Users:     ${Object.keys(userMap).length}`);
    console.log(`     - Admins:    ${USERS.admin.length}`);
    console.log(`     - Faculty:   ${USERS.faculty.length}`);
    console.log(`     - Students:  ${USERS.students.length}`);
    console.log('');
    console.log('🔑 Default password for all users: password123');
    console.log('');
    console.log('📧 Test Accounts:');
    console.log('  Admin:    admin@geca.ac.in / password123');
    console.log('  Faculty:  amit.sharma@geca.ac.in / password123');
    console.log('  Student:  aarav@student.geca.ac.in / password123');
    console.log('  Student:  aditya@student.uitrgpv.ac.in / password123');

  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
