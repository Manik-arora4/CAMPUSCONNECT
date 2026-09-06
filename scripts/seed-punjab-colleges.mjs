import { PrismaClient } from '../server/node_modules/@prisma/client/index.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../server/.env') });

// Use direct connection
const directUrl = process.env.DATABASE_URL?.replace(':6543', ':5432');
const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });

// ═══════════════════════════════════════════════════════════
// PUNJAB COLLEGES DATA
// ═══════════════════════════════════════════════════════════

const PUNJAB_COLLEGES = [
  // ── DAV Colleges (Group) ──────────────────────────────
  {
    name: 'DAV College, Jalandhar',
    code: 'DAV-JAL',
    city: 'Jalandhar',
    state: 'Punjab',
    website: 'https://davjalandhar.org',
    contactEmail: 'info@davjalandhar.org',
    contactPhone: '0181-2232125',
    establishedYear: 1918,
    departments: [
      {
        name: 'Computer Science & Applications',
        code: 'CSA',
        courses: [
          {
            name: 'Bachelor of Computer Applications',
            code: 'BCA',
            duration: 3,
            totalSemesters: 6,
            subjects: [
              { name: 'Programming in C', code: 'BCA101', semester: 1, credits: 4 },
              { name: 'Fundamentals of IT', code: 'BCA102', semester: 1, credits: 3 },
              { name: 'Mathematics-I', code: 'BCA103', semester: 1, credits: 4 },
              { name: 'Digital Electronics', code: 'BCA104', semester: 1, credits: 3 },
              { name: 'English Communication', code: 'BCA105', semester: 1, credits: 2 },
              { name: 'Data Structures', code: 'BCA201', semester: 2, credits: 4 },
              { name: 'Object Oriented Programming (C++)', code: 'BCA202', semester: 2, credits: 4 },
              { name: 'Mathematics-II', code: 'BCA203', semester: 2, credits: 4 },
              { name: 'Computer Architecture', code: 'BCA204', semester: 2, credits: 3 },
              { name: 'Discrete Mathematics', code: 'BCA205', semester: 2, credits: 3 },
              { name: 'Database Management Systems', code: 'BCA301', semester: 3, credits: 4 },
              { name: 'Operating Systems', code: 'BCA302', semester: 3, credits: 4 },
              { name: 'Computer Networks', code: 'BCA303', semester: 3, credits: 4 },
              { name: 'Web Technologies', code: 'BCA304', semester: 3, credits: 3 },
              { name: 'Java Programming', code: 'BCA305', semester: 3, credits: 3 },
              { name: 'Software Engineering', code: 'BCA401', semester: 4, credits: 4 },
              { name: 'Theory of Computation', code: 'BCA402', semester: 4, credits: 4 },
              { name: 'Compiler Design', code: 'BCA403', semester: 4, credits: 3 },
              { name: 'Artificial Intelligence', code: 'BCA404', semester: 4, credits: 3 },
              { name: 'Web Development (React)', code: 'BCA405', semester: 4, credits: 3 },
              { name: 'Machine Learning', code: 'BCA501', semester: 5, credits: 4 },
              { name: 'Cloud Computing', code: 'BCA502', semester: 5, credits: 3 },
              { name: 'Cyber Security', code: 'BCA503', semester: 5, credits: 3 },
              { name: 'Project Work-I', code: 'BCA504', semester: 5, credits: 4 },
              { name: 'Blockchain Technology', code: 'BCA505', semester: 5, credits: 2 },
              { name: 'Big Data Analytics', code: 'BCA601', semester: 6, credits: 4 },
              { name: 'Internet of Things', code: 'BCA602', semester: 6, credits: 3 },
              { name: 'Mobile App Development', code: 'BCA603', semester: 3, credits: 3 },
              { name: 'DevOps & Cloud', code: 'BCA604', semester: 6, credits: 3 },
              { name: 'Project Work-II (Major)', code: 'BCA605', semester: 6, credits: 6 },
            ],
            sections: ['A', 'B'],
          },
          {
            name: 'B.Sc. (Hons.) Computer Science',
            code: 'BSC-CS',
            duration: 3,
            totalSemesters: 6,
            subjects: [
              { name: 'Programming in C', code: 'CS101', semester: 1, credits: 4 },
              { name: 'Mathematics-I', code: 'CS102', semester: 1, credits: 4 },
              { name: 'Physics', code: 'CS103', semester: 1, credits: 4 },
              { name: 'English', code: 'CS104', semester: 1, credits: 2 },
              { name: 'Data Structures', code: 'CS201', semester: 2, credits: 4 },
              { name: 'OOP using Java', code: 'CS202', semester: 2, credits: 4 },
              { name: 'Mathematics-II', code: 'CS203', semester: 2, credits: 4 },
              { name: 'DBMS', code: 'CS301', semester: 3, credits: 4 },
              { name: 'Operating Systems', code: 'CS302', semester: 3, credits: 4 },
              { name: 'Computer Networks', code: 'CS303', semester: 3, credits: 4 },
              { name: 'Web Development', code: 'CS401', semester: 4, credits: 3 },
              { name: 'AI & ML', code: 'CS402', semester: 4, credits: 4 },
              { name: 'Software Engineering', code: 'CS403', semester: 4, credits: 3 },
              { name: 'Cyber Security', code: 'CS501', semester: 5, credits: 3 },
              { name: 'Cloud Computing', code: 'CS502', semester: 5, credits: 3 },
              { name: 'Project', code: 'CS601', semester: 6, credits: 6 },
            ],
            sections: ['A'],
          },
        ],
      },
      {
        name: 'Commerce',
        code: 'COMM',
        courses: [
          {
            name: 'Bachelor of Commerce',
            code: 'BCOM',
            duration: 3,
            totalSemesters: 6,
            subjects: [
              { name: 'Financial Accounting', code: 'COM101', semester: 1, credits: 4 },
              { name: 'Business Economics', code: 'COM102', semester: 1, credits: 4 },
              { name: 'Business Law', code: 'COM103', semester: 1, credits: 3 },
              { name: 'Cost Accounting', code: 'COM201', semester: 2, credits: 4 },
              { name: 'Corporate Accounting', code: 'COM202', semester: 2, credits: 4 },
              { name: 'Income Tax', code: 'COM301', semester: 3, credits: 4 },
              { name: 'Auditing', code: 'COM302', semester: 3, credits: 4 },
              { name: 'GST & Tax Planning', code: 'COM401', semester: 4, credits: 3 },
              { name: 'E-Commerce', code: 'COM402', semester: 4, credits: 3 },
            ],
            sections: ['A', 'B'],
          },
        ],
      },
      {
        name: 'Management',
        code: 'MGT',
        courses: [
          {
            name: 'Bachelor of Business Administration',
            code: 'BBA',
            duration: 3,
            totalSemesters: 6,
            subjects: [
              { name: 'Principles of Management', code: 'BBA101', semester: 1, credits: 4 },
              { name: 'Business Communication', code: 'BBA102', semester: 1, credits: 3 },
              { name: 'Microeconomics', code: 'BBA103', semester: 1, credits: 4 },
              { name: 'Financial Accounting', code: 'BBA201', semester: 2, credits: 4 },
              { name: 'Marketing Management', code: 'BBA202', semester: 2, credits: 4 },
              { name: 'Human Resource Management', code: 'BBA301', semester: 3, credits: 4 },
              { name: 'Business Ethics', code: 'BBA302', semester: 3, credits: 3 },
              { name: 'Operations Management', code: 'BBA401', semester: 4, credits: 4 },
              { name: 'Entrepreneurship', code: 'BBA402', semester: 4, credits: 3 },
            ],
            sections: ['A'],
          },
        ],
      },
    ],
  },
  {
    name: 'DAV College, Amritsar',
    code: 'DAV-AMR',
    city: 'Amritsar',
    state: 'Punjab',
    website: 'https://davamritsar.ac.in',
    contactEmail: 'info@davamritsar.ac.in',
    contactPhone: '0183-2565352',
    establishedYear: 1941,
    departments: [
      {
        name: 'Computer Science & Applications',
        code: 'CSA',
        courses: [
          {
            name: 'Bachelor of Computer Applications',
            code: 'BCA',
            duration: 3,
            totalSemesters: 6,
            subjects: [
              { name: 'Programming in C', code: 'BCA101', semester: 1, credits: 4 },
              { name: 'Computer Fundamentals', code: 'BCA102', semester: 1, credits: 3 },
              { name: 'Mathematics-I', code: 'BCA103', semester: 1, credits: 4 },
              { name: 'Data Structures', code: 'BCA201', semester: 2, credits: 4 },
              { name: 'OOP with C++', code: 'BCA202', semester: 2, credits: 4 },
              { name: 'DBMS', code: 'BCA301', semester: 3, credits: 4 },
              { name: 'Operating Systems', code: 'BCA302', semester: 3, credits: 4 },
              { name: 'Computer Networks', code: 'BCA303', semester: 3, credits: 4 },
              { name: 'Web Technologies', code: 'BCA401', semester: 4, credits: 3 },
              { name: 'Java Programming', code: 'BCA402', semester: 4, credits: 3 },
              { name: 'Software Engineering', code: 'BCA501', semester: 5, credits: 4 },
              { name: 'Machine Learning', code: 'BCA502', semester: 5, credits: 3 },
              { name: 'Project Work', code: 'BCA601', semester: 6, credits: 6 },
            ],
            sections: ['A', 'B'],
          },
        ],
      },
    ],
  },
  {
    name: 'DAV College, Ludhiana',
    code: 'DAV-LDH',
    city: 'Ludhiana',
    state: 'Punjab',
    website: 'https://davludhiana.org',
    contactEmail: 'info@davludhiana.org',
    contactPhone: '0161-2441833',
    establishedYear: 1948,
    departments: [
      {
        name: 'Computer Science',
        code: 'CS',
        courses: [
          {
            name: 'B.Sc. Computer Science',
            code: 'BSC-CS',
            duration: 3,
            totalSemesters: 6,
            subjects: [
              { name: 'Programming in C', code: 'CS101', semester: 1, credits: 4 },
              { name: 'Mathematics', code: 'CS102', semester: 1, credits: 4 },
              { name: 'Data Structures', code: 'CS201', semester: 2, credits: 4 },
              { name: 'DBMS', code: 'CS301', semester: 3, credits: 4 },
              { name: 'Operating Systems', code: 'CS302', semester: 3, credits: 4 },
              { name: 'Computer Networks', code: 'CS401', semester: 4, credits: 4 },
              { name: 'Web Development', code: 'CS501', semester: 5, credits: 3 },
              { name: 'Project', code: 'CS601', semester: 6, credits: 6 },
            ],
            sections: ['A'],
          },
        ],
      },
    ],
  },
  // ── Other Punjab Colleges ──────────────────────────────
  {
    name: 'Punjab Engineering College (PEC), Chandigarh',
    code: 'PEC-CHD',
    city: 'Chandigarh',
    state: 'Punjab',
    website: 'https://pec.ac.in',
    contactEmail: 'info@pec.ac.in',
    contactPhone: '0172-2753115',
    establishedYear: 1921,
    departments: [
      {
        name: 'Computer Science & Engineering',
        code: 'CSE',
        courses: [
          {
            name: 'B.Tech Computer Science & Engineering',
            code: 'BTech-CSE',
            duration: 4,
            totalSemesters: 8,
            subjects: [
              { name: 'Programming in C', code: 'CSE101', semester: 1, credits: 4 },
              { name: 'Engineering Mathematics-I', code: 'CSE102', semester: 1, credits: 4 },
              { name: 'Engineering Physics', code: 'CSE103', semester: 1, credits: 3 },
              { name: 'Basic Electronics', code: 'CSE104', semester: 1, credits: 3 },
              { name: 'Workshop Practice', code: 'CSE105', semester: 1, credits: 2 },
              { name: 'Data Structures', code: 'CSE201', semester: 2, credits: 4 },
              { name: 'OOP using Java', code: 'CSE202', semester: 2, credits: 4 },
              { name: 'Engineering Mathematics-II', code: 'CSE203', semester: 2, credits: 4 },
              { name: 'Digital Logic Design', code: 'CSE204', semester: 2, credits: 3 },
              { name: 'DBMS', code: 'CSE301', semester: 3, credits: 4 },
              { name: 'Operating Systems', code: 'CSE302', semester: 3, credits: 4 },
              { name: 'Computer Architecture', code: 'CSE303', semester: 3, credits: 4 },
              { name: 'Theory of Computation', code: 'CSE304', semester: 3, credits: 3 },
              { name: 'Computer Networks', code: 'CSE401', semester: 4, credits: 4 },
              { name: 'Software Engineering', code: 'CSE402', semester: 4, credits: 4 },
              { name: 'Compiler Design', code: 'CSE403', semester: 4, credits: 3 },
              { name: 'Web Technologies', code: 'CSE404', semester: 4, credits: 3 },
              { name: 'Machine Learning', code: 'CSE501', semester: 5, credits: 4 },
              { name: 'Artificial Intelligence', code: 'CSE502', semester: 5, credits: 4 },
              { name: 'Information Security', code: 'CSE503', semester: 5, credits: 3 },
              { name: 'Cloud Computing', code: 'CSE504', semester: 5, credits: 3 },
              { name: 'Big Data Analytics', code: 'CSE601', semester: 6, credits: 4 },
              { name: 'Internet of Things', code: 'CSE602', semester: 6, credits: 3 },
              { name: 'Blockchain Technology', code: 'CSE603', semester: 6, credits: 3 },
              { name: 'Elective-I', code: 'CSE604', semester: 6, credits: 3 },
              { name: 'Major Project-I', code: 'CSE701', semester: 7, credits: 10 },
              { name: 'Minor Project / Internship', code: 'CSE702', semester: 7, credits: 6 },
              { name: 'Elective-II', code: 'CSE703', semester: 7, credits: 3 },
              { name: 'Major Project-II', code: 'CSE801', semester: 8, credits: 12 },
              { name: 'Seminar', code: 'CSE802', semester: 8, credits: 4 },
            ],
            sections: ['A', 'B', 'C'],
          },
        ],
      },
      {
        name: 'Electronics & Communication Engineering',
        code: 'ECE',
        courses: [
          {
            name: 'B.Tech Electronics & Communication',
            code: 'BTech-ECE',
            duration: 4,
            totalSemesters: 8,
            subjects: [
              { name: 'Basic Electronics', code: 'ECE101', semester: 1, credits: 4 },
              { name: 'Engineering Mathematics-I', code: 'ECE102', semester: 1, credits: 4 },
              { name: 'Network Theory', code: 'ECE201', semester: 2, credits: 4 },
              { name: 'Analog Electronics', code: 'ECE202', semester: 2, credits: 4 },
              { name: 'Signals & Systems', code: 'ECE301', semester: 3, credits: 4 },
              { name: 'Digital Electronics', code: 'ECE302', semester: 3, credits: 4 },
              { name: 'Communication Systems', code: 'ECE401', semester: 4, credits: 4 },
              { name: 'VLSI Design', code: 'ECE501', semester: 5, credits: 4 },
            ],
            sections: ['A', 'B'],
          },
        ],
      },
    ],
  },
  {
    name: 'Thapar Institute of Engineering & Technology, Patiala',
    code: 'TIET-PTA',
    city: 'Patiala',
    state: 'Punjab',
    website: 'https://thapar.edu',
    contactEmail: 'info@thapar.edu',
    contactPhone: '0175-2393021',
    establishedYear: 1956,
    departments: [
      {
        name: 'Computer Science & Engineering',
        code: 'CSE',
        courses: [
          {
            name: 'B.Tech Computer Engineering',
            code: 'BTech-CE',
            duration: 4,
            totalSemesters: 8,
            subjects: [
              { name: 'Programming Fundamentals', code: 'CE101', semester: 1, credits: 4 },
              { name: 'Engineering Mathematics-I', code: 'CE102', semester: 1, credits: 4 },
              { name: 'Data Structures & Algorithms', code: 'CE201', semester: 2, credits: 4 },
              { name: 'DBMS', code: 'CE301', semester: 3, credits: 4 },
              { name: 'Operating Systems', code: 'CE302', semester: 3, credits: 4 },
              { name: 'Computer Networks', code: 'CE401', semester: 4, credits: 4 },
              { name: 'Machine Learning', code: 'CE501', semester: 5, credits: 4 },
              { name: 'Capstone Project', code: 'CE801', semester: 8, credits: 10 },
            ],
            sections: ['A', 'B', 'C', 'D'],
          },
        ],
      },
    ],
  },
  {
    name: 'Guru Nanak Dev University, Amritsar',
    code: 'GNDU-AMR',
    city: 'Amritsar',
    state: 'Punjab',
    website: 'https://gndu.ac.in',
    contactEmail: 'registrar@gndu.ac.in',
    contactPhone: '0183-2452414',
    establishedYear: 1969,
    departments: [
      {
        name: 'Computer Science',
        code: 'CS',
        courses: [
          {
            name: 'B.Tech Computer Science & Engineering',
            code: 'BTech-CSE',
            duration: 4,
            totalSemesters: 8,
            subjects: [
              { name: 'Programming in C', code: 'GND-CS101', semester: 1, credits: 4 },
              { name: 'Engineering Mathematics-I', code: 'GND-CS102', semester: 1, credits: 4 },
              { name: 'Data Structures', code: 'GND-CS201', semester: 2, credits: 4 },
              { name: 'OOP with Java', code: 'GND-CS202', semester: 2, credits: 4 },
              { name: 'DBMS', code: 'GND-CS301', semester: 3, credits: 4 },
              { name: 'Operating Systems', code: 'GND-CS302', semester: 3, credits: 4 },
              { name: 'Computer Networks', code: 'GND-CS401', semester: 4, credits: 4 },
              { name: 'Software Engineering', code: 'GND-CS402', semester: 4, credits: 4 },
              { name: 'Machine Learning', code: 'GND-CS501', semester: 5, credits: 4 },
              { name: 'Cloud Computing', code: 'GND-CS502', semester: 5, credits: 3 },
              { name: 'Major Project', code: 'GND-CS801', semester: 8, credits: 12 },
            ],
            sections: ['A', 'B'],
          },
          {
            name: 'BCA',
            code: 'BCA',
            duration: 3,
            totalSemesters: 6,
            subjects: [
              { name: 'Programming in C', code: 'GND-BCA101', semester: 1, credits: 4 },
              { name: 'Data Structures', code: 'GND-BCA201', semester: 2, credits: 4 },
              { name: 'DBMS', code: 'GND-BCA301', semester: 3, credits: 4 },
              { name: 'Operating Systems', code: 'GND-BCA302', semester: 3, credits: 4 },
              { name: 'Web Development', code: 'GND-BCA401', semester: 4, credits: 3 },
              { name: 'Project', code: 'GND-BCA601', semester: 6, credits: 6 },
            ],
            sections: ['A'],
          },
        ],
      },
    ],
  },
  {
    name: 'Punjabi University, Patiala',
    code: 'PU-PTA',
    city: 'Patiala',
    state: 'Punjab',
    website: 'https://punjabiuniversity.ac.in',
    contactEmail: 'info@punjabiuniversity.ac.in',
    contactPhone: '0175-2283175',
    establishedYear: 1962,
    departments: [
      {
        name: 'Computer Science & Engineering',
        code: 'CSE',
        courses: [
          {
            name: 'B.Tech Computer Science & Engineering',
            code: 'BTech-CSE',
            duration: 4,
            totalSemesters: 8,
            subjects: [
              { name: 'C Programming', code: 'PU-CS101', semester: 1, credits: 4 },
              { name: 'Engineering Mathematics', code: 'PU-CS102', semester: 1, credits: 4 },
              { name: 'Data Structures', code: 'PU-CS201', semester: 2, credits: 4 },
              { name: 'DBMS', code: 'PU-CS301', semester: 3, credits: 4 },
              { name: 'Operating Systems', code: 'PU-CS302', semester: 3, credits: 4 },
              { name: 'Computer Networks', code: 'PU-CS401', semester: 4, credits: 4 },
              { name: 'Software Engineering', code: 'PU-CS402', semester: 4, credits: 4 },
              { name: 'Machine Learning', code: 'PU-CS501', semester: 5, credits: 4 },
              { name: 'Project', code: 'PU-CS801', semester: 8, credits: 12 },
            ],
            sections: ['A', 'B'],
          },
          {
            name: 'B.Sc. Computer Science',
            code: 'BSC-CS',
            duration: 3,
            totalSemesters: 6,
            subjects: [
              { name: 'C Programming', code: 'PU-BCS101', semester: 1, credits: 4 },
              { name: 'Data Structures', code: 'PU-BCS201', semester: 2, credits: 4 },
              { name: 'DBMS', code: 'PU-BCS301', semester: 3, credits: 4 },
              { name: 'Web Development', code: 'PU-BCS401', semester: 4, credits: 3 },
              { name: 'Project', code: 'PU-BCS601', semester: 6, credits: 6 },
            ],
            sections: ['A'],
          },
        ],
      },
    ],
  },
  {
    name: 'Chandigarh University, Mohali',
    code: 'CU-MOH',
    city: 'Mohali',
    state: 'Punjab',
    website: 'https://cuchd.in',
    contactEmail: 'info@cuchd.in',
    contactPhone: '0172-3543740',
    establishedYear: 2012,
    departments: [
      {
        name: 'Computer Science & Engineering',
        code: 'CSE',
        courses: [
          {
            name: 'B.Tech Computer Science & Engineering',
            code: 'BTech-CSE',
            duration: 4,
            totalSemesters: 8,
            subjects: [
              { name: 'Programming in C', code: 'CU-CS101', semester: 1, credits: 4 },
              { name: 'Engineering Mathematics-I', code: 'CU-CS102', semester: 1, credits: 4 },
              { name: 'Data Structures', code: 'CU-CS201', semester: 2, credits: 4 },
              { name: 'OOP using Java', code: 'CU-CS202', semester: 2, credits: 4 },
              { name: 'DBMS', code: 'CU-CS301', semester: 3, credits: 4 },
              { name: 'Operating Systems', code: 'CU-CS302', semester: 3, credits: 4 },
              { name: 'Computer Networks', code: 'CU-CS401', semester: 4, credits: 4 },
              { name: 'Software Engineering', code: 'CU-CS402', semester: 4, credits: 4 },
              { name: 'Machine Learning', code: 'CU-CS501', semester: 5, credits: 4 },
              { name: 'Artificial Intelligence', code: 'CU-CS502', semester: 5, credits: 4 },
              { name: 'Cloud Computing', code: 'CU-CS601', semester: 6, credits: 3 },
              { name: 'Major Project', code: 'CU-CS801', semester: 8, credits: 12 },
            ],
            sections: ['A', 'B', 'C'],
          },
          {
            name: 'B.Tech Information Technology',
            code: 'BTech-IT',
            duration: 4,
            totalSemesters: 8,
            subjects: [
              { name: 'Programming Fundamentals', code: 'CU-IT101', semester: 1, credits: 4 },
              { name: 'Data Structures', code: 'CU-IT201', semester: 2, credits: 4 },
              { name: 'Web Technologies', code: 'CU-IT301', semester: 3, credits: 4 },
              { name: 'Database Systems', code: 'CU-IT302', semester: 3, credits: 4 },
              { name: 'Network Security', code: 'CU-IT401', semester: 4, credits: 4 },
              { name: 'Project', code: 'CU-IT801', semester: 8, credits: 12 },
            ],
            sections: ['A', 'B'],
          },
          {
            name: 'BCA',
            code: 'BCA',
            duration: 3,
            totalSemesters: 6,
            subjects: [
              { name: 'Programming in C', code: 'CU-BCA101', semester: 1, credits: 4 },
              { name: 'Data Structures', code: 'CU-BCA201', semester: 2, credits: 4 },
              { name: 'DBMS', code: 'CU-BCA301', semester: 3, credits: 4 },
              { name: 'Web Development', code: 'CU-BCA401', semester: 4, credits: 3 },
              { name: 'Project', code: 'CU-BCA601', semester: 6, credits: 6 },
            ],
            sections: ['A', 'B'],
          },
        ],
      },
    ],
  },
  {
    name: 'Lovely Professional University, Phagwara',
    code: 'LPU-PHR',
    city: 'Phagwara',
    state: 'Punjab',
    website: 'https://lpu.in',
    contactEmail: 'info@lpu.in',
    contactPhone: '01824-511111',
    establishedYear: 2005,
    departments: [
      {
        name: 'Computer Science & Engineering',
        code: 'CSE',
        courses: [
          {
            name: 'B.Tech Computer Science & Engineering',
            code: 'BTech-CSE',
            duration: 4,
            totalSemesters: 8,
            subjects: [
              { name: 'Programming in C', code: 'LPU-CS101', semester: 1, credits: 4 },
              { name: 'Engineering Mathematics-I', code: 'LPU-CS102', semester: 1, credits: 4 },
              { name: 'Data Structures & Algorithms', code: 'LPU-CS201', semester: 2, credits: 4 },
              { name: 'OOP with Java', code: 'LPU-CS202', semester: 2, credits: 4 },
              { name: 'DBMS', code: 'LPU-CS301', semester: 3, credits: 4 },
              { name: 'Operating Systems', code: 'LPU-CS302', semester: 3, credits: 4 },
              { name: 'Computer Networks', code: 'LPU-CS401', semester: 4, credits: 4 },
              { name: 'Software Engineering', code: 'LPU-CS402', semester: 4, credits: 4 },
              { name: 'Machine Learning', code: 'LPU-CS501', semester: 5, credits: 4 },
              { name: 'AI & Deep Learning', code: 'LPU-CS502', semester: 5, credits: 4 },
              { name: 'Cloud Computing', code: 'LPU-CS601', semester: 6, credits: 3 },
              { name: 'Cyber Security', code: 'LPU-CS602', semester: 6, credits: 3 },
              { name: 'Major Project', code: 'LPU-CS801', semester: 8, credits: 12 },
            ],
            sections: ['A', 'B', 'C', 'D'],
          },
          {
            name: 'BCA',
            code: 'BCA',
            duration: 3,
            totalSemesters: 6,
            subjects: [
              { name: 'Programming in C', code: 'LPU-BCA101', semester: 1, credits: 4 },
              { name: 'Data Structures', code: 'LPU-BCA201', semester: 2, credits: 4 },
              { name: 'DBMS', code: 'LPU-BCA301', semester: 3, credits: 4 },
              { name: 'Web Development', code: 'LPU-BCA401', semester: 4, credits: 3 },
              { name: 'Project', code: 'LPU-BCA601', semester: 6, credits: 6 },
            ],
            sections: ['A', 'B'],
          },
        ],
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════
// SEED FUNCTION
// ═══════════════════════════════════════════════════════════

async function seedPunjabColleges() {
  console.log('🏫 Seeding Punjab Colleges...\n');

  // Remove old colleges (except keep existing test data if needed)
  const oldColleges = await prisma.college.findMany();
  console.log(`⚠️  Found ${oldColleges.length} old colleges. Keeping them (adding Punjab colleges alongside).\n`);

  let totalColleges = 0, totalDepts = 0, totalCourses = 0, totalSections = 0, totalSubjects = 0;

  for (const collegeData of PUNJAB_COLLEGES) {
    // Check if college already exists
    let college = await prisma.college.findFirst({ where: { code: collegeData.code } });
    if (!college) {
      college = await prisma.college.create({
        data: {
          name: collegeData.name,
          code: collegeData.code,
          city: collegeData.city,
          state: collegeData.state,
          website: collegeData.website || '',
          contactEmail: collegeData.contactEmail || '',
          contactPhone: collegeData.contactPhone || '',
          establishedYear: collegeData.establishedYear || null,
          address: `${collegeData.city}, ${collegeData.state}`,
        },
      });
      totalColleges++;
      console.log(`✅ College: ${college.name} (${college.code})`);
    } else {
      console.log(`⏭️  College already exists: ${college.name}`);
    }

    for (const deptData of collegeData.departments) {
      // Check if department exists
      let dept = await prisma.department.findFirst({
        where: { college: college.id, name: deptData.name },
      });
      if (!dept) {
        dept = await prisma.department.create({
          data: {
            college: college.id,
            name: deptData.name,
            code: deptData.code,
          },
        });
        totalDepts++;
        console.log(`  📁 Dept: ${dept.name}`);
      }

      for (const courseData of deptData.courses) {
        // Check if course exists
        let course = await prisma.course.findFirst({
          where: { college: college.id, code: courseData.code },
        });
        if (!course) {
          course = await prisma.course.create({
            data: {
              college: college.id,
              name: courseData.name,
              code: courseData.code,
              department: dept.name,
              duration: courseData.duration,
              totalSemesters: courseData.totalSemesters,
              description: `${courseData.name} at ${college.name}`,
            },
          });
          totalCourses++;
          console.log(`    📚 Course: ${course.name} (${course.code})`);
        }

        // Create sections for each semester
        for (let sem = 1; sem <= courseData.totalSemesters; sem++) {
          for (const secName of courseData.sections) {
            const existingSection = await prisma.section.findFirst({
              where: {
                course: course.id,
                semester: sem,
                name: secName,
              },
            });
            if (!existingSection) {
              await prisma.section.create({
                data: {
                  course: course.id,
                  name: secName,
                  code: `${courseData.code}-S${sem}-${secName}`,
                  semester: sem,
                  maxStudents: 60,
                },
              });
              totalSections++;
            }
          }
        }

        // Create subjects
        for (const subjData of courseData.subjects) {
          const existingSubject = await prisma.subject.findFirst({
            where: { college: college.id, code: subjData.code },
          });
          if (!existingSubject) {
            await prisma.subject.create({
              data: {
                college: college.id,
                name: subjData.name,
                code: subjData.code,
                semester: subjData.semester,
                credits: subjData.credits || 4,
                course: course.id,
              },
            });
            totalSubjects++;
          }
        }
      }
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════');
  console.log('🎓 SEED COMPLETE!');
  console.log(`   Colleges:    +${totalColleges}`);
  console.log(`   Departments: +${totalDepts}`);
  console.log(`   Courses:     +${totalCourses}`);
  console.log(`   Sections:    +${totalSections}`);
  console.log(`   Subjects:    +${totalSubjects}`);
  console.log('═══════════════════════════════════════');
}

seedPunjabColleges()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
