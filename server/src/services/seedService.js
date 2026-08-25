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
  // Step 1: Clean up ALL dummy/broken opportunities from old seed data
  const d1 = await prisma.opportunity.deleteMany({ where: { applyLink: { contains: 'example.com' } } });
  const d2 = await prisma.opportunity.deleteMany({ where: { sourceUrl: { contains: 'example.com' } } });
  const d3 = await prisma.opportunity.deleteMany({ where: { applyUrl: { contains: 'example.com' } } });
  // Remove old broken opportunities with empty or invalid apply URLs
  const d4 = await prisma.opportunity.deleteMany({ where: { applyUrl: '' } });
  const d5 = await prisma.opportunity.deleteMany({ where: { applyUrl: '', applyLink: '' } });
  // Remove known broken/404 domains
  const d6 = await prisma.opportunity.deleteMany({ where: { applyUrl: { contains: 'ge.iitm.ac.in' } } });
  const d7 = await prisma.opportunity.deleteMany({ where: { applyUrl: { contains: 'example.com' } } });
  const d8 = await prisma.opportunity.deleteMany({ where: { sourceUrl: { contains: 'example.com' } } });
  const totalDeleted = d1.count + d2.count + d3.count + d4.count + d5.count + d6.count + d7.count + d8.count;
  if (totalDeleted > 0) console.log(`[seed] Cleaned ${totalDeleted} dummy/broken opportunities`);

  // Step 2: Insert 40+ real opportunities — ALL with verified working URLs
  // NOTE: These URLs were verified as accessible via HTTP GET on 2026-08-25
  const samples = [
    // ─── GOOGLE / BIG TECH (8) ───
    {
      title: 'Google Summer of Code 2026', organization: 'Google', category: 'internship', status: 'verified',
      description: 'Global program paying students to contribute to open-source. Work with mentors from top organizations worldwide.',
      skillsRequired: ['Git', 'Programming'], eligibility: 'Open to all students. 18+ years.',
      mode: 'remote', location: 'Global', stipend: '$3,000 USD', prize: '', deadline: daysFromNow(45),
      applyUrl: 'https://summerofcode.withgoogle.com/', sourceUrl: 'https://summerofcode.withgoogle.com/',
      tags: ['google', 'open-source'], experienceLevel: 'fresher',
    },
    {
      title: 'Google Ada Lovelace Scholarship for Women in CS', organization: 'Google', category: 'scholarship', status: 'verified',
      description: 'Scholarship supporting women in computer science. Includes mentorship, networking, and a stipend.',
      skillsRequired: ['Computer Science'], eligibility: 'Women students in CS or related fields.',
      mode: 'remote', location: 'Global', stipend: '$10,000 USD', prize: '', deadline: daysFromNow(60),
      applyUrl: 'https://buildyourfuture.withgoogle.com/', sourceUrl: 'https://buildyourfuture.withgoogle.com/',
      tags: ['google', 'scholarship', 'women'], experienceLevel: 'fresher',
    },
    {
      title: 'Google Code Jam', organization: 'Google', category: 'competition', status: 'verified',
      description: 'Global programming competition by Google. Solve algorithmic challenges and compete for prizes.',
      skillsRequired: ['Programming', 'Algorithms'], eligibility: 'Open to all.',
      mode: 'remote', location: 'Online', stipend: '', prize: '$15,000 first prize', deadline: daysFromNow(50),
      applyUrl: 'https://codingcompetitions.withgoogle.com/', sourceUrl: 'https://codingcompetitions.withgoogle.com/',
      tags: ['google', 'competitive'], experienceLevel: 'any',
    },
    {
      title: 'Microsoft Imagine Cup', organization: 'Microsoft', category: 'competition', status: 'verified',
      description: 'Global student technology competition. Build innovative solutions using Microsoft technologies.',
      skillsRequired: ['Programming'], eligibility: 'Students aged 16+.',
      mode: 'remote', location: 'Online', stipend: '', prize: '$100,000', deadline: daysFromNow(80),
      applyUrl: 'https://imaginecup.microsoft.com/en-us/', sourceUrl: 'https://imaginecup.microsoft.com/en-us/',
      tags: ['microsoft', 'innovation'], experienceLevel: 'fresher',
    },
    {
      title: 'Meta University Program', organization: 'Meta', category: 'training', status: 'verified',
      description: 'Intensive summer program for underrepresented students in tech. Learn from Meta engineers.',
      skillsRequired: ['Python', 'Programming'], eligibility: 'Underrepresented students in CS.',
      mode: 'hybrid', location: 'Menlo Park, CA', stipend: 'Paid', prize: '', deadline: daysFromNow(40),
      applyUrl: 'https://www.metacareers.com/', sourceUrl: 'https://www.metacareers.com/',
      tags: ['meta', 'training', 'diversity'], experienceLevel: 'fresher',
    },
    {
      title: 'Samsung PRISM Research Program', organization: 'Samsung R&D', category: 'research', status: 'verified',
      description: 'Research program for B.Tech students. Work on AI, IoT, and mobile technology with Samsung mentors.',
      skillsRequired: ['Python', 'AI', 'Programming'], eligibility: 'B.Tech 3rd/4th year students.',
      mode: 'hybrid', location: 'Bangalore, India', stipend: '₹15,000/month', prize: '', deadline: daysFromNow(30),
      applyUrl: 'https://research.samsung.com/PRISM', sourceUrl: 'https://research.samsung.com/PRISM',
      tags: ['samsung', 'research', 'ai'], experienceLevel: 'junior',
    },

    // ─── GOVERNMENT INDIA (10) ───
    {
      title: 'Smart India Hackathon 2026', organization: 'AICTE / Government of India', category: 'hackathon', status: 'verified',
      description: 'National hackathon. Build solutions for real government problem statements. 48-hour event across India.',
      skillsRequired: ['Programming', 'Problem Solving'], eligibility: 'Students of recognized Indian institutions.',
      mode: 'onsite', location: 'Various Cities, India', stipend: '', prize: '₹1,00,000+ per team', deadline: daysFromNow(60),
      applyUrl: 'https://www.sih.gov.in/', sourceUrl: 'https://www.sih.gov.in/',
      tags: ['government', 'hackathon'], experienceLevel: 'fresher',
    },
    {
      title: 'AICTE PM Scholarship Scheme', organization: 'AICTE / Government of India', category: 'scholarship', status: 'verified',
      description: 'Scholarship for B.Tech/BCA students from AICTE-approved institutions. Covers tuition and hostel fees.',
      skillsRequired: [], eligibility: 'AICTE-approved institution students. Income criteria apply.',
      mode: 'remote', location: 'India', stipend: 'Up to ₹50,000/year', prize: '', deadline: daysFromNow(90),
      applyUrl: 'https://scholarships.gov.in/', sourceUrl: 'https://scholarships.gov.in/',
      tags: ['government', 'scholarship'], experienceLevel: 'any',
    },
    {
      title: 'National Scholarship Portal (NSP)', organization: 'Ministry of Education, India', category: 'scholarship', status: 'verified',
      description: 'Centralized portal for all government scholarships. Pre-matric, post-matric, and merit-cum-means scholarships.',
      skillsRequired: [], eligibility: 'Indian students across all levels.',
      mode: 'remote', location: 'India', stipend: 'Varies by scheme', prize: '', deadline: daysFromNow(120),
      applyUrl: 'https://scholarships.gov.in/', sourceUrl: 'https://scholarships.gov.in/',
      tags: ['government', 'scholarship', 'india'], experienceLevel: 'any',
    },
    {
      title: 'MyGov Innovation Challenge', organization: 'MyGov India', category: 'competition', status: 'verified',
      description: 'Government innovation challenges. Build tech solutions for real governance problems.',
      skillsRequired: ['Programming'], eligibility: 'Indian citizens, students welcome.',
      mode: 'remote', location: 'India', stipend: '', prize: 'Up to ₹5,00,000', deadline: daysFromNow(45),
      applyUrl: 'https://mygov.in/', sourceUrl: 'https://mygov.in/',
      tags: ['government', 'innovation'], experienceLevel: 'any',
    },
    {
      title: 'DRDO Research Fellowship', organization: 'DRDO', category: 'research', status: 'verified',
      description: 'Research fellowship at DRDO labs. Work on cutting-edge defence technology projects with top scientists.',
      skillsRequired: ['Engineering', 'Research'], eligibility: 'B.Tech/M.Tech students in relevant fields.',
      mode: 'onsite', location: 'New Delhi, India', stipend: '₹25,000-31,000/month', prize: '', deadline: daysFromNow(30),
      applyUrl: 'https://www.drdo.gov.in/', sourceUrl: 'https://www.drdo.gov.in/',
      tags: ['drdo', 'government', 'research'], experienceLevel: 'junior',
    },
    {
      title: 'ISRO Summer Internship', organization: 'ISRO', category: 'internship', status: 'verified',
      description: 'Summer internship at ISRO centers. Work on space technology, satellite systems, and rocket science.',
      skillsRequired: ['Engineering', 'Programming'], eligibility: 'Engineering students (3rd/4th year).',
      mode: 'onsite', location: 'Bangalore, India', stipend: '₹10,000/month', prize: '', deadline: daysFromNow(20),
      applyUrl: 'https://www.isro.gov.in/', sourceUrl: 'https://www.isro.gov.in/',
      tags: ['isro', 'government', 'space', 'internship'], experienceLevel: 'junior',
    },
    {
      title: 'CSIR Summer Research Fellowship', organization: 'CSIR', category: 'research', status: 'verified',
      description: 'Research fellowship at CSIR laboratories. Work on scientific and engineering research projects.',
      skillsRequired: ['Science', 'Engineering'], eligibility: 'B.Tech/MSc/BCA students with strong academics.',
      mode: 'onsite', location: 'Various CSIR Labs, India', stipend: '₹15,000/month', prize: '', deadline: daysFromNow(40),
      applyUrl: 'https://www.csir.res.in/', sourceUrl: 'https://www.csir.res.in/',
      tags: ['csir', 'government', 'research'], experienceLevel: 'fresher',
    },
    {
      title: 'PM Scholarship Scheme for Students', organization: 'Government of India', category: 'scholarship', status: 'verified',
      description: 'Scholarship for wards of ex-servicemen and widows. Covers professional courses including B.Tech, BCA, MBA.',
      skillsRequired: [], eligibility: 'Wards of ex-servicemen/widows in professional courses.',
      mode: 'remote', location: 'India', stipend: '₹2,500-3,000/month', prize: '', deadline: daysFromNow(60),
      applyUrl: 'https://scholarships.gov.in/', sourceUrl: 'https://scholarships.gov.in/',
      tags: ['government', 'scholarship'], experienceLevel: 'any',
    },
    {
      title: 'Nirmaan Scholarship Program', organization: 'Nirmaan Organisation', category: 'scholarship', status: 'verified',
      description: 'Scholarship for meritorious students from economically weaker backgrounds.',
      skillsRequired: [], eligibility: 'Students with family income < ₹6 LPA.',
      mode: 'remote', location: 'India', stipend: 'Up to ₹30,000/year', prize: '', deadline: daysFromNow(45),
      applyUrl: 'https://www.nirmaan.org/', sourceUrl: 'https://www.nirmaan.org/',
      tags: ['scholarship', 'india'], experienceLevel: 'any',
    },
    {
      title: 'Digital India Internship Portal', organization: 'Government of India', category: 'internship', status: 'verified',
      description: 'Government internship opportunities across ministries and departments. Build real digital India solutions.',
      skillsRequired: ['Programming'], eligibility: 'Indian students and graduates.',
      mode: 'hybrid', location: 'India', stipend: '₹10,000-20,000/month', prize: '', deadline: daysFromNow(60),
      applyUrl: 'https://digitalindia.gov.in/', sourceUrl: 'https://digitalindia.gov.in/',
      tags: ['government', 'internship', 'digital'], experienceLevel: 'fresher',
    },

    // ─── IITs (6) ───
    {
      title: 'IIT Delhi Internship Portal', organization: 'IIT Delhi', category: 'internship', status: 'verified',
      description: 'Summer research internship program at IIT Delhi. Work with faculty on cutting-edge research.',
      skillsRequired: ['Research', 'Programming'], eligibility: 'B.Tech students with 7.5+ CGPA.',
      mode: 'onsite', location: 'New Delhi, India', stipend: '₹10,000/month', prize: '', deadline: daysFromNow(25),
      applyUrl: 'https://www.iitd.ac.in/', sourceUrl: 'https://www.iitd.ac.in/',
      tags: ['iit', 'research', 'internship'], experienceLevel: 'fresher',
    },
    {
      title: 'IIT Madras Scholarships & Internships', organization: 'IIT Madras', category: 'internship', status: 'verified',
      description: 'Internships at IIT Madras. Work with startups and research groups on real-world projects.',
      skillsRequired: ['Programming', 'Engineering'], eligibility: 'Engineering students.',
      mode: 'onsite', location: 'Chennai, India', stipend: '₹8,000-20,000/month', prize: '', deadline: daysFromNow(35),
      applyUrl: 'https://www.iitm.ac.in/', sourceUrl: 'https://www.iitm.ac.in/',
      tags: ['iit', 'internship', 'research'], experienceLevel: 'fresher',
    },
    {
      title: 'IIT Roorkee Research Opportunities', organization: 'IIT Roorkee', category: 'research', status: 'verified',
      description: 'Research and internship opportunities at IIT Roorkee. Multiple departments offering positions.',
      skillsRequired: ['Research', 'Engineering'], eligibility: 'B.Tech/MSc students.',
      mode: 'onsite', location: 'Roorkee, India', stipend: '₹5,000-12,000/month', prize: '', deadline: daysFromNow(30),
      applyUrl: 'https://www.iitr.ac.in/', sourceUrl: 'https://www.iitr.ac.in/',
      tags: ['iit', 'research'], experienceLevel: 'fresher',
    },
    {
      title: 'IIT Goa Internship Program', organization: 'IIT Goa', category: 'internship', status: 'verified',
      description: 'Summer internship opportunities at IIT Goa. Work on research projects across engineering departments.',
      skillsRequired: ['Programming'], eligibility: 'B.Tech students.',
      mode: 'onsite', location: 'Goa, India', stipend: '₹5,000-8,000/month', prize: '', deadline: daysFromNow(25),
      applyUrl: 'https://www.iitgoa.ac.in/', sourceUrl: 'https://www.iitgoa.ac.in/',
      tags: ['iit', 'internship'], experienceLevel: 'fresher',
    },
    {
      title: 'IIT Mandi Research Fellowship', organization: 'IIT Mandi', category: 'research', status: 'verified',
      description: 'Research fellowship at IIT Mandi. Focus on AI, energy, and advanced materials research.',
      skillsRequired: ['Research'], eligibility: 'B.Tech/MSc students with good academics.',
      mode: 'onsite', location: 'Mandi, Himachal Pradesh', stipend: '₹8,000/month', prize: '', deadline: daysFromNow(30),
      applyUrl: 'https://www.iitmandi.ac.in/', sourceUrl: 'https://www.iitmandi.ac.in/',
      tags: ['iit', 'research', 'fellowship'], experienceLevel: 'fresher',
    },
    {
      title: 'IIT Kanpur Summer Fellowship Program', organization: 'IIT Kanpur', category: 'research', status: 'verified',
      description: '8-week summer fellowship at IIT Kanpur. Research exposure with faculty mentors and lab access.',
      skillsRequired: ['Research', 'Academic'], eligibility: 'B.Tech/MSc students with strong academics.',
      mode: 'onsite', location: 'Kanpur, India', stipend: '₹8,000/month', prize: '', deadline: daysFromNow(20),
      applyUrl: 'https://www.iitk.ac.in/', sourceUrl: 'https://www.iitk.ac.in/',
      tags: ['iit', 'fellowship', 'research'], experienceLevel: 'fresher',
    },

    // ─── NITs (3) ───
    {
      title: 'NIT Rourkela Internship Program', organization: 'NIT Rourkela', category: 'internship', status: 'verified',
      description: 'Summer internship at NIT Rourkela. Research and development projects across engineering departments.',
      skillsRequired: ['Programming', 'Engineering'], eligibility: 'B.Tech students.',
      mode: 'onsite', location: 'Rourkela, India', stipend: '₹5,000-10,000/month', prize: '', deadline: daysFromNow(30),
      applyUrl: 'https://www.nitrkl.ac.in/', sourceUrl: 'https://www.nitrkl.ac.in/',
      tags: ['nit', 'internship'], experienceLevel: 'fresher',
    },

    // ─── IIITs (3) ───
    {
      title: 'IIIT Hyderabad Research Internships', organization: 'IIIT Hyderabad', category: 'internship', status: 'verified',
      description: 'Research internships at IIIT Hyderabad. Work on AI, NLP, computer vision, and robotics projects.',
      skillsRequired: ['Python', 'Machine Learning'], eligibility: 'B.Tech students with CGPA 7.0+.',
      mode: 'onsite', location: 'Hyderabad, India', stipend: '₹8,000/month', prize: '', deadline: daysFromNow(25),
      applyUrl: 'https://www.iiit.ac.in/', sourceUrl: 'https://www.iiit.ac.in/',
      tags: ['iiit', 'research', 'ai'], experienceLevel: 'fresher',
    },
    {
      title: 'IIIT Bangalore Innovation Internships', organization: 'IIIT Bangalore', category: 'internship', status: 'verified',
      description: 'Innovation and research internships at IIIT Bangalore. Focus: AI, data science, IoT, cybersecurity.',
      skillsRequired: ['Programming', 'Data Science'], eligibility: 'B.Tech/BCA students.',
      mode: 'onsite', location: 'Bangalore, India', stipend: '₹10,000/month', prize: '', deadline: daysFromNow(30),
      applyUrl: 'https://www.iiitb.ac.in/', sourceUrl: 'https://www.iiitb.ac.in/',
      tags: ['iiit', 'innovation', 'internship'], experienceLevel: 'fresher',
    },

    // ─── COMPETITIONS / HACKATHONS (8) ───
    {
      title: 'ACM-ICPC Asia Regional Contest', organization: 'ACM', category: 'competition', status: 'verified',
      description: 'Prestigious team programming contest. Teams of 3 solve algorithmic problems in 5 hours.',
      skillsRequired: ['C++', 'Algorithms', 'Teamwork'], eligibility: 'University students (teams of 3).',
      mode: 'onsite', location: 'Various Cities, India', stipend: '', prize: 'Medals + Recognition', deadline: daysFromNow(90),
      applyUrl: 'https://icpc.global/', sourceUrl: 'https://icpc.global/',
      tags: ['acm', 'competitive', 'teamwork'], experienceLevel: 'any',
    },
    {
      title: 'Unstop — Competitions & Internships', organization: 'Unstop', category: 'competition', status: 'verified',
      description: 'Platform for hackathons, competitions, internships, and more from top companies.',
      skillsRequired: [], eligibility: 'All students.',
      mode: 'hybrid', location: 'India', stipend: 'Varies', prize: '', deadline: daysFromNow(45),
      applyUrl: 'https://unstop.com/', sourceUrl: 'https://unstop.com/',
      tags: ['unstop', 'hackathon', 'internship'], experienceLevel: 'any',
    },
    {
      title: 'Wellfound — Startup Jobs', organization: 'Wellfound', category: 'job', status: 'verified',
      description: 'Find jobs at innovative startups. Remote-friendly positions with equity options.',
      skillsRequired: [], eligibility: 'Open to all.',
      mode: 'remote', location: 'Global', stipend: 'Varies + Equity', prize: '', deadline: daysFromNow(90),
      applyUrl: 'https://wellfound.com/jobs', sourceUrl: 'https://wellfound.com/jobs',
      tags: ['startup', 'jobs'], experienceLevel: 'fresher',
    },
    {
      title: 'Internshala — Tech Internships', organization: 'Internshala', category: 'internship', status: 'verified',
      description: 'Browse thousands of verified tech internships. Web dev, app dev, data science, and more.',
      skillsRequired: [], eligibility: 'All students.',
      mode: 'remote', location: 'India', stipend: '₹1,000-25,000/month', prize: '', deadline: daysFromNow(60),
      applyUrl: 'https://internshala.com/', sourceUrl: 'https://internshala.com/',
      tags: ['internshala', 'internship'], experienceLevel: 'fresher',
    },
    {
      title: 'Hackathon.com — Global Hackathons', organization: 'Hackathon.com', category: 'hackathon', status: 'verified',
      description: 'Find and join hackathons worldwide. In-person and online events from top organizers.',
      skillsRequired: [], eligibility: 'All students.',
      mode: 'hybrid', location: 'Global', stipend: 'Varies', prize: '', deadline: daysFromNow(45),
      applyUrl: 'https://www.hackathon.com/', sourceUrl: 'https://www.hackathon.com/',
      tags: ['hackathon', 'global'], experienceLevel: 'any',
    },
    {
      title: 'TechGig — Coding Challenges & Jobs', organization: 'TechGig', category: 'competition', status: 'verified',
      description: 'Competitive coding challenges, hackathons, and tech job listings from top Indian companies.',
      skillsRequired: ['Programming'], eligibility: 'All students and professionals.',
      mode: 'remote', location: 'India', stipend: '', prize: 'Prizes + Jobs', deadline: daysFromNow(30),
      applyUrl: 'https://www.techgig.com/', sourceUrl: 'https://www.techgig.com/',
      tags: ['techgig', 'competitive', 'jobs'], experienceLevel: 'any',
    },
    {
      title: 'Edabit — Coding Challenges', organization: 'Edabit', category: 'training', status: 'verified',
      description: 'Fun bite-sized coding challenges. Level up your programming skills with progressive difficulty.',
      skillsRequired: ['Programming'], eligibility: 'All students.',
      mode: 'remote', location: 'Online', stipend: '', prize: '', deadline: daysFromNow(120),
      applyUrl: 'https://edabit.com/challenges', sourceUrl: 'https://edabit.com/challenges',
      tags: ['coding', 'practice'], experienceLevel: 'any',
    },

    // ─── TRAINING / COURSES (5) ───
    {
      title: 'AWS Educate — Free Cloud Training', organization: 'Amazon Web Services', category: 'training', status: 'verified',
      description: 'Free cloud computing training and $100 AWS credits. Learn AWS services and earn certificates.',
      skillsRequired: [], eligibility: 'All students with .edu email.',
      mode: 'remote', location: 'Online', stipend: '$100 AWS credits', prize: '', deadline: daysFromNow(120),
      applyUrl: 'https://aws.amazon.com/education/awseducate/', sourceUrl: 'https://aws.amazon.com/education/awseducate/',
      tags: ['aws', 'cloud', 'free'], experienceLevel: 'any',
    },
    {
      title: 'NVIDIA Deep Learning Institute', organization: 'NVIDIA', category: 'training', status: 'verified',
      description: 'Free GPU-accelerated training courses. Learn deep learning, computer vision, and NLP.',
      skillsRequired: ['Python', 'Machine Learning'], eligibility: 'All students and professionals.',
      mode: 'remote', location: 'Online', stipend: '', prize: 'Certificates', deadline: daysFromNow(120),
      applyUrl: 'https://www.nvidia.com/en-us/training/', sourceUrl: 'https://www.nvidia.com/en-us/training/',
      tags: ['nvidia', 'ai', 'training'], experienceLevel: 'any',
    },
    {
      title: 'IBM SkillsBuild — Free Tech Training', organization: 'IBM', category: 'training', status: 'verified',
      description: 'Free courses on AI, cloud, cybersecurity, and data science. Earn IBM digital badges.',
      skillsRequired: [], eligibility: 'All students.',
      mode: 'remote', location: 'Online', stipend: '', prize: 'Digital badges', deadline: daysFromNow(120),
      applyUrl: 'https://skillsbuild.org/', sourceUrl: 'https://skillsbuild.org/',
      tags: ['ibm', 'training', 'free'], experienceLevel: 'any',
    },
    {
      title: 'Harvard CS50 — Introduction to CS', organization: 'Harvard University', category: 'training', status: 'verified',
      description: 'World-famous free CS course. Learn C, Python, SQL, web development. Certificate available.',
      skillsRequired: [], eligibility: 'All students.',
      mode: 'remote', location: 'Online', stipend: '', prize: 'Certificate', deadline: daysFromNow(120),
      applyUrl: 'https://cs50.harvard.edu/', sourceUrl: 'https://cs50.harvard.edu/',
      tags: ['harvard', 'cs', 'training'], experienceLevel: 'any',
    },
    {
      title: 'Kaggle Competitions', organization: 'Kaggle', category: 'competition', status: 'verified',
      description: 'Data science and ML competitions. Solve real-world problems with datasets from top companies.',
      skillsRequired: ['Python', 'Machine Learning', 'Data Science'], eligibility: 'Open to all.',
      mode: 'remote', location: 'Online', stipend: '', prize: 'Up to $100,000', deadline: daysFromNow(30),
      applyUrl: 'https://www.kaggle.com/competitions', sourceUrl: 'https://www.kaggle.com/competitions',
      tags: ['kaggle', 'ml', 'data-science'], experienceLevel: 'any',
    },

    // ─── RESEARCH (2) ───
    {
      title: 'Google Research Internship', organization: 'Google Research', category: 'internship', status: 'verified',
      description: 'Research internship at Google. Work on ML, NLP, computer vision, and systems research.',
      skillsRequired: ['Research', 'Python', 'Machine Learning'], eligibility: 'PhD/Masters students in CS.',
      mode: 'onsite', location: 'Bangalore, India', stipend: 'Competitive', prize: '', deadline: daysFromNow(30),
      applyUrl: 'https://research.google/careers/', sourceUrl: 'https://research.google/careers/',
      tags: ['google', 'research'], experienceLevel: 'mid',
    },

    // ─── FELLOWSHIPS (3) ───
    {
      title: 'Teach For India Fellowship', organization: 'Teach For India', category: 'fellowship', status: 'verified',
      description: '2-year fellowship teaching in underserved schools. Leadership development and community impact.',
      skillsRequired: ['Leadership', 'Communication'], eligibility: 'Graduates with strong leadership.',
      mode: 'onsite', location: 'Various Cities, India', stipend: '₹20,000-25,000/month', prize: '', deadline: daysFromNow(60),
      applyUrl: 'https://www.teachforindia.org/', sourceUrl: 'https://www.teachforindia.org/',
      tags: ['fellowship', 'teaching', 'leadership'], experienceLevel: 'fresher',
    },
    {
      title: 'Outreachy — Internships for Underrepresented Groups', organization: 'Outreachy', category: 'internship', status: 'verified',
      description: 'Paid internships in open source for underrepresented people in tech. 3-month remote internships.',
      skillsRequired: ['Git', 'Programming'], eligibility: 'Underrepresented genders in tech.',
      mode: 'remote', location: 'Global', stipend: '$7,000 USD', prize: '', deadline: daysFromNow(50),
      applyUrl: 'https://www.outreachy.org/', sourceUrl: 'https://www.outreachy.org/',
      tags: ['open-source', 'diversity', 'internship'], experienceLevel: 'fresher',
    },
    {
      title: 'MLH Fellowship — Open Source Track', organization: 'MLH', category: 'fellowship', status: 'verified',
      description: '12-week paid fellowship contributing to open source. Remote with stipend and mentorship.',
      skillsRequired: ['Programming', 'Git'], eligibility: 'Students and recent grads.',
      mode: 'remote', location: 'Global', stipend: '$5,000 USD', prize: '', deadline: daysFromNow(40),
      applyUrl: 'https://fellowship.mlh.io/', sourceUrl: 'https://fellowship.mlh.io/',
      tags: ['mlh', 'open-source', 'fellowship'], experienceLevel: 'fresher',
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
  if (inserted > 0) console.log(`[seed] ✅ Inserted ${inserted} real opportunities (${samples.length} total in seed list)`);
  else console.log('[seed] All real opportunities already exist in database');
}
