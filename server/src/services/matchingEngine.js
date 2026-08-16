import { normalizeText, daysBetween, clamp, unique } from '../utils/helpers.js';

// Weights per spec section 12
export const MATCH_WEIGHTS = {
  skills: 35,
  eligibility: 20,
  career: 15,
  interests: 10,
  course: 10,
  location: 5,
  deadline: 5,
};

const LEVEL_WEIGHT = { Advanced: 1, Intermediate: 0.75, Beginner: 0.5 };

// Career goal → related keyword groups (used for career-goal alignment)
const CAREER_KEYWORDS = {
  'AI Engineer': ['ai', 'machine learning', 'ml', 'deep learning', 'llm', 'generative', 'neural', 'tensorflow', 'pytorch', 'nlp', 'artificial intelligence'],
  'Software Engineer': ['software', 'developer', 'coding', 'programming', 'full stack', 'frontend', 'backend', 'web', 'api', 'react', 'node', 'engineering'],
  'Data Scientist': ['data', 'analytics', 'statistics', 'python', 'sql', 'machine learning', 'visualization'],
  'Cybersecurity Engineer': ['security', 'cyber', 'ethical hacking', 'network', 'vulnerability', 'penetration'],
  'Product Manager': ['product', 'management', 'business', 'roadmap', 'startup'],
  'UI/UX Designer': ['design', 'ui', 'ux', 'figma', 'user experience', 'interface'],
  'Data Analyst': ['data', 'analytics', 'sql', 'excel', 'dashboard', 'visualization'],
  'Cloud Engineer': ['cloud', 'aws', 'azure', 'devops', 'kubernetes', 'docker'],
  'Entrepreneur': ['startup', 'business', 'entrepreneur', 'founder', 'venture'],
  'Full Stack Developer': ['full stack', 'web', 'react', 'node', 'javascript', 'frontend', 'backend'],
  'Backend Developer': ['backend', 'api', 'node', 'java', 'python', 'server', 'database'],
  'Frontend Developer': ['frontend', 'react', 'ui', 'javascript', 'css', 'web'],
  'Mobile Developer': ['mobile', 'android', 'ios', 'flutter', 'react native'],
  'Machine Learning Engineer': ['machine learning', 'ml', 'deep learning', 'python', 'tensorflow', 'pytorch'],
  'DevOps Engineer': ['devops', 'cloud', 'docker', 'kubernetes', 'ci/cd'],
};

const CATEGORY_INTERESTS = {
  hackathon: ['ai', 'ml', 'web', 'coding', 'design', 'hackathon', 'technology', 'cybersecurity'],
  internship: ['ai', 'ml', 'web', 'data', 'business', 'finance', 'marketing', 'design', 'cybersecurity'],
  job: ['ai', 'ml', 'web', 'data', 'business', 'finance', 'marketing', 'design', 'cybersecurity'],
  scholarship: ['education', 'research', 'academic'],
  research: ['research', 'ai', 'ml', 'data', 'science'],
  training: ['education', 'skills', 'learning'],
  workshop: ['skills', 'learning', 'design'],
  fellowship: ['leadership', 'research', 'social'],
  competition: ['competitive', 'coding', 'design'],
  conference: ['networking', 'technology', 'research'],
};

function normList(items) {
  return (items || []).map((s) => normalizeText(s));
}

function overlap(studentList, oppList) {
  const a = normList(studentList);
  const b = normList(oppList);
  if (!b.length) return null; // opportunity lists nothing → not applicable
  if (!a.length) return 0;
  const matched = b.filter((x) => a.some((y) => y.includes(x) || x.includes(y))).length;
  return matched / b.length;
}

function skillsScore(student, opp) {
  const required = normList(opp.skillsRequired);
  if (!required.length) return 35; // no skills required → full marks
  const studentSkills = student.skills || [];
  let earned = 0;
  for (const req of required) {
    const match = studentSkills.find((s) => {
      const n = normalizeText(s.name);
      return n === req || n.includes(req) || req.includes(n);
    });
    if (match) earned += LEVEL_WEIGHT[match.level] || 0.75;
  }
  return Math.min(35, (earned / required.length) * 35);
}

function eligibilityScore(student, opp) {
  let score = 0;
  const elig = normalizeText(opp.eligibility || '');
  const course = normalizeText(student.course || '');
  const career = normalizeText(student.careerGoal || '');
  const restrictions = normList(opp.courseRestrictions);
  const exp = student.experienceYears || 0;

  if (!elig && !restrictions.length) score += 12; // open to all

  if (restrictions.length) {
    const match = restrictions.some((r) => r === course || course.includes(r) || r.includes(course));
    score += match ? 10 : 0;
  } else if (elig) {
    if (elig.includes(course) && course) score += 10;
    if (elig.includes('all') || elig.includes('any course') || elig.includes('any branch')) score += 8;
    if (career && elig.includes(career)) score += 6;
    // semester gates like "2nd semester"
    const semMatch = elig.match(/(\d+)(?:st|nd|rd|th)?\s*semester/);
    if (semMatch && Number(semMatch[1]) <= (student.semester || 9)) score += 4;
  }

  // experience fit
  if (opp.experienceLevel === 'fresher' && exp <= 1) score += 8;
  else if (opp.experienceLevel === 'junior' && exp <= 3) score += 8;
  else if (opp.experienceLevel === 'mid' && exp >= 1) score += 6;
  else if (!opp.experienceLevel || opp.experienceLevel === 'any') score += 6;

  return Math.min(20, score);
}

