import { normalizeText, daysBetween, relativeDay, formatDate, timeToMinutes, minutesToTime } from '../../utils/helpers.js';
import { MATCH_WEIGHTS } from '../matchingEngine.js';
import { healthMeta } from '../attendanceService.js';
import { forecastMessage } from '../attendanceService.js';

// ---------------------------------------------------------------------------
// Skill dictionary used by resume parsing + skill-gap analysis
// ---------------------------------------------------------------------------
export const SKILL_DICT = [
  'Python', 'Java', 'JavaScript', 'TypeScript', 'C', 'C++', 'C#', 'SQL', 'HTML', 'CSS', 'React',
  'Node.js', 'Node', 'Express', 'MongoDB', 'Django', 'Flask', 'Git', 'GitHub', 'R', 'MATLAB',
  'AI', 'Machine Learning', 'Deep Learning', 'LLM', 'NLP', 'TensorFlow', 'PyTorch', 'Keras',
  'Data Science', 'Pandas', 'NumPy', 'Data Analysis', 'Data Visualization', 'Tableau', 'Power BI',
  'UI/UX', 'Figma', 'Photoshop', 'Cybersecurity', 'Ethical Hacking', 'Networking', 'Linux',
  'Cloud', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'DevOps', 'CI/CD', 'REST API',
  'Android', 'iOS', 'Flutter', 'React Native', 'Swift', 'Kotlin', 'Excel', 'Communication',
  'Leadership', 'Teamwork', 'Problem Solving', 'Critical Thinking', 'Public Speaking', 'Writing',
];

const ROADMAPS = {
  'AI Engineer': ['Python', 'SQL', 'Machine Learning', 'Deep Learning', 'LLMs / Generative AI', 'Deployment (Docker, APIs)', 'AI Projects', 'Hackathons', 'Internships'],
  'Software Engineer': ['Programming Fundamentals', 'Data Structures & Algorithms', 'Version Control (Git)', 'Databases (SQL)', 'Web Frameworks (React/Node)', 'System Design', 'Projects', 'Hackathons', 'Internships'],
  'Data Scientist': ['Python', 'Statistics', 'SQL', 'Data Analysis (Pandas)', 'Machine Learning', 'Data Visualization', 'Projects', 'Kaggle Competitions', 'Internships'],
  'Cybersecurity Engineer': ['Networking Basics', 'Linux', 'Python', 'Cybersecurity Fundamentals', 'Ethical Hacking', 'Network Security', 'CTF Challenges', 'Certifications (CEH)', 'Internships'],
  'Full Stack Developer': ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'Databases (MongoDB/SQL)', 'REST APIs', 'Projects', 'Hackathons', 'Internships'],
  'Frontend Developer': ['HTML/CSS', 'JavaScript', 'React', 'UI/UX Basics', 'Responsive Design', 'Projects', 'Open Source', 'Internships'],
  'Backend Developer': ['Programming (Python/Node)', 'Databases', 'REST APIs', 'Authentication', 'Caching', 'Deployment', 'Projects', 'Internships'],
  'Data Analyst': ['Excel', 'SQL', 'Python', 'Statistics', 'Data Visualization (Tableau/Power BI)', 'Projects', 'Dashboards', 'Internships'],
  'Product Manager': ['Business Basics', 'Product Lifecycle', 'User Research', 'Wireframing', 'Analytics', 'Communication', 'Case Studies', 'Internships'],
  'UI/UX Designer': ['Design Principles', 'Figma', 'Wireframing', 'Prototyping', 'User Research', 'Portfolio Projects', 'Case Studies', 'Design Internships'],
  'Cloud Engineer': ['Linux', 'Networking', 'Python', 'Cloud Fundamentals (AWS/Azure)', 'Docker', 'Kubernetes', 'DevOps', 'Certifications', 'Projects'],
  'DevOps Engineer': ['Linux', 'Shell Scripting', 'Python', 'Git', 'CI/CD', 'Docker', 'Kubernetes', 'Cloud (AWS/Azure)', 'Monitoring'],
  'Mobile Developer': ['Programming (Kotlin/Swift)', 'Mobile UI', 'Flutter/React Native', 'REST APIs', 'App Deployment', 'Projects', 'Hackathons', 'Internships'],
  'Machine Learning Engineer': ['Python', 'SQL', 'Machine Learning', 'Deep Learning', 'MLOps', 'TensorFlow/PyTorch', 'Projects', 'Kaggle', 'Internships'],
  'Entrepreneur': ['Idea Validation', 'Business Basics', 'Marketing', 'Finance Basics', 'Networking', 'MVP Development', 'Startup Competitions', 'Incubators'],
};

