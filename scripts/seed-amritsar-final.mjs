import { PrismaClient } from '../server/node_modules/@prisma/client/index.js';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL?.replace('6543', '5432') || process.env.DATABASE_URL } }
});

const newColleges = [
  // ── Affiliated Colleges ──
  {
    name: 'Khalsa College, Chawinda Devi',
    code: 'KCC-AMR',
    city: 'Amritsar',
    departments: ['Arts', 'Commerce', 'Science'],
    courses: [
      { name: 'BA', code: 'BA-KCC', duration: 3, totalSemesters: 6, dept: 'Arts', subjects: [
        { name: 'English Literature', code: 'KCC101', sem: 1, credits: 4 },
        { name: 'Punjabi Literature', code: 'KCC102', sem: 1, credits: 4 },
        { name: 'Political Science', code: 'KCC103', sem: 1, credits: 3 },
        { name: 'History', code: 'KCC104', sem: 1, credits: 3 },
      ]},
      { name: 'B.Com', code: 'BCOM-KCC', duration: 3, totalSemesters: 6, dept: 'Commerce', subjects: [
        { name: 'Financial Accounting', code: 'KCC201', sem: 1, credits: 4 },
        { name: 'Business Economics', code: 'KCC202', sem: 1, credits: 3 },
        { name: 'Corporate Accounting', code: 'KCC203', sem: 2, credits: 4 },
      ]},
      { name: 'B.Sc', code: 'BSC-KCC', duration: 3, totalSemesters: 6, dept: 'Science', subjects: [
        { name: 'Physics', code: 'KCC301', sem: 1, credits: 4 },
        { name: 'Chemistry', code: 'KCC302', sem: 1, credits: 4 },
        { name: 'Mathematics', code: 'KCC303', sem: 1, credits: 4 },
      ]},
    ]
  },
  {
    name: 'Shaheed Darshan Singh Pheruman Memorial College for Women',
    code: 'SDSPM-CW',
    city: 'Amritsar',
    departments: ['Arts', 'Commerce'],
    courses: [
      { name: 'BA', code: 'BA-SDSPM', duration: 3, totalSemesters: 6, dept: 'Arts', subjects: [
        { name: 'English', code: 'SDSPM101', sem: 1, credits: 4 },
        { name: 'Political Science', code: 'SDSPM102', sem: 1, credits: 3 },
        { name: 'Economics', code: 'SDSPM103', sem: 1, credits: 3 },
      ]},
      { name: 'B.Com', code: 'BCOM-SDSPM', duration: 3, totalSemesters: 6, dept: 'Commerce', subjects: [
        { name: 'Financial Accounting', code: 'SDSPM201', sem: 1, credits: 4 },
        { name: 'Business Law', code: 'SDSPM202', sem: 1, credits: 3 },
      ]},
    ]
  },
  {
    name: 'Apex International College, Amritsar',
    code: 'AIC-AMR',
    city: 'Amritsar',
    departments: ['Management', 'Computer Science', 'Commerce'],
    courses: [
      { name: 'MBA', code: 'MBA-AIC', duration: 2, totalSemesters: 4, dept: 'Management', subjects: [
        { name: 'Principles of Management', code: 'AIC101', sem: 1, credits: 4 },
        { name: 'Marketing Management', code: 'AIC102', sem: 1, credits: 3 },
        { name: 'Financial Management', code: 'AIC201', sem: 2, credits: 4 },
        { name: 'HR Management', code: 'AIC202', sem: 2, credits: 3 },
      ]},
      { name: 'BCA', code: 'BCA-AIC', duration: 3, totalSemesters: 6, dept: 'Computer Science', subjects: [
        { name: 'Programming in C', code: 'AIC301', sem: 1, credits: 4 },
        { name: 'Data Structures', code: 'AIC302', sem: 1, credits: 4 },
        { name: 'OOP (C++)', code: 'AIC401', sem: 2, credits: 4 },
      ]},
      { name: 'B.Com (Hons)', code: 'BCOMH-AIC', duration: 3, totalSemesters: 6, dept: 'Commerce', subjects: [
        { name: 'Advanced Accounting', code: 'AIC501', sem: 1, credits: 4 },
        { name: 'Auditing', code: 'AIC502', sem: 2, credits: 4 },
      ]},
    ]
  },
  {
    name: 'Amritsar College of Nursing',
    code: 'ACN-AMR',
    city: 'Amritsar',
    departments: ['Nursing'],
    courses: [
      { name: 'B.Sc Nursing', code: 'BSC-NUR-ACN', duration: 4, totalSemesters: 8, dept: 'Nursing', subjects: [
        { name: 'Fundamentals of Nursing', code: 'ACN101', sem: 1, credits: 4 },
        { name: 'Anatomy & Physiology', code: 'ACN102', sem: 1, credits: 4 },
        { name: 'Microbiology', code: 'ACN103', sem: 1, credits: 3 },
        { name: 'Medical-Surgical Nursing', code: 'ACN201', sem: 2, credits: 4 },
        { name: 'Community Health Nursing', code: 'ACN202', sem: 2, credits: 4 },
      ]},
    ]
  },
  {
    name: 'Directorate of Open & Distance Learning, GNDU',
    code: 'ODL-GNDU',
    city: 'Amritsar',
    departments: ['Arts', 'Commerce', 'Science'],
    courses: [
      { name: 'BA (ODL)', code: 'BA-ODL', duration: 3, totalSemesters: 6, dept: 'Arts', subjects: [
        { name: 'English', code: 'ODL101', sem: 1, credits: 4 },
        { name: 'Hindi', code: 'ODL102', sem: 1, credits: 4 },
        { name: 'Economics', code: 'ODL103', sem: 1, credits: 3 },
      ]},
      { name: 'B.Com (ODL)', code: 'BCOM-ODL', duration: 3, totalSemesters: 6, dept: 'Commerce', subjects: [
        { name: 'Financial Accounting', code: 'ODL201', sem: 1, credits: 4 },
        { name: 'Business Economics', code: 'ODL202', sem: 1, credits: 3 },
      ]},
    ]
  },
  {
    name: 'Amritsar Group of Colleges',
    code: 'AGC-AMR',
    city: 'Amritsar',
    departments: ['Engineering', 'Pharmacy', 'Management', 'Computer Science'],
    courses: [
      { name: 'B.Tech CSE', code: 'BTech-CSE-AGC', duration: 4, totalSemesters: 8, dept: 'Computer Science', subjects: [
        { name: 'Programming in C', code: 'AGC101', sem: 1, credits: 4 },
        { name: 'Data Structures', code: 'AGC102', sem: 1, credits: 4 },
        { name: 'OOP (Java)', code: 'AGC201', sem: 2, credits: 4 },
        { name: 'DBMS', code: 'AGC202', sem: 2, credits: 4 },
        { name: 'Operating Systems', code: 'AGC301', sem: 3, credits: 4 },
        { name: 'Computer Networks', code: 'AGC302', sem: 3, credits: 4 },
      ]},
      { name: 'B.Tech ECE', code: 'BTech-ECE-AGC', duration: 4, totalSemesters: 8, dept: 'Engineering', subjects: [
        { name: 'Basic Electronics', code: 'AGC401', sem: 1, credits: 4 },
        { name: 'Signals & Systems', code: 'AGC402', sem: 1, credits: 4 },
        { name: 'Digital Electronics', code: 'AGC501', sem: 2, credits: 4 },
      ]},
      { name: 'B.Pharmacy', code: 'BPHARM-AGC', duration: 4, totalSemesters: 8, dept: 'Pharmacy', subjects: [
        { name: 'Pharmaceutics', code: 'AGC601', sem: 1, credits: 4 },
        { name: 'Pharmaceutical Chemistry', code: 'AGC602', sem: 1, credits: 4 },
        { name: 'Pharmacognosy', code: 'AGC701', sem: 2, credits: 4 },
      ]},
      { name: 'MBA', code: 'MBA-AGC', duration: 2, totalSemesters: 4, dept: 'Management', subjects: [
        { name: 'Principles of Management', code: 'AGC801', sem: 1, credits: 4 },
        { name: 'Marketing Management', code: 'AGC802', sem: 1, credits: 3 },
        { name: 'Financial Management', code: 'AGC901', sem: 2, credits: 4 },
      ]},
    ]
  },
  {
    name: 'Shaheed Bhagat Singh College of Pharmacy, Amritsar',
    code: 'SBSCP',
    city: 'Amritsar',
    departments: ['Pharmacy'],
    courses: [
      { name: 'B.Pharmacy', code: 'BPHARM-SBSCP', duration: 4, totalSemesters: 8, dept: 'Pharmacy', subjects: [
        { name: 'Pharmaceutics', code: 'SBSCP101', sem: 1, credits: 4 },
        { name: 'Pharmaceutical Chemistry', code: 'SBSCP102', sem: 1, credits: 4 },
        { name: 'Pharmacognosy', code: 'SBSCP201', sem: 2, credits: 4 },
        { name: 'Pharmacology', code: 'SBSCP202', sem: 2, credits: 4 },
      ]},
      { name: 'D.Pharmacy', code: 'DPHARM-SBSCP', duration: 2, totalSemesters: 4, dept: 'Pharmacy', subjects: [
        { name: 'Pharmaceutics I', code: 'SBSCP301', sem: 1, credits: 4 },
        { name: 'Pharmaceutical Chemistry I', code: 'SBSCP302', sem: 1, credits: 4 },
      ]},
    ]
  },
  {
    name: 'Satyam Institute of Engineering and Technology, Amritsar',
    code: 'SIET-AMR',
    city: 'Amritsar',
    departments: ['Computer Science', 'Engineering', 'Pharmacy'],
    courses: [
      { name: 'B.Tech CSE', code: 'BTech-CSE-SIET', duration: 4, totalSemesters: 8, dept: 'Computer Science', subjects: [
        { name: 'Programming in C', code: 'SIET101', sem: 1, credits: 4 },
        { name: 'Data Structures', code: 'SIET102', sem: 1, credits: 4 },
        { name: 'OOP (Java)', code: 'SIET201', sem: 2, credits: 4 },
        { name: 'DBMS', code: 'SIET202', sem: 2, credits: 4 },
      ]},
      { name: 'B.Tech ME', code: 'BTech-ME-SIET', duration: 4, totalSemesters: 8, dept: 'Engineering', subjects: [
        { name: 'Engineering Mechanics', code: 'SIET301', sem: 1, credits: 4 },
        { name: 'Thermodynamics', code: 'SIET302', sem: 1, credits: 4 },
      ]},
      { name: 'B.Pharmacy', code: 'BPHARM-SIET', duration: 4, totalSemesters: 8, dept: 'Pharmacy', subjects: [
        { name: 'Pharmaceutics', code: 'SIET401', sem: 1, credits: 4 },
        { name: 'Pharmaceutical Chemistry', code: 'SIET402', sem: 1, credits: 4 },
      ]},
    ]
  },
  {
    name: 'Hindu Institute of Management, Amritsar',
    code: 'HIM-AMR',
    city: 'Amritsar',
    departments: ['Management'],
    courses: [
      { name: 'MBA', code: 'MBA-HIM', duration: 2, totalSemesters: 4, dept: 'Management', subjects: [
        { name: 'Principles of Management', code: 'HIM101', sem: 1, credits: 4 },
        { name: 'Marketing Management', code: 'HIM102', sem: 1, credits: 3 },
        { name: 'Financial Management', code: 'HIM201', sem: 2, credits: 4 },
        { name: 'Operations Management', code: 'HIM202', sem: 2, credits: 3 },
      ]},
      { name: 'BBA', code: 'BBA-HIM', duration: 3, totalSemesters: 6, dept: 'Management', subjects: [
        { name: 'Principles of Management', code: 'HIM301', sem: 1, credits: 4 },
        { name: 'Business Communication', code: 'HIM302', sem: 1, credits: 3 },
        { name: 'Financial Accounting', code: 'HIM401', sem: 2, credits: 4 },
      ]},
    ]
  },
  {
    name: 'Sidana Institute of Management and Technology, Amritsar',
    code: 'SIMT-AMR',
    city: 'Amritsar',
    departments: ['Management', 'Computer Science'],
    courses: [
      { name: 'MBA', code: 'MBA-SIMT', duration: 2, totalSemesters: 4, dept: 'Management', subjects: [
        { name: 'Principles of Management', code: 'SIMT101', sem: 1, credits: 4 },
        { name: 'Business Communication', code: 'SIMT102', sem: 1, credits: 3 },
      ]},
      { name: 'BCA', code: 'BCA-SIMT', duration: 3, totalSemesters: 6, dept: 'Computer Science', subjects: [
        { name: 'Programming in C', code: 'SIMT201', sem: 1, credits: 4 },
        { name: 'Web Development', code: 'SIMT202', sem: 2, credits: 3 },
      ]},
    ]
  },
  {
    name: 'Mai Bhago Government Polytechnic College, Amritsar',
    code: 'MBGPC',
    city: 'Amritsar',
    departments: ['Engineering', 'Computer Science'],
    courses: [
      { name: 'Diploma CSE', code: 'DIP-CSE-MBG', duration: 3, totalSemesters: 6, dept: 'Computer Science', subjects: [
        { name: 'Programming Basics', code: 'MBG101', sem: 1, credits: 4 },
        { name: 'Data Structures', code: 'MBG102', sem: 1, credits: 4 },
        { name: 'Web Technologies', code: 'MBG201', sem: 2, credits: 3 },
      ]},
      { name: 'Diploma ECE', code: 'DIP-ECE-MBG', duration: 3, totalSemesters: 6, dept: 'Engineering', subjects: [
        { name: 'Basic Electronics', code: 'MBG301', sem: 1, credits: 4 },
        { name: 'Circuit Analysis', code: 'MBG302', sem: 1, credits: 4 },
      ]},
      { name: 'Diploma ME', code: 'DIP-ME-MBG', duration: 3, totalSemesters: 6, dept: 'Engineering', subjects: [
        { name: 'Engineering Drawing', code: 'MBG401', sem: 1, credits: 4 },
        { name: 'Workshop Practice', code: 'MBG402', sem: 1, credits: 3 },
      ]},
    ]
  },
  {
    name: 'Government Polytechnic College, Amritsar',
    code: 'GPC-AMR',
    city: 'Amritsar',
    departments: ['Engineering', 'Computer Science'],
    courses: [
      { name: 'Diploma CSE', code: 'DIP-CSE-GPC', duration: 3, totalSemesters: 6, dept: 'Computer Science', subjects: [
        { name: 'Programming Basics', code: 'GPC101', sem: 1, credits: 4 },
        { name: 'Data Structures', code: 'GPC102', sem: 1, credits: 4 },
        { name: 'Database Systems', code: 'GPC201', sem: 2, credits: 4 },
      ]},
      { name: 'Diploma ECE', code: 'DIP-ECE-GPC', duration: 3, totalSemesters: 6, dept: 'Engineering', subjects: [
        { name: 'Basic Electronics', code: 'GPC301', sem: 1, credits: 4 },
        { name: 'Analog Circuits', code: 'GPC302', sem: 2, credits: 4 },
      ]},
    ]
  },
  {
    name: 'Indo Global Group of Institutions, Amritsar',
    code: 'IGGI-AMR',
    city: 'Amritsar',
    departments: ['Engineering', 'Pharmacy', 'Management'],
    courses: [
      { name: 'B.Tech CSE', code: 'BTech-CSE-IGGI', duration: 4, totalSemesters: 8, dept: 'Engineering', subjects: [
        { name: 'Programming in C', code: 'IGGI101', sem: 1, credits: 4 },
        { name: 'Data Structures', code: 'IGGI102', sem: 1, credits: 4 },
        { name: 'OOP (Java)', code: 'IGGI201', sem: 2, credits: 4 },
        { name: 'DBMS', code: 'IGGI202', sem: 2, credits: 4 },
      ]},
      { name: 'B.Pharmacy', code: 'BPHARM-IGGI', duration: 4, totalSemesters: 8, dept: 'Pharmacy', subjects: [
        { name: 'Pharmaceutics', code: 'IGGI301', sem: 1, credits: 4 },
        { name: 'Pharmaceutical Chemistry', code: 'IGGI302', sem: 1, credits: 4 },
      ]},
      { name: 'MBA', code: 'MBA-IGGI', duration: 2, totalSemesters: 4, dept: 'Management', subjects: [
        { name: 'Principles of Management', code: 'IGGI401', sem: 1, credits: 4 },
        { name: 'Marketing Management', code: 'IGGI402', sem: 1, credits: 3 },
      ]},
    ]
  },
  {
    name: 'Sri Guru Hargobind Sahib College, Amritsar',
    code: 'SGHS-AMR',
    city: 'Amritsar',
    departments: ['Arts', 'Commerce'],
    courses: [
      { name: 'BA', code: 'BA-SGHS', duration: 3, totalSemesters: 6, dept: 'Arts', subjects: [
        { name: 'English', code: 'SGHS101', sem: 1, credits: 4 },
        { name: 'Punjabi', code: 'SGHS102', sem: 1, credits: 4 },
        { name: 'Economics', code: 'SGHS103', sem: 1, credits: 3 },
      ]},
      { name: 'B.Com', code: 'BCOM-SGHS', duration: 3, totalSemesters: 6, dept: 'Commerce', subjects: [
        { name: 'Financial Accounting', code: 'SGHS201', sem: 1, credits: 4 },
        { name: 'Business Economics', code: 'SGHS202', sem: 1, credits: 3 },
      ]},
    ]
  },
  {
    name: 'Mohan Lal Memorial Institute of Education, Amritsar',
    code: 'MLMIE',
    city: 'Amritsar',
    departments: ['Education'],
    courses: [
      { name: 'B.Ed', code: 'BED-MLMIE', duration: 2, totalSemesters: 4, dept: 'Education', subjects: [
        { name: 'Education Psychology', code: 'MLMIE101', sem: 1, credits: 4 },
        { name: 'Teaching Methods', code: 'MLMIE102', sem: 1, credits: 4 },
        { name: 'Educational Philosophy', code: 'MLMIE201', sem: 2, credits: 4 },
      ]},
    ]
  },
];