function careerScore(student, opp) {
  const career = normalizeText(student.careerGoal || '');
  if (!career) return 6; // neutral
  const keywords = CAREER_KEYWORDS[student.careerGoal] || [];
  const text = normalizeText([opp.title, opp.description, opp.eligibility, opp.tags?.join(' ')].filter(Boolean).join(' '));
  const matchCount = keywords.filter((k) => text.includes(k)).length;
  const ratio = keywords.length ? matchCount / keywords.length : 0;
  // also direct title/category hits
  const bonus = text.includes(career) || normalizeText(opp.category) === career ? 1 : 0;
  return Math.min(15, 6 + ratio * 7 + bonus * 2);
}

function interestsScore(student, opp) {
  const interests = normList(student.interests || []);
  if (!interests.length) return 5;
  const catTerms = CATEGORY_INTERESTS[opp.category] || [];
  const oppText = normList([...opp.tags, ...opp.skillsRequired]);
  const all = [...catTerms, ...oppText];
  if (!all.length) return 5;
  const matched = all.filter((t) => interests.some((i) => i.includes(t) || t.includes(i))).length;
  return Math.min(10, 4 + (matched / all.length) * 6);
}

function courseScore(student, opp) {
  const course = normalizeText(student.course || '');
  const restrictions = normList(opp.courseRestrictions);
  if (restrictions.length) {
    return restrictions.some((r) => r === course || course.includes(r) || r.includes(course)) ? 10 : 3;
  }
  // semester hint
  const elig = normalizeText(opp.eligibility || '');
  if (elig.includes('final year') && (student.semester || 0) >= 6) return 8;
  return 7;
}

function locationScore(student, opp) {
  const pref = student.remotePreference || 'any';
  if (pref === 'any') return 3;
  if (pref === opp.mode) return 5;
  if (opp.mode === 'hybrid') return 4;
  return 1;
}

function deadlineScore(opp) {
  const diff = daysBetween(new Date(), opp.deadline);
  if (diff < 0) return 0;
  if (diff <= 3) return 2;
  if (diff <= 7) return 3;
  if (diff <= 14) return 4;
  if (diff <= 30) return 4.5;
  return 5;
}

/**
 * Compute a deterministic match score between a student profile and an opportunity.
 * @returns {{score:number, breakdown:object, reasons:string[]}}
 */
export function computeMatch(student, opp) {
  const breakdown = {
    skills: Math.round(skillsScore(student, opp)),
    eligibility: Math.round(eligibilityScore(student, opp)),
    career: Math.round(careerScore(student, opp)),
    interests: Math.round(interestsScore(student, opp)),
    course: Math.round(courseScore(student, opp)),
    location: Math.round(locationScore(student, opp)),
    deadline: Math.round(deadlineScore(opp)),
  };
  const score = Math.round(
    Object.entries(breakdown).reduce((acc, [k, v]) => acc + v, 0)
  );
  const reasons = buildReasons(student, opp, breakdown);
  return { score: clamp(score, 0, 100), breakdown, reasons };
}

function buildReasons(student, opp, b) {
  const reasons = [];
  const studentSkills = normList((student.skills || []).map((s) => s.name));
  const required = normList(opp.skillsRequired || []);
  const matchedSkills = required.filter((r) => studentSkills.some((s) => s.includes(r) || r.includes(s)));
  if (matchedSkills.length) {
    reasons.push(`you have ${matchedSkills.slice(0, 3).join(', ')} skills which this ${opp.category} requires`);
  } else if (!required.length) {
    reasons.push(`this ${opp.category} has no strict skill requirements`);
  }
  if (student.course) {
    const restrictions = normList(opp.courseRestrictions || []);
    const ok = !restrictions.length || restrictions.some((r) => r === normalizeText(student.course));
    if (ok) reasons.push(`you are a ${student.course} student which fits the eligibility`);
  }
  if (student.careerGoal && b.career >= 10) {
    reasons.push(`your career goal (${student.careerGoal}) aligns with this opportunity`);
  }
  if (student.interests && b.interests >= 7) {
    reasons.push(`it matches your interest in ${student.interests.slice(0, 2).join(' and ')}`);
  }
  const diff = daysBetween(new Date(), opp.deadline);
  if (diff >= 0 && diff <= 7) reasons.push(`the deadline is ${diff === 0 ? 'today' : `in ${diff} days`}, so acting now gives you a head start`);
  if (diff > 7) reasons.push(`you have ${diff} days until the deadline, enough time to prepare a strong application`);
  return unique(reasons).slice(0, 4);
}

/**
 * Rank a list of opportunities for a student, highest match first.
 */
export function rankOpportunities(student, opportunities, limit = 12) {
  const ranked = opportunities
    .map((opp) => ({ ...computeMatch(student, opp), opportunity: opp }))
    .sort((a, b) => b.score - a.score);
  return limit ? ranked.slice(0, limit) : ranked;
}

export function matchCategory(category) {
  return {
    internship: 'Internship',
    hackathon: 'Hackathon',
    job: 'Job',
    scholarship: 'Scholarship',
    training: 'Training',
    workshop: 'Workshop',
    competition: 'Competition',
    fellowship: 'Fellowship',
    research: 'Research',
    conference: 'Conference',
  }[category] || category;
}
