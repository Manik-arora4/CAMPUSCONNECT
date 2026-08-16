import mongoose from 'mongoose';
import { College } from '../models/College.js';
import { Department } from '../models/Department.js';
import { Subject } from '../models/Subject.js';
import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { UserPreference } from '../models/UserPreference.js';
import { TimetableSlot } from '../models/TimetableSlot.js';
import { Attendance } from '../models/Attendance.js';
import { Assignment } from '../models/Assignment.js';
import { Task } from '../models/Task.js';
import { Exam } from '../models/Exam.js';
import { Notice } from '../models/Notice.js';
import { Event } from '../models/Event.js';
import { Club } from '../models/Club.js';
import { Opportunity } from '../models/Opportunity.js';
import { Application } from '../models/Application.js';
import { Notification } from '../models/Notification.js';
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

export async function ensureSeed({ force = false } = {}) {
  if (!force) {
    const count = await User.countDocuments();
    if (count > 0) {
      console.log('[seed] Demo data already present — skipping (use `npm run seed` to force reseed)');
      return { seeded: false };
    }
  }

  console.log('[seed] Seeding demo data...');

  // ---------------------------------------------------------- College
  const college = await College.create({
    name: 'Nova Institute of Technology',
    code: 'NIT',
    city: 'Pune',
    state: 'Maharashtra',
    address: '12 Knowledge Park, Pune',
    website: 'https://nova.edu',
    contactEmail: 'office@nova.edu',
    contactPhone: '+91 20 2555 4400',
    establishedYear: 2005,
  });

  const [deptCS, deptAI] = await Department.create([
    { college: college._id, name: 'Computer Science', code: 'CS' },
    { college: college._id, name: 'AI & Data Science', code: 'AI' },
  ]);

  // ---------------------------------------------------------- Users
  const admin = await User.create({
    name: 'Dr. Ananya Rao',
    email: 'admin@demo.campusconnect',
    password: 'demo1234',
    role: 'admin',
    college: college._id,
    designation: 'College Administrator',
    emailVerified: true,
    onboarded: true,
  });

  const faculty = await User.create({
    name: 'Prof. Rohan Mehta',
    email: 'faculty@demo.campusconnect',
    password: 'demo1234',
    role: 'faculty',
    college: college._id,
    designation: 'Assistant Professor, Computer Science',
    emailVerified: true,
    onboarded: true,
  });

  const faculty2 = await User.create({
    name: 'Prof. Sneha Iyer',
    email: 'sneha.iyer@nova.edu',
    password: 'demo1234',
    role: 'faculty',
    college: college._id,
    designation: 'Assistant Professor, AI & Data Science',
    emailVerified: true,
    onboarded: true,
  });

  const student = await User.create({
    name: 'Aarav Sharma',
    email: 'student@demo.campusconnect',
    password: 'demo1234',
    role: 'student',
    college: college._id,
    emailVerified: true,
    onboarded: true,
    lastLoginAt: new Date(),
  });

  const student2 = await User.create({
    name: 'Priya Patel',
    email: 'priya.patel@nova.edu',
    password: 'demo1234',
    role: 'student',
    college: college._id,
    emailVerified: true,
    onboarded: true,
  });

  // ---------------------------------------------------------- Profiles
  await StudentProfile.create([
    {
      user: student._id,
      college: college._id,
      course: 'BCA',
      semester: 2,
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
      preferredLocation: 'Pune',
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
      user: student2._id,
      college: college._id,
      course: 'BCA',
      semester: 2,
      section: 'A',
      skills: [{ name: 'Java', level: 'Intermediate' }, { name: 'SQL', level: 'Beginner' }, { name: 'C++', level: 'Beginner' }],
      interests: ['Cybersecurity', 'Web Development'],
      careerGoal: 'Software Engineer',
      remotePreference: 'hybrid',
      weeklyLearningHours: 8,
    },
  ]);

  await UserPreference.create([{ user: student._id }, { user: student2._id }, { user: faculty._id }, { user: admin._id }]);

  // ---------------------------------------------------------- Subjects
  const [cProg, dbms, webDev, ds, math, python] = await Subject.create([
    { college: college._id, department: deptCS._id, name: 'C Programming', code: 'CS201', semester: 2, faculty: faculty._id, color: '#818cf8' },
    { college: college._id, department: deptCS._id, name: 'DBMS', code: 'CS204', semester: 2, faculty: faculty._id, color: '#34d399' },
    { college: college._id, department: deptCS._id, name: 'Web Development', code: 'CS206', semester: 2, faculty: faculty2._id, color: '#fbbf24' },
    { college: college._id, department: deptCS._id, name: 'Data Structures', code: 'CS203', semester: 2, faculty: faculty._id, color: '#f472b6' },
    { college: college._id, department: deptCS._id, name: 'Mathematics', code: 'MA201', semester: 2, faculty: faculty2._id, color: '#22d3ee' },
    { college: college._id, department: deptAI._id, name: 'Python Programming', code: 'AI201', semester: 2, faculty: faculty2._id, color: '#a78bfa' },
  ]);

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
  for (const s of tt) {
    await TimetableSlot.create({
      student: student._id,
      college: college._id,
      subject: s.subject?._id,
      subjectName: s.name,
      teacherName: s.subject?.name === 'Web Development' || s.subject?.name === 'Web Development Lab' || s.subject?.name === 'Web Development Workshop' ? 'Prof. Sneha Iyer' : s.subject?.name === 'Python Programming' ? 'Prof. Sneha Iyer' : 'Prof. Rohan Mehta',
      room: s.room,
      day: s.day,
      startTime: s.start,
      endTime: s.end,
      color: s.subject?.color || '#64748b',
      type: s.type || 'class',
    });
  }

  // ---------------------------------------------------------- Attendance (last ~5 weeks)
  // deterministic pattern per subject to create a realistic health spread
  const attendancePlan = {
    'C Programming': { total: 22, absentDays: [2, 9, 16] }, // ~86%
    DBMS: { total: 24, absentDays: [1, 3, 8, 12, 18, 23] }, // 75%
    'Web Development': { total: 20, absentDays: [5, 15] }, // 90%
    'Data Structures': { total: 20, absentDays: [4, 10, 14, 20] }, // 80%
    Mathematics: { total: 18, absentDays: [2, 6, 9, 13, 17, 21] }, // ~67% warning
    'Python Programming': { total: 20, absentDays: [7, 11] }, // 90%
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
      attendanceRecords.push({ student: student._id, subjectName: sub, date: d, status: absent ? 'absent' : 'present', subject: ({ 'C Programming': cProg, DBMS: dbms, 'Web Development': webDev, 'Data Structures': ds, Mathematics: math, 'Python Programming': python })[sub]._id });
    }
  }
  await Attendance.insertMany(attendanceRecords);

  // ---------------------------------------------------------- Assignments
  const assignments = await Assignment.create([
    { college: college._id, subject: dbms._id, subjectName: 'DBMS', faculty: faculty._id, semester: 2, title: 'ER Diagram & Normalization Assignment', description: 'Design an ER diagram for a library management system and normalize it up to 3NF.', type: 'assignment', dueDate: daysFromNow(1), priority: 'high', maxMarks: 50 },
    { college: college._id, subject: cProg._id, subjectName: 'C Programming', faculty: faculty._id, semester: 2, title: 'Data Structures in C: Linked List Implementation', description: 'Implement singly and doubly linked lists with insertion, deletion and reversal.', type: 'assignment', dueDate: daysFromNow(4), priority: 'medium', maxMarks: 100 },
    { college: college._id, subject: webDev._id, subjectName: 'Web Development', faculty: faculty2._id, semester: 2, title: 'Personal Portfolio Website', description: 'Build a responsive portfolio with HTML, CSS and React. Deploy it and share the link.', type: 'project', dueDate: daysFromNow(7), priority: 'medium', maxMarks: 100 },
    { college: college._id, subject: python._id, subjectName: 'Python Programming', faculty: faculty2._id, semester: 2, title: 'Python: Attendance Analyzer Script', description: 'Write a Python script that reads attendance data and reports percentage and trends.', type: 'assignment', dueDate: daysFromNow(9), priority: 'low', maxMarks: 50 },
  ]);

  // ---------------------------------------------------------- Tasks
  await Task.create([
    { user: student._id, title: 'Complete DBMS ER Diagram', description: 'Finish ER diagram for library system', subject: 'DBMS', category: 'assignment', dueDate: daysFromNow(1), priority: 'high', status: 'todo' },
    { user: student._id, title: 'Revise C pointers', description: 'Practice pointer exercises from Chapter 4', subject: 'C Programming', category: 'study', dueDate: daysFromNow(2), priority: 'medium', status: 'todo' },
    { user: student._id, title: 'Start AI hackathon application', description: 'Research team and write project idea', subject: '', category: 'career', dueDate: daysFromNow(2), priority: 'high', status: 'todo' },
    { user: student._id, title: 'Python practice: pandas basics', description: 'Complete 5 pandas exercises', subject: 'Python Programming', category: 'study', dueDate: daysFromNow(3), priority: 'medium', status: 'todo' },
    { user: student._id, title: 'Update LinkedIn profile', description: 'Add semester 2 skills and projects', subject: '', category: 'career', dueDate: daysFromNow(5), priority: 'low', status: 'todo' },
    { user: student._id, title: 'Math problem set 3', description: 'Problems 1-10 from unit 3', subject: 'Mathematics', category: 'study', dueDate: daysFromNow(-1), priority: 'medium', status: 'done', completedAt: new Date(Date.now() - 2 * DAY_MS) },
    { user: student._id, title: 'Watch DBMS normalization video', description: '3NF and BCNF examples', subject: 'DBMS', category: 'study', dueDate: daysFromNow(-2), priority: 'low', status: 'done', completedAt: new Date(Date.now() - 3 * DAY_MS) },
  ]);

  // ---------------------------------------------------------- Exams
  await Exam.create([
    { college: college._id, subject: cProg._id, subjectName: 'C Programming', semester: 2, title: 'C Programming Unit Test 2', date: daysFromNow(5), startTime: '10:00', endTime: '12:00', room: 'Hall B', maxMarks: 50, type: 'quiz' },
    { college: college._id, subject: dbms._id, subjectName: 'DBMS', semester: 2, title: 'DBMS Mid-Semester Exam', date: daysFromNow(12), startTime: '10:00', endTime: '13:00', room: 'Hall A', maxMarks: 100, type: 'midterm' },
    { college: college._id, subject: math._id, subjectName: 'Mathematics', semester: 2, title: 'Mathematics Mid-Semester Exam', date: daysFromNow(15), startTime: '14:00', endTime: '17:00', room: 'Hall C', maxMarks: 100, type: 'midterm' },
  ]);

  // ---------------------------------------------------------- Notices
  const examNoticeContent = 'Mid-semester examinations begin on 15 September.\n\nDBMS — 15 September, 10 AM, Hall A.\nMathematics — 18 September, 2 PM, Hall C.\n\nStudents must fill the examination form before 5 September. Forms are available in the examination cell. Late submission will attract a penalty fee of ₹500.\n\nContact the examination cell for any queries.';
  const examNotice = await Notice.create({
    college: college._id,
    title: 'Important: Mid-Semester Examination Schedule',
    content: examNoticeContent,
    category: 'exam',
    important: true,
    date: daysFromNow(-1),
    createdBy: admin._id,
  });
  examNotice.aiSummary = { ...fallbackNoticeSummary(examNotice.title, examNotice.content), generatedAt: new Date() };
  await examNotice.save();

  await Notice.create([
    { college: college._id, title: 'TechFest 2026 Registrations Open', content: 'Nova TechFest 2026 registrations are now open. Workshops, hackathons, and coding competitions across 3 days. Register on the student portal before 20 September.', category: 'event', important: false, date: daysFromNow(-2), createdBy: admin._id },
    { college: college._id, title: 'Library Timings Extended During Exams', content: 'The central library will remain open until 10 PM from 1 September to 20 September for exam preparation. No books will be issued during this period.', category: 'general', important: false, date: daysFromNow(-3), createdBy: admin._id },
    { college: college._id, title: 'Placement Drive: Infosys & TCS Campus Visit', content: 'Campus placements for final-year students begin in October. Pre-placement talks and mock interviews will be conducted by the placement cell. Register your interest in the placement office.', category: 'placement', important: true, date: daysFromNow(-4), createdBy: admin._id },
    { college: college._id, title: 'Holiday: Independence Day', content: 'The college will remain closed on 15 August on account of Independence Day. Classes resume on 16 August.', category: 'holiday', important: false, date: daysFromNow(-6), createdBy: admin._id },
  ]);

  // ---------------------------------------------------------- Events
  await Event.create([
    { college: college._id, title: 'AI & ML Workshop', description: 'Hands-on workshop covering machine learning fundamentals with Python. Bring your laptops!', category: 'workshop', date: daysFromNow(6), startTime: '10:00', endTime: '16:00', location: 'Seminar Hall', organizer: 'AI/ML Club', registrationLink: 'https://forms.gle/demo', createdBy: faculty2._id },
    { college: college._id, title: 'Nova Hackathon 2026', description: '24-hour hackathon. Build something that solves a real campus problem. Prizes worth ₹50,000.', category: 'hackathon', date: daysFromNow(10), startTime: '09:00', endTime: '09:00', location: 'Main Auditorium', organizer: 'Coding Club', createdBy: faculty._id },
    { college: college._id, title: 'Industry Talk: Careers in Data Science', description: 'Guest lecture by alumni working at a top analytics firm. Networking session after.', category: 'talk', date: daysFromNow(8), startTime: '15:00', endTime: '17:00', location: 'Lecture Hall 2', organizer: 'Placement Cell', createdBy: admin._id },
    { college: college._id, title: 'Cultural Fest: Nova Utsav', description: 'Music, dance, drama and art competitions across the campus.', category: 'fest', date: daysFromNow(14), startTime: '10:00', endTime: '18:00', location: 'Open Air Theatre', organizer: 'Cultural Committee', createdBy: admin._id },
  ]);

  // ---------------------------------------------------------- Clubs
  const codingClub = await Club.create({ college: college._id, name: 'Coding Club', description: 'Competitive programming, DSA practice and hackathon teams.', category: 'technical', facultyAdvisor: 'Prof. Rohan Mehta', members: [student._id, student2._id], followers: [student._id], announcements: [{ title: 'DSA Practice Hour', content: 'Join us every Friday at 5 PM in Lab 2.', date: daysFromNow(-2) }] });
  await Club.create([
    { college: college._id, name: 'AI/ML Club', description: 'Learn machine learning, deep learning and build AI projects.', category: 'technical', facultyAdvisor: 'Prof. Sneha Iyer', members: [student._id], followers: [student._id], announcements: [{ title: 'ML Basics Workshop', content: 'This Saturday, 10 AM, Seminar Hall.', date: daysFromNow(-1) }] },
    { college: college._id, name: 'Robotics Club', description: 'Build robots and compete in national robotics competitions.', category: 'technical', facultyAdvisor: 'Prof. Rohan Mehta', announcements: [{ title: 'RoboWar entries open', content: 'Register your team for the inter-college RoboWar.', date: daysFromNow(-3) }] },
    { college: college._id, name: 'Photography Club', description: 'Campus photography, editing workshops and photo walks.', category: 'cultural' },
    { college: college._id, name: 'Debate & Literary Society', description: 'Debates, MUNs, poetry and creative writing.', category: 'cultural' },
    { college: college._id, name: 'Music Society', description: 'Band practice, open mics and music production.', category: 'cultural' },
  ]);

  // ---------------------------------------------------------- Opportunities
  const opportunities = await Opportunity.create([
    {
      title: 'National AI Hackathon 2026', organization: 'CodeVita & Partners', category: 'hackathon', status: 'verified',
      description: 'A 48-hour online hackathon to build AI-powered solutions for education. Build an app that helps students learn better using AI. Top 10 teams get mentorship and incubation.',
      skillsRequired: ['Python', 'AI', 'Machine Learning', 'React'], eligibility: 'Open to all undergraduate students. BCA, B.Tech, BSc students welcome.',
      mode: 'remote', location: 'Remote (India)', stipend: '', prize: '₹1,00,000 in prizes + incubation', deadline: daysFromNow(2, 23), applyLink: 'https://hackathon.example.com/ai-2026',
      requirements: ['Team of 1-4', 'Submit project idea by deadline', 'Demo video required'], applicationProcess: 'Register online, submit idea, then build during the hackathon weekend.',
      tags: ['ai', 'ml', 'education', 'hackathon'], experienceLevel: 'fresher', verifiedBy: admin._id, createdBy: admin._id,
    },
    {
      title: 'Software Development Internship', organization: 'TechNova Solutions', category: 'internship', status: 'verified',
      description: '3-month remote internship building web applications with React and Node.js. Work with a mentor, ship real features and get a certificate + stipend.',
      skillsRequired: ['JavaScript', 'React', 'Node.js', 'MongoDB'], eligibility: '2nd year and above. BCA/B.Tech students preferred.',
      mode: 'remote', location: 'Remote', stipend: '₹8,000/month', prize: '', deadline: daysFromNow(9), applyLink: 'https://technova.example.com/intern',
      requirements: ['Resume', 'GitHub profile'], applicationProcess: 'Apply online, shortlisting followed by a technical interview.',
      tags: ['web', 'javascript', 'react', 'internship'], experienceLevel: 'fresher', verifiedBy: admin._id, createdBy: admin._id,
    },
    {
      title: 'Data Science Internship', organization: 'Analytix Labs', category: 'internship', status: 'verified',
      description: 'Work on real datasets with our data science team. Learn pandas, visualization and basic ML. Hybrid role based in Bangalore.',
      skillsRequired: ['Python', 'SQL', 'Data Science'], eligibility: 'BCA/BSc/B.Tech students with Python basics. Final year preferred.',
      mode: 'hybrid', location: 'Bangalore', stipend: '₹12,000/month', prize: '', deadline: daysFromNow(14), applyLink: 'https://analytix.example.com/ds-intern',
      requirements: ['Resume', 'One sample analysis project'], applicationProcess: 'Online application → data challenge → interview.',
      tags: ['data', 'python', 'sql'], experienceLevel: 'fresher', verifiedBy: admin._id, createdBy: admin._id,
    },
    {
      title: 'Frontend Developer (Junior)', organization: 'PixelForge Studio', category: 'job', status: 'verified',
      description: 'Entry-level frontend role. Build pixel-perfect interfaces with React and Tailwind. Strong portfolio required.',
      skillsRequired: ['JavaScript', 'React', 'HTML', 'CSS'], eligibility: 'Freshers with portfolio projects. BCA/B.Tech.',
      mode: 'remote', location: 'Remote', stipend: '', prize: '₹4.5 LPA', deadline: daysFromNow(12), applyLink: 'https://pixelforge.example.com/jobs/frontend',
      requirements: ['Portfolio', 'Resume'], applicationProcess: 'Portfolio review → take-home task → interview.',
      tags: ['frontend', 'react', 'job'], experienceLevel: 'fresher', verifiedBy: admin._id, createdBy: admin._id,
    },
    {
      title: 'Cybersecurity Awareness Training', organization: 'SecureCampus Initiative', category: 'training', status: 'verified',
      description: 'Free 4-week online training on cybersecurity fundamentals: network security, phishing, ethical hacking basics. Certificate included.',
      skillsRequired: ['Cybersecurity', 'Networking'], eligibility: 'Open to all students.',
      mode: 'remote', location: 'Online', stipend: '', prize: 'Certificate', deadline: daysFromNow(7), applyLink: 'https://securecampus.example.com/training',
      requirements: ['Laptop with internet'], applicationProcess: 'Register and attend live sessions.',
      tags: ['security', 'training'], experienceLevel: 'any', verifiedBy: admin._id, createdBy: admin._id,
    },
    {
      title: 'Merit Scholarship 2026', organization: 'Nova Education Trust', category: 'scholarship', status: 'verified',
      description: 'Scholarship for meritorious students (top 10% of class). Covers 50% of tuition fees for one academic year.',
      skillsRequired: [], eligibility: 'CGPA 8.0+ or top 10% of class. All courses.',
      mode: 'onsite', location: 'Pune', stipend: '', prize: '50% tuition waiver', deadline: daysFromNow(20), applyLink: 'https://nova.edu/scholarship',
      requirements: ['Marksheets', 'Income certificate'], applicationProcess: 'Fill form, submit documents, shortlisting by committee.',
      tags: ['scholarship', 'merit'], experienceLevel: 'any', verifiedBy: admin._id, createdBy: admin._id,
    },
    {
      title: 'Full Stack Web Development Bootcamp', organization: 'SkillUp Academy', category: 'training', status: 'verified',
      description: '8-week intensive bootcamp covering HTML, CSS, JavaScript, React, Node and MongoDB. Project-based with placement assistance.',
      skillsRequired: ['JavaScript', 'React', 'Node.js'], eligibility: 'Students with basic programming knowledge.',
      mode: 'remote', location: 'Online', stipend: '', prize: '', deadline: daysFromNow(11), applyLink: 'https://skillup.example.com/bootcamp',
      requirements: ['Basic programming knowledge'], applicationProcess: 'Apply and clear a short aptitude test.',
      tags: ['fullstack', 'training', 'web'], experienceLevel: 'fresher', verifiedBy: admin._id, createdBy: admin._id,
    },
    {
      title: 'CodeSprint 48: Competitive Programming Contest', organization: 'Nova Coding Club', category: 'competition', status: 'verified',
      description: '48-hour competitive programming contest with 6 problems across difficulty levels. Top 3 win cash prizes and swag.',
      skillsRequired: ['C', 'C++', 'Python'], eligibility: 'Open to all college students.',
      mode: 'remote', location: 'Online', stipend: '', prize: '₹15,000', deadline: daysFromNow(4), applyLink: 'https://nova.edu/codesprint',
      requirements: ['Registered team'], applicationProcess: 'Register online before deadline.',
      tags: ['competitive', 'coding'], experienceLevel: 'any', verifiedBy: admin._id, createdBy: admin._id,
    },
    {
      title: 'Research Assistant: NLP for Education', organization: 'Nova AI Lab', category: 'research', status: 'verified',
      description: 'Assist faculty research on NLP applications in education. Learn to work with LLMs, datasets and academic writing. Publication credit for contributors.',
      skillsRequired: ['Python', 'AI', 'Machine Learning'], eligibility: 'Students with strong Python skills. GPA 7.5+ preferred.',
      mode: 'onsite', location: 'Pune', stipend: '', prize: 'Publication credit', deadline: daysFromNow(15), applyLink: 'https://nova.edu/ai-lab/research',
      requirements: ['Resume', 'Statement of interest'], applicationProcess: 'Email your resume and a short statement of interest.',
      tags: ['research', 'nlp', 'ai'], experienceLevel: 'fresher', verifiedBy: admin._id, createdBy: admin._id,
    },
    {
      title: 'Flutter App Development Workshop', organization: 'Google Developers Group Pune', category: 'workshop', status: 'verified',
      description: '1-day hands-on workshop to build your first Flutter app. Learn widgets, state management and publishing.',
      skillsRequired: ['Flutter', 'Dart'], eligibility: 'Open to all students. No prior mobile experience needed.',
      mode: 'onsite', location: 'Pune', stipend: '', prize: 'Certificates', deadline: daysFromNow(6), applyLink: 'https://gdg.example.com/flutter',
      requirements: ['Laptop'], applicationProcess: 'Register on the GDG page.',
      tags: ['mobile', 'flutter', 'workshop'], experienceLevel: 'any', verifiedBy: admin._id, createdBy: admin._id,
    },
    {
      title: 'Young Innovators Fellowship', organization: 'India STEM Foundation', category: 'fellowship', status: 'verified',
      description: '6-month fellowship for students with innovative project ideas. Mentorship, ₹30,000 stipend and demo day at the end.',
      skillsRequired: ['Problem Solving', 'AI'], eligibility: 'Undergraduate students with a project idea.',
      mode: 'hybrid', location: 'India', stipend: '₹30,000 total', prize: 'Mentorship + Demo Day', deadline: daysFromNow(18), applyLink: 'https://stemfoundation.example.com/fellowship',
      requirements: ['Project proposal'], applicationProcess: 'Submit proposal → interview → selection.',
      tags: ['fellowship', 'innovation'], experienceLevel: 'fresher', verifiedBy: admin._id, createdBy: admin._id,
    },
    {
      title: 'AI Summit India 2026', organization: 'AI Association of India', category: 'conference', status: 'verified',
      description: 'Two-day conference with talks from AI researchers and industry leaders. Student passes available at a discount.',
      skillsRequired: ['AI'], eligibility: 'Open to all. Student ID required for student passes.',
      mode: 'onsite', location: 'Mumbai', stipend: '', prize: '', deadline: daysFromNow(25), applyLink: 'https://aisummit.example.com',
      requirements: ['Student ID'], applicationProcess: 'Buy student pass online.',
      tags: ['conference', 'ai'], experienceLevel: 'any', verifiedBy: admin._id, createdBy: admin._id,
    },
    {
      title: 'Junior Data Analyst', organization: 'FinEdge Analytics', category: 'job', status: 'verified',
      description: 'Entry-level data analyst role: dashboards, SQL queries and Excel modelling for financial data.',
      skillsRequired: ['SQL', 'Excel', 'Data Analysis'], eligibility: 'Freshers. BCA/BSc Mathematics/Statistics.',
      mode: 'onsite', location: 'Mumbai', stipend: '', prize: '₹3.8 LPA', deadline: daysFromNow(16), applyLink: 'https://finedge.example.com/jobs/analyst',
      requirements: ['Resume'], applicationProcess: 'Apply → SQL test → interview.',
      tags: ['data', 'analyst', 'job'], experienceLevel: 'fresher', verifiedBy: admin._id, createdBy: admin._id,
    },
    {
      title: 'ML Foundations Mini-Course', organization: 'Kaggle Learn (free)', category: 'training', status: 'verified',
      description: 'Free self-paced mini-course: intro to machine learning with scikit-learn. Great first step before applying to AI roles.',
      skillsRequired: ['Python', 'Machine Learning'], eligibility: 'Anyone with basic Python.',
      mode: 'remote', location: 'Online', stipend: '', prize: 'Certificate', deadline: daysFromNow(30), applyLink: 'https://kaggle.example.com/learn/ml',
      requirements: [], applicationProcess: 'Enroll anytime.',
      tags: ['ml', 'training', 'free'], experienceLevel: 'any', verifiedBy: admin._id, createdBy: admin._id,
    },
    {
      title: 'Web3 & Blockchain Hackathon', organization: 'ChainVerse Labs', category: 'hackathon', status: 'verified',
      description: 'Weekend hackathon for Web3 projects. Workshops on day 1, building on day 2. Prizes for best dApp.',
      skillsRequired: ['JavaScript', 'Blockchain'], eligibility: 'Open to all students.',
      mode: 'hybrid', location: 'Hyderabad', stipend: '', prize: '₹60,000', deadline: daysFromNow(8), applyLink: 'https://chainverse.example.com/hack',
      requirements: ['Team of 2-4'], applicationProcess: 'Register online.',
      tags: ['web3', 'blockchain', 'hackathon'], experienceLevel: 'fresher', verifiedBy: admin._id, createdBy: admin._id,
    },
    {
      title: 'UI/UX Design Internship', organization: 'DesignOwl Studio', category: 'internship', status: 'pending',
      description: 'UI/UX internship with a design studio. Work on mobile app designs, wireframes and design systems.',
      skillsRequired: ['UI/UX', 'Figma'], eligibility: 'Students with design portfolio.',
      mode: 'remote', location: 'Remote', stipend: '₹6,000/month', prize: '', deadline: daysFromNow(13), applyLink: 'https://designowl.example.com/intern',
      requirements: ['Portfolio'], applicationProcess: 'Apply online with portfolio.',
      tags: ['design', 'internship'], experienceLevel: 'fresher', createdBy: faculty._id,
    },
  ]);

  // ---------------------------------------------------------- Applications
  await Application.create([
    {
      student: student._id,
      opportunity: opportunities[0]._id,
      status: 'applied',
      appliedDate: new Date(),
      notes: 'Applied with AI-generated cover letter.',
      timeline: [{ status: 'applied' }],
    },
    {
      student: student._id,
      opportunity: opportunities[1]._id,
      status: 'shortlisted',
      appliedDate: daysFromNow(-4),
      timeline: [{ status: 'applied' }, { status: 'shortlisted' }],
    },
    {
      student: student._id,
      opportunity: opportunities[5]._id,
      status: 'saved',
      timeline: [{ status: 'saved' }],
    },
    {
      student: student._id,
      opportunity: opportunities[7]._id,
      status: 'planning',
      timeline: [{ status: 'planning' }],
    },
  ]);

  // ---------------------------------------------------------- Notifications
  await Notification.create([
    { user: student._id, category: 'opportunity', title: '🎯 96% match: National AI Hackathon 2026', message: 'This opportunity matches your AI Engineer career goal. Deadline in 2 days.', link: `/opportunities/${opportunities[0]._id}`, icon: 'target', priority: 'high', read: false },
    { user: student._id, category: 'academic', title: '⏰ DBMS assignment due tomorrow', message: '"ER Diagram & Normalization Assignment" is due tomorrow.', link: '/assignments', icon: 'alarm-clock', priority: 'high', read: false },
    { user: student._id, category: 'attendance', title: '⚠️ Mathematics attendance at 67%', message: 'Attend the next 5 classes to reach your 75% target.', link: '/attendance', icon: 'percent', priority: 'high', read: false },
    { user: student._id, category: 'college', title: '📢 Important: Mid-Semester Examination Schedule', message: 'Mid-semester examinations begin 15 September. Form deadline: 5 September.', link: '/college', icon: 'megaphone', priority: 'high', read: false },
    { user: student._id, category: 'ai', title: '🧠 Your AI Daily Plan is ready', message: 'Open the AI Daily Planner to see today\'s focus.', link: '/ai/planner', icon: 'sparkles', priority: 'medium', read: false },
    { user: student._id, category: 'opportunity', title: '✨ You were shortlisted for Software Development Internship', message: 'TechNova Solutions shortlisted your application.', link: '/applications', icon: 'award', priority: 'high', read: false },
    { user: student._id, category: 'system', title: 'Welcome to CAMPUSCONNECT, Aarav! 👋', message: 'Your AI-powered campus is ready.', link: '/dashboard', icon: 'sparkles', priority: 'low', read: true },
  ]);

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
