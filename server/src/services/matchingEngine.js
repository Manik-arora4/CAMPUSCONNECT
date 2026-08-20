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
  const studentSkills = student.skills || [];
  const studentSkillNames = normList(studentSkills.map((s) => s.name));
  
  // If opportunity lists required skills, check overlap strictly
  if (required.length && studentSkillNames.length) {
    let earned = 0;
    for (const req of required) {
      const match = studentSkills.find((s) => {
        const n = normalizeText(s.name);
        return n === req || n.includes(req) || req.includes(n);
      });
      if (match) earned += LEVEL_WEIGHT[match.level] || 0.75;
    }
    const ratio = earned / required.length;
    // If no skills match at all, heavily penalize
    if (ratio === 0) return 2;
    // Partial matches get proportional score
    return Math.round(Math.min(35, ratio * 35));
  }
  
  // If opportunity has no skill requirements AND student has defined skills,
  // give LOW score — generic opportunities shouldn't outrank skill-specific ones
  if (!required.length && studentSkillNames.length) return 5;
  
  // Neither has skills specified → neutral
  return 18;
}

function eligibilityScore(student, opp) {
  let score = 0;
  const elig = normalizeText(opp.eligibility || '');
  const course = normalizeText(student.course || '');
  const degree = normalizeText(student.degree || '');
  const career = normalizeText(student.careerGoal || '');
  const restrictions = normList(opp.courseRestrictions);
  const degreeRestrictions = normList(opp.degreeRestrictions);
  const exp = student.experienceYears || 0;
  const year = student.year || Math.ceil((student.semester || 1) / 2);
  const semester = student.semester || 1;

  if (!elig && !restrictions.length && !degreeRestrictions.length) score += 12; // open to all

  // Degree check (structured)
  if (degreeRestrictions.length) {
    const match = degreeRestrictions.some((r) => r === degree || degree.includes(r) || r.includes(degree));
    score += match ? 6 : 0;
  }

  // Course check (structured)
  if (restrictions.length) {
    const match = restrictions.some((r) => r === course || course.includes(r) || r.includes(course));
    score += match ? 6 : 0;
  } else if (elig) {
    if (elig.includes(course) && course) score += 6;
    if (elig.includes('all') || elig.includes('any course') || elig.includes('any branch')) score += 5;
    if (career && elig.includes(career)) score += 4;
  }

  // Year/Semester check (structured)
  if (opp.yearMin || opp.yearMax) {
    if (year >= (opp.yearMin || 1) && year <= (opp.yearMax || 4)) score += 4;
  } else {
    const semMatch = elig.match(/(\d+)(?:st|nd|rd|th)?\s*semester/);
    if (semMatch && Number(semMatch[1]) <= semester) score += 3;
  }

  // experience fit
  if (opp.experienceLevel === 'fresher' && exp <= 1) score += 4;
  else if (opp.experienceLevel === 'junior' && exp <= 3) score += 4;
  else if (opp.experienceLevel === 'mid' && exp >= 1) score += 3;
  else if (!opp.experienceLevel || opp.experienceLevel === 'any') score += 3;

  return Math.min(20, score);
}

function careerScore(student, opp) {
  const career = normalizeText(student.careerGoal || '');
  if (!career) return 6; // neutral
  const keywords = CAREER_KEYWORDS[student.careerGoal] || [];
  const text = normalizeText([opp.title, opp.description, opp.eligibility, opp.tags?.join(' '), opp.skillsRequired?.join(' ')].filter(Boolean).join(' '));
  const matchCount = keywords.filter((k) => text.includes(k)).length;
  const ratio = keywords.length ? matchCount / keywords.length : 0;
  // Also check direct career goal match in opportunity text
  const directMatch = text.includes(career);
  const bonus = directMatch || normalizeText(opp.category) === career ? 1 : 0;
  // If no keywords match at all AND no direct match, penalize
  if (ratio === 0 && !directMatch) return 2;
  return Math.min(15, 4 + ratio * 8 + bonus * 3);
}