// ═══════════════════════════════════════════════════════
// SECTION GENERATOR
// ═══════════════════════════════════════════════════════
function generateSections(courseId, totalSemesters) {
  const sections = [];
  for (let sem = 1; sem <= Math.min(totalSemesters, 8); sem++) {
    for (const name of ['Section A', 'Section B']) {
      sections.push({
        course: courseId,
        semester: sem,
        name,
        code: name.replace('Section ', ''),
        maxStudents: 60,
      });
    }
  }
  return sections;
}

// ═══════════════════════════════════════════════════════
// MAIN SEED
// ═══════════════════════════════════════════════════════
async function main() {
  let totalColleges = 0, totalDepts = 0, totalCourses = 0, totalSections = 0, totalSubjects = 0;

  for (const collegeData of newColleges) {
    const existing = await prisma.college.findFirst({ where: { name: collegeData.name } });
    if (existing) {
      console.log('⏭️  Skip:', collegeData.name);
      continue;
    }

    const college = await prisma.college.create({
      data: { name: collegeData.name, code: collegeData.code, city: collegeData.city, state: 'Punjab' }
    });
    totalColleges++;
    console.log('✅ College:', college.name);

    const deptIds = {};
    for (const deptName of collegeData.departments) {
      const dept = await prisma.department.create({
        data: { college: college.id, name: deptName, code: deptName.slice(0, 3).toUpperCase() }
      });
      deptIds[deptName] = dept.id;
      totalDepts++;
    }

    for (const courseData of collegeData.courses) {
      const course = await prisma.course.create({
        data: {
          college: college.id,
          department: deptIds[courseData.dept],
          name: courseData.name,
          code: courseData.code,
          duration: courseData.duration,
          totalSemesters: courseData.totalSemesters,
        }
      });
      totalCourses++;

      const sections = generateSections(course.id, courseData.totalSemesters);
      await prisma.section.createMany({ data: sections });
      totalSections += sections.length;

      const subjects = courseData.subjects.map(s => ({
        college: college.id,
        course: course.id,
        department: deptIds[courseData.dept],
        name: s.name,
        code: s.code,
        semester: s.sem,
        credits: s.credits,
      }));
      await prisma.subject.createMany({ data: subjects });
      totalSubjects += subjects.length;
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('  🎉 SEED COMPLETE!');
  console.log('═══════════════════════════════════════════');
  console.log(`  🏫 New Colleges:    ${totalColleges}`);
  console.log(`  📁 Departments:     ${totalDepts}`);
  console.log(`  📚 Courses:         ${totalCourses}`);
  console.log(`  📋 Sections:        ${totalSections}`);
  console.log(`  📖 Subjects:        ${totalSubjects}`);

  const totalC = await prisma.college.count();
  const totalD = await prisma.department.count();
  const totalCo = await prisma.course.count();
  const totalS = await prisma.section.count();
  const totalSu = await prisma.subject.count();
  console.log('\n📊 TOTAL IN DATABASE:');
  console.log(`  🏫 Colleges:   ${totalC}`);
  console.log(`  📁 Departments: ${totalD}`);
  console.log(`  📚 Courses:    ${totalCo}`);
  console.log(`  📋 Sections:   ${totalS}`);
  console.log(`  📖 Subjects:   ${totalSu}`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