// ---------------------------------------------------------------------------
// 1. Match explanation
// ---------------------------------------------------------------------------
export function fallbackMatchExplanation(profile, opp, match) {
  const { score, breakdown, reasons } = match;
  const lines = [];
  lines.push(`**Your Match: ${score}%**`);
  lines.push('');
  lines.push(`This ${opp.category} at ${opp.organization} — "${opp.title}" — is a strong fit for you.`);
  if (reasons && reasons.length) {
    lines.push('Why it matches you:');
    reasons.forEach((r) => lines.push(`- Because ${r}.`));
  }
  const weak = Object.entries(breakdown || {}).filter(([k, v]) => v < MATCH_WEIGHTS[k] * 0.6);
  if (weak.length) {
    lines.push('');
    lines.push('To improve your match further:');
    weak.forEach(([k]) => {
      if (k === 'skills') lines.push('- Add the required skills to your profile or learn them.');
      if (k === 'eligibility') lines.push('- Review the eligibility criteria carefully.');
      if (k === 'career') lines.push('- Align your career goal with this domain.');
      if (k === 'location') lines.push('- Update your location / remote preference.');
    });
  }
  const diff = daysBetween(new Date(), opp.deadline);
  lines.push('');
  lines.push(diff < 0 ? '⚠️ This opportunity has expired.' : diff <= 3 ? `⏳ Deadline urgency: HIGH — closes ${relativeDay(opp.deadline)}. Apply now!` : `⏳ You have ${diff} days before the deadline.`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// 2. Daily plan
// ---------------------------------------------------------------------------
export function fallbackDailyPlan({ date, timetable, tasks, deadlines, topOpportunity, attendanceWarning }) {
  const items = [];
  const push = (time, title, type, source = '') => items.push({ time, title, type, source });

  const schedule = [...(timetable || [])]
    .filter((s) => s.day === new Date(date).getDay())
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const pending = (tasks || []).filter((t) => t.status !== 'done').slice(0, 3);
  const urgentDeadlines = (deadlines || []).filter((d) => d.diff <= 3).slice(0, 2);
  const hasMorning = schedule.some((s) => timeToMinutes(s.startTime) < 720);

  if (hasMorning && schedule.length) push('08:00', 'Morning routine & review', 'free');

  for (const s of schedule) {
    push(s.startTime, `${s.subjectName}${s.room ? ` (${s.room})` : ''}`, s.type === 'free' ? 'free' : 'class', `timetable:${s.id}`);
  }

  if (!schedule.length) push('09:00', 'Self-study block — no classes today', 'study');

  push('13:00', 'Lunch break', 'break');

  if (urgentDeadlines.length) {
    for (const d of urgentDeadlines) {
      push('14:00', `${d.label}${d.diff === 0 ? ' — due TODAY' : ` — due ${relativeDay(d.date)}`}`, 'task', d.ref);
    }
  }
  if (pending.length) {
    push('15:30', `${pending[0].title}`, 'task', `task:${pending[0].id}`);
    if (pending[1]) push('16:30', `${pending[1].title}`, 'task', `task:${pending[1].id}`);
  }
  if (topOpportunity) {
    push('17:30', `Work on "${topOpportunity.title}" application (${topOpportunity.score}% match)`, 'career', `opportunity:${topOpportunity.id}`);
  }
  if (attendanceWarning) {
    push('18:30', 'Prepare for next class to recover attendance', 'study');
  }
  push('19:30', 'Free time / hobbies', 'free');
  push('20:30', 'Skill practice & revision', 'study');
  push('22:00', 'Wind down', 'free');

  const uniqueItems = [];
  const seen = new Set();
  for (const it of items) {
    const key = `${it.time}-${it.title}`;
    if (!seen.has(key)) { seen.add(key); uniqueItems.push(it); }
  }

  const summary = `Plan for ${formatDate(date)}: ${schedule.length ? `${schedule.length} classes, ` : ''}${pending.length ? `${pending.length} pending task${pending.length > 1 ? 's' : ''}, ` : ''}${urgentDeadlines.length ? `${urgentDeadlines.length} urgent deadline${urgentDeadlines.length > 1 ? 's' : ''}, ` : ''}${topOpportunity ? `a ${topOpportunity.score}% match opportunity to work on.` : 'focus on your goals.'}`;

  return { items: uniqueItems, summary };
}

// ---------------------------------------------------------------------------
// 3. Chat (intent-based, data-aware)
// ---------------------------------------------------------------------------
export function detectIntent(message) {
  const m = normalizeText(message);
  const has = (...terms) => terms.some((t) => m.includes(normalizeText(t)));
  if (has('class', 'lecture', 'timetable', 'schedule', 'period') && has('today', 'tomorrow', 'day')) return 'classes';
  if (has('focus', 'should i do', 'what to do', 'plan', 'prioritize') && has('today', 'now')) return 'focus';
  if (has('attendance', 'present')) return 'attendance';
  if (has('skill gap', 'missing skill', 'learn next', 'become', 'career', 'roadmap')) return 'skillgap';
  if (has('deadline', 'due', 'urgent')) return 'deadlines';
  if (has('hackathon')) return 'hackathons';
  if (has('internship', 'job', 'opportunit', 'apply', 'best for me', 'recommend')) return 'opportunities';
  if (has('notice', 'college update', 'happening', 'event', 'announce')) return 'college';
  if (has('hello', 'hi', 'hey', 'namaste')) return 'greeting';
  if (has('who are you', 'help', 'what can you do')) return 'help';
  if (has('resume', 'cover letter')) return 'resume';
  return 'general';
}

export function fallbackChatReply(intent, ctx) {
  const { student, timetable, attendance, tasks, deadlines, opportunities, notices, events, plan } = ctx || {};
  const today = new Date();
  const todaySlots = (timetable || []).filter((s) => s.day === today.getDay()).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  switch (intent) {
    case 'classes': {
      if (!todaySlots.length) return "You don't have any classes today. Great chance to focus on pending tasks! 🎉";
      const list = todaySlots.map((s) => `${s.startTime} — ${s.subjectName}${s.room ? ` (${s.room})` : ''}`).join('\n');
      return `Here's your schedule for today:\n\n${list}`;
    }
    case 'focus': {
      const urgent = (deadlines || []).filter((d) => d.diff <= 2);
      const pending = (tasks || []).filter((t) => t.status !== 'done');
      if (urgent.length) return `You have ${urgent.length} urgent deadline${urgent.length > 1 ? 's' : ''}: ${urgent.map((d) => `${d.label} (${relativeDay(d.date)})`).join(', ')}. I recommend starting with **${urgent[0].label}** today.`;
      if (pending.length) return `No urgent deadlines. You have ${pending.length} pending task${pending.length > 1 ? 's' : ''} — try knocking out **${pending[0].title}** first.`;
      if (plan && plan.items && plan.items.length) return `Your AI daily plan is ready — you have ${plan.items.filter((i) => i.status === 'pending').length} planned items. Check the AI Daily Planner.`;
      return 'Your day looks clear! A good day to learn a new skill or work on your portfolio.';
    }
    case 'attendance': {
      const ov = attendance?.overall;
      if (!ov || !ov.total) return 'You have no attendance records yet.';
      const meta = healthMeta(ov.health);
      let msg = `Your overall attendance is **${ov.percentage}%** (${ov.attended}/${ov.total} classes) — status: **${meta.label}**.\n\n${meta.hint}`;
      if (ov.needed > 0) msg += `\n\nAttend your next **${ov.needed} consecutive classes** to reach the ${ov.target}% target.`;
      msg += `\n\n${forecastMessage(ov)}`;
      return msg;
    }
    case 'skillgap': {
      if (!student?.careerGoal) return "Set a career goal in your profile and I'll analyse your skill gaps!";
      const gaps = skillGapFromProfile(student, student.careerGoal);
      if (!gaps.gaps.length) return `You have all the core skills for ${student.careerGoal}. Time to build projects and apply! 🚀`;
      return `To become a **${student.careerGoal}**, you're missing: ${gaps.gaps.join(', ')}.\n\nI recommend starting with **${gaps.recommended}** — check the Skill Gap page for courses and project ideas.`;
    }
    case 'deadlines': {
      const all = (deadlines || []).slice(0, 5);
      if (!all.length) return 'No deadlines coming up. Nice work! 🎉';
      return `Your nearest deadlines:\n\n${all.map((d) => `• ${d.label} — ${relativeDay(d.date)}`).join('\n')}`;
    }
    case 'hackathons': {
      const hacks = (opportunities || []).filter((o) => o.category === 'hackathon' && o.status === 'verified' && daysBetween(new Date(), o.deadline) >= 0);
      if (!hacks.length) return 'No open hackathons right now. Check back soon!';
      return `Here are hackathons open to you:\n\n${hacks.slice(0, 4).map((o) => `• **${o.title}** (${o.organization}) — ${o.score}% match, closes ${relativeDay(o.deadline)}`).join('\n')}`;
    }
    case 'opportunities': {
      const top = (opportunities || []).slice(0, 3);
      if (!top.length) return 'I could not find matching opportunities right now. Try adjusting filters.';
      return `Best opportunities for you right now:\n\n${top.map((o, i) => `${i + 1}. **${o.title}** at ${o.organization} — ${o.score}% match, ${o.mode}${o.deadline ? `, closes ${relativeDay(o.deadline)}` : ''}`).join('\n')}`;
    }
    case 'college': {
      const parts = [];
      if ((notices || []).length) parts.push(`📢 **${notices.length} recent notice${notices.length > 1 ? 's' : ''}**: ${notices.slice(0, 2).map((n) => n.title).join('; ')}`);
      if ((events || []).length) parts.push(`🗓️ **Upcoming events**: ${events.slice(0, 2).map((e) => `${e.title} (${formatDate(e.date)})`).join('; ')}`);
      if (!parts.length) return 'Nothing new in your college right now.';
      return parts.join('\n\n');
    }
    case 'greeting':
      return `Hello${student ? ` ${student.name?.split(' ')[0]}` : ''}! 👋 I'm your AI assistant. Ask me about your classes, attendance, deadlines, opportunities or skill gaps.`;
    case 'help':
      return 'I can help you with:\n• "What classes do I have today?"\n• "What should I focus on today?"\n• "My attendance is 68%, what should I do?"\n• "Which internship is best for me?"\n• "What skills am I missing to become an AI Engineer?"\n• "Summarize today\'s college updates."';
    case 'resume':
      return 'Upload your resume on the Resume page and I\'ll score it, extract your skills, and suggest improvements. You can also compare it against any opportunity!';
    default:
      return "I've analysed your academic data, opportunities and career goal. Here's my suggestion: focus on your nearest deadlines first, keep your attendance above 75%, and spend at least 30 minutes daily on skills that close your career gap. Ask me about classes, attendance, deadlines, or opportunities for specifics!";
  }
}

// ---------------------------------------------------------------------------
// 4. Resume analysis
// ---------------------------------------------------------------------------
export function extractSkills(text) {
  const found = [];
  const t = text.toLowerCase();
  for (const skill of SKILL_DICT) {
    const re = new RegExp(`\\b${skill.toLowerCase().replace(/[.+]/g, '\\$&')}\\b`);
    if (re.test(t)) found.push(skill);
  }
  return [...new Set(found)];
}

export function fallbackResumeAnalysis(text) {
  const lower = text.toLowerCase();
  const skills = extractSkills(text);

  const hasSection = (re) => re.test(lower);
  const education = [];
  const projects = [];
  const experience = [];
  const certifications = [];
  const lines = text.split('\n');

  const degreeRe = /(b\.?tech|bca|bsc|bachelor|mca|msc|master|be\b|b\.e|diploma|phd|12th|10th|higher secondary)/i;
  const eduKeywords = ['education', 'university', 'college', 'school', 'degree', 'cgpa', 'gpa'];
  const projKeywords = ['project', 'built', 'developed', 'created', 'designed', 'implemented'];
  const expKeywords = ['intern', 'worked', 'experience', 'freelance', 'assistant', 'trainee', 'role'];
  const certKeywords = ['certif', 'certificate', 'completed course', 'google', 'aws', 'azure', 'coursera', 'udemy'];

  for (const line of lines) {
    const l = line.trim();
    if (!l || l.length < 4) continue;
    if (degreeRe.test(l) || eduKeywords.some((k) => lower.includes(k))) {
      if (line.length < 200) education.push(l.slice(0, 120));
    }
    if (projKeywords.some((k) => l.toLowerCase().includes(k))) projects.push(l.slice(0, 120));
    if (expKeywords.some((k) => l.toLowerCase().includes(k))) experience.push(l.slice(0, 120));
    if (certKeywords.some((k) => l.toLowerCase().includes(k))) certifications.push(l.slice(0, 120));
  }

  const email = /[\w.-]+@[\w.-]+\.\w+/.test(lower);
  const phone = /(\+?\d[\d\s-]{8,}\d)/.test(text);
  const hasSummary = /(summary|objective|profile|about me)/i.test(lower);
  const quantified = /\d+\s*(%|projects|users|sales|students|classes|downloads)/i.test(text);
  const sections = ['education', 'skills', 'project', 'experience', 'certif'].filter((s) => lower.includes(s)).length;
  const words = text.trim().split(/\s+/).length;
  const atsFriendly = sections >= 3 && email && words >= 200;

  let score = 30;
  if (email) score += 8;
  if (phone) score += 5;
  if (hasSummary) score += 7;
  if (sections >= 3) score += 15;
  if (quantified) score += 8;
  if (skills.length >= 5) score += 12;
  if (skills.length >= 10) score += 8;
  if (projects.length) score += 7;
  if (experience.length) score += 5;
  if (certifications.length) score += 3;
  score = Math.min(100, Math.round(score));

  const strengths = [];
  if (skills.length >= 5) strengths.push(`${skills.length} relevant skills listed (${skills.slice(0, 5).join(', ')})`);
  if (projects.length) strengths.push(`You showcase ${projects.length} project${projects.length > 1 ? 's' : ''}`);
  if (experience.length) strengths.push(`You include ${experience.length} work experience entr${experience.length > 1 ? 'ies' : 'y'}`);
  if (quantified) strengths.push('You use quantified achievements, which recruiters love');
  if (atsFriendly) strengths.push('The layout is ATS-friendly with clear sections');
  if (!strengths.length) strengths.push('You have started your resume — adding more sections will strengthen it');

  const weaknesses = [];
  if (!email) weaknesses.push('Missing contact email');
  if (!hasSummary) weaknesses.push('No professional summary at the top');
  if (sections < 3) weaknesses.push('Fewer than 3 clear sections (education/skills/projects)');
  if (!quantified) weaknesses.push('No quantified achievements — add numbers');
  if (words < 250) weaknesses.push('Resume is short — expand with projects and details');

  const missingSkills = [
    'Machine Learning', 'Deep Learning', 'LLMs / Generative AI', 'Docker', 'Cloud (AWS)', 'Data Structures & Algorithms',
  ].filter((s) => !skills.includes(s)).slice(0, 4);

  const improvements = [];
  if (!hasSummary) improvements.push('Add a 2–3 line professional summary with your career goal');
  if (!quantified) improvements.push('Add numbers: "built X, improved Y by Z%"');
  if (projects.length === 0) improvements.push('Add 2–3 projects with tech stacks and outcomes');
  if (missingSkills.length) improvements.push(`Learn and add: ${missingSkills.slice(0, 2).join(', ')}`);
  improvements.push('Keep it to one page for entry-level roles');

  return {
    score,
    parsed: {
      education: [...new Set(education)].slice(0, 5),
      skills: skills.slice(0, 20),
      projects: [...new Set(projects)].slice(0, 5),
      experience: [...new Set(experience)].slice(0, 5),
      certifications: [...new Set(certifications)].slice(0, 5),
    },
    strengths,
    weaknesses,
    missingSkills,
    improvements,
    atsFriendly,
  };
}

export function fallbackResumeAlignment(resumeSkills, opp) {
  const required = (opp.skillsRequired || []).map((s) => normalizeText(s));
  if (!required.length) return { alignment: 85, matched: [], missing: [] };
  const matched = required.filter((r) => resumeSkills.some((s) => normalizeText(s).includes(r) || r.includes(normalizeText(s))));
  const missing = required.filter((r) => !matched.includes(r));
  const alignment = Math.round((matched.length / required.length) * 100);
  return { alignment, matched, missing };
}

// ---------------------------------------------------------------------------
// 5. Skill gap
// ---------------------------------------------------------------------------
export function skillGapFromProfile(profile, careerGoal) {
  const roadmap = ROADMAPS[careerGoal] || ROADMAPS['Software Engineer'];
  const have = new Set((profile.skills || []).map((s) => normalizeText(s.name)));
  const gaps = [];
  for (const step of roadmap) {
    const key = step.split(' ')[0];
    if (!have.has(normalizeText(key)) && !have.has(normalizeText(step))) gaps.push(step);
  }
  return {
    careerGoal,
    roadmap,
    gaps,
    recommended: gaps[0] || 'Advanced project work',
    have: (profile.skills || []).map((s) => s.name),
  };
}

export function resourcesForSkill(skill) {
  const base = {
    courses: [
      `"${skill} Fundamentals" on Coursera / Udemy`,
      `YouTube crash course on ${skill}`,
      `FreeCodeCamp / Kaggle Learn path for ${skill}`,
    ],
    projects: [
      `Build a small ${skill} project this week (starter ideas: CLI tool, dashboard, API)`,
      `Contribute a ${skill}-related feature to an open-source repo`,
    ],
    hackathons: ['Participate in a 48-hour hackathon and use this skill'],
    internships: [`Apply for internships that explicitly list ${skill}`],
    training: [`Complete a ${skill} certification before your next application cycle`],
  };
  return base;
}

// ---------------------------------------------------------------------------
// 6. Roadmap
// ---------------------------------------------------------------------------
export function fallbackRoadmap(careerGoal, profileSkills) {
  const steps = ROADMAPS[careerGoal] || ROADMAPS['Software Engineer'];
  const have = new Set((profileSkills || []).map((s) => normalizeText(s.name)));
  return steps.map((skill, i) => {
    const key = skill.split(' ')[0];
    const done = have.has(normalizeText(key)) || have.has(normalizeText(skill));
    const inProgress = !done && (profileSkills || []).some((s) => normalizeText(s.name).includes(key));
    return {
      skill,
      order: i,
      status: done ? 'Completed' : inProgress ? 'Learning' : 'Not Started',
    };
  });
}

// ---------------------------------------------------------------------------
// 7. Projects
// ---------------------------------------------------------------------------
export function fallbackProjects(profile) {
  const skills = (profile.skills || []).map((s) => s.name);
  const has = (s) => skills.some((k) => normalizeText(k).includes(normalizeText(s)));
  const goal = normalizeText(profile.careerGoal || '');
  const projects = [];

  if (has('python') || has('ai') || goal.includes('ai') || goal.includes('data') || goal.includes('ml')) {
    projects.push({
      title: 'AI Resume Analyzer',
      difficulty: 'Medium',
      time: '2 weeks',
      skillsGained: ['Python', 'LLM / NLP', 'API Design'],
      techStack: ['Python', 'LLM API', 'React', 'MongoDB'],
      features: ['Extract text from PDF resumes', 'Score resumes with an LLM', 'Suggest improvements', 'Compare resume vs job description'],
      portfolioValue: 'High — shows applied AI skills end-to-end',
    });
    projects.push({
      title: 'Student Attendance & Deadline Tracker with AI Insights',
      difficulty: 'Medium',
      time: '3 weeks',
      skillsGained: ['Full-stack', 'MongoDB', 'Data Visualization'],
      techStack: ['React', 'Node.js', 'MongoDB'],
      features: ['Attendance dashboards', 'Deadline reminders', 'AI weekly summaries'],
      portfolioValue: 'High — solves a real campus problem',
    });
  }
  if (has('react') || has('javascript') || has('node')) {
    projects.push({
      title: 'Opportunity Discovery Hub',
      difficulty: 'Medium',
      time: '2 weeks',
      skillsGained: ['React', 'REST APIs', 'Search & filters'],
      techStack: ['React', 'Node.js', 'MongoDB'],
      features: ['Filtered opportunity listings', 'Save & track applications', 'Smart match badges'],
      portfolioValue: 'Medium — demonstrates product thinking',
    });
  }
  if (has('python') || has('sql')) {
    projects.push({
      title: 'Career Skill-Gap Dashboard',
      difficulty: 'Easy',
      time: '1 week',
      skillsGained: ['Python', 'SQL', 'Visualization'],
      techStack: ['Python', 'Pandas', 'Streamlit'],
      features: ['Map skills to career paths', 'Visual progress bars', 'Learning recommendations'],
      portfolioValue: 'Medium — shows data analysis skills',
    });
  }
  projects.push({
    title: 'Personal Portfolio & Blog',
    difficulty: 'Easy',
    time: '1 week',
    skillsGained: ['Web development', 'Writing', 'Personal branding'],
    techStack: ['HTML/CSS', 'React'],
    features: ['Projects gallery', 'Blog posts on your learning journey', 'Contact form'],
    portfolioValue: 'High — every recruiter checks your portfolio',
  });
  return projects.slice(0, 4);
}

// ---------------------------------------------------------------------------
// 8. Notice summary
// ---------------------------------------------------------------------------
export function fallbackNoticeSummary(title, content) {
  const text = `${title}. ${content}`;
  const dates = [...text.matchAll(/\b(\d{1,2})(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[,\s]*\s*(\d{4})?\b/gi)]
    .map((m) => m[0]).slice(0, 5);
  const isoDates = [...text.matchAll(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b/g)].map((m) => m[0]).slice(0, 5);
  const allDates = [...new Set([...dates, ...isoDates])];
  const deadlineMatch = text.match(/(?:deadline|last date|last day|due)[^.\n]{0,80}/i);
  const actionMatch = text.match(/(?:submit|fill|register|apply|report|bring|contact|deposit)[^.\n]{0,80}/i);
  const examMatch = text.match(/(?:exam|examination|test|assessment)[^.\n]{0,100}/i);
  const sentences = content.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
  const summary = sentences.slice(0, 2).join(' ') || content.slice(0, 200);
  return {
    summary,
    importantDates: allDates,
    deadline: deadlineMatch ? deadlineMatch[0].trim() : (allDates[0] || ''),
    actionRequired: actionMatch ? actionMatch[0].trim() : '',
    examDetails: examMatch ? examMatch[0].trim() : '',
  };
}

// ---------------------------------------------------------------------------
// 9. Application assistant
// ---------------------------------------------------------------------------
export function fallbackApplicationAssist(profile, opp, resumeText) {
  const name = profile.userName || 'the candidate';
  const skills = (profile.skills || []).slice(0, 5).map((s) => s.name).join(', ');
  const career = profile.careerGoal || 'a career in technology';
  const intro = `I'm ${name}, a ${profile.course || ''} student currently in semester ${profile.semester || ''}, passionate about becoming ${career}.`;
  const why = `You should select me because I bring ${skills || 'a strong willingness to learn'}, a track record of completing projects, and the discipline to show up consistently. I'm particularly motivated by ${opp.title} at ${opp.organization} because it directly aligns with my goal of ${career}.`;
  const cover = `${intro}\n\nI'm writing to apply for the ${opp.category} opportunity "${opp.title}" at ${opp.organization}. My skills in ${skills || 'relevant technologies'} and my interest in ${career} make me a strong fit for this role.\n\n${why}\n\nI'm excited about the chance to contribute, learn from the team, and grow. Thank you for considering my application.\n\nBest regards,\n${name}`;
  return { coverLetter: cover, introduction: intro, whyYou: why };
}

// ---------------------------------------------------------------------------
// 10. Weekly review
// ---------------------------------------------------------------------------
export function fallbackWeeklyReview(data) {
  const attended = data.classesAttended ?? 0;
  const total = data.classesTotal ?? 0;
  const completed = data.tasksCompleted ?? 0;
  const pending = data.tasksTotal ?? 0;
  const insights = [];
  const pct = total ? Math.round((attended / total) * 100) : 100;
  if (pct >= 80) insights.push('Your academic consistency improved this week — keep attending regularly.');
  else if (pct < 75) insights.push(`Your attendance dipped to ${pct}%. Prioritize attending every class next week to protect your attendance.`);
  if (pending > 0 && completed > 0) insights.push(`You completed ${completed}/${completed + pending} tasks — try to clear the remaining ${pending} early next week.`);
  if (data.applications > 0) insights.push(`You submitted ${data.applications} application${data.applications > 1 ? 's' : ''} — great momentum on the career front.`);
  if (data.skillsPracticed && data.skillsPracticed.length) insights.push(`You practiced ${data.skillsPracticed.join(', ')} — consistent skill practice compounds fast.`);
  if (!insights.length) insights.push('A steady week. Next week, try adding one career-focused action: apply to an opportunity or build a small project.');
  return insights.join(' ');
}

// ---------------------------------------------------------------------------
// 11. Profile insights
// ---------------------------------------------------------------------------
export function fallbackProfileInsights(profile) {
  const skills = (profile.skills || []).map((s) => s.name);
  const goal = profile.careerGoal || '';
  const out = [];
  if (goal) {
    const gaps = skillGapFromProfile(profile, goal);
    if (gaps.gaps.length) out.push(`Your profile is building toward ${goal}, but you're missing ${gaps.gaps.slice(0, 2).join(' and ')}. Adding a project using these skills would strengthen your applications significantly.`);
    else out.push(`Your profile is strong for ${goal} — now focus on projects and applications to convert it into offers.`);
  } else {
    out.push('Set a career goal so I can personalise your recommendations and roadmap.');
  }
  if (skills.includes('React') || skills.includes('JavaScript') || skills.includes('Frontend')) {
    if (goal && normalizeText(goal).includes('ai')) out.push('Your frontend skills are valuable for AI roles too — AI products need great interfaces.');
  }
  if (!profile.resume) out.push('You have not uploaded a resume yet — it unlocks resume scoring and apply-with-AI.');
  return out.join(' ');
}

// ---------------------------------------------------------------------------
// 12. Natural language search → structured filters
// ---------------------------------------------------------------------------
export function fallbackSearchParse(query) {
  const q = normalizeText(query);
  const filters = { text: query, category: null, mode: null, location: null, skills: [], urgent: null };
  const categories = {
    internship: ['internship', 'intern', 'internships'],
    hackathon: ['hackathon', 'hackathons'],
    job: ['job', 'jobs', 'placement', 'full-time'],
    scholarship: ['scholarship', 'scholarships'],
    training: ['training', 'course', 'program'],
    workshop: ['workshop'],
    competition: ['competition', 'contest'],
    fellowship: ['fellowship'],
    research: ['research'],
    conference: ['conference'],
  };
  for (const [cat, terms] of Object.entries(categories)) {
    if (terms.some((t) => q.includes(t))) { filters.category = cat; break; }
  }
  if (q.includes('remote')) filters.mode = 'remote';
  if (q.includes('onsite') || q.includes('on-site')) filters.mode = 'onsite';
  if (q.includes('hybrid')) filters.mode = 'hybrid';
  if (q.includes('this week') || q.includes('closing soon') || q.includes('urgent')) filters.urgent = true;
  const locMatch = q.match(/(?:in|near|based in)\s+([a-z]{3,20})/);
  if (locMatch) filters.location = locMatch[1];
  for (const skill of SKILL_DICT) {
    if (q.includes(normalizeText(skill))) filters.skills.push(skill);
  }
  return filters;
}

// ---------------------------------------------------------------------------
// 13. Task prioritization
// ---------------------------------------------------------------------------
export function fallbackPrioritize(tasks) {
  const order = { high: 3, medium: 2, low: 1 };
  const now = Date.now();
  return [...(tasks || [])]
    .filter((t) => t.status !== 'done')
    .map((t) => ({
      ...t,
      priorityScore:
        (order[t.priority] || 2) * 10 +
        (t.dueDate ? Math.max(0, 40 - Math.floor((new Date(t.dueDate) - now) / 86400000) * 5) : 15),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

// ---------------------------------------------------------------------------
// 14. Proactive actions (rule based on real stored data)
// ---------------------------------------------------------------------------
export function fallbackProactiveActions({ deadlines, topOpportunities, attendance, applications }) {
  const actions = [];
  for (const d of (deadlines || []).slice(0, 5)) {
    if (d.diff === 0 || d.diff === 1) {
      actions.push({ type: 'deadline', priority: 'high', title: `${d.label} is due ${relativeDay(d.date)}`, message: `Complete "${d.label}" before it's due ${relativeDay(d.date)}.`, link: d.link || '/assignments' });
    }
  }
  for (const opp of (topOpportunities || []).slice(0, 3)) {
    const applied = (applications || []).some((a) => String(a.opportunity) === String(opp.id));
    const diff = daysBetween(new Date(), opp.deadline);
    if (!applied && opp.score >= 80 && diff >= 0 && diff <= 3) {
      actions.push({ type: 'opportunity', priority: 'high', title: `High-match opportunity closing soon (${opp.score}% match)`, message: `You haven't applied to "${opp.title}" at ${opp.organization} — it closes ${relativeDay(opp.deadline)}.`, link: `/opportunities/${opp.id}` });
    }
  }
  if (attendance?.overall && attendance.overall.health !== 'safe' && attendance.overall.total > 0) {
    actions.push({ type: 'attendance', priority: attendance.overall.health === 'critical' ? 'high' : 'medium', title: `Attendance is ${attendance.overall.percentage}%`, message: `Attend the next ${attendance.overall.needed || 1} classes to reach your ${attendance.overall.target}% target.`, link: '/attendance' });
  }
  return actions.slice(0, 4);
}

export { MATCH_WEIGHTS, minutesToTime };