function interestsScore(student, opp) {
  const interests = normList(student.interests || []);
  if (!interests.length) return 5;
  // Build opp relevance text from title, description, tags, skills, category
  const oppText = normList([
    opp.title, opp.description, opp.organization,
    ...(opp.tags || []), ...(opp.skillsRequired || []), opp.category,
  ].filter(Boolean));
  if (!oppText.length) return 3;
  // Check how many of the student's interests appear in the opportunity
  const matched = interests.filter((interest) =>
    oppText.some((t) => t.includes(interest) || interest.includes(t))
  ).length;
  const ratio = matched / interests.length;
  // If NONE of the student's interests match, penalize
  if (ratio === 0) return 1;
  // Strong match if most interests align
  return Math.round(Math.min(10, 3 + ratio * 7));
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

function computeEligibilityStatus(student, opp) {
  const checks = [];
  const degree = normalizeText(student.degree || '');
  const course = normalizeText(student.course || '');
  const year = student.year || Math.ceil((student.semester || 1) / 2);
  const semester = student.semester || 1;
  const studentSkills = (student.skills || []).map((s) => normalizeText(s.name));
  const exp = student.experienceYears || 0;

  // Degree check
  const degreeRestrictions = normList(opp.degreeRestrictions);
  if (degreeRestrictions.length) {
    const match = degreeRestrictions.some((r) => r === degree || degree.includes(r) || r.includes(degree));
    checks.push({ label: `${student.degree || 'Degree'} requirement`, status: match ? 'pass' : 'fail' });
  }

  // Course check
  const courseRestrictions = normList(opp.courseRestrictions);
  if (courseRestrictions.length) {
    const match = courseRestrictions.some((r) => r === course || course.includes(r) || r.includes(course));
    checks.push({ label: `${student.course || 'Course'} eligibility`, status: match ? 'pass' : 'fail' });
  }

  // Year check
  if (opp.yearMin || opp.yearMax) {
    const min = opp.yearMin || 1;
    const max = opp.yearMax || 4;
    const inRange = year >= min && year <= max;
    checks.push({ label: `Year ${min}–${max} required`, status: inRange ? 'pass' : 'fail' });
  }

  // Mandatory skills check
  const mandatory = normList(opp.mandatorySkills || []);
  if (mandatory.length) {
    const have = mandatory.filter((s) => studentSkills.some((sk) => sk.includes(s) || s.includes(sk)));
    const missing = mandatory.filter((s) => !have.includes(s));
    checks.push({ label: `Required skills: ${mandatory.join(', ')}`, status: missing.length === 0 ? 'pass' : missing.length <= 1 ? 'warn' : 'fail' });
  }

  // Experience check
  if (opp.experienceLevel && opp.experienceLevel !== 'any') {
    let expOk = false;
    if (opp.experienceLevel === 'fresher') expOk = exp <= 1;
    else if (opp.experienceLevel === 'junior') expOk = exp <= 3;
    else if (opp.experienceLevel === 'mid') expOk = exp >= 1 && exp <= 5;
    else if (opp.experienceLevel === 'senior') expOk = exp >= 3;
    else expOk = true;
    checks.push({ label: `${opp.experienceLevel} experience level`, status: expOk ? 'pass' : 'fail' });
  }

  // Determine overall status
  const hasFail = checks.some((c) => c.status === 'fail');
  const hasWarn = checks.some((c) => c.status === 'warn');
  const status = hasFail ? 'not_eligible' : hasWarn ? 'partially_eligible' : 'eligible';

  return { status, checks };
}

/**
 * Compute a deterministic match score between a student profile and an opportunity.
 * @returns {{score:number, breakdown:object, reasons:string[], eligibility:{status,checks}}}
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
  const eligibility = computeEligibilityStatus(student, opp);
  // If not eligible (mandatory fail), cap the score
  const finalScore = eligibility.status === 'not_eligible' ? Math.min(score, 45) : score;
  return { score: clamp(finalScore, 0, 100), breakdown, reasons, eligibility };
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
  if (student.degree || student.course) {
    const restrictions = normList(opp.courseRestrictions || []);
    const degreeRestrictions = normList(opp.degreeRestrictions || []);
    const courseOk = !restrictions.length || restrictions.some((r) => r === normalizeText(student.course));
    const degreeOk = !degreeRestrictions.length || degreeRestrictions.some((r) => r === normalizeText(student.degree));
    if (courseOk && degreeOk) reasons.push(`you are a ${student.degree || student.course} student which fits the eligibility`);
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
 * When student has skills/interests defined, filter out low-relevance results
 * so they only see opportunities matching their profile.
 */
export function rankOpportunities(student, opportunities, limit = 12) {
  const hasSkills = (student.skills || []).length > 0;
  const hasInterests = (student.interests || []).length > 0;
  const hasProfile = hasSkills || hasInterests || student.careerGoal;
  
  let ranked = opportunities
    .map((opp) => ({ ...computeMatch(student, opp), opportunity: opp }))
    .sort((a, b) => b.score - a.score);
  
  // If student has a defined profile, filter out low-relevance opportunities
  // so they only see what matches their skills/interests/career
  if (hasProfile) {
    ranked = ranked.filter((r) => r.score >= 20);
  }
  
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
