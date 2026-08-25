import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../utils/userUtils.js';
import { fallbackNoticeSummary } from './ai/fallbacks.js';

const DAY_MS = 86400000;
function daysFromNow(n, hour = 10) {
  const d = new Date(Date.now() + n * DAY_MS);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function atDay(dayOffset, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const DEMO_PASSWORD = 'demo1234';

export async function ensureSeed({ force = false } = {}) {
  if (!force) {
    const count = await prisma.user.count();
    if (count > 0) {
      console.log('[seed] Demo data already present — skipping (use `npm run seed` to force reseed)');
      return { seeded: false };
    }
  }

  if (force) {
    console.log('[seed] Force reseed — clearing existing data...');
    await prisma.application.deleteMany();
    await prisma.recommendationEvent.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.aIPlan.deleteMany();
    await prisma.resume.deleteMany();
    await prisma.message.deleteMany();
    await prisma.userPreference.deleteMany();
    await prisma.facultyProfile.deleteMany();
    await prisma.studentProfile.deleteMany();
    await prisma.timetableSlot.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.notice.deleteMany();
    await prisma.event.deleteMany();
    await prisma.club.deleteMany();
    await prisma.opportunity.deleteMany();
    await prisma.resource.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.department.deleteMany();
    await prisma.user.deleteMany();
    await prisma.college.deleteMany();
  }

  console.log('[seed] Seeding demo data...');
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // ---------------------------------------------------------- College
  const college = await prisma.college.create({
    data: {
      name: 'Indian Institute of Information Technology, Ropar',
      code: 'IIIT-RPR',
      city: 'Rupnagar',
      state: 'Punjab',
      address: 'Nangal Road, Rupnagar, Punjab 140001',
      website: 'https://www.iiit.ac.in',
      contactEmail: 'office@iiitropar.ac.in',
      contactPhone: '+91 1881 227078',
      establishedYear: 2014,
    },
  });

  const deptCS = await prisma.department.create({ data: { college: college.id, name: 'Computer Science', code: 'CS' } });
  const deptAI = await prisma.department.create({ data: { college: college.id, name: 'AI & Data Science', code: 'AI' } });

  // ---------------------------------------------------------- Users
  const admin = await prisma.user.create({
    data: {
      name: 'Dr. Ananya Rao',
      email: 'admin@demo.campusconnect',
      password: passwordHash,
      role: 'admin',
      college: college.id,
      designation: 'College Administrator',
      emailVerified: true,
      onboarded: true,
      approved: true,
    },
  });

  const faculty = await prisma.user.create({
    data: {
      name: 'Prof. Rohan Mehta',
      email: 'faculty@demo.campusconnect',
      password: passwordHash,
      role: 'faculty',
      college: college.id,
      designation: 'Assistant Professor, Computer Science',
      emailVerified: true,
      onboarded: true,
      approved: true,
    },
  });

  const faculty2 = await prisma.user.create({
    data: {
      name: 'Prof. Sneha Iyer',
      email: 'sneha.iyer@iiitropar.ac.in',
      password: passwordHash,
      role: 'faculty',
      college: college.id,
      designation: 'Assistant Professor, AI & Data Science',
      emailVerified: true,
      onboarded: true,
      approved: true,
    },
  });

  const student = await prisma.user.create({
    data: {
      name: 'Aarav Sharma',
      email: 'student@demo.campusconnect',
      password: passwordHash,
      role: 'student',
      college: college.id,
      emailVerified: true,
      onboarded: true,
      lastLoginAt: new Date(),
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'priya.patel@iiitropar.ac.in',
      password: passwordHash,
      role: 'student',
      college: college.id,
      emailVerified: true,
      onboarded: true,
    },
  });

  // ---------------------------------------------------------- Profiles
  await prisma.studentProfile.createMany({
    data: [
      {
        user: student.id,
        college: college.id,
        degree: 'BCA',
        course: 'Computer Science',
        semester: 2,
        year: 1,
        section: 'B',
        enrollmentNumber: 'BCA2025-042',
        bio: '2nd semester BCA student passionate about AI and building products that help students.',
        linkedin: 'https://linkedin.com/in/aaravsharma',
        github: 'https://github.com/aaravsharma',
        skills: [
          { name: 'Python', level: 'Intermediate' },
          { name: 'React', level: 'Intermediate' },
          { name: 'AI', level: 'Beginner' },
          { name: 'JavaScript', level: 'Intermediate' },
          { name: 'SQL', level: 'Beginner' },
          { name: 'C', level: 'Intermediate' },
        ],
        interests: ['AI/ML', 'Web Development', 'Data Science'],
        careerGoal: 'AI Engineer',
        preferredLocation: 'Rupnagar',
        remotePreference: 'remote',
        weeklyLearningHours: 12,
        preferredOpportunityTypes: ['internship', 'hackathon', 'training', 'scholarship'],
        roadmap: [
          { skill: 'Python', status: 'Completed', order: 0 },
          { skill: 'SQL', status: 'Learning', order: 1 },
          { skill: 'Machine Learning', status: 'Learning', order: 2 },
          { skill: 'Deep Learning', status: 'Not Started', order: 3 },
          { skill: 'LLMs / Generative AI', status: 'Not Started', order: 4 },
          { skill: 'Deployment (Docker, APIs)', status: 'Not Started', order: 5 },
          { skill: 'AI Projects', status: 'Learning', order: 6 },
          { skill: 'Hackathons', status: 'Not Started', order: 7 },
          { skill: 'Internships', status: 'Not Started', order: 8 },
        ],
      },
      {
        user: student2.id,
        college: college.id,
        degree: 'BCA',
        course: 'Computer Science',
        semester: 2,
        year: 1,
        section: 'A',
        skills: [{ name: 'Java', level: 'Intermediate' }, { name: 'SQL', level: 'Beginner' }, { name: 'C++', level: 'Beginner' }],
        interests: ['Cybersecurity', 'Web Development'],
        careerGoal: 'Software Engineer',
        remotePreference: 'hybrid',
        weeklyLearningHours: 8,
      },
    ],
  });

  await prisma.userPreference.createMany({
    data: [{ user: student.id }, { user: student2.id }, { user: faculty.id }, { user: admin.id }],
  });

  // Faculty profiles
  await prisma.facultyProfile.createMany({
    data: [
      { user: faculty.id, college: college.id, employeeId: 'EMP-2024-001', department: 'Computer Science', designation: 'Assistant Professor', subjects: ['C Programming', 'DBMS', 'Data Structures'], classes: ['BCA Sem 2 Section A', 'BCA Sem 2 Section B'], bio: 'Teaching computer science for 8 years. Research interest in databases.' },
      { user: faculty2.id, college: college.id, employeeId: 'EMP-2024-002', department: 'AI & Data Science', designation: 'Assistant Professor', subjects: ['Python Programming', 'Web Development', 'Machine Learning'], classes: ['BCA Sem 2 Section A', 'BCA Sem 2 Section B'], bio: 'Passionate about AI/ML education and web technologies.' },
    ],
  });

  // ---------------------------------------------------------- Subjects
  const subjects = [];
  for (const s of [
    { college: college.id, department: deptCS.id, name: 'C Programming', code: 'CS201', semester: 2, faculty: faculty.id, color: '#818cf8' },
    { college: college.id, department: deptCS.id, name: 'DBMS', code: 'CS204', semester: 2, faculty: faculty.id, color: '#34d399' },
    { college: college.id, department: deptCS.id, name: 'Web Development', code: 'CS206', semester: 2, faculty: faculty2.id, color: '#fbbf24' },
    { college: college.id, department: deptCS.id, name: 'Data Structures', code: 'CS203', semester: 2, faculty: faculty.id, color: '#f472b6' },
    { college: college.id, department: deptCS.id, name: 'Mathematics', code: 'MA201', semester: 2, faculty: faculty2.id, color: '#22d3ee' },
    { college: college.id, department: deptAI.id, name: 'Python Programming', code: 'AI201', semester: 2, faculty: faculty2.id, color: '#a78bfa' },
  ]) {
    subjects.push(await prisma.subject.create({ data: s }));
  }
  const [cProg, dbms, webDev, ds, math, python] = subjects;
  const subjectMap = { 'C Programming': cProg, DBMS: dbms, 'Web Development': webDev, 'Data Structures': ds, Mathematics: math, 'Python Programming': python };

  // ---------------------------------------------------------- Timetable (Mon-Sat)
  const tt = [
    { subject: cProg, name: 'C Programming', day: 1, start: '09:00', end: '10:00', room: 'Room 101' },
    { subject: dbms, name: 'DBMS', day: 1, start: '10:00', end: '11:00', room: 'Room 102' },
    { subject: null, name: 'Free Period', day: 1, start: '12:00', end: '13:00', room: '', type: 'free' },
    { subject: webDev, name: 'Web Development', day: 1, start: '14:00', end: '15:30', room: 'Lab 3' },
    { subject: math, name: 'Mathematics', day: 2, start: '09:00', end: '10:00', room: 'Room 105' },
    { subject: ds, name: 'Data Structures', day: 2, start: '11:00', end: '12:00', room: 'Room 103' },
    { subject: python, name: 'Python Programming', day: 2, start: '14:00', end: '15:00', room: 'Lab 1' },
    { subject: dbms, name: 'DBMS', day: 3, start: '09:00', end: '10:00', room: 'Room 102' },
    { subject: cProg, name: 'C Programming', day: 3, start: '10:00', end: '11:00', room: 'Room 101' },
    { subject: webDev, name: 'Web Development Lab', day: 3, start: '14:00', end: '16:00', room: 'Lab 3', type: 'lab' },
    { subject: ds, name: 'Data Structures', day: 4, start: '09:00', end: '10:00', room: 'Room 103' },
    { subject: math, name: 'Mathematics', day: 4, start: '11:00', end: '12:00', room: 'Room 105' },
    { subject: null, name: 'Free Period', day: 4, start: '14:00', end: '15:00', room: '', type: 'free' },
    { subject: python, name: 'Python Programming', day: 5, start: '09:00', end: '10:00', room: 'Lab 1' },
    { subject: dbms, name: 'DBMS', day: 5, start: '10:00', end: '11:00', room: 'Room 102' },
    { subject: cProg, name: 'C Programming Lab', day: 5, start: '14:00', end: '16:00', room: 'Lab 2', type: 'lab' },
    { subject: webDev, name: 'Web Development Workshop', day: 6, start: '10:00', end: '12:00', room: 'Seminar Hall', type: 'other' },
  ];
  await prisma.timetableSlot.createMany({
    data: tt.map((s) => ({
      student: student.id,
      college: college.id,
      subject: s.subject?.id,
      subjectName: s.name,
      teacherName: s.subject?.name === 'Web Development' || s.subject?.name === 'Web Development Lab' || s.subject?.name === 'Web Development Workshop' ? 'Prof. Sneha Iyer' : s.subject?.name === 'Python Programming' ? 'Prof. Sneha Iyer' : 'Prof. Rohan Mehta',
      room: s.room,
      day: s.day,
      startTime: s.start,
      endTime: s.end,
      color: s.subject?.color || '#64748b',
      type: s.type || 'class',
    })),
  });

  // ---------------------------------------------------------- Attendance (last ~5 weeks)
  const attendancePlan = {
    'C Programming': { total: 22, absentDays: [2, 9, 16] },
    DBMS: { total: 24, absentDays: [1, 3, 8, 12, 18, 23] },
    'Web Development': { total: 20, absentDays: [5, 15] },
    'Data Structures': { total: 20, absentDays: [4, 10, 14, 20] },
    Mathematics: { total: 18, absentDays: [2, 6, 9, 13, 17, 21] },
    'Python Programming': { total: 20, absentDays: [7, 11] },
  };
  const scheduleDays = { 1: ['C Programming', 'DBMS', 'Web Development'], 2: ['Mathematics', 'Data Structures', 'Python Programming'], 3: ['DBMS', 'C Programming', 'Web Development'], 4: ['Data Structures', 'Mathematics'], 5: ['Python Programming', 'DBMS', 'C Programming'], 6: ['Web Development'] };
  const attendanceRecords = [];
  for (let offset = 34; offset >= 0; offset--) {
    const d = atDay(-offset);
    const dow = d.getDay();
    const subs = scheduleDays[dow] || [];
    for (const sub of subs) {
      const plan = attendancePlan[sub];
      if (!plan) continue;
      const seq = attendanceRecords.filter((r) => r.subjectName === sub).length + 1;
      const absent = plan.absentDays.includes(seq);
      attendanceRecords.push({ student: student.id, subjectName: sub, date: d, status: absent ? 'absent' : 'present', subject: subjectMap[sub].id });
    }
  }
  await prisma.attendance.createMany({ data: attendanceRecords });

  // ---------------------------------------------------------- Assignments
  await prisma.assignment.createMany({
    data: [
      { college: college.id, subject: dbms.id, subjectName: 'DBMS', faculty: faculty.id, semester: 2, title: 'ER Diagram & Normalization Assignment', description: 'Design an ER diagram for a library management system and normalize it up to 3NF.', type: 'assignment', dueDate: daysFromNow(1), priority: 'high', maxMarks: 50 },
      { college: college.id, subject: cProg.id, subjectName: 'C Programming', faculty: faculty.id, semester: 2, title: 'Data Structures in C: Linked List Implementation', description: 'Implement singly and doubly linked lists with insertion, deletion and reversal.', type: 'assignment', dueDate: daysFromNow(4), priority: 'medium', maxMarks: 100 },
      { college: college.id, subject: webDev.id, subjectName: 'Web Development', faculty: faculty2.id, semester: 2, title: 'Personal Portfolio Website', description: 'Build a responsive portfolio with HTML, CSS and React. Deploy it and share the link.', type: 'project', dueDate: daysFromNow(7), priority: 'medium', maxMarks: 100 },
      { college: college.id, subject: python.id, subjectName: 'Python Programming', faculty: faculty2.id, semester: 2, title: 'Python: Attendance Analyzer Script', description: 'Write a Python script that reads attendance data and reports percentage and trends.', type: 'assignment', dueDate: daysFromNow(9), priority: 'low', maxMarks: 50 },
    ],
  });

  // ---------------------------------------------------------- Tasks
  await prisma.task.createMany({
    data: [
      { user: student.id, title: 'Complete DBMS ER Diagram', description: 'Finish ER diagram for library system', subject: 'DBMS', category: 'assignment', dueDate: daysFromNow(1), priority: 'high', status: 'todo' },
      { user: student.id, title: 'Revise C pointers', description: 'Practice pointer exercises from Chapter 4', subject: 'C Programming', category: 'study', dueDate: daysFromNow(2), priority: 'medium', status: 'todo' },
      { user: student.id, title: 'Start AI hackathon application', description: 'Research team and write project idea', subject: '', category: 'career', dueDate: daysFromNow(2), priority: 'high', status: 'todo' },
      { user: student.id, title: 'Python practice: pandas basics', description: 'Complete 5 pandas exercises', subject: 'Python Programming', category: 'study', dueDate: daysFromNow(3), priority: 'medium', status: 'todo' },
      { user: student.id, title: 'Update LinkedIn profile', description: 'Add semester 2 skills and projects', subject: '', category: 'career', dueDate: daysFromNow(5), priority: 'low', status: 'todo' },
      { user: student.id, title: 'Math problem set 3', description: 'Problems 1-10 from unit 3', subject: 'Mathematics', category: 'study', dueDate: daysFromNow(-1), priority: 'medium', status: 'done', completedAt: new Date(Date.now() - 2 * DAY_MS) },
      { user: student.id, title: 'Watch DBMS normalization video', description: '3NF and BCNF examples', subject: 'DBMS', category: 'study', dueDate: daysFromNow(-2), priority: 'low', status: 'done', completedAt: new Date(Date.now() - 3 * DAY_MS) },
    ],
  });

  // ---------------------------------------------------------- Exams
  await prisma.exam.createMany({
    data: [
      { college: college.id, subject: cProg.id, subjectName: 'C Programming', semester: 2, title: 'C Programming Unit Test 2', date: daysFromNow(5), startTime: '10:00', endTime: '12:00', room: 'Hall B', maxMarks: 50, type: 'quiz' },
      { college: college.id, subject: dbms.id, subjectName: 'DBMS', semester: 2, title: 'DBMS Mid-Semester Exam', date: daysFromNow(12), startTime: '10:00', endTime: '13:00', room: 'Hall A', maxMarks: 100, type: 'midterm' },
      { college: college.id, subject: math.id, subjectName: 'Mathematics', semester: 2, title: 'Mathematics Mid-Semester Exam', date: daysFromNow(15), startTime: '14:00', endTime: '17:00', room: 'Hall C', maxMarks: 100, type: 'midterm' },
    ],
  });

  // ---------------------------------------------------------- Notices
  const examNoticeContent = 'Mid-semester examinations begin on 15 September.\n\nDBMS — 15 September, 10 AM, Hall A.\nMathematics — 18 September, 2 PM, Hall C.\n\nStudents must fill the examination form before 5 September. Forms are available in the examination cell. Late submission will attract a penalty fee of ₹500.\n\nContact the examination cell for any queries.';
  const examNotice = await prisma.notice.create({
    data: {
      college: college.id,
      title: 'Important: Mid-Semester Examination Schedule',
      content: examNoticeContent,
      category: 'exam',
      important: true,
      date: daysFromNow(-1),
      createdBy: admin.id,
      aiSummary: { ...fallbackNoticeSummary('Important: Mid-Semester Examination Schedule', examNoticeContent), generatedAt: new Date() },
    },
  });

  await prisma.notice.createMany({
    data: [
      { college: college.id, title: 'TechFest 2026 Registrations Open', content: 'IIIT Ropar TechFest 2026 registrations are now open. Workshops, hackathons, and coding competitions across 3 days. Register on the student portal before 20 September.', category: 'event', important: false, date: daysFromNow(-2), createdBy: admin.id },
      { college: college.id, title: 'Library Timings Extended During Exams', content: 'The central library will remain open until 10 PM from 1 September to 20 September for exam preparation. No books will be issued during this period.', category: 'general', important: false, date: daysFromNow(-3), createdBy: admin.id },
      { college: college.id, title: 'Placement Drive: Infosys & TCS Campus Visit', content: 'Campus placements for final-year students begin in October. Pre-placement talks and mock interviews will be conducted by the placement cell. Register your interest in the placement office.', category: 'placement', important: true, date: daysFromNow(-4), createdBy: admin.id },
      { college: college.id, title: 'Holiday: Independence Day', content: 'The college will remain closed on 15 August on account of Independence Day. Classes resume on 16 August.', category: 'holiday', important: false, date: daysFromNow(-6), createdBy: admin.id },
    ],
  });

  // ---------------------------------------------------------- Events
  await prisma.event.createMany({
    data: [
      { college: college.id, title: 'AI & ML Workshop', description: 'Hands-on workshop covering machine learning fundamentals with Python. Bring your laptops!', category: 'workshop', date: daysFromNow(6), startTime: '10:00', endTime: '16:00', location: 'Seminar Hall', organizer: 'AI/ML Club', registrationLink: 'https://forms.gle/demo', createdBy: faculty2.id },
      { college: college.id, title: 'IIIT Ropar Hackathon 2026', description: '24-hour hackathon. Build something that solves a real campus problem. Prizes worth ₹50,000.', category: 'hackathon', date: daysFromNow(10), startTime: '09:00', endTime: '09:00', location: 'Main Auditorium', organizer: 'Coding Club', createdBy: faculty.id },
      { college: college.id, title: 'Industry Talk: Careers in Data Science', description: 'Guest lecture by alumni working at a top analytics firm. Networking session after.', category: 'talk', date: daysFromNow(8), startTime: '15:00', endTime: '17:00', location: 'Lecture Hall 2', organizer: 'Placement Cell', createdBy: admin.id },
      { college: college.id, title: 'Cultural Fest: IIIT Ropar Utsav', description: 'Music, dance, drama and art competitions across the campus.', category: 'fest', date: daysFromNow(14), startTime: '10:00', endTime: '18:00', location: 'Open Air Theatre', organizer: 'Cultural Committee', createdBy: admin.id },
    ],
  });

  // ---------------------------------------------------------- Clubs
  const codingClub = await prisma.club.create({
    data: {
      college: college.id,
      name: 'Coding Club',
      description: 'Competitive programming, DSA practice and hackathon teams.',
      category: 'technical',
      facultyAdvisor: 'Prof. Rohan Mehta',
      members: [student.id, student2.id],
      followers: [student.id],
      announcements: [{ title: 'DSA Practice Hour', content: 'Join us every Friday at 5 PM in Lab 2.', date: daysFromNow(-2) }],
    },
  });
  await prisma.club.createMany({
    data: [
      { college: college.id, name: 'AI/ML Club', description: 'Learn machine learning, deep learning and build AI projects.', category: 'technical', facultyAdvisor: 'Prof. Sneha Iyer', members: [student.id], followers: [student.id], announcements: [{ title: 'ML Basics Workshop', content: 'This Saturday, 10 AM, Seminar Hall.', date: daysFromNow(-1) }] },
      { college: college.id, name: 'Robotics Club', description: 'Build robots and compete in national robotics competitions.', category: 'technical', facultyAdvisor: 'Prof. Rohan Mehta', announcements: [{ title: 'RoboWar entries open', content: 'Register your team for the inter-college RoboWar.', date: daysFromNow(-3) }] },
      { college: college.id, name: 'Photography Club', description: 'Campus photography, editing workshops and photo walks.', category: 'cultural' },
      { college: college.id, name: 'Debate & Literary Society', description: 'Debates, MUNs, poetry and creative writing.', category: 'cultural' },
      { college: college.id, name: 'Music Society', description: 'Band practice, open mics and music production.', category: 'cultural' },
    ],
  });

  // ---------------------------------------------------------- Opportunities
  // NOTE: Dummy opportunities removed. Real opportunities are fetched by the
  // connector system (IITs, NITs, IIITs, platforms, government portals).
  // Admin can manually create opportunities via POST /api/opportunities.
  const opportunityRows = [];
  // Create a few sample opportunities for demo only (not dummy — linked to real sources)
  const sampleOpps = [
    {
      title: 'Google Summer of Code 2026', organization: 'Google', category: 'internship', status: 'verified',
      description: 'Google Summer of Code is a global program that pays students to contribute to open-source software. Work with mentors from top open-source organizations.',
      skillsRequired: ['Git', 'Programming', 'Open Source'],
      eligibility: 'Open to all students enrolled in or accepted to an accredited institution. 18+ years.',
      mode: 'remote', location: 'Remote (Global)', stipend: '$3,000 USD stipend', prize: '', deadline: daysFromNow(45), applyLink: 'https://summerofcode.withgoogle.com/',
      sourceUrl: 'https://summerofcode.withgoogle.com/',
      applyUrl: 'https://summerofcode.withgoogle.com/',
      requirements: ['Google account', 'Project proposal'], applicationProcess: 'Submit project proposal on the GSoC portal.',
      tags: ['google', 'open-source', 'internship'], experienceLevel: 'fresher', verifiedBy: admin.id, createdBy: admin.id,
    },
    {
      title: 'Smart India Hackathon 2026', organization: 'AICTE / Government of India', category: 'hackathon', status: 'verified',
      description: 'National-level hackathon organized by the Government of India. Build solutions for real government and industry problem statements.',
      skillsRequired: ['Programming', 'Problem Solving'],
      eligibility: 'Students enrolled in recognized Indian institutions.',
      mode: 'onsite', location: 'Various Cities, India', stipend: '', prize: '₹1,00,000+ per team', deadline: daysFromNow(60), applyLink: 'https://www.sih.gov.in/',
      sourceUrl: 'https://www.sih.gov.in/',
      applyUrl: 'https://www.sih.gov.in/',
      requirements: ['Team of 5-6 members', 'Valid college ID'], applicationProcess: 'Register on SIH portal, select problem statement, qualify rounds.',
      tags: ['government', 'hackathon', 'india'], experienceLevel: 'fresher', verifiedBy: admin.id, createdBy: admin.id,
    },
    {
      title: 'AICTE PM Scholarship Scheme', organization: 'AICTE / Government of India', category: 'scholarship', status: 'verified',
      description: 'Scholarship for students of technical courses (B.Tech, BCA, etc.) from AICTE-approved institutions. Covers tuition and hostel fees.',
      skillsRequired: [],
      eligibility: 'Students enrolled in AICTE-approved institutions. Income criteria apply.',
      mode: 'remote', location: 'India', stipend: 'Up to ₹50,000/year', prize: '', deadline: daysFromNow(90), applyLink: 'https://scholarships.gov.in/',
      sourceUrl: 'https://scholarships.gov.in/',
      applyUrl: 'https://scholarships.gov.in/',
      requirements: ['Aadhaar card', 'Income certificate', 'Marksheets'], applicationProcess: 'Apply on National Scholarship Portal.',
      tags: ['government', 'scholarship', 'india'], experienceLevel: 'any', verifiedBy: admin.id, createdBy: admin.id,
    },
  ];
  const opportunities = [];
  for (const row of sampleOpps) {
    opportunities.push(await prisma.opportunity.create({ data: row }));
  }

  // ---------------------------------------------------------- Applications
  if (opportunities.length > 0) {
    await prisma.application.createMany({
      data: [
        {
          student: student.id,
          opportunity: opportunities[0].id,
          status: 'applied',
          appliedDate: new Date(),
          notes: 'Applied via Google Summer of Code portal.',
          timeline: [{ status: 'applied' }],
        },
        {
          student: student.id,
          opportunity: opportunities[1].id,
          status: 'saved',
          timeline: [{ status: 'saved' }],
        },
      ],
    });
  }

  // ---------------------------------------------------------- Notifications
  const notifs = [
    { user: student.id, category: 'academic', title: '⏰ DBMS assignment due tomorrow', message: '"ER Diagram & Normalization Assignment" is due tomorrow.', link: '/assignments', icon: 'alarm-clock', priority: 'high', read: false },
    { user: student.id, category: 'attendance', title: '⚠️ Mathematics attendance at 67%', message: 'Attend the next 5 classes to reach your 75% target.', link: '/attendance', icon: 'percent', priority: 'high', read: false },
    { user: student.id, category: 'college', title: '📢 Important: Mid-Semester Examination Schedule', message: 'Mid-semester examinations begin 15 September. Form deadline: 5 September.', link: '/college', icon: 'megaphone', priority: 'high', read: false },
    { user: student.id, category: 'ai', title: '🧠 Your AI Daily Plan is ready', message: "Open the AI Daily Planner to see today's focus.", link: '/ai/planner', icon: 'sparkles', priority: 'medium', read: false },
    { user: student.id, category: 'system', title: 'Welcome to CAMPUSCONNECT, Aarav! 👋', message: 'Your AI-powered campus is ready. IIIT Ropar.', link: '/dashboard', icon: 'sparkles', priority: 'low', read: true },
  ];
  if (opportunities.length > 0) {
    notifs.push({ user: student.id, category: 'opportunity', title: '🎯 New opportunities available!', message: 'Fresh opportunities from IITs, Google, and government portals are now live.', link: '/opportunities', icon: 'target', priority: 'high', read: false });
  }
  await prisma.notification.createMany({ data: notifs });

  console.log('[seed] ✅ Demo data seeded');
  console.log('   ─────────────────────────────────────────────');
  console.log('   🎓 Student : student@demo.campusconnect / demo1234');
  console.log('   👨‍🏫 Faculty : faculty@demo.campusconnect / demo1234');
  console.log('   🛡️  Admin  : admin@demo.campusconnect / demo1234');
  console.log('   ─────────────────────────────────────────────');
  return { seeded: true };
}

export async function reseed() {
  await ensureSeed({ force: true });
}

/**
 * Ensure real sample opportunities exist in the database.
 * Called on every server start — only inserts if they don't already exist.
 * These are NOT dummy data — they link to real application portals.
 */
export async function ensureSampleOpportunities() {
  const samples = [
    {
      title: 'Google Summer of Code 2026',
      organization: 'Google',
      category: 'internship',
      status: 'verified',
      description: 'Google Summer of Code is a global program that pays students to contribute to open-source software. Work with mentors from top open-source organizations.',
      skillsRequired: ['Git', 'Programming', 'Open Source'],
      eligibility: 'Open to all students enrolled in or accepted to an accredited institution. 18+ years.',
      mode: 'remote', location: 'Remote (Global)',
      stipend: '$3,000 USD stipend', prize: '',
      deadline: daysFromNow(45),
      applyLink: 'https://summerofcode.withgoogle.com/',
      sourceUrl: 'https://summerofcode.withgoogle.com/',
      applyUrl: 'https://summerofcode.withgoogle.com/',
      requirements: ['Google account', 'Project proposal'],
      applicationProcess: 'Submit project proposal on the GSoC portal.',
      tags: ['google', 'open-source', 'internship'],
      experienceLevel: 'fresher',
    },
    {
      title: 'Smart India Hackathon 2026',
      organization: 'AICTE / Government of India',
      category: 'hackathon',
      status: 'verified',
      description: 'National-level hackathon organized by the Government of India. Build solutions for real government and industry problem statements.',
      skillsRequired: ['Programming', 'Problem Solving'],
      eligibility: 'Students enrolled in recognized Indian institutions.',
      mode: 'onsite', location: 'Various Cities, India',
      stipend: '', prize: '₹1,00,000+ per team',
      deadline: daysFromNow(60),
      applyLink: 'https://www.sih.gov.in/',
      sourceUrl: 'https://www.sih.gov.in/',
      applyUrl: 'https://www.sih.gov.in/',
      requirements: ['Team of 5-6 members', 'Valid college ID'],
      applicationProcess: 'Register on SIH portal, select problem statement, qualify rounds.',
      tags: ['government', 'hackathon', 'india'],
      experienceLevel: 'fresher',
    },
    {
      title: 'AICTE PM Scholarship Scheme',
      organization: 'AICTE / Government of India',
      category: 'scholarship',
      status: 'verified',
      description: 'Scholarship for students of technical courses (B.Tech, BCA, etc.) from AICTE-approved institutions. Covers tuition and hostel fees.',
      skillsRequired: [],
      eligibility: 'Students enrolled in AICTE-approved institutions. Income criteria apply.',
      mode: 'remote', location: 'India',
      stipend: 'Up to ₹50,000/year', prize: '',
      deadline: daysFromNow(90),
      applyLink: 'https://scholarships.gov.in/',
      sourceUrl: 'https://scholarships.gov.in/',
      applyUrl: 'https://scholarships.gov.in/',
      requirements: ['Aadhaar card', 'Income certificate', 'Marksheets'],
      applicationProcess: 'Apply on National Scholarship Portal.',
      tags: ['government', 'scholarship', 'india'],
      experienceLevel: 'any',
    },
    {
      title: 'NVIDIA AI Campus Challenge',
      organization: 'NVIDIA',
      category: 'competition',
      status: 'verified',
      description: 'Build AI/ML solutions using NVIDIA GPUs. Teams of 2-4 students. Top teams get NVIDIA hardware and internship interviews.',
      skillsRequired: ['Python', 'Machine Learning', 'Deep Learning'],
      eligibility: 'Undergraduate and graduate students.',
      mode: 'remote', location: 'Online (Global)',
      stipend: '', prize: 'NVIDIA GPUs + Internship interviews',
      deadline: daysFromNow(30),
      applyLink: 'https://www.nvidia.com/en-us/ai/',
      sourceUrl: 'https://www.nvidia.com/en-us/ai/',
      applyUrl: 'https://www.nvidia.com/en-us/ai/',
      requirements: ['Team of 2-4', 'NVIDIA Developer account'],
      applicationProcess: 'Register on NVIDIA Developer portal.',
      tags: ['nvidia', 'ai', 'competition'],
      experienceLevel: 'fresher',
    },
    {
      title: 'Amazon Web Services Educate',
      organization: 'Amazon Web Services',
      category: 'training',
      status: 'verified',
      description: 'Free cloud computing credits and training for students. Learn AWS services, build projects, earn certificates.',
      skillsRequired: [],
      eligibility: 'All students with .edu email.',
      mode: 'remote', location: 'Online',
      stipend: '$100 AWS credits', prize: '',
      deadline: daysFromNow(120),
      applyLink: 'https://aws.amazon.com/education/awseducate/',
      sourceUrl: 'https://aws.amazon.com/education/awseducate/',
      applyUrl: 'https://aws.amazon.com/education/awseducate/',
      requirements: ['.edu email'],
      applicationProcess: 'Sign up with your .edu email on AWS Educate.',
      tags: ['aws', 'cloud', 'training', 'free'],
      experienceLevel: 'any',
    },
  ];

  let inserted = 0;
  for (const sample of samples) {
    const existing = await prisma.opportunity.findFirst({
      where: { title: sample.title, organization: sample.organization },
    });
    if (!existing) {
      await prisma.opportunity.create({ data: sample });
      inserted++;
    }
  }
  if (inserted > 0) console.log(`[seed] ✅ Inserted ${inserted} sample opportunities with real apply URLs`);
}
