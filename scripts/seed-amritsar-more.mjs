import { PrismaClient } from '../server/node_modules/@prisma/client/index.js';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL?.replace('6543', '5432') || process.env.DATABASE_URL } }
});

// ═══════════════════════════════════════════════════════
// NEW AMRITSAR COLLEGES TO ADD
// ═══════════════════════════════════════════════════════
const newColleges = [
  // ── Universities ──
  {
    name: 'Sri Guru Ram Das University of Health Sciences',
    code: 'SGRDUHS',
    city: 'Amritsar',
    type: 'university',
    departments: ['Medicine', 'Nursing', 'Pharmacy', 'Dentistry'],
    courses: [
      { name: 'MBBS', code: 'MBBS', duration: 5.5, totalSemesters: 11, dept: 'Medicine', subjects: [
        { name: 'Anatomy', code: 'MED101', sem: 1, credits: 6 },
        { name: 'Physiology', code: 'MED102', sem: 1, credits: 6 },
        { name: 'Biochemistry', code: 'MED103', sem: 1, credits: 4 },
        { name: 'Pathology', code: 'MED201', sem: 2, credits: 6 },
        { name: 'Pharmacology', code: 'MED202', sem: 2, credits: 4 },
        { name: 'Microbiology', code: 'MED203', sem: 2, credits: 4 },
        { name: 'Forensic Medicine', code: 'MED301', sem: 3, credits: 4 },
        { name: 'Community Medicine', code: 'MED302', sem: 3, credits: 4 },
      ]},
      { name: 'B.Sc Nursing', code: 'BSC-NUR', duration: 4, totalSemesters: 8, dept: 'Nursing', subjects: [
        { name: 'Fundamentals of Nursing', code: 'NUR101', sem: 1, credits: 4 },
        { name: 'Anatomy & Physiology', code: 'NUR102', sem: 1, credits: 4 },
        { name: 'Microbiology', code: 'NUR103', sem: 1, credits: 3 },
        { name: 'Medical-Surgical Nursing', code: 'NUR201', sem: 2, credits: 4 },
        { name: 'Child Health Nursing', code: 'NUR202', sem: 2, credits: 4 },
      ]},
      { name: 'B.Pharmacy', code: 'BPHARM', duration: 4, totalSemesters: 8, dept: 'Pharmacy', subjects: [
        { name: 'Pharmaceutics', code: 'PHR101', sem: 1, credits: 4 },
        { name: 'Pharmaceutical Chemistry', code: 'PHR102', sem: 1, credits: 4 },
        { name: 'Pharmacognosy', code: 'PHR201', sem: 2, credits: 4 },
        { name: 'Pharmacology', code: 'PHR202', sem: 2, credits: 4 },
      ]},
      { name: 'BDS', code: 'BDS', duration: 5, totalSemesters: 10, dept: 'Dentistry', subjects: [
        { name: 'Dental Anatomy', code: 'DEN101', sem: 1, credits: 5 },
        { name: 'Dental Histology', code: 'DEN102', sem: 1, credits: 4 },
        { name: 'Oral Pathology', code: 'DEN201', sem: 2, credits: 5 },
        { name: 'Conservative Dentistry', code: 'DEN202', sem: 2, credits: 4 },
      ]},
    ]
  },
  // ── Medical ──
  {
    name: 'Government Medical College, Amritsar',
    code: 'GMCA',
    city: 'Amritsar',
    type: 'government',
    departments: ['Medicine', 'Surgery', 'Orthopedics'],
    courses: [
      { name: 'MBBS', code: 'MBBS-GMC', duration: 5.5, totalSemesters: 11, dept: 'Medicine', subjects: [
        { name: 'Anatomy', code: 'GMC101', sem: 1, credits: 6 },
        { name: 'Physiology', code: 'GMC102', sem: 1, credits: 6 },
        { name: 'Biochemistry', code: 'GMC103', sem: 1, credits: 4 },
        { name: 'Pathology', code: 'GMC201', sem: 2, credits: 6 },
        { name: 'Pharmacology', code: 'GMC202', sem: 2, credits: 4 },
      ]},
      { name: 'MD Medicine', code: 'MD-MED', duration: 3, totalSemesters: 6, dept: 'Medicine', subjects: [
        { name: 'Internal Medicine', code: 'GMD301', sem: 1, credits: 6 },
        { name: 'Cardiology', code: 'GMD302', sem: 1, credits: 4 },
        { name: 'Neurology', code: 'GMD401', sem: 2, credits: 4 },
      ]},
    ]
  },
  // ── Engineering ──
  {
    name: 'Global Institutes, Amritsar',
    code: 'GI-AMR',
    city: 'Amritsar',
    type: 'private',
    departments: ['Computer Science', 'Mechanical', 'Electronics', 'Civil'],
    courses: [
      { name: 'B.Tech CSE', code: 'BTech-CSE', duration: 4, totalSemesters: 8, dept: 'Computer Science', subjects: [
        { name: 'Programming in C', code: 'GIC101', sem: 1, credits: 4 },
        { name: 'Data Structures', code: 'GIC102', sem: 1, credits: 4 },
        { name: 'OOP (Java)', code: 'GIC201', sem: 2, credits: 4 },
        { name: 'DBMS', code: 'GIC202', sem: 2, credits: 4 },
        { name: 'Operating Systems', code: 'GIC301', sem: 3, credits: 4 },
        { name: 'Computer Networks', code: 'GIC302', sem: 3, credits: 4 },
        { name: 'Web Development', code: 'GIC401', sem: 4, credits: 3 },
        { name: 'Machine Learning', code: 'GIC402', sem: 4, credits: 4 },
      ]},
      { name: 'B.Tech Mechanical', code: 'BTech-MECH', duration: 4, totalSemesters: 8, dept: 'Mechanical', subjects: [
        { name: 'Engineering Mechanics', code: 'GIM101', sem: 1, credits: 4 },
        { name: 'Thermodynamics', code: 'GIM102', sem: 1, credits: 4 },
        { name: 'Fluid Mechanics', code: 'GIM201', sem: 2, credits: 4 },
        { name: 'Machine Design', code: 'GIM202', sem: 2, credits: 4 },
      ]},
      { name: 'B.Tech ECE', code: 'BTech-ECE', duration: 4, totalSemesters: 8, dept: 'Electronics', subjects: [
        { name: 'Basic Electronics', code: 'GIE101', sem: 1, credits: 4 },
        { name: 'Signals & Systems', code: 'GIE102', sem: 1, credits: 4 },
        { name: 'Digital Electronics', code: 'GIE201', sem: 2, credits: 4 },
        { name: 'Communication Systems', code: 'GIE202', sem: 2, credits: 4 },
      ]},
      { name: 'MBA', code: 'MBA-GI', duration: 2, totalSemesters: 4, dept: 'Computer Science', subjects: [
        { name: 'Principles of Management', code: 'GIMB101', sem: 1, credits: 4 },
        { name: 'Marketing Management', code: 'GIMB102', sem: 1, credits: 3 },
        { name: 'Financial Management', code: 'GIMB201', sem: 2, credits: 4 },
        { name: 'HR Management', code: 'GIMB202', sem: 2, credits: 3 },
      ]},
    ]
  },
  // ── Education ──
  {
    name: 'Khalsa College of Education, Amritsar',
    code: 'KCE-AMR',
    city: 'Amritsar',
    type: 'private',
    departments: ['Education'],
    courses: [
      { name: 'B.Ed', code: 'BED-KCE', duration: 2, totalSemesters: 4, dept: 'Education', subjects: [
        { name: 'Education Psychology', code: 'KCE101', sem: 1, credits: 4 },
        { name: 'Teaching Methods', code: 'KCE102', sem: 1, credits: 4 },
        { name: 'Educational Philosophy', code: 'KCE201', sem: 2, credits: 4 },
        { name: 'Classroom Management', code: 'KCE202', sem: 2, credits: 3 },
      ]},
      { name: 'M.Ed', code: 'MED-KCE', duration: 2, totalSemesters: 4, dept: 'Education', subjects: [
        { name: 'Advanced Educational Psychology', code: 'KCE301', sem: 1, credits: 4 },
        { name: 'Research Methodology', code: 'KCE302', sem: 1, credits: 4 },
      ]},
    ]
  },
  // ── Physical Education ──
  {
    name: 'Khalsa College of Physical Education, Amritsar',
    code: 'KCPE',
    city: 'Amritsar',
    type: 'private',
    departments: ['Physical Education'],
    courses: [
      { name: 'B.P.Ed', code: 'BPED', duration: 2, totalSemesters: 4, dept: 'Physical Education', subjects: [
        { name: 'Sports Psychology', code: 'KCPE101', sem: 1, credits: 4 },
        { name: 'Anatomy for Sports', code: 'KCPE102', sem: 1, credits: 4 },
        { name: 'Athletics', code: 'KCPE201', sem: 2, credits: 3 },
        { name: 'Yoga & Wellness', code: 'KCPE202', sem: 2, credits: 3 },
      ]},
      { name: 'M.P.Ed', code: 'MPED', duration: 2, totalSemesters: 4, dept: 'Physical Education', subjects: [
        { name: 'Sports Training', code: 'KCPE301', sem: 1, credits: 4 },
        { name: 'Sports Management', code: 'KCPE302', sem: 1, credits: 4 },
      ]},
    ]
  },
  // ── More Degree Colleges ──
  {
    name: 'Punjab Institute of Technology, Amritsar',
    code: 'PIT-AMR',
    city: 'Amritsar',
    type: 'government',
    departments: ['Computer Science', 'Electronics', 'Mechanical'],
    courses: [
      { name: ' Diploma CSE', code: 'DIP-CSE', duration: 3, totalSemesters: 6, dept: 'Computer Science', subjects: [
        { name: 'Programming Basics', code: 'PIT101', sem: 1, credits: 4 },
        { name: 'Data Structures', code: 'PIT102', sem: 1, credits: 4 },
        { name: 'Web Technologies', code: 'PIT201', sem: 2, credits: 3 },
        { name: 'Database Systems', code: 'PIT202', sem: 2, credits: 4 },
      ]},
      { name: 'Diploma ECE', code: 'DIP-ECE', duration: 3, totalSemesters: 6, dept: 'Electronics', subjects: [
        { name: 'Basic Electronics', code: 'PIT301', sem: 1, credits: 4 },
        { name: 'Circuit Analysis', code: 'PIT302', sem: 1, credits: 4 },
      ]},
    ]
  },
  {
    name: 'CKD Institute of Management and Technology, Amritsar',
    code: 'CKD-IMT',
    city: 'Amritsar',
    type: 'private',
    departments: ['Computer Science', 'Management'],
    courses: [
      { name: 'BCA', code: 'BCA-CKD', duration: 3, totalSemesters: 6, dept: 'Computer Science', subjects: [
        { name: 'Programming in C', code: 'CKD101', sem: 1, credits: 4 },
        { name: 'Data Structures', code: 'CKD102', sem: 1, credits: 4 },
        { name: 'OOP (C++)', code: 'CKD201', sem: 2, credits: 4 },
        { name: 'DBMS', code: 'CKD202', sem: 2, credits: 4 },
      ]},
      { name: 'BBA', code: 'BBA-CKD', duration: 3, totalSemesters: 6, dept: 'Management', subjects: [
        { name: 'Principles of Management', code: 'CKD301', sem: 1, credits: 4 },
        { name: 'Business Communication', code: 'CKD302', sem: 1, credits: 3 },
        { name: 'Financial Accounting', code: 'CKD401', sem: 2, credits: 4 },
        { name: 'Marketing Basics', code: 'CKD402', sem: 2, credits: 3 },
      ]},
    ]
  },
  {
    name: 'Shaheed Baba Jiwan Singh Khalsa College, Amritsar',
    code: 'SBJK',
    city: 'Amritsar',
    type: 'private',
    departments: ['Arts', 'Commerce', 'Science'],
    courses: [
      { name: 'BA', code: 'BA-SBJK', duration: 3, totalSemesters: 6, dept: 'Arts', subjects: [
        { name: 'English Literature', code: 'SBJK101', sem: 1, credits: 4 },
        { name: 'Punjabi Literature', code: 'SBJK102', sem: 1, credits: 4 },
        { name: 'Political Science', code: 'SBJK103', sem: 1, credits: 3 },
      ]},
      { name: 'B.Com', code: 'BCOM-SBJK', duration: 3, totalSemesters: 6, dept: 'Commerce', subjects: [
        { name: 'Financial Accounting', code: 'SBJK201', sem: 1, credits: 4 },
        { name: 'Business Economics', code: 'SBJK202', sem: 1, credits: 3 },
      ]},
      { name: 'B.Sc', code: 'BSC-SBJK', duration: 3, totalSemesters: 6, dept: 'Science', subjects: [
        { name: 'Physics', code: 'SBJK301', sem: 1, credits: 4 },
        { name: 'Chemistry', code: 'SBJK302', sem: 1, credits: 4 },
        { name: 'Mathematics', code: 'SBJK303', sem: 1, credits: 4 },
      ]},
    ]
  },
  {
    name: 'Trai Shatabdi Guru Gobind Khalsa College, Amritsar',
    code: 'TSGGK',
    city: 'Amritsar',
    type: 'private',
    departments: ['Arts', 'Commerce'],
    courses: [
      { name: 'BA', code: 'BA-TSGGK', duration: 3, totalSemesters: 6, dept: 'Arts', subjects: [
        { name: 'English', code: 'TSGGK101', sem: 1, credits: 4 },
        { name: 'Hindi', code: 'TSGGK102', sem: 1, credits: 4 },
        { name: 'Economics', code: 'TSGGK103', sem: 1, credits: 3 },
      ]},
      { name: 'B.Com', code: 'BCOM-TSGGK', duration: 3, totalSemesters: 6, dept: 'Commerce', subjects: [
        { name: 'Financial Accounting', code: 'TSGGK201', sem: 1, credits: 4 },
        { name: 'Business Law', code: 'TSGGK202', sem: 1, credits: 3 },
      ]},
    ]
  },
  {
    name: 'Swami Satyanand College of Management and Technology, Amritsar',
    code: 'SSCMT',
    city: 'Amritsar',
    type: 'private',
    departments: ['Management', 'Computer Science'],
    courses: [
      { name: 'BBA', code: 'BBA-SSCMT', duration: 3, totalSemesters: 6, dept: 'Management', subjects: [
        { name: 'Principles of Management', code: 'SSCMT101', sem: 1, credits: 4 },
        { name: 'Business Communication', code: 'SSCMT102', sem: 1, credits: 3 },
      ]},
      { name: 'BCA', code: 'BCA-SSCMT', duration: 3, totalSemesters: 6, dept: 'Computer Science', subjects: [
        { name: 'Programming in C', code: 'SSCMT201', sem: 1, credits: 4 },
        { name: 'Web Development', code: 'SSCMT202', sem: 2, credits: 3 },
      ]},
    ]
  },
  {
    name: 'Anand College of Education for Women, Amritsar',
    code: 'ACEW',
    city: 'Amritsar',
    type: 'private',
    departments: ['Education'],
    courses: [
      { name: 'B.Ed', code: 'BED-ACEW', duration: 2, totalSemesters: 4, dept: 'Education', subjects: [
        { name: 'Education Psychology', code: 'ACEW101', sem: 1, credits: 4 },
        { name: 'Teaching Methods', code: 'ACEW102', sem: 1, credits: 4 },
        { name: 'Educational Technology', code: 'ACEW201', sem: 2, credits: 3 },
      ]},
    ]
  },
  {
    name: 'Saraswati College of Amritsar',
    code: 'SCA-AMR',
    city: 'Amritsar',
    type: 'private',
    departments: ['Arts', 'Commerce'],
    courses: [
      { name: 'BA', code: 'BA-SCA', duration: 3, totalSemesters: 6, dept: 'Arts', subjects: [
        { name: 'English', code: 'SCA101', sem: 1, credits: 4 },
        { name: 'History', code: 'SCA102', sem: 1, credits: 3 },
      ]},
      { name: 'B.Com', code: 'BCOM-SCA', duration: 3, totalSemesters: 6, dept: 'Commerce', subjects: [
        { name: 'Financial Accounting', code: 'SCA201', sem: 1, credits: 4 },
        { name: 'Cost Accounting', code: 'SCA202', sem: 2, credits: 4 },
      ]},
    ]
  },
  {
    name: 'SSSS College of Commerce for Women, Amritsar',
    code: 'SSSS-CW',
    city: 'Amritsar',
    type: 'private',
    departments: ['Commerce'],
    courses: [
      { name: 'B.Com', code: 'BCOM-SSSS', duration: 3, totalSemesters: 6, dept: 'Commerce', subjects: [
        { name: 'Financial Accounting', code: 'SSSS101', sem: 1, credits: 4 },
        { name: 'Business Economics', code: 'SSSS102', sem: 1, credits: 3 },
        { name: 'Corporate Accounting', code: 'SSSS201', sem: 2, credits: 4 },
      ]},
      { name: 'B.Com (Hons)', code: 'BCOMH-SSSS', duration: 3, totalSemesters: 6, dept: 'Commerce', subjects: [
        { name: 'Advanced Accounting', code: 'SSSS301', sem: 1, credits: 4 },
        { name: 'Auditing', code: 'SSSS302', sem: 2, credits: 4 },
      ]},
    ]
  },
  {
    name: 'Shahzada Nand College, Amritsar',
    code: 'SNC-AMR',
    city: 'Amritsar',
    type: 'private',
    departments: ['Arts', 'Science'],
    courses: [
      { name: 'BA', code: 'BA-SNC', duration: 3, totalSemesters: 6, dept: 'Arts', subjects: [
        { name: 'English', code: 'SNC101', sem: 1, credits: 4 },
        { name: 'Sanskrit', code: 'SNC102', sem: 1, credits: 4 },
      ]},
      { name: 'B.Sc', code: 'BSC-SNC', duration: 3, totalSemesters: 6, dept: 'Science', subjects: [
        { name: 'Physics', code: 'SNC201', sem: 1, credits: 4 },
        { name: 'Chemistry', code: 'SNC202', sem: 1, credits: 4 },
      ]},
    ]
  },
  {
    name: 'S.D.S.P Memorial College for Women, Amritsar',
    code: 'SDSP',
    city: 'Amritsar',
    type: 'private',
    departments: ['Arts', 'Commerce'],
    courses: [
      { name: 'BA', code: 'BA-SDSP', duration: 3, totalSemesters: 6, dept: 'Arts', subjects: [
        { name: 'English', code: 'SDSP101', sem: 1, credits: 4 },
        { name: 'Hindi', code: 'SDSP102', sem: 1, credits: 4 },
      ]},
      { name: 'B.Com', code: 'BCOM-SDSP', duration: 3, totalSemesters: 6, dept: 'Commerce', subjects: [
        { name: 'Financial Accounting', code: 'SDSP201', sem: 1, credits: 4 },
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
    // Check if college already exists
    const existing = await prisma.college.findFirst({ where: { name: collegeData.name } });
    if (existing) {
      console.log('⏭️  Skip:', collegeData.name);
      continue;
    }

    // Create college
    const college = await prisma.college.create({
      data: { name: collegeData.name, code: collegeData.code, city: collegeData.city, state: 'Punjab' }
    });
    totalColleges++;
    console.log('✅ College:', college.name);

    // Create departments
    const deptIds = {};
    for (const deptName of collegeData.departments) {
      const dept = await prisma.department.create({
        data: { college: college.id, name: deptName, code: deptName.slice(0, 3).toUpperCase() }
      });
      deptIds[deptName] = dept.id;
      totalDepts++;
    }

    // Create courses
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

      // Create sections
      const sections = generateSections(course.id, courseData.totalSemesters);
      await prisma.section.createMany({ data: sections });
      totalSections += sections.length;

      // Create subjects
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

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('  🎉 SEED COMPLETE!');
  console.log('═══════════════════════════════════════════');
  console.log(`  🏫 New Colleges:    ${totalColleges}`);
  console.log(`  📁 Departments:     ${totalDepts}`);
  console.log(`  📚 Courses:         ${totalCourses}`);
  console.log(`  📋 Sections:        ${totalSections}`);
  console.log(`  📖 Subjects:        ${totalSubjects}`);
  console.log('═══════════════════════════════════════════');

  // Total in database
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
