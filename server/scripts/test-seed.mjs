#!/usr/bin/env node
/**
 * Local seed data test — validates IIT data inserts into SQLite
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const { hash } = bcrypt;

const prisma = new PrismaClient();
const DAY_MS = 86400000;
function daysFromNow(n, hour = 10) {
  const d = new Date(Date.now() + n * DAY_MS);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  console.log('🧪 Testing seed data on local SQLite...\n');

  // Clean
  await prisma.notification.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.application.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.club.deleteMany();
  await prisma.event.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
  await prisma.college.deleteMany();
  console.log('🗑️  Cleaned database');

  const passwordHash = await hash('demo1234', 10);

  // ── Colleges ──
  const colleges = [];
  const collegeData = [
    { name: 'Indian Institute of Information Technology, Ropar', code: 'IIIT-RPR', city: 'Rupnagar', state: 'Punjab', establishedYear: 2014, website: 'https://www.iiit.ac.in' },
    { name: 'Indian Institute of Technology Ropar', code: 'IITRPR', city: 'Rupnagar', state: 'Punjab', establishedYear: 2008, website: 'https://www.iitrpr.ac.in' },
    { name: 'Indian Institute of Technology Bombay', code: 'IITB', city: 'Mumbai', state: 'Maharashtra', establishedYear: 1958, website: 'https://www.iitb.ac.in' },
    { name: 'Indian Institute of Technology Delhi', code: 'IITD', city: 'New Delhi', state: 'Delhi', establishedYear: 1963, website: 'https://home.iitd.ac.in' },
    { name: 'Indian Institute of Technology Madras', code: 'IITM', city: 'Chennai', state: 'Tamil Nadu', establishedYear: 1959, website: 'https://www.iitm.ac.in' },
    { name: 'Indian Institute of Technology Kanpur', code: 'IITK', city: 'Kanpur', state: 'Uttar Pradesh', establishedYear: 1959, website: 'https://www.iitk.ac.in' },
    { name: 'Indian Institute of Technology Kharagpur', code: 'IITKGP', city: 'Kharagpur', state: 'West Bengal', establishedYear: 1951, website: 'https://www.iitkgp.ac.in' },
    { name: 'Indian Institute of Technology Hyderabad', code: 'IITH', city: 'Hyderabad', state: 'Telangana', establishedYear: 2008, website: 'https://www.iith.ac.in' },
  ];
  for (const c of collegeData) {
    const created = await prisma.college.create({ data: c });
    colleges.push(created);
  }
  console.log(`🏫 Colleges created: ${colleges.length}`);

  // ── Admin user ──
  const admin = await prisma.user.create({
    data: { name: 'Admin', email: 'admin@test.com', password: passwordHash, role: 'admin', emailVerified: true, approved: true },
  });

  // ── IIT Ropar Opportunities ──
  const iitRoparOpps = [
    { title: 'HACK CORE 2026 — AI Agriculture Hackathon', organization: 'ANNAM.AI, IIT Ropar', category: 'hackathon', description: 'National AI hackathon for agriculture. 36-hour build at IIT Ropar.', skillsRequired: '["Python","AI","ML"]', mode: 'hybrid', location: 'IIT Ropar', prize: 'Incubation + Prizes', deadline: daysFromNow(8), applyLink: 'https://www.annam.ai/hack-core', tags: '["ai","agriculture","hackathon","iit-ropar"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'AI Hackathon for Social Good', organization: 'sAIDE, IIT Ropar', category: 'hackathon', description: '24-hour coding marathon. AI solutions for social impact.', skillsRequired: '["Python","AI","React"]', mode: 'onsite', location: 'CS Block, IIT Ropar', prize: 'Prizes + Incubation', deadline: daysFromNow(15), applyLink: 'https://unstop.com/hackathons/pre-ai-summit', tags: '["ai","social-good","hackathon","iit-ropar"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'AI Fusion Prompt Hackathon', organization: 'sAIDE, IIT Ropar', category: 'hackathon', description: 'Prompt engineering hackathon using LLMs.', skillsRequired: '["AI","LLMs","Python"]', mode: 'onsite', location: 'IIT Ropar', prize: 'Prizes', deadline: daysFromNow(20), tags: '["ai","llm","hackathon","iit-ropar"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'DeployAI 2026 Winter School', organization: 'sAIDE, IIT Ropar', category: 'workshop', description: 'AI deployment, MLOps, model serving. Hands-on workshops.', skillsRequired: '["Python","AI","Docker"]', mode: 'onsite', location: 'IIT Ropar', prize: 'Certificate', deadline: daysFromNow(90), tags: '["ai","mlops","workshop","iit-ropar"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'Workshop: AI for Internal Security', organization: 'sAIDE, IIT Ropar', category: 'workshop', description: 'AI for Punjab police. Cybercrime detection, ethical considerations.', skillsRequired: '["AI","Cybersecurity"]', mode: 'onsite', location: 'Main Auditorium, IIT Ropar', prize: 'Certificate', deadline: daysFromNow(18), tags: '["ai","security","workshop","iit-ropar"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'FinTech Cybersecurity Hackathon', organization: 'IIT Ropar', category: 'hackathon', description: 'FinTech cybersecurity challenge. Free registration + accommodation.', skillsRequired: '["Cybersecurity","Python"]', mode: 'onsite', location: 'IIT Ropar', prize: 'Cash Prizes', deadline: daysFromNow(10), tags: '["fintech","cybersecurity","hackathon","iit-ropar"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'Advitiya 2026 — BUILD WITH PUNJAB', organization: 'IIT Ropar', category: 'hackathon', description: "North India's biggest AI & Tech event. Multiple hackathons.", skillsRequired: '["AI","Innovation"]', mode: 'onsite', location: 'IIT Ropar Campus', prize: 'Prizes + Networking', deadline: daysFromNow(12), tags: '["tech-fest","ai","hackathon","iit-ropar"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'Summer Internship 2026 — IIT Ropar Research Labs', organization: 'IIT Ropar', category: 'internship', description: 'Research internship across 15 departments. May 15 – July 15.', skillsRequired: '["Python","Research"]', mode: 'onsite', location: 'IIT Ropar', prize: 'Research Experience', deadline: daysFromNow(1), tags: '["research","internship","iit-ropar"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'ARC Lab Internship — Communications & ML', organization: 'ARC Lab, IIT Ropar', category: 'internship', description: 'PAID internship. ₹15,000/month. ML, 6G, UAV systems.', skillsRequired: '["Python","MATLAB","ML"]', mode: 'onsite', location: 'IIT Ropar', prize: '', stipend: '₹15,000/month', deadline: daysFromNow(30), tags: '["communications","ml","paid-internship","iit-ropar"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'JRF Position — ARC Lab', organization: 'ARC Lab, IIT Ropar', category: 'job', description: 'Junior Research Fellow. ₹4.88 LPA with GATE/NET.', skillsRequired: '["MATLAB","Python","C++"]', mode: 'onsite', location: 'IIT Ropar', prize: '', stipend: '₹4.88 LPA', deadline: daysFromNow(30), tags: '["jrf","research","paid","iit-ropar"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'TBIF Startup Incubation Program', organization: 'TBIF, IIT Ropar', category: 'fellowship', description: 'Incubation for student startups. Mentorship + funding.', skillsRequired: '["Entrepreneurship"]', mode: 'onsite', location: 'IIT Ropar', prize: 'Incubation Space', deadline: daysFromNow(30), tags: '["startup","incubation","iit-ropar"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'Goldman Sachs India Hackathon', organization: 'Goldman Sachs', category: 'hackathon', description: '12-hour coding challenge. Quant + CS. PPI for winners.', skillsRequired: '["Python","DSA","Quant"]', mode: 'hybrid', location: 'Online + Office', prize: 'PPI + Prizes', deadline: daysFromNow(30), tags: '["fintech","hackathon","goldman-sachs"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
  ];

  // ── IIT Bombay Opportunities ──
  const iitBombayOpps = [
    { title: 'IIT India Hackathon 2026', organization: 'IIT Bombay Gymkhana', category: 'hackathon', description: 'Annual hackathon. 2-week build sprint.', skillsRequired: '["Python","JavaScript","AI"]', mode: 'hybrid', location: 'IIT Bombay + Online', prize: 'Prizes + Incubation', deadline: daysFromNow(15), tags: '["hackathon","iit-bombay"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'Trust Lab Summer Internship — Ethical Hacking', organization: 'IITB Trust Lab (HSBC)', category: 'internship', description: 'Ethical hacking internship with HSBC collaboration.', skillsRequired: '["Cybersecurity","Python"]', mode: 'onsite', location: 'IIT Bombay', stipend: 'Paid', deadline: daysFromNow(10), tags: '["cybersecurity","internship","iit-bombay"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'RUST Programming Workshop', organization: 'IIT Bombay', category: 'workshop', description: 'Systems programming with RUST. Memory safety focus.', skillsRequired: '["RUST","Systems Programming"]', mode: 'onsite', location: 'IIT Bombay', prize: 'Certificate', deadline: daysFromNow(20), tags: '["rust","workshop","iit-bombay"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
  ];

  // ── IIT Delhi Opportunities ──
  const iitDelhiOpps = [
    { title: 'Summer Research Fellowship 2026', organization: 'IIT Delhi', category: 'internship', description: 'Prestigious research fellowship. ₹15,000/month stipend.', skillsRequired: '["Research","Python"]', mode: 'onsite', location: 'IIT Delhi', stipend: '₹15,000/month', deadline: daysFromNow(3), tags: '["research","fellowship","iit-delhi"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'National Product Development Hackathon', organization: 'IIT Delhi', category: 'hackathon', description: 'Product development & design for technical textiles.', skillsRequired: '["Design","Engineering"]', mode: 'onsite', location: 'IIT Delhi', prize: 'Prizes + Incubation', deadline: daysFromNow(25), tags: '["design","hackathon","iit-delhi"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
  ];

  // ── IIT Madras Opportunities ──
  const iitMadrasOpps = [
    { title: 'BIMSTEC AI Road Safety Hackathon', organization: 'COERS, IIT Madras', category: 'hackathon', description: 'Biggest road safety hackathon for Global South.', skillsRequired: '["AI","Python","CV"]', mode: 'onsite', location: 'IIT Madras', prize: 'Cash Prizes + Incubation', deadline: daysFromNow(20), tags: '["ai","road-safety","hackathon","iit-madras"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'CyStar Cybersecurity Internship', organization: 'CyStar, IIT Madras', category: 'internship', description: 'Bootcamp + Hackathon + CTF on reverse engineering.', skillsRequired: '["Cybersecurity","C","Python"]', mode: 'onsite', location: 'IIT Madras', prize: 'Certificate', deadline: daysFromNow(15), tags: '["cybersecurity","internship","iit-madras"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
  ];

  // ── IIT Kanpur Opportunities ──
  const iitKanpurOpps = [
    { title: 'HACK IITK 2026 — Cybersecurity Hackathon', organization: 'C3iHub, IIT Kanpur', category: 'hackathon', description: 'Nationwide cybersecurity hackathon. Problem-solving.', skillsRequired: '["Cybersecurity","Python"]', mode: 'onsite', location: 'IIT Kanpur', prize: 'Cash Prizes + Incubation', deadline: daysFromNow(25), tags: '["cybersecurity","hackathon","iit-kanpur"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'SARIP 2026 — Summer Research Apprenticeship', organization: 'IIT Kanpur', category: 'internship', description: '8-week research internship. ₹10,000/month.', skillsRequired: '["Research","Python"]', mode: 'onsite', location: 'IIT Kanpur', stipend: '₹10,000/month', deadline: daysFromNow(10), tags: '["research","internship","iit-kanpur"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'Nexus Hackathon — ₹50K Prize Pool', organization: 'IIT Kanpur Tech Fest', category: 'hackathon', description: 'Three-day sprint. ₹50,000 prize pool.', skillsRequired: '["Innovation","Coding"]', mode: 'onsite', location: 'IIT Kanpur', prize: '₹50,000', deadline: daysFromNow(22), tags: '["hackathon","tech-fest","iit-kanpur"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
  ];

  // ── IIT Kharagpur Opportunities ──
  const iitKgpOpps = [
    { title: 'GRISHMA — UG Summer Internship', organization: 'KRITI, IIT Kharagpur', category: 'internship', description: '8-week UG research internship. Fellowship provided.', skillsRequired: '["Research","Python"]', mode: 'onsite', location: 'IIT Kharagpur', stipend: 'Fellowship', deadline: daysFromNow(10), tags: '["research","internship","iit-kgp"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'VibeBuild — 36-Hour Hackathon', organization: 'IIC, IIT Kharagpur', category: 'hackathon', description: 'Vibe coding hackathon. 36-hour offline build.', skillsRequired: '["Coding","AI"]', mode: 'onsite', location: 'IIT Kharagpur', prize: 'Prizes + Incubation', deadline: daysFromNow(25), tags: '["hackathon","vibe-coding","iit-kgp"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'Kshitij — Microsoft AI Agent Workshop', organization: 'Kshitij + Microsoft, IIT KGP', category: 'workshop', description: 'Build autonomous AI agents. Hands-on with Microsoft tools.', skillsRequired: '["AI","Python","LLMs"]', mode: 'onsite', location: 'IIT Kharagpur', prize: 'Certificate', deadline: daysFromNow(20), tags: '["ai","microsoft","workshop","iit-kgp"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
  ];

  // ── IIT Hyderabad Opportunities ──
  const iitHydOpps = [
    { title: 'SURE Internship 2026', organization: 'IIT Hyderabad', category: 'internship', description: '2-month research internship. ₹15,000 fellowship.', skillsRequired: '["Research","Python"]', mode: 'onsite', location: 'IIT Hyderabad', stipend: '₹15,000', deadline: daysFromNow(14), tags: '["research","internship","iit-hyderabad"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'PSB Cybersecurity & AI Hackathon — ₹20L Prize', organization: 'Bank of India + IIT Hyderabad', category: 'hackathon', description: 'Solve banking fraud. ₹20 Lakh prize pool.', skillsRequired: '["Cybersecurity","AI","Python"]', mode: 'hybrid', location: 'IIT Hyderabad + Online', prize: '₹20 Lakh', deadline: daysFromNow(28), tags: '["cybersecurity","ai","hackathon","iit-hyderabad"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
    { title: 'AVEVA National AI/ML Hackathon', organization: 'AVEVA + IIT Hyderabad', category: 'hackathon', description: 'National AI/ML hackathon. Live demo at IIT Hyderabad.', skillsRequired: '["AI","ML","Python"]', mode: 'hybrid', location: 'IIT Hyderabad', prize: 'Prizes + Industry Mentorship', deadline: daysFromNow(21), tags: '["ai","ml","hackathon","iit-hyderabad"]', status: 'verified', verifiedBy: admin.id, createdBy: admin.id },
  ];

  const allOpps = [
    ...iitRoparOpps,
    ...iitBombayOpps,
    ...iitDelhiOpps,
    ...iitMadrasOpps,
    ...iitKanpurOpps,
    ...iitKgpOpps,
    ...iitHydOpps,
  ];

  let oppCount = 0;
  for (const row of allOpps) {
    await prisma.opportunity.create({ data: row });
    oppCount++;
  }
  console.log(`🎯 Opportunities created: ${oppCount}`);

  // ── Summary ──
  const totalColleges = await prisma.college.count();
  const totalOpps = await prisma.opportunity.count();
  const hackathons = await prisma.opportunity.count({ where: { category: 'hackathon' } });
  const internships = await prisma.opportunity.count({ where: { category: 'internship' } });
  const workshops = await prisma.opportunity.count({ where: { category: 'workshop' } });
  const jobs = await prisma.opportunity.count({ where: { category: 'job' } });
  const fellowships = await prisma.opportunity.count({ where: { category: 'fellowship' } });

  console.log('\n═══════════════════════════════════════');
  console.log('  📊 SEED DATA TEST RESULTS');
  console.log('═══════════════════════════════════════');
  console.log(`  🏫 Colleges:       ${totalColleges}`);
  console.log(`  🎯 Total Opps:     ${totalOpps}`);
  console.log(`     🏆 Hackathons:  ${hackathons}`);
  console.log(`     💼 Internships: ${internships}`);
  console.log(`     🔧 Workshops:   ${workshops}`);
  console.log(`     📄 Jobs:        ${jobs}`);
  console.log(`     🏅 Fellowships: ${fellowships}`);
  console.log('═══════════════════════════════════════\n');

  // Show IIT-wise breakdown
  console.log('  📋 IIT-wise Breakdown:');
  for (const c of colleges) {
    const count = allOpps.filter(o => {
      const tags = o.tags || '[]';
      return tags.includes(c.code.toLowerCase()) || 
             (c.code === 'IITB' && tags.includes('iit-bombay')) ||
             (c.code === 'IITD' && tags.includes('iit-delhi')) ||
             (c.code === 'IITM' && tags.includes('iit-madras')) ||
             (c.code === 'IITK' && tags.includes('iit-kanpur')) ||
             (c.code === 'IITKGP' && tags.includes('iit-kgp')) ||
             (c.code === 'IITH' && tags.includes('iit-hyderabad')) ||
             (c.code === 'IITRPR' && tags.includes('iit-ropar'));
    }).length;
    console.log(`     ${c.name}: ${count} opportunities`);
  }

  await prisma.$disconnect();
  console.log('\n✅ Seed data test PASSED!');
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
