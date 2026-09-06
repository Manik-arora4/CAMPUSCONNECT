#!/usr/bin/env node
// Fast seed using createMany for batch inserts
import { PrismaClient } from '../server/node_modules/@prisma/client/index.js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../server/.env') });

const p = new PrismaClient();
const mk = (n = 20) => crypto.randomBytes(n).toString('base64url').slice(0, 25);

async function main() {
  // ═══ 1. COLLEGES ═══
  console.log('🏫 Creating colleges...');
  const collegeRows = [
    { id: mk(), name: 'Guru Nanak Dev University', code: 'GNDU', city: 'Amritsar', address: 'Chheharta Road, Amritsar 143001', contactPhone: '0183-2258802', establishedYear: 1969 },
    { id: mk(), name: 'I.K. Gujral Punjab Technical University, Amritsar', code: 'IKGPTU', city: 'Amritsar', address: 'Govt Polytechnic Campus 143105', contactPhone: '0183-2450034', establishedYear: 1997 },
    { id: mk(), name: 'Indian Institute of Management, Amritsar', code: 'IIM-AMR', city: 'Amritsar', address: 'PIT Building, Govt Polytechnic 143105', contactPhone: '0183-2254538', establishedYear: 2015 },
    { id: mk(), name: 'Khalsa College, Amritsar', code: 'KC-AMR', city: 'Amritsar', address: 'G.T. Road, Putlighar 143001', contactPhone: '0183-5015511', establishedYear: 1892 },
    { id: mk(), name: 'BBK DAV College for Women, Amritsar', code: 'BBKDAV', city: 'Amritsar', address: 'Lawrence Road, Krishna Nagar 143001', contactPhone: '0183-222157', establishedYear: 1967 },
    { id: mk(), name: 'DAV College, Amritsar', code: 'DAV-AMR', city: 'Amritsar', address: 'Hathi Gate, Katra Ahluwalia 143001', contactPhone: '0183-2565742', establishedYear: 1948 },
    { id: mk(), name: 'Hindu College, Amritsar', code: 'HINDU', city: 'Amritsar', address: 'Dhab Khatikan, Katra Ahluwalia 143001', contactPhone: '9417080473', establishedYear: 1912 },
    { id: mk(), name: 'S.R. Government College for Women, Amritsar', code: 'SRGCW', city: 'Amritsar', address: 'Mcleod Road, Rani Ka Bagh 143001', contactPhone: '9501500488', establishedYear: 1937 },
    { id: mk(), name: 'Khalsa College for Women, Amritsar', code: 'KCW-AMR', city: 'Amritsar', address: 'G.T. Road, Putlighar 143001', contactPhone: '0183-5050431', establishedYear: 1956 },
    { id: mk(), name: 'Khalsa College of Engineering & Technology', code: 'KCET', city: 'Amritsar', address: 'G.T. Road, Amritsar 143002', contactPhone: '0183-5015511', establishedYear: 1957 },
    { id: mk(), name: 'Amritsar College of Engineering & Technology', code: 'ACET', city: 'Amritsar', address: '12 km Stone, GT Road 143001', contactPhone: '0183-5069532', establishedYear: 2001 },
    { id: mk(), name: 'Baba Kuma Singh Ji Engineering College', code: 'BKSJEC', city: 'Amritsar', address: 'Hoshiar Nagar, Attari Road 143001', contactPhone: '9501259955', establishedYear: 2001 },
    { id: mk(), name: 'Khalsa College of Law', code: 'KCL-AMR', city: 'Amritsar', address: 'Ram Tirth Road 143001', contactPhone: '9888999790', establishedYear: 1974 },
    { id: mk(), name: 'Government College, Ajnala', code: 'GCAJ', city: 'Ajnala', address: 'Ajnala, District Amritsar 143102', contactPhone: '0185-8221038', establishedYear: 1968 },
  ];
  await p.college.createMany({ data: collegeRows });
  console.log(`✅ ${collegeRows.length} colleges`);

  const cId = {};
  for (const r of collegeRows) cId[r.code] = r.id;

  // ═══ 2. DEPARTMENTS ═══
  console.log('📁 Creating departments...');
  const deptDefs = [
    ['GNDU', [['CSA','Computer Science & Applications'],['ET','Electronics Technology'],['PHY','Physics'],['CHEM','Chemistry'],['MATH','Mathematics'],['ECS','English & Cultural Studies'],['CBM','Commerce & Business'],['ECON','Economics'],['LAW','Law'],['BT','Biotechnology']]],
    ['IKGPTU', [['CS','Computer Science & IT'],['ECE','Electronics & Communication'],['ME','Mechanical Engineering'],['CE','Civil Engineering']]],
    ['IIM-AMR', [['MGMT','Management']]],
    ['KC-AMR', [['CS','Computer Science'],['COM','Commerce'],['ARTS','Arts'],['SCI','Science'],['LAW','Law'],['BBA','Business Admin']]],
    ['BBKDAV', [['CS','Computer Science'],['COM','Commerce'],['ARTS','Arts'],['SCI','Science'],['BBA','Business Admin']]],
    ['DAV-AMR', [['CS','Computer Science'],['COM','Commerce'],['ARTS','Arts'],['SCI','Science']]],
    ['HINDU', [['CS','Computer Science'],['COM','Commerce'],['ARTS','Arts'],['SCI','Science']]],
    ['SRGCW', [['CS','Computer Science'],['COM','Commerce'],['ARTS','Arts'],['SCI','Science']]],
    ['KCW-AMR', [['CS','Computer Science'],['COM','Commerce'],['ARTS','Arts'],['SCI','Science']]],
    ['KCET', [['CSE','CSE'],['ECE','ECE'],['ME','Mechanical'],['CE','Civil']]],
    ['ACET', [['CSE','CSE'],['ECE','ECE'],['ME','Mechanical'],['CE','Civil']]],
    ['BKSJEC', [['CSE','CSE'],['ECE','ECE'],['ME','Mechanical']]],
    ['KCL-AMR', [['LAW','Law']]],
    ['GCAJ', [['COM','Commerce'],['ARTS','Arts'],['SCI','Science']]],
  ];

  const dId = {};
  const deptRows = [];
  for (const [cc, depts] of deptDefs) {
    dId[cc] = {};
    for (const [code, name] of depts) {
      const id = mk();
      dId[cc][code] = id;
      deptRows.push({ id, college: cId[cc], name, code });
    }
  }
  await p.department.createMany({ data: deptRows });
  console.log(`✅ ${deptRows.length} departments`);

  // ═══ 3. COURSES ═══
  console.log('📚 Creating courses...');
  const courseDefs = {
    GNDU: [
      { name:'B.Tech Computer Science', code:'BTech-CS', dur:4, sems:8, dept:'CSA', subs:['Data Structures','DBMS','OS','Networks','OOP','Web Tech','Software Engg','AI'] },
      { name:'BCA', code:'BCA', dur:3, sems:6, dept:'CSA', subs:['Prog in C','Data Structures','DBMS','Web Dev','OS','Networks'] },
      { name:'MCA', code:'MCA', dur:2, sems:4, dept:'CSA', subs:['Adv DBMS','Cloud Computing','AI/ML','Cyber Security'] },
      { name:'B.Sc Computer Science', code:'BSc-CS', dur:3, sems:6, dept:'CSA', subs:['CS Fundamentals','Programming','DBMS','Networking','Web Dev','AI'] },
      { name:'B.Com', code:'BCom', dur:3, sems:6, dept:'CBM', subs:['Fin Accounting','Business Eco','Business Law','Cost Acct','Income Tax','Auditing'] },
      { name:'BBA', code:'BBA', dur:3, sems:6, dept:'CBM', subs:['Principles of Mgmt','Marketing','HRM','Finance','Operations','Strategy'] },
      { name:'BA English', code:'BA-Eng', dur:3, sems:6, dept:'ECS', subs:['English Lit','Comm Skills','Indian Writing','Creative Writing','Linguistics','Literary Criticism'] },
      { name:'B.Sc Physics', code:'BSc-Phy', dur:3, sems:6, dept:'PHY', subs:['Mechanics','Thermo','Optics','Electromagnetism','Quantum','Lab'] },
    ],
    IKGPTU: [
      { name:'B.Tech CSE', code:'BTech-CSE', dur:4, sems:8, dept:'CS', subs:['Data Structures','DBMS','OS','Networks','Compiler Design','AI','Cloud','Security'] },
      { name:'B.Tech ECE', code:'BTech-ECE', dur:4, sems:8, dept:'ECE', subs:['Circuit Theory','Signals','Digital Elec','VLSI','Embedded','Comm','DSP','Antenna'] },
      { name:'B.Tech ME', code:'BTech-ME', dur:4, sems:8, dept:'ME', subs:['Thermo','Fluid Mech','Machine Design','Manufacturing','Heat Transfer','CAD','Robotics','Project'] },
      { name:'BCA', code:'BCA', dur:3, sems:6, dept:'CS', subs:['Prog in C','Data Structures','DBMS','Web Dev','OS','Networks'] },
    ],
    'IIM-AMR': [
      { name:'PGP (MBA)', code:'PGP', dur:2, sems:4, dept:'MGMT', subs:['Marketing Mgmt','Fin Mgmt','OB','Operations','Strategy','Business Analytics'] },
    ],
  };

  const genDef = [
    { name:'BCA', code:'BCA', dur:3, sems:6, dept:'CS', subs:['Prog in C','Data Structures','DBMS','Web Dev','OS','Networks'] },
    { name:'B.Com', code:'BCom', dur:3, sems:6, dept:'COM', subs:['Fin Accounting','Business Eco','Business Law','Cost Acct','Auditing'] },
    { name:'B.Com (Hons)', code:'BCom-H', dur:3, sems:6, dept:'COM', subs:['Fin Accounting','Adv Acct','Business Law','Tax','Auditing','Mgmt Acct'] },
    { name:'BA', code:'BA', dur:3, sems:6, dept:'ARTS', subs:['English','Hindi','Punjabi','History','Pol Science','Economics'] },
    { name:'B.Sc', code:'BSc', dur:3, sems:6, dept:'SCI', subs:['Physics','Chemistry','Math','Biology','CS Fundamentals','Lab'] },
    { name:'BBA', code:'BBA', dur:3, sems:6, dept:'BBA', subs:['Principles of Mgmt','Marketing','HRM','Finance','Operations','Strategy'] },
  ];

  const engDef = [
    { name:'B.Tech CSE', code:'BTech-CSE', dur:4, sems:8, dept:'CSE', subs:['Data Structures','DBMS','OS','Networks','OOP','Web Tech','Software Engg'] },
    { name:'B.Tech ECE', code:'BTech-ECE', dur:4, sems:8, dept:'ECE', subs:['Circuit Theory','Signals','Digital Elec','VLSI','Communication','DSP'] },
    { name:'B.Tech ME', code:'BTech-ME', dur:4, sems:8, dept:'ME', subs:['Thermo','Fluid Mech','Machine Design','Manufacturing'] },
    { name:'BCA', code:'BCA', dur:3, sems:6, dept:'CSE', subs:['Prog in C','Data Structures','DBMS','Web Dev','OS'] },
  ];

  const lawDef = [
    { name:'BA LLB (5 Year)', code:'BALLB', dur:5, sems:10, dept:'LAW', subs:['Const Law','Crim Law','Civil Law','Legal Reasoning','Legal English','Family Law','IPR','Intl Law','Cyber Law','Moot Court'] },
    { name:'LLB (3 Year)', code:'LLB', dur:3, sems:6, dept:'LAW', subs:['Const Law','Crim Law','Civil Law','Legal Reasoning','Family Law','IPR'] },
  ];

  const bksjecDef = [
    { name:'B.Tech CSE', code:'BTech-CSE', dur:4, sems:8, dept:'CSE', subs:['Data Structures','DBMS','OS','Networks','OOP','Web Tech'] },
    { name:'B.Tech ECE', code:'BTech-ECE', dur:4, sems:8, dept:'ECE', subs:['Circuit Theory','Signals','Digital Elec','VLSI'] },
    { name:'B.Tech ME', code:'BTech-ME', dur:4, sems:8, dept:'ME', subs:['Thermo','Fluid Mech','Machine Design'] },
  ];

  // Assign courses to colleges
  const collegeCourses = {};
  for (const cc of ['KC-AMR','BBKDAV','DAV-AMR','HINDU','SRGCW','KCW-AMR','GCAJ']) collegeCourses[cc] = genDef;
  for (const cc of ['KCET','ACET']) collegeCourses[cc] = engDef;
  collegeCourses['BKSJEC'] = bksjecDef;
  collegeCourses['KCL-AMR'] = lawDef;

  const courseRows = [];
  const courseMap = {}; // collegeCode -> [{code, id, subs, deptCode, sems}]
  for (const cc of Object.keys({...courseDefs, ...collegeCourses})) {
    const allCourses = [...(courseDefs[cc] || []), ...(collegeCourses[cc] || [])];
    courseMap[cc] = [];
    for (const c of allCourses) {
      const id = mk();
      courseRows.push({ id, college: cId[cc], department: dId[cc]?.[c.dept], name: c.name, code: c.code, duration: c.dur, totalSemesters: c.sems });
      courseMap[cc].push({ id, code: c.code, subs: c.subs, deptCode: c.dept, sems: c.sems });
    }
  }
  await p.course.createMany({ data: courseRows });
  console.log(`✅ ${courseRows.length} courses`);

  // ═══ 4. SECTIONS ═══
  console.log('📋 Creating sections...');
  const secRows = [];
  for (const cc of Object.keys(courseMap)) {
    for (const c of courseMap[cc]) {
      const maxSems = Math.min(c.sems, 4);
      for (let sem = 1; sem <= maxSems; sem++) {
        for (const sec of ['A', 'B']) {
          secRows.push({ id: mk(), course: c.id, semester: sem, name: `Section ${sec}`, code: sec, maxStudents: 60 });
        }
      }
    }
  }
  // Batch insert (50 at a time)
  for (let i = 0; i < secRows.length; i += 50) {
    await p.section.createMany({ data: secRows.slice(i, i + 50) });
  }
  console.log(`✅ ${secRows.length} sections`);

  // ═══ 5. SUBJECTS ═══
  console.log('📖 Creating subjects...');
  const subRows = [];
  for (const cc of Object.keys(courseMap)) {
    for (const c of courseMap[cc]) {
      for (const sn of c.subs) {
        subRows.push({
          id: mk(), college: cId[cc], course: c.code, department: dId[cc]?.[c.deptCode],
          name: sn, code: `${c.code}-${sn.slice(0,3).toUpperCase()}`,
          semester: 1, color: '#6366f1', credits: 3
        });
      }
    }
  }
  for (let i = 0; i < subRows.length; i += 50) {
    await p.subject.createMany({ data: subRows.slice(i, i + 50) });
  }
  console.log(`✅ ${subRows.length} subjects`);

  console.log('\n' + '═'.repeat(50));
  console.log('🎉 AMRITSAR COLLEGES SEED COMPLETE!');
  console.log('═'.repeat(50));
  console.log(`🏫 Colleges:    ${collegeRows.length}`);
  console.log(`📁 Departments: ${deptRows.length}`);
  console.log(`📚 Courses:     ${courseRows.length}`);
  console.log(`📋 Sections:    ${secRows.length}`);
  console.log(`📖 Subjects:    ${subRows.length}`);
  console.log('═'.repeat(50));

  await p.$disconnect();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
