var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/src/config/env.js
var import_dotenv, import_path, import_url, import_meta, env, aiProvider;
var init_env = __esm({
  "server/src/config/env.js"() {
    import_dotenv = __toESM(require("dotenv"), 1);
    import_path = __toESM(require("path"), 1);
    import_url = require("url");
    import_meta = {};
    try {
      const __dirname2 = import_path.default.dirname((0, import_url.fileURLToPath)(import_meta.url));
      import_dotenv.default.config({ path: import_path.default.resolve(__dirname2, "../../.env") });
    } catch {
    }
    env = {
      PORT: Number(process.env.PORT || 5e3),
      NODE_ENV: process.env.NODE_ENV || "development",
      JWT_SECRET: process.env.JWT_SECRET || "super-secret-campusconnect-change-me",
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
      DATABASE_URL: process.env.DATABASE_URL || "",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
      GROQ_API_KEY: process.env.GROQ_API_KEY || "",
      NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || "",
      OLLAMA_URL: process.env.OLLAMA_URL || "http://localhost:11434",
      OLLAMA_MODEL: process.env.OLLAMA_MODEL || "llama3.2:1b",
      VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || "",
      VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || "",
      VAPID_EMAIL: process.env.VAPID_EMAIL || "mailto:campusconnect.ia@gmail.com",
      PUBLIC_URL: process.env.PUBLIC_URL || "http://localhost:5173",
      DEMO_ADMINS: (process.env.DEMO_ADMINS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    };
    aiProvider = () => env.NVIDIA_API_KEY ? "nvidia (Llama 3.1 8B)" : env.GEMINI_API_KEY ? "gemini" : env.GROQ_API_KEY ? "groq" : "ollama";
  }
});

// server/src/lib/prisma.js
function createClient() {
  try {
    let req;
    try {
      req = (0, import_node_module.createRequire)(import_meta2.url);
    } catch {
      if (typeof require !== "undefined") req = require;
    }
    if (!req) throw new Error("Cannot resolve require function");
    const { PrismaClient } = req("@prisma/client");
    return new PrismaClient({
      log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"]
    });
  } catch (err) {
    console.warn("[prisma] Failed to create client:", err.message);
    return null;
  }
}
function getPrisma() {
  if (!_prisma) _prisma = createClient();
  return _prisma;
}
var import_node_module, import_meta2, _prisma, prisma;
var init_prisma = __esm({
  "server/src/lib/prisma.js"() {
    import_node_module = require("node:module");
    import_meta2 = {};
    prisma = new Proxy({}, {
      get(_, prop) {
        const client3 = getPrisma();
        if (!client3) throw new Error("Prisma client not available");
        return client3[prop];
      }
    });
  }
});

// server/src/utils/userUtils.js
async function hashPassword(password) {
  const salt = await import_bcryptjs.default.genSalt(10);
  return import_bcryptjs.default.hash(password, salt);
}
async function comparePassword(candidate, hashed) {
  return import_bcryptjs.default.compare(candidate, hashed);
}
function toSafeUser(u) {
  if (!u) return null;
  const { password, resetToken, resetTokenExpiry, verificationToken, ...rest } = u;
  return {
    id: u.id,
    _id: u.id,
    ...rest
  };
}
var import_bcryptjs;
var init_userUtils = __esm({
  "server/src/utils/userUtils.js"() {
    import_bcryptjs = __toESM(require("bcryptjs"), 1);
  }
});

// server/src/utils/helpers.js
function startOfToday() {
  const d = /* @__PURE__ */ new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function daysBetween(a, b) {
  const ms = new Date(b).setHours(0, 0, 0, 0) - new Date(a).setHours(0, 0, 0, 0);
  return Math.round(ms / 864e5);
}
function timeToMinutes(t) {
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + (m || 0);
}
function minutesToTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function relativeDay(d) {
  const diff = daysBetween(/* @__PURE__ */ new Date(), d);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  if (diff < -1) return `${-diff} days ago`;
  return formatDate(d);
}
function unique(arr) {
  return [...new Set(arr)];
}
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
function normalizeText(s) {
  return String(s || "").toLowerCase().trim();
}
var init_helpers = __esm({
  "server/src/utils/helpers.js"() {
  }
});

// server/src/services/attendanceService.js
function summarizeSubject(records, target = ATTENDANCE_TARGET) {
  const total = records.length;
  const attended = records.filter((r) => r.status === "present").length;
  const missed = records.filter((r) => r.status === "absent").length;
  const percentage = total ? Math.round(attended / total * 100) : 0;
  const health = percentage >= target ? "safe" : percentage >= target - 10 ? "warning" : "critical";
  return {
    total,
    attended,
    missed,
    percentage,
    target,
    health
  };
}
function classesNeeded(summary) {
  const { attended, total, target } = summary;
  if (total === 0) return 0;
  if (attended / total * 100 >= target) return 0;
  const n = Math.ceil((target * total - 100 * attended) / (100 - target));
  return Math.max(0, n);
}
function forecast(summary, nextClasses) {
  const { attended, total, target } = summary;
  const result = [];
  for (let n = 0; n <= nextClasses; n++) {
    const projected = total + nextClasses;
    const projectedAttended = attended + n;
    const pct = projected ? Math.round(projectedAttended / projected * 100) : 0;
    result.push({ attendNext: n, projectedPercentage: pct, reachesTarget: pct >= target });
  }
  return result;
}
function buildAttendanceReport(subjectGroups, target = ATTENDANCE_TARGET) {
  const subjects = Object.entries(subjectGroups).map(([subjectName, records]) => {
    const summary = summarizeSubject(records, target);
    return {
      subject: subjectName,
      ...summary,
      needed: classesNeeded(summary),
      forecast: forecast(summary, 5)
    };
  });
  const overall = summarizeSubject(
    Object.values(subjectGroups).flat(),
    target
  );
  const trend = buildTrend(Object.values(subjectGroups).flat());
  return {
    subjects,
    overall: { ...overall, needed: classesNeeded(overall) },
    trend,
    target
  };
}
function buildTrend(records) {
  const buckets = /* @__PURE__ */ new Map();
  for (const r of records) {
    const d = new Date(r.date);
    const weekStart = new Date(d);
    weekStart.setHours(0, 0, 0, 0);
    const day = (d.getDay() + 6) % 7;
    weekStart.setDate(d.getDate() - day);
    const key = weekStart.toISOString().slice(0, 10);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(r);
  }
  return [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([week, recs]) => {
    const present = recs.filter((r) => r.status === "present").length;
    return { week, percentage: recs.length ? Math.round(present / recs.length * 100) : 0, total: recs.length };
  });
}
function healthMeta(health) {
  const meta = {
    safe: { label: "Safe", color: "#10b981", hint: "You are above your attendance target. Keep it up!" },
    warning: { label: "Warning", color: "#f59e0b", hint: "Attendance is below target \u2014 attend the next few classes to recover." },
    critical: { label: "Critical", color: "#ef4444", hint: "Attendance is dangerously low. Prioritize attending classes." }
  };
  return meta[health] || meta.warning;
}
function forecastMessage(overall, next = 5) {
  if (!overall.total) return "No attendance recorded yet.";
  const proj = forecast(overall, next);
  const ifAttendAll = proj.find((p) => p.attendNext === next);
  const msg = [];
  if (ifAttendAll) {
    msg.push(`If you attend your next ${next} classes, your attendance is projected to reach approximately ${ifAttendAll.projectedPercentage}%.`);
  }
  const miss2 = forecast({ ...overall, total: overall.total + 2 }, 0)[0];
  if (miss2) {
    const pct = miss2.projectedPercentage;
    if (pct < overall.target) {
      msg.push(`Missing the next 2 classes may push you below your ${overall.target}% target (${pct}%).`);
    }
  }
  return msg.join(" ");
}
var ATTENDANCE_TARGET;
var init_attendanceService = __esm({
  "server/src/services/attendanceService.js"() {
    init_helpers();
    ATTENDANCE_TARGET = 75;
  }
});

// server/src/services/matchingEngine.js
function normList(items) {
  return (items || []).map((s) => normalizeText(s));
}
function skillsScore(student, opp) {
  const required = normList(opp.skillsRequired);
  const studentSkills = student.skills || [];
  const studentSkillNames = normList(studentSkills.map((s) => s.name));
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
    if (ratio === 0) return 2;
    return Math.round(Math.min(35, ratio * 35));
  }
  if (!required.length && studentSkillNames.length) return 5;
  return 18;
}
function eligibilityScore(student, opp) {
  let score = 0;
  const elig = normalizeText(opp.eligibility || "");
  const course = normalizeText(student.course || "");
  const degree = normalizeText(student.degree || "");
  const career = normalizeText(student.careerGoal || "");
  const restrictions = normList(opp.courseRestrictions);
  const degreeRestrictions = normList(opp.degreeRestrictions);
  const exp = student.experienceYears || 0;
  const year = student.year || Math.ceil((student.semester || 1) / 2);
  const semester = student.semester || 1;
  if (!elig && !restrictions.length && !degreeRestrictions.length) score += 12;
  if (degreeRestrictions.length) {
    const match = degreeRestrictions.some((r) => r === degree || degree.includes(r) || r.includes(degree));
    score += match ? 6 : 0;
  }
  if (restrictions.length) {
    const match = restrictions.some((r) => r === course || course.includes(r) || r.includes(course));
    score += match ? 6 : 0;
  } else if (elig) {
    if (elig.includes(course) && course) score += 6;
    if (elig.includes("all") || elig.includes("any course") || elig.includes("any branch")) score += 5;
    if (career && elig.includes(career)) score += 4;
  }
  if (opp.yearMin || opp.yearMax) {
    if (year >= (opp.yearMin || 1) && year <= (opp.yearMax || 4)) score += 4;
  } else {
    const semMatch = elig.match(/(\d+)(?:st|nd|rd|th)?\s*semester/);
    if (semMatch && Number(semMatch[1]) <= semester) score += 3;
  }
  if (opp.experienceLevel === "fresher" && exp <= 1) score += 4;
  else if (opp.experienceLevel === "junior" && exp <= 3) score += 4;
  else if (opp.experienceLevel === "mid" && exp >= 1) score += 3;
  else if (!opp.experienceLevel || opp.experienceLevel === "any") score += 3;
  return Math.min(20, score);
}
function careerScore(student, opp) {
  const career = normalizeText(student.careerGoal || "");
  if (!career) return 6;
  const keywords = CAREER_KEYWORDS[student.careerGoal] || [];
  const text = normalizeText([opp.title, opp.description, opp.eligibility, opp.tags?.join(" "), opp.skillsRequired?.join(" ")].filter(Boolean).join(" "));
  const matchCount = keywords.filter((k) => text.includes(k)).length;
  const ratio = keywords.length ? matchCount / keywords.length : 0;
  const directMatch = text.includes(career);
  const bonus = directMatch || normalizeText(opp.category) === career ? 1 : 0;
  if (ratio === 0 && !directMatch) return 2;
  return Math.min(15, 4 + ratio * 8 + bonus * 3);
}
function interestsScore(student, opp) {
  const interests = normList(student.interests || []);
  if (!interests.length) return 5;
  const oppText = normList([
    opp.title,
    opp.description,
    opp.organization,
    ...opp.tags || [],
    ...opp.skillsRequired || [],
    opp.category
  ].filter(Boolean));
  if (!oppText.length) return 3;
  const matched = interests.filter(
    (interest) => oppText.some((t) => t.includes(interest) || interest.includes(t))
  ).length;
  const ratio = matched / interests.length;
  if (ratio === 0) return 1;
  return Math.round(Math.min(10, 3 + ratio * 7));
}
function courseScore(student, opp) {
  const course = normalizeText(student.course || "");
  const restrictions = normList(opp.courseRestrictions);
  if (restrictions.length) {
    return restrictions.some((r) => r === course || course.includes(r) || r.includes(course)) ? 10 : 3;
  }
  const elig = normalizeText(opp.eligibility || "");
  if (elig.includes("final year") && (student.semester || 0) >= 6) return 8;
  return 7;
}
function locationScore(student, opp) {
  const pref = student.remotePreference || "any";
  if (pref === "any") return 3;
  if (pref === opp.mode) return 5;
  if (opp.mode === "hybrid") return 4;
  return 1;
}
function deadlineScore(opp) {
  const diff = daysBetween(/* @__PURE__ */ new Date(), opp.deadline);
  if (diff < 0) return 0;
  if (diff <= 3) return 2;
  if (diff <= 7) return 3;
  if (diff <= 14) return 4;
  if (diff <= 30) return 4.5;
  return 5;
}
function computeEligibilityStatus(student, opp) {
  const checks = [];
  const degree = normalizeText(student.degree || "");
  const course = normalizeText(student.course || "");
  const year = student.year || Math.ceil((student.semester || 1) / 2);
  const semester = student.semester || 1;
  const studentSkills = (student.skills || []).map((s) => normalizeText(s.name));
  const exp = student.experienceYears || 0;
  const degreeRestrictions = normList(opp.degreeRestrictions);
  if (degreeRestrictions.length) {
    const match = degreeRestrictions.some((r) => r === degree || degree.includes(r) || r.includes(degree));
    checks.push({ label: `${student.degree || "Degree"} requirement`, status: match ? "pass" : "fail" });
  }
  const courseRestrictions = normList(opp.courseRestrictions);
  if (courseRestrictions.length) {
    const match = courseRestrictions.some((r) => r === course || course.includes(r) || r.includes(course));
    checks.push({ label: `${student.course || "Course"} eligibility`, status: match ? "pass" : "fail" });
  }
  if (opp.yearMin || opp.yearMax) {
    const min = opp.yearMin || 1;
    const max = opp.yearMax || 4;
    const inRange = year >= min && year <= max;
    checks.push({ label: `Year ${min}\u2013${max} required`, status: inRange ? "pass" : "fail" });
  }
  const mandatory = normList(opp.mandatorySkills || []);
  if (mandatory.length) {
    const have = mandatory.filter((s) => studentSkills.some((sk) => sk.includes(s) || s.includes(sk)));
    const missing = mandatory.filter((s) => !have.includes(s));
    checks.push({ label: `Required skills: ${mandatory.join(", ")}`, status: missing.length === 0 ? "pass" : missing.length <= 1 ? "warn" : "fail" });
  }
  if (opp.experienceLevel && opp.experienceLevel !== "any") {
    let expOk = false;
    if (opp.experienceLevel === "fresher") expOk = exp <= 1;
    else if (opp.experienceLevel === "junior") expOk = exp <= 3;
    else if (opp.experienceLevel === "mid") expOk = exp >= 1 && exp <= 5;
    else if (opp.experienceLevel === "senior") expOk = exp >= 3;
    else expOk = true;
    checks.push({ label: `${opp.experienceLevel} experience level`, status: expOk ? "pass" : "fail" });
  }
  const hasFail = checks.some((c) => c.status === "fail");
  const hasWarn = checks.some((c) => c.status === "warn");
  const status = hasFail ? "not_eligible" : hasWarn ? "partially_eligible" : "eligible";
  return { status, checks };
}
function computeMatch(student, opp) {
  const breakdown = {
    skills: Math.round(skillsScore(student, opp)),
    eligibility: Math.round(eligibilityScore(student, opp)),
    career: Math.round(careerScore(student, opp)),
    interests: Math.round(interestsScore(student, opp)),
    course: Math.round(courseScore(student, opp)),
    location: Math.round(locationScore(student, opp)),
    deadline: Math.round(deadlineScore(opp))
  };
  const score = Math.round(
    Object.entries(breakdown).reduce((acc, [k, v]) => acc + v, 0)
  );
  const reasons = buildReasons(student, opp, breakdown);
  const eligibility = computeEligibilityStatus(student, opp);
  const finalScore = eligibility.status === "not_eligible" ? Math.min(score, 45) : score;
  return { score: clamp(finalScore, 0, 100), breakdown, reasons, eligibility };
}
function buildReasons(student, opp, b) {
  const reasons = [];
  const studentSkills = normList((student.skills || []).map((s) => s.name));
  const required = normList(opp.skillsRequired || []);
  const matchedSkills = required.filter((r) => studentSkills.some((s) => s.includes(r) || r.includes(s)));
  if (matchedSkills.length) {
    reasons.push(`you have ${matchedSkills.slice(0, 3).join(", ")} skills which this ${opp.category} requires`);
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
    reasons.push(`it matches your interest in ${student.interests.slice(0, 2).join(" and ")}`);
  }
  const diff = daysBetween(/* @__PURE__ */ new Date(), opp.deadline);
  if (diff >= 0 && diff <= 7) reasons.push(`the deadline is ${diff === 0 ? "today" : `in ${diff} days`}, so acting now gives you a head start`);
  if (diff > 7) reasons.push(`you have ${diff} days until the deadline, enough time to prepare a strong application`);
  return unique(reasons).slice(0, 4);
}
function rankOpportunities(student, opportunities, limit = 12) {
  const hasSkills = (student.skills || []).length > 0;
  const hasInterests = (student.interests || []).length > 0;
  const hasProfile = hasSkills || hasInterests || student.careerGoal;
  let ranked = opportunities.map((opp) => ({ ...computeMatch(student, opp), opportunity: opp })).sort((a, b) => b.score - a.score);
  if (hasProfile) {
    const studentSkillNames = (student.skills || []).map((s) => normalizeText(s.name));
    const studentInterests = normList(student.interests || []);
    const careerGoal = normalizeText(student.careerGoal || "");
    ranked = ranked.filter((r) => {
      if (r.score < 20) return false;
      const oppRequired = normList(r.opportunity.skillsRequired || []);
      if (studentSkillNames.length && oppRequired.length) {
        const skillOverlap = oppRequired.some((s) => studentSkillNames.some((st) => st.includes(s) || s.includes(st)));
        const oppText = [r.opportunity.title, r.opportunity.description, r.opportunity.category, ...r.opportunity.tags || []].join(" ").toLowerCase();
        const interestOverlap = studentInterests.some((i) => oppText.includes(i));
        const careerMatch = careerGoal && oppText.includes(careerGoal);
        return skillOverlap || interestOverlap || careerMatch;
      }
      return true;
    });
  }
  return limit ? ranked.slice(0, limit) : ranked;
}
var MATCH_WEIGHTS, LEVEL_WEIGHT, CAREER_KEYWORDS;
var init_matchingEngine = __esm({
  "server/src/services/matchingEngine.js"() {
    init_helpers();
    MATCH_WEIGHTS = {
      skills: 35,
      eligibility: 20,
      career: 15,
      interests: 10,
      course: 10,
      location: 5,
      deadline: 5
    };
    LEVEL_WEIGHT = { Advanced: 1, Intermediate: 0.75, Beginner: 0.5 };
    CAREER_KEYWORDS = {
      "AI Engineer": ["ai", "machine learning", "ml", "deep learning", "llm", "generative", "neural", "tensorflow", "pytorch", "nlp", "artificial intelligence"],
      "Software Engineer": ["software", "developer", "coding", "programming", "full stack", "frontend", "backend", "web", "api", "react", "node", "engineering"],
      "Data Scientist": ["data", "analytics", "statistics", "python", "sql", "machine learning", "visualization"],
      "Cybersecurity Engineer": ["security", "cyber", "ethical hacking", "network", "vulnerability", "penetration"],
      "Product Manager": ["product", "management", "business", "roadmap", "startup"],
      "UI/UX Designer": ["design", "ui", "ux", "figma", "user experience", "interface"],
      "Data Analyst": ["data", "analytics", "sql", "excel", "dashboard", "visualization"],
      "Cloud Engineer": ["cloud", "aws", "azure", "devops", "kubernetes", "docker"],
      "Entrepreneur": ["startup", "business", "entrepreneur", "founder", "venture"],
      "Full Stack Developer": ["full stack", "web", "react", "node", "javascript", "frontend", "backend"],
      "Backend Developer": ["backend", "api", "node", "java", "python", "server", "database"],
      "Frontend Developer": ["frontend", "react", "ui", "javascript", "css", "web"],
      "Mobile Developer": ["mobile", "android", "ios", "flutter", "react native"],
      "Machine Learning Engineer": ["machine learning", "ml", "deep learning", "python", "tensorflow", "pytorch"],
      "DevOps Engineer": ["devops", "cloud", "docker", "kubernetes", "ci/cd"]
    };
  }
});

// server/src/services/ai/gemini.js
var gemini_exports = {};
__export(gemini_exports, {
  askGemini: () => askGemini,
  parseJsonLoose: () => parseJsonLoose
});
function client() {
  if (!env.GEMINI_API_KEY) return null;
  if (!_client) _client = new import_generative_ai.GoogleGenerativeAI(env.GEMINI_API_KEY);
  return _client;
}
async function checkOllamaAvailable() {
  if (_ollamaAvailable !== null) return _ollamaAvailable;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OLLAMA_CHECK_TIMEOUT_MS);
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    _ollamaAvailable = res.ok;
    if (_ollamaAvailable) console.log("[ollama] detected \u2014 AI will use local model as fallback");
    else console.log("[ollama] not available \u2014 AI will use offline deterministic fallbacks");
  } catch {
    _ollamaAvailable = false;
    console.log("[ollama] not running \u2014 AI will use offline deterministic fallbacks");
  }
  return _ollamaAvailable;
}
async function askOllama(systemPrompt, userPrompt, { temperature = 0.7, json = false } = {}) {
  if (_ollamaAvailable === false) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
  const trimmedPrompt = userPrompt.length > OLLAMA_MAX_PROMPT_CHARS ? userPrompt.slice(0, OLLAMA_MAX_PROMPT_CHARS) + "\n[context truncated for brevity]" : userPrompt;
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `${systemPrompt}

User: ${trimmedPrompt}

Assistant:`,
        stream: false,
        options: { temperature, num_predict: json ? 600 : 350, num_ctx: OLLAMA_NUM_CTX }
      })
    });
    if (!res.ok) {
      _ollamaAvailable = false;
      return null;
    }
    const data = await res.json();
    return (data.response || "").trim();
  } catch (err) {
    if (err?.name === "AbortError") {
      _ollamaAvailable = false;
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}
async function askGemini(systemPrompt, userPrompt, { json = false, temperature = 0.7 } = {}) {
  const c = client();
  if (!c) {
    return askOllama(systemPrompt, userPrompt, { temperature, json });
  }
  await checkOllamaAvailable();
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const model = c.getGenerativeModel({
        model: MODEL,
        generationConfig: {
          temperature,
          ...json ? { responseMimeType: "application/json" } : {}
        }
      });
      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Understood. I will follow those instructions exactly." }] },
          { role: "user", parts: [{ text: userPrompt }] }
        ]
      });
      const text = result.response?.text?.() || "";
      _quotaLogged = false;
      return text.trim();
    } catch (err) {
      const message = err?.message || "";
      if (/quota|RESOURCE_EXHAUSTED/i.test(message)) {
        if (!_quotaLogged) {
          console.warn("[gemini] quota exceeded \u2014 using offline fallbacks. Regenerate your key at https://aistudio.google.com/apikey");
          _quotaLogged = true;
        }
        return askOllama(systemPrompt, userPrompt, { temperature, json });
      }
      const retriable = /503|429|500|high demand|UNAVAILABLE/i.test(message);
      if (!retriable || attempt === maxAttempts) {
        if (attempt === maxAttempts) console.warn("[gemini] all", maxAttempts, "attempts failed \u2014 using offline fallback");
        return askOllama(systemPrompt, userPrompt, { temperature, json });
      }
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
  return askOllama(systemPrompt, userPrompt, { temperature, json });
}
function parseJsonLoose(text) {
  if (!text) return null;
  const t = text.trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
var import_generative_ai, _client, MODEL, OLLAMA_URL, OLLAMA_MODEL, _ollamaAvailable, OLLAMA_CHECK_TIMEOUT_MS, OLLAMA_TIMEOUT_MS, OLLAMA_NUM_CTX, OLLAMA_MAX_PROMPT_CHARS, _quotaLogged;
var init_gemini = __esm({
  "server/src/services/ai/gemini.js"() {
    import_generative_ai = require("@google/generative-ai");
    init_env();
    _client = null;
    MODEL = "gemini-3.6-flash";
    OLLAMA_URL = env.OLLAMA_URL;
    OLLAMA_MODEL = env.OLLAMA_MODEL;
    _ollamaAvailable = null;
    OLLAMA_CHECK_TIMEOUT_MS = 3e3;
    OLLAMA_TIMEOUT_MS = 25e3;
    OLLAMA_NUM_CTX = 1024;
    OLLAMA_MAX_PROMPT_CHARS = 2200;
    _quotaLogged = false;
  }
});

// server/src/services/ai/fallbacks.js
var fallbacks_exports = {};
__export(fallbacks_exports, {
  MATCH_WEIGHTS: () => MATCH_WEIGHTS,
  SKILL_DICT: () => SKILL_DICT,
  detectIntent: () => detectIntent,
  extractSkills: () => extractSkills,
  fallbackApplicationAssist: () => fallbackApplicationAssist,
  fallbackChatReply: () => fallbackChatReply,
  fallbackDailyPlan: () => fallbackDailyPlan,
  fallbackMatchExplanation: () => fallbackMatchExplanation,
  fallbackNoticeSummary: () => fallbackNoticeSummary,
  fallbackPrioritize: () => fallbackPrioritize,
  fallbackProactiveActions: () => fallbackProactiveActions,
  fallbackProfileInsights: () => fallbackProfileInsights,
  fallbackProjects: () => fallbackProjects,
  fallbackResumeAlignment: () => fallbackResumeAlignment,
  fallbackResumeAnalysis: () => fallbackResumeAnalysis,
  fallbackRoadmap: () => fallbackRoadmap,
  fallbackSearchParse: () => fallbackSearchParse,
  fallbackWeeklyReview: () => fallbackWeeklyReview,
  minutesToTime: () => minutesToTime,
  resourcesForSkill: () => resourcesForSkill,
  skillGapFromProfile: () => skillGapFromProfile
});
function fallbackMatchExplanation(profile, opp, match) {
  const { score, breakdown, reasons } = match;
  const lines = [];
  lines.push(`**Your Match: ${score}%**`);
  lines.push("");
  lines.push(`This ${opp.category} at ${opp.organization} \u2014 "${opp.title}" \u2014 is a strong fit for you.`);
  if (reasons && reasons.length) {
    lines.push("Why it matches you:");
    reasons.forEach((r) => lines.push(`- Because ${r}.`));
  }
  const weak = Object.entries(breakdown || {}).filter(([k, v]) => v < MATCH_WEIGHTS[k] * 0.6);
  if (weak.length) {
    lines.push("");
    lines.push("To improve your match further:");
    weak.forEach(([k]) => {
      if (k === "skills") lines.push("- Add the required skills to your profile or learn them.");
      if (k === "eligibility") lines.push("- Review the eligibility criteria carefully.");
      if (k === "career") lines.push("- Align your career goal with this domain.");
      if (k === "location") lines.push("- Update your location / remote preference.");
    });
  }
  const diff = daysBetween(/* @__PURE__ */ new Date(), opp.deadline);
  lines.push("");
  lines.push(diff < 0 ? "\u26A0\uFE0F This opportunity has expired." : diff <= 3 ? `\u23F3 Deadline urgency: HIGH \u2014 closes ${relativeDay(opp.deadline)}. Apply now!` : `\u23F3 You have ${diff} days before the deadline.`);
  return lines.join("\n");
}
function fallbackDailyPlan({ date, timetable, tasks, deadlines, topOpportunity, attendanceWarning }) {
  const items = [];
  const push = (time, title, type, source = "") => items.push({ time, title, type, source });
  const schedule = [...timetable || []].filter((s) => s.day === new Date(date).getDay()).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const pending = (tasks || []).filter((t) => t.status !== "done").slice(0, 3);
  const urgentDeadlines = (deadlines || []).filter((d) => d.diff <= 3).slice(0, 2);
  const hasMorning = schedule.some((s) => timeToMinutes(s.startTime) < 720);
  if (hasMorning && schedule.length) push("08:00", "Morning routine & review", "free");
  for (const s of schedule) {
    push(s.startTime, `${s.subjectName}${s.room ? ` (${s.room})` : ""}`, s.type === "free" ? "free" : "class", `timetable:${s.id}`);
  }
  if (!schedule.length) push("09:00", "Self-study block \u2014 no classes today", "study");
  push("13:00", "Lunch break", "break");
  if (urgentDeadlines.length) {
    for (const d of urgentDeadlines) {
      push("14:00", `${d.label}${d.diff === 0 ? " \u2014 due TODAY" : ` \u2014 due ${relativeDay(d.date)}`}`, "task", d.ref);
    }
  }
  if (pending.length) {
    push("15:30", `${pending[0].title}`, "task", `task:${pending[0].id}`);
    if (pending[1]) push("16:30", `${pending[1].title}`, "task", `task:${pending[1].id}`);
  }
  if (topOpportunity) {
    push("17:30", `Work on "${topOpportunity.title}" application (${topOpportunity.score}% match)`, "career", `opportunity:${topOpportunity.id}`);
  }
  if (attendanceWarning) {
    push("18:30", "Prepare for next class to recover attendance", "study");
  }
  push("19:30", "Free time / hobbies", "free");
  push("20:30", "Skill practice & revision", "study");
  push("22:00", "Wind down", "free");
  const uniqueItems = [];
  const seen = /* @__PURE__ */ new Set();
  for (const it of items) {
    const key = `${it.time}-${it.title}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(it);
    }
  }
  const summary = `Plan for ${formatDate(date)}: ${schedule.length ? `${schedule.length} classes, ` : ""}${pending.length ? `${pending.length} pending task${pending.length > 1 ? "s" : ""}, ` : ""}${urgentDeadlines.length ? `${urgentDeadlines.length} urgent deadline${urgentDeadlines.length > 1 ? "s" : ""}, ` : ""}${topOpportunity ? `a ${topOpportunity.score}% match opportunity to work on.` : "focus on your goals."}`;
  return { items: uniqueItems, summary };
}
function detectIntent(message) {
  const m = normalizeText(message);
  const has = (...terms) => terms.some((t) => m.includes(normalizeText(t)));
  if (has("class", "lecture", "timetable", "schedule", "period") && has("today", "tomorrow", "day")) return "classes";
  if (has("focus", "should i do", "what to do", "plan", "prioritize") && has("today", "now")) return "focus";
  if (has("attendance", "present")) return "attendance";
  if (has("skill gap", "missing skill", "learn next", "become", "career", "roadmap")) return "skillgap";
  if (has("deadline", "due", "urgent")) return "deadlines";
  if (has("hackathon")) return "hackathons";
  if (has("internship", "job", "opportunit", "apply", "best for me", "recommend")) return "opportunities";
  if (has("notice", "college update", "happening", "event", "announce")) return "college";
  if (has("hello", "hi", "hey", "namaste")) return "greeting";
  if (has("who are you", "help", "what can you do")) return "help";
  if (has("resume", "cover letter")) return "resume";
  return "general";
}
function fallbackChatReply(intent, ctx) {
  const { student, timetable, attendance, tasks, deadlines, opportunities, notices, events, plan } = ctx || {};
  const today = /* @__PURE__ */ new Date();
  const todaySlots = (timetable || []).filter((s) => s.day === today.getDay()).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  switch (intent) {
    case "classes": {
      if (!todaySlots.length) return "You don't have any classes today. Great chance to focus on pending tasks! \u{1F389}";
      const list = todaySlots.map((s) => `${s.startTime} \u2014 ${s.subjectName}${s.room ? ` (${s.room})` : ""}`).join("\n");
      return `Here's your schedule for today:

${list}`;
    }
    case "focus": {
      const urgent = (deadlines || []).filter((d) => d.diff <= 2);
      const pending = (tasks || []).filter((t) => t.status !== "done");
      if (urgent.length) return `You have ${urgent.length} urgent deadline${urgent.length > 1 ? "s" : ""}: ${urgent.map((d) => `${d.label} (${relativeDay(d.date)})`).join(", ")}. I recommend starting with **${urgent[0].label}** today.`;
      if (pending.length) return `No urgent deadlines. You have ${pending.length} pending task${pending.length > 1 ? "s" : ""} \u2014 try knocking out **${pending[0].title}** first.`;
      if (plan && plan.items && plan.items.length) return `Your AI daily plan is ready \u2014 you have ${plan.items.filter((i) => i.status === "pending").length} planned items. Check the AI Daily Planner.`;
      return "Your day looks clear! A good day to learn a new skill or work on your portfolio.";
    }
    case "attendance": {
      const ov = attendance?.overall;
      if (!ov || !ov.total) return "You have no attendance records yet.";
      const meta = healthMeta(ov.health);
      let msg = `Your overall attendance is **${ov.percentage}%** (${ov.attended}/${ov.total} classes) \u2014 status: **${meta.label}**.

${meta.hint}`;
      if (ov.needed > 0) msg += `

Attend your next **${ov.needed} consecutive classes** to reach the ${ov.target}% target.`;
      msg += `

${forecastMessage(ov)}`;
      return msg;
    }
    case "skillgap": {
      if (!student?.careerGoal) return "Set a career goal in your profile and I'll analyse your skill gaps!";
      const gaps = skillGapFromProfile(student, student.careerGoal);
      if (!gaps.gaps.length) return `You have all the core skills for ${student.careerGoal}. Time to build projects and apply! \u{1F680}`;
      return `To become a **${student.careerGoal}**, you're missing: ${gaps.gaps.join(", ")}.

I recommend starting with **${gaps.recommended}** \u2014 check the Skill Gap page for courses and project ideas.`;
    }
    case "deadlines": {
      const all = (deadlines || []).slice(0, 5);
      if (!all.length) return "No deadlines coming up. Nice work! \u{1F389}";
      return `Your nearest deadlines:

${all.map((d) => `\u2022 ${d.label} \u2014 ${relativeDay(d.date)}`).join("\n")}`;
    }
    case "hackathons": {
      const hacks = (opportunities || []).filter((o) => o.category === "hackathon" && o.status === "verified" && daysBetween(/* @__PURE__ */ new Date(), o.deadline) >= 0);
      if (!hacks.length) return "No open hackathons right now. Check back soon!";
      return `Here are hackathons open to you:

${hacks.slice(0, 4).map((o) => `\u2022 **${o.title}** (${o.organization}) \u2014 ${o.score}% match, closes ${relativeDay(o.deadline)}`).join("\n")}`;
    }
    case "opportunities": {
      const top = (opportunities || []).slice(0, 3);
      if (!top.length) return "I could not find matching opportunities right now. Try adjusting filters.";
      return `Best opportunities for you right now:

${top.map((o, i) => `${i + 1}. **${o.title}** at ${o.organization} \u2014 ${o.score}% match, ${o.mode}${o.deadline ? `, closes ${relativeDay(o.deadline)}` : ""}`).join("\n")}`;
    }
    case "college": {
      const parts = [];
      if ((notices || []).length) parts.push(`\u{1F4E2} **${notices.length} recent notice${notices.length > 1 ? "s" : ""}**: ${notices.slice(0, 2).map((n) => n.title).join("; ")}`);
      if ((events || []).length) parts.push(`\u{1F5D3}\uFE0F **Upcoming events**: ${events.slice(0, 2).map((e) => `${e.title} (${formatDate(e.date)})`).join("; ")}`);
      if (!parts.length) return "Nothing new in your college right now.";
      return parts.join("\n\n");
    }
    case "greeting":
      return `Hello${student ? ` ${student.name?.split(" ")[0]}` : ""}! \u{1F44B} I'm your AI assistant. Ask me about your classes, attendance, deadlines, opportunities or skill gaps.`;
    case "help":
      return `I can help you with:
\u2022 "What classes do I have today?"
\u2022 "What should I focus on today?"
\u2022 "My attendance is 68%, what should I do?"
\u2022 "Which internship is best for me?"
\u2022 "What skills am I missing to become an AI Engineer?"
\u2022 "Summarize today's college updates."`;
    case "resume":
      return "Upload your resume on the Resume page and I'll score it, extract your skills, and suggest improvements. You can also compare it against any opportunity!";
    default:
      return "I've analysed your academic data, opportunities and career goal. Here's my suggestion: focus on your nearest deadlines first, keep your attendance above 75%, and spend at least 30 minutes daily on skills that close your career gap. Ask me about classes, attendance, deadlines, or opportunities for specifics!";
  }
}
function extractSkills(text) {
  const found = [];
  const t = text.toLowerCase();
  for (const skill of SKILL_DICT) {
    const re = new RegExp(`\\b${skill.toLowerCase().replace(/[.+]/g, "\\$&")}\\b`);
    if (re.test(t)) found.push(skill);
  }
  return [...new Set(found)];
}
function fallbackResumeAnalysis(text) {
  const lower = text.toLowerCase();
  const skills = extractSkills(text);
  const hasSection = (re) => re.test(lower);
  const education = [];
  const projects = [];
  const experience = [];
  const certifications = [];
  const lines = text.split("\n");
  const degreeRe = /(b\.?tech|bca|bsc|bachelor|mca|msc|master|be\b|b\.e|diploma|phd|12th|10th|higher secondary)/i;
  const eduKeywords = ["education", "university", "college", "school", "degree", "cgpa", "gpa"];
  const projKeywords = ["project", "built", "developed", "created", "designed", "implemented"];
  const expKeywords = ["intern", "worked", "experience", "freelance", "assistant", "trainee", "role"];
  const certKeywords = ["certif", "certificate", "completed course", "google", "aws", "azure", "coursera", "udemy"];
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
  const sections = ["education", "skills", "project", "experience", "certif"].filter((s) => lower.includes(s)).length;
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
  if (skills.length >= 5) strengths.push(`${skills.length} relevant skills listed (${skills.slice(0, 5).join(", ")})`);
  if (projects.length) strengths.push(`You showcase ${projects.length} project${projects.length > 1 ? "s" : ""}`);
  if (experience.length) strengths.push(`You include ${experience.length} work experience entr${experience.length > 1 ? "ies" : "y"}`);
  if (quantified) strengths.push("You use quantified achievements, which recruiters love");
  if (atsFriendly) strengths.push("The layout is ATS-friendly with clear sections");
  if (!strengths.length) strengths.push("You have started your resume \u2014 adding more sections will strengthen it");
  const weaknesses = [];
  if (!email) weaknesses.push("Missing contact email");
  if (!hasSummary) weaknesses.push("No professional summary at the top");
  if (sections < 3) weaknesses.push("Fewer than 3 clear sections (education/skills/projects)");
  if (!quantified) weaknesses.push("No quantified achievements \u2014 add numbers");
  if (words < 250) weaknesses.push("Resume is short \u2014 expand with projects and details");
  const missingSkills = [
    "Machine Learning",
    "Deep Learning",
    "LLMs / Generative AI",
    "Docker",
    "Cloud (AWS)",
    "Data Structures & Algorithms"
  ].filter((s) => !skills.includes(s)).slice(0, 4);
  const improvements = [];
  if (!hasSummary) improvements.push("Add a 2\u20133 line professional summary with your career goal");
  if (!quantified) improvements.push('Add numbers: "built X, improved Y by Z%"');
  if (projects.length === 0) improvements.push("Add 2\u20133 projects with tech stacks and outcomes");
  if (missingSkills.length) improvements.push(`Learn and add: ${missingSkills.slice(0, 2).join(", ")}`);
  improvements.push("Keep it to one page for entry-level roles");
  return {
    score,
    parsed: {
      education: [...new Set(education)].slice(0, 5),
      skills: skills.slice(0, 20),
      projects: [...new Set(projects)].slice(0, 5),
      experience: [...new Set(experience)].slice(0, 5),
      certifications: [...new Set(certifications)].slice(0, 5)
    },
    strengths,
    weaknesses,
    missingSkills,
    improvements,
    atsFriendly
  };
}
function fallbackResumeAlignment(resumeSkills, opp) {
  const required = (opp.skillsRequired || []).map((s) => normalizeText(s));
  if (!required.length) return { alignment: 85, matched: [], missing: [] };
  const matched = required.filter((r) => resumeSkills.some((s) => normalizeText(s).includes(r) || r.includes(normalizeText(s))));
  const missing = required.filter((r) => !matched.includes(r));
  const alignment = Math.round(matched.length / required.length * 100);
  return { alignment, matched, missing };
}
function skillGapFromProfile(profile, careerGoal) {
  const roadmap = ROADMAPS[careerGoal] || ROADMAPS["Software Engineer"];
  const have = new Set((profile.skills || []).map((s) => normalizeText(s.name)));
  const gaps = [];
  for (const step of roadmap) {
    const key = step.split(" ")[0];
    if (!have.has(normalizeText(key)) && !have.has(normalizeText(step))) gaps.push(step);
  }
  return {
    careerGoal,
    roadmap,
    gaps,
    recommended: gaps[0] || "Advanced project work",
    have: (profile.skills || []).map((s) => s.name)
  };
}
function resourcesForSkill(skill) {
  const base = {
    courses: [
      `"${skill} Fundamentals" on Coursera / Udemy`,
      `YouTube crash course on ${skill}`,
      `FreeCodeCamp / Kaggle Learn path for ${skill}`
    ],
    projects: [
      `Build a small ${skill} project this week (starter ideas: CLI tool, dashboard, API)`,
      `Contribute a ${skill}-related feature to an open-source repo`
    ],
    hackathons: ["Participate in a 48-hour hackathon and use this skill"],
    internships: [`Apply for internships that explicitly list ${skill}`],
    training: [`Complete a ${skill} certification before your next application cycle`]
  };
  return base;
}
function fallbackRoadmap(careerGoal, profileSkills) {
  const steps = ROADMAPS[careerGoal] || ROADMAPS["Software Engineer"];
  const have = new Set((profileSkills || []).map((s) => normalizeText(s.name)));
  return steps.map((skill, i) => {
    const key = skill.split(" ")[0];
    const done = have.has(normalizeText(key)) || have.has(normalizeText(skill));
    const inProgress = !done && (profileSkills || []).some((s) => normalizeText(s.name).includes(key));
    return {
      skill,
      order: i,
      status: done ? "Completed" : inProgress ? "Learning" : "Not Started"
    };
  });
}
function fallbackProjects(profile) {
  const skills = (profile.skills || []).map((s) => s.name);
  const has = (s) => skills.some((k) => normalizeText(k).includes(normalizeText(s)));
  const goal = normalizeText(profile.careerGoal || "");
  const projects = [];
  if (has("python") || has("ai") || goal.includes("ai") || goal.includes("data") || goal.includes("ml")) {
    projects.push({
      title: "AI Resume Analyzer",
      difficulty: "Medium",
      time: "2 weeks",
      skillsGained: ["Python", "LLM / NLP", "API Design"],
      techStack: ["Python", "LLM API", "React", "MongoDB"],
      features: ["Extract text from PDF resumes", "Score resumes with an LLM", "Suggest improvements", "Compare resume vs job description"],
      portfolioValue: "High \u2014 shows applied AI skills end-to-end"
    });
    projects.push({
      title: "Student Attendance & Deadline Tracker with AI Insights",
      difficulty: "Medium",
      time: "3 weeks",
      skillsGained: ["Full-stack", "MongoDB", "Data Visualization"],
      techStack: ["React", "Node.js", "MongoDB"],
      features: ["Attendance dashboards", "Deadline reminders", "AI weekly summaries"],
      portfolioValue: "High \u2014 solves a real campus problem"
    });
  }
  if (has("react") || has("javascript") || has("node")) {
    projects.push({
      title: "Opportunity Discovery Hub",
      difficulty: "Medium",
      time: "2 weeks",
      skillsGained: ["React", "REST APIs", "Search & filters"],
      techStack: ["React", "Node.js", "MongoDB"],
      features: ["Filtered opportunity listings", "Save & track applications", "Smart match badges"],
      portfolioValue: "Medium \u2014 demonstrates product thinking"
    });
  }
  if (has("python") || has("sql")) {
    projects.push({
      title: "Career Skill-Gap Dashboard",
      difficulty: "Easy",
      time: "1 week",
      skillsGained: ["Python", "SQL", "Visualization"],
      techStack: ["Python", "Pandas", "Streamlit"],
      features: ["Map skills to career paths", "Visual progress bars", "Learning recommendations"],
      portfolioValue: "Medium \u2014 shows data analysis skills"
    });
  }
  projects.push({
    title: "Personal Portfolio & Blog",
    difficulty: "Easy",
    time: "1 week",
    skillsGained: ["Web development", "Writing", "Personal branding"],
    techStack: ["HTML/CSS", "React"],
    features: ["Projects gallery", "Blog posts on your learning journey", "Contact form"],
    portfolioValue: "High \u2014 every recruiter checks your portfolio"
  });
  return projects.slice(0, 4);
}
function fallbackNoticeSummary(title, content) {
  const text = `${title}. ${content}`;
  const dates = [...text.matchAll(/\b(\d{1,2})(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[,\s]*\s*(\d{4})?\b/gi)].map((m) => m[0]).slice(0, 5);
  const isoDates = [...text.matchAll(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b/g)].map((m) => m[0]).slice(0, 5);
  const allDates = [.../* @__PURE__ */ new Set([...dates, ...isoDates])];
  const deadlineMatch = text.match(/(?:deadline|last date|last day|due)[^.\n]{0,80}/i);
  const actionMatch = text.match(/(?:submit|fill|register|apply|report|bring|contact|deposit)[^.\n]{0,80}/i);
  const examMatch = text.match(/(?:exam|examination|test|assessment)[^.\n]{0,100}/i);
  const sentences = content.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
  const summary = sentences.slice(0, 2).join(" ") || content.slice(0, 200);
  return {
    summary,
    importantDates: allDates,
    deadline: deadlineMatch ? deadlineMatch[0].trim() : allDates[0] || "",
    actionRequired: actionMatch ? actionMatch[0].trim() : "",
    examDetails: examMatch ? examMatch[0].trim() : ""
  };
}
function fallbackApplicationAssist(profile, opp, resumeText) {
  const name = profile.userName || "the candidate";
  const skills = (profile.skills || []).slice(0, 5).map((s) => s.name).join(", ");
  const career = profile.careerGoal || "a career in technology";
  const intro = `I'm ${name}, a ${profile.course || ""} student currently in semester ${profile.semester || ""}, passionate about becoming ${career}.`;
  const why = `You should select me because I bring ${skills || "a strong willingness to learn"}, a track record of completing projects, and the discipline to show up consistently. I'm particularly motivated by ${opp.title} at ${opp.organization} because it directly aligns with my goal of ${career}.`;
  const cover = `${intro}

I'm writing to apply for the ${opp.category} opportunity "${opp.title}" at ${opp.organization}. My skills in ${skills || "relevant technologies"} and my interest in ${career} make me a strong fit for this role.

${why}

I'm excited about the chance to contribute, learn from the team, and grow. Thank you for considering my application.

Best regards,
${name}`;
  return { coverLetter: cover, introduction: intro, whyYou: why };
}
function fallbackWeeklyReview(data) {
  const attended = data.classesAttended ?? 0;
  const total = data.classesTotal ?? 0;
  const completed = data.tasksCompleted ?? 0;
  const pending = data.tasksTotal ?? 0;
  const insights = [];
  const pct = total ? Math.round(attended / total * 100) : 100;
  if (pct >= 80) insights.push("Your academic consistency improved this week \u2014 keep attending regularly.");
  else if (pct < 75) insights.push(`Your attendance dipped to ${pct}%. Prioritize attending every class next week to protect your attendance.`);
  if (pending > 0 && completed > 0) insights.push(`You completed ${completed}/${completed + pending} tasks \u2014 try to clear the remaining ${pending} early next week.`);
  if (data.applications > 0) insights.push(`You submitted ${data.applications} application${data.applications > 1 ? "s" : ""} \u2014 great momentum on the career front.`);
  if (data.skillsPracticed && data.skillsPracticed.length) insights.push(`You practiced ${data.skillsPracticed.join(", ")} \u2014 consistent skill practice compounds fast.`);
  if (!insights.length) insights.push("A steady week. Next week, try adding one career-focused action: apply to an opportunity or build a small project.");
  return insights.join(" ");
}
function fallbackProfileInsights(profile) {
  const skills = (profile.skills || []).map((s) => s.name);
  const goal = profile.careerGoal || "";
  const out = [];
  if (goal) {
    const gaps = skillGapFromProfile(profile, goal);
    if (gaps.gaps.length) out.push(`Your profile is building toward ${goal}, but you're missing ${gaps.gaps.slice(0, 2).join(" and ")}. Adding a project using these skills would strengthen your applications significantly.`);
    else out.push(`Your profile is strong for ${goal} \u2014 now focus on projects and applications to convert it into offers.`);
  } else {
    out.push("Set a career goal so I can personalise your recommendations and roadmap.");
  }
  if (skills.includes("React") || skills.includes("JavaScript") || skills.includes("Frontend")) {
    if (goal && normalizeText(goal).includes("ai")) out.push("Your frontend skills are valuable for AI roles too \u2014 AI products need great interfaces.");
  }
  if (!profile.resume) out.push("You have not uploaded a resume yet \u2014 it unlocks resume scoring and apply-with-AI.");
  return out.join(" ");
}
function fallbackSearchParse(query2) {
  const q = normalizeText(query2);
  const filters = { text: query2, category: null, mode: null, location: null, skills: [], urgent: null };
  const categories = {
    internship: ["internship", "intern", "internships"],
    hackathon: ["hackathon", "hackathons"],
    job: ["job", "jobs", "placement", "full-time"],
    scholarship: ["scholarship", "scholarships"],
    training: ["training", "course", "program"],
    workshop: ["workshop"],
    competition: ["competition", "contest"],
    fellowship: ["fellowship"],
    research: ["research"],
    conference: ["conference"]
  };
  for (const [cat, terms] of Object.entries(categories)) {
    if (terms.some((t) => q.includes(t))) {
      filters.category = cat;
      break;
    }
  }
  if (q.includes("remote")) filters.mode = "remote";
  if (q.includes("onsite") || q.includes("on-site")) filters.mode = "onsite";
  if (q.includes("hybrid")) filters.mode = "hybrid";
  if (q.includes("this week") || q.includes("closing soon") || q.includes("urgent")) filters.urgent = true;
  const locMatch = q.match(/(?:in|near|based in)\s+([a-z]{3,20})/);
  if (locMatch) filters.location = locMatch[1];
  for (const skill of SKILL_DICT) {
    if (q.includes(normalizeText(skill))) filters.skills.push(skill);
  }
  return filters;
}
function fallbackPrioritize(tasks) {
  const order = { high: 3, medium: 2, low: 1 };
  const now = Date.now();
  return [...tasks || []].filter((t) => t.status !== "done").map((t) => ({
    ...t,
    priorityScore: (order[t.priority] || 2) * 10 + (t.dueDate ? Math.max(0, 40 - Math.floor((new Date(t.dueDate) - now) / 864e5) * 5) : 15)
  })).sort((a, b) => b.priorityScore - a.priorityScore);
}
function fallbackProactiveActions({ deadlines, topOpportunities, attendance, applications }) {
  const actions = [];
  for (const d of (deadlines || []).slice(0, 5)) {
    if (d.diff === 0 || d.diff === 1) {
      actions.push({ type: "deadline", priority: "high", title: `${d.label} is due ${relativeDay(d.date)}`, message: `Complete "${d.label}" before it's due ${relativeDay(d.date)}.`, link: d.link || "/assignments" });
    }
  }
  for (const opp of (topOpportunities || []).slice(0, 3)) {
    const applied = (applications || []).some((a) => String(a.opportunity) === String(opp.id));
    const diff = daysBetween(/* @__PURE__ */ new Date(), opp.deadline);
    if (!applied && opp.score >= 80 && diff >= 0 && diff <= 3) {
      actions.push({ type: "opportunity", priority: "high", title: `High-match opportunity closing soon (${opp.score}% match)`, message: `You haven't applied to "${opp.title}" at ${opp.organization} \u2014 it closes ${relativeDay(opp.deadline)}.`, link: `/opportunities/${opp.id}` });
    }
  }
  if (attendance?.overall && attendance.overall.health !== "safe" && attendance.overall.total > 0) {
    actions.push({ type: "attendance", priority: attendance.overall.health === "critical" ? "high" : "medium", title: `Attendance is ${attendance.overall.percentage}%`, message: `Attend the next ${attendance.overall.needed || 1} classes to reach your ${attendance.overall.target}% target.`, link: "/attendance" });
  }
  return actions.slice(0, 4);
}
var SKILL_DICT, ROADMAPS;
var init_fallbacks = __esm({
  "server/src/services/ai/fallbacks.js"() {
    init_helpers();
    init_matchingEngine();
    init_attendanceService();
    init_attendanceService();
    SKILL_DICT = [
      "Python",
      "Java",
      "JavaScript",
      "TypeScript",
      "C",
      "C++",
      "C#",
      "SQL",
      "HTML",
      "CSS",
      "React",
      "Node.js",
      "Node",
      "Express",
      "MongoDB",
      "Django",
      "Flask",
      "Git",
      "GitHub",
      "R",
      "MATLAB",
      "AI",
      "Machine Learning",
      "Deep Learning",
      "LLM",
      "NLP",
      "TensorFlow",
      "PyTorch",
      "Keras",
      "Data Science",
      "Pandas",
      "NumPy",
      "Data Analysis",
      "Data Visualization",
      "Tableau",
      "Power BI",
      "UI/UX",
      "Figma",
      "Photoshop",
      "Cybersecurity",
      "Ethical Hacking",
      "Networking",
      "Linux",
      "Cloud",
      "AWS",
      "Azure",
      "GCP",
      "Docker",
      "Kubernetes",
      "DevOps",
      "CI/CD",
      "REST API",
      "Android",
      "iOS",
      "Flutter",
      "React Native",
      "Swift",
      "Kotlin",
      "Excel",
      "Communication",
      "Leadership",
      "Teamwork",
      "Problem Solving",
      "Critical Thinking",
      "Public Speaking",
      "Writing"
    ];
    ROADMAPS = {
      "AI Engineer": ["Python", "SQL", "Machine Learning", "Deep Learning", "LLMs / Generative AI", "Deployment (Docker, APIs)", "AI Projects", "Hackathons", "Internships"],
      "Software Engineer": ["Programming Fundamentals", "Data Structures & Algorithms", "Version Control (Git)", "Databases (SQL)", "Web Frameworks (React/Node)", "System Design", "Projects", "Hackathons", "Internships"],
      "Data Scientist": ["Python", "Statistics", "SQL", "Data Analysis (Pandas)", "Machine Learning", "Data Visualization", "Projects", "Kaggle Competitions", "Internships"],
      "Cybersecurity Engineer": ["Networking Basics", "Linux", "Python", "Cybersecurity Fundamentals", "Ethical Hacking", "Network Security", "CTF Challenges", "Certifications (CEH)", "Internships"],
      "Full Stack Developer": ["HTML/CSS", "JavaScript", "React", "Node.js", "Databases (MongoDB/SQL)", "REST APIs", "Projects", "Hackathons", "Internships"],
      "Frontend Developer": ["HTML/CSS", "JavaScript", "React", "UI/UX Basics", "Responsive Design", "Projects", "Open Source", "Internships"],
      "Backend Developer": ["Programming (Python/Node)", "Databases", "REST APIs", "Authentication", "Caching", "Deployment", "Projects", "Internships"],
      "Data Analyst": ["Excel", "SQL", "Python", "Statistics", "Data Visualization (Tableau/Power BI)", "Projects", "Dashboards", "Internships"],
      "Product Manager": ["Business Basics", "Product Lifecycle", "User Research", "Wireframing", "Analytics", "Communication", "Case Studies", "Internships"],
      "UI/UX Designer": ["Design Principles", "Figma", "Wireframing", "Prototyping", "User Research", "Portfolio Projects", "Case Studies", "Design Internships"],
      "Cloud Engineer": ["Linux", "Networking", "Python", "Cloud Fundamentals (AWS/Azure)", "Docker", "Kubernetes", "DevOps", "Certifications", "Projects"],
      "DevOps Engineer": ["Linux", "Shell Scripting", "Python", "Git", "CI/CD", "Docker", "Kubernetes", "Cloud (AWS/Azure)", "Monitoring"],
      "Mobile Developer": ["Programming (Kotlin/Swift)", "Mobile UI", "Flutter/React Native", "REST APIs", "App Deployment", "Projects", "Hackathons", "Internships"],
      "Machine Learning Engineer": ["Python", "SQL", "Machine Learning", "Deep Learning", "MLOps", "TensorFlow/PyTorch", "Projects", "Kaggle", "Internships"],
      "Entrepreneur": ["Idea Validation", "Business Basics", "Marketing", "Finance Basics", "Networking", "MVP Development", "Startup Competitions", "Incubators"]
    };
  }
});

// server/src/services/seedService.js
var seedService_exports = {};
__export(seedService_exports, {
  ensureSampleOpportunities: () => ensureSampleOpportunities,
  ensureSeed: () => ensureSeed,
  reseed: () => reseed
});
function daysFromNow(n, hour = 10) {
  const d = new Date(Date.now() + n * DAY_MS);
  d.setHours(hour, 0, 0, 0);
  return d;
}
function atDay(dayOffset, hour = 10) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d;
}
async function ensureSeed({ force = false } = {}) {
  if (!force) {
    const count = await prisma.user.count();
    if (count > 0) {
      console.log("[seed] Demo data already present \u2014 skipping (use `npm run seed` to force reseed)");
      return { seeded: false };
    }
  }
  if (force) {
    console.log("[seed] Force reseed \u2014 clearing existing data...");
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
  console.log("[seed] Seeding demo data...");
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const college = await prisma.college.create({
    data: {
      name: "Indian Institute of Information Technology, Ropar",
      code: "IIIT-RPR",
      city: "Rupnagar",
      state: "Punjab",
      address: "Nangal Road, Rupnagar, Punjab 140001",
      website: "https://www.iiit.ac.in",
      contactEmail: "office@iiitropar.ac.in",
      contactPhone: "+91 1881 227078",
      establishedYear: 2014
    }
  });
  const deptCS = await prisma.department.create({ data: { college: college.id, name: "Computer Science", code: "CS" } });
  const deptAI = await prisma.department.create({ data: { college: college.id, name: "AI & Data Science", code: "AI" } });
  const admin = await prisma.user.create({
    data: {
      name: "Dr. Ananya Rao",
      email: "admin@demo.campusconnect",
      password: passwordHash,
      role: "admin",
      college: college.id,
      designation: "College Administrator",
      emailVerified: true,
      onboarded: true,
      approved: true
    }
  });
  const faculty = await prisma.user.create({
    data: {
      name: "Prof. Rohan Mehta",
      email: "faculty@demo.campusconnect",
      password: passwordHash,
      role: "faculty",
      college: college.id,
      designation: "Assistant Professor, Computer Science",
      emailVerified: true,
      onboarded: true,
      approved: true
    }
  });
  const faculty2 = await prisma.user.create({
    data: {
      name: "Prof. Sneha Iyer",
      email: "sneha.iyer@iiitropar.ac.in",
      password: passwordHash,
      role: "faculty",
      college: college.id,
      designation: "Assistant Professor, AI & Data Science",
      emailVerified: true,
      onboarded: true,
      approved: true
    }
  });
  const student = await prisma.user.create({
    data: {
      name: "Aarav Sharma",
      email: "student@demo.campusconnect",
      password: passwordHash,
      role: "student",
      college: college.id,
      emailVerified: true,
      onboarded: true,
      lastLoginAt: /* @__PURE__ */ new Date()
    }
  });
  const student2 = await prisma.user.create({
    data: {
      name: "Priya Patel",
      email: "priya.patel@iiitropar.ac.in",
      password: passwordHash,
      role: "student",
      college: college.id,
      emailVerified: true,
      onboarded: true
    }
  });
  await prisma.studentProfile.createMany({
    data: [
      {
        user: student.id,
        college: college.id,
        degree: "BCA",
        course: "Computer Science",
        semester: 2,
        year: 1,
        section: "B",
        enrollmentNumber: "BCA2025-042",
        bio: "2nd semester BCA student passionate about AI and building products that help students.",
        linkedin: "https://linkedin.com/in/aaravsharma",
        github: "https://github.com/aaravsharma",
        skills: [
          { name: "Python", level: "Intermediate" },
          { name: "React", level: "Intermediate" },
          { name: "AI", level: "Beginner" },
          { name: "JavaScript", level: "Intermediate" },
          { name: "SQL", level: "Beginner" },
          { name: "C", level: "Intermediate" }
        ],
        interests: ["AI/ML", "Web Development", "Data Science"],
        careerGoal: "AI Engineer",
        preferredLocation: "Rupnagar",
        remotePreference: "remote",
        weeklyLearningHours: 12,
        preferredOpportunityTypes: ["internship", "hackathon", "training", "scholarship"],
        roadmap: [
          { skill: "Python", status: "Completed", order: 0 },
          { skill: "SQL", status: "Learning", order: 1 },
          { skill: "Machine Learning", status: "Learning", order: 2 },
          { skill: "Deep Learning", status: "Not Started", order: 3 },
          { skill: "LLMs / Generative AI", status: "Not Started", order: 4 },
          { skill: "Deployment (Docker, APIs)", status: "Not Started", order: 5 },
          { skill: "AI Projects", status: "Learning", order: 6 },
          { skill: "Hackathons", status: "Not Started", order: 7 },
          { skill: "Internships", status: "Not Started", order: 8 }
        ]
      },
      {
        user: student2.id,
        college: college.id,
        degree: "BCA",
        course: "Computer Science",
        semester: 2,
        year: 1,
        section: "A",
        skills: [{ name: "Java", level: "Intermediate" }, { name: "SQL", level: "Beginner" }, { name: "C++", level: "Beginner" }],
        interests: ["Cybersecurity", "Web Development"],
        careerGoal: "Software Engineer",
        remotePreference: "hybrid",
        weeklyLearningHours: 8
      }
    ]
  });
  await prisma.userPreference.createMany({
    data: [{ user: student.id }, { user: student2.id }, { user: faculty.id }, { user: admin.id }]
  });
  await prisma.facultyProfile.createMany({
    data: [
      { user: faculty.id, college: college.id, employeeId: "EMP-2024-001", department: "Computer Science", designation: "Assistant Professor", subjects: ["C Programming", "DBMS", "Data Structures"], classes: ["BCA Sem 2 Section A", "BCA Sem 2 Section B"], bio: "Teaching computer science for 8 years. Research interest in databases." },
      { user: faculty2.id, college: college.id, employeeId: "EMP-2024-002", department: "AI & Data Science", designation: "Assistant Professor", subjects: ["Python Programming", "Web Development", "Machine Learning"], classes: ["BCA Sem 2 Section A", "BCA Sem 2 Section B"], bio: "Passionate about AI/ML education and web technologies." }
    ]
  });
  const subjects = [];
  for (const s of [
    { college: college.id, department: deptCS.id, name: "C Programming", code: "CS201", semester: 2, faculty: faculty.id, color: "#818cf8" },
    { college: college.id, department: deptCS.id, name: "DBMS", code: "CS204", semester: 2, faculty: faculty.id, color: "#34d399" },
    { college: college.id, department: deptCS.id, name: "Web Development", code: "CS206", semester: 2, faculty: faculty2.id, color: "#fbbf24" },
    { college: college.id, department: deptCS.id, name: "Data Structures", code: "CS203", semester: 2, faculty: faculty.id, color: "#f472b6" },
    { college: college.id, department: deptCS.id, name: "Mathematics", code: "MA201", semester: 2, faculty: faculty2.id, color: "#22d3ee" },
    { college: college.id, department: deptAI.id, name: "Python Programming", code: "AI201", semester: 2, faculty: faculty2.id, color: "#a78bfa" }
  ]) {
    subjects.push(await prisma.subject.create({ data: s }));
  }
  const [cProg, dbms, webDev, ds, math, python] = subjects;
  const subjectMap = { "C Programming": cProg, DBMS: dbms, "Web Development": webDev, "Data Structures": ds, Mathematics: math, "Python Programming": python };
  const tt = [
    { subject: cProg, name: "C Programming", day: 1, start: "09:00", end: "10:00", room: "Room 101" },
    { subject: dbms, name: "DBMS", day: 1, start: "10:00", end: "11:00", room: "Room 102" },
    { subject: null, name: "Free Period", day: 1, start: "12:00", end: "13:00", room: "", type: "free" },
    { subject: webDev, name: "Web Development", day: 1, start: "14:00", end: "15:30", room: "Lab 3" },
    { subject: math, name: "Mathematics", day: 2, start: "09:00", end: "10:00", room: "Room 105" },
    { subject: ds, name: "Data Structures", day: 2, start: "11:00", end: "12:00", room: "Room 103" },
    { subject: python, name: "Python Programming", day: 2, start: "14:00", end: "15:00", room: "Lab 1" },
    { subject: dbms, name: "DBMS", day: 3, start: "09:00", end: "10:00", room: "Room 102" },
    { subject: cProg, name: "C Programming", day: 3, start: "10:00", end: "11:00", room: "Room 101" },
    { subject: webDev, name: "Web Development Lab", day: 3, start: "14:00", end: "16:00", room: "Lab 3", type: "lab" },
    { subject: ds, name: "Data Structures", day: 4, start: "09:00", end: "10:00", room: "Room 103" },
    { subject: math, name: "Mathematics", day: 4, start: "11:00", end: "12:00", room: "Room 105" },
    { subject: null, name: "Free Period", day: 4, start: "14:00", end: "15:00", room: "", type: "free" },
    { subject: python, name: "Python Programming", day: 5, start: "09:00", end: "10:00", room: "Lab 1" },
    { subject: dbms, name: "DBMS", day: 5, start: "10:00", end: "11:00", room: "Room 102" },
    { subject: cProg, name: "C Programming Lab", day: 5, start: "14:00", end: "16:00", room: "Lab 2", type: "lab" },
    { subject: webDev, name: "Web Development Workshop", day: 6, start: "10:00", end: "12:00", room: "Seminar Hall", type: "other" }
  ];
  await prisma.timetableSlot.createMany({
    data: tt.map((s) => ({
      student: student.id,
      college: college.id,
      subject: s.subject?.id,
      subjectName: s.name,
      teacherName: s.subject?.name === "Web Development" || s.subject?.name === "Web Development Lab" || s.subject?.name === "Web Development Workshop" ? "Prof. Sneha Iyer" : s.subject?.name === "Python Programming" ? "Prof. Sneha Iyer" : "Prof. Rohan Mehta",
      room: s.room,
      day: s.day,
      startTime: s.start,
      endTime: s.end,
      color: s.subject?.color || "#64748b",
      type: s.type || "class"
    }))
  });
  const attendancePlan = {
    "C Programming": { total: 22, absentDays: [2, 9, 16] },
    DBMS: { total: 24, absentDays: [1, 3, 8, 12, 18, 23] },
    "Web Development": { total: 20, absentDays: [5, 15] },
    "Data Structures": { total: 20, absentDays: [4, 10, 14, 20] },
    Mathematics: { total: 18, absentDays: [2, 6, 9, 13, 17, 21] },
    "Python Programming": { total: 20, absentDays: [7, 11] }
  };
  const scheduleDays = { 1: ["C Programming", "DBMS", "Web Development"], 2: ["Mathematics", "Data Structures", "Python Programming"], 3: ["DBMS", "C Programming", "Web Development"], 4: ["Data Structures", "Mathematics"], 5: ["Python Programming", "DBMS", "C Programming"], 6: ["Web Development"] };
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
      attendanceRecords.push({ student: student.id, subjectName: sub, date: d, status: absent ? "absent" : "present", subject: subjectMap[sub].id });
    }
  }
  await prisma.attendance.createMany({ data: attendanceRecords });
  await prisma.assignment.createMany({
    data: [
      { college: college.id, subject: dbms.id, subjectName: "DBMS", faculty: faculty.id, semester: 2, title: "ER Diagram & Normalization Assignment", description: "Design an ER diagram for a library management system and normalize it up to 3NF.", type: "assignment", dueDate: daysFromNow(1), priority: "high", maxMarks: 50 },
      { college: college.id, subject: cProg.id, subjectName: "C Programming", faculty: faculty.id, semester: 2, title: "Data Structures in C: Linked List Implementation", description: "Implement singly and doubly linked lists with insertion, deletion and reversal.", type: "assignment", dueDate: daysFromNow(4), priority: "medium", maxMarks: 100 },
      { college: college.id, subject: webDev.id, subjectName: "Web Development", faculty: faculty2.id, semester: 2, title: "Personal Portfolio Website", description: "Build a responsive portfolio with HTML, CSS and React. Deploy it and share the link.", type: "project", dueDate: daysFromNow(7), priority: "medium", maxMarks: 100 },
      { college: college.id, subject: python.id, subjectName: "Python Programming", faculty: faculty2.id, semester: 2, title: "Python: Attendance Analyzer Script", description: "Write a Python script that reads attendance data and reports percentage and trends.", type: "assignment", dueDate: daysFromNow(9), priority: "low", maxMarks: 50 }
    ]
  });
  await prisma.task.createMany({
    data: [
      { user: student.id, title: "Complete DBMS ER Diagram", description: "Finish ER diagram for library system", subject: "DBMS", category: "assignment", dueDate: daysFromNow(1), priority: "high", status: "todo" },
      { user: student.id, title: "Revise C pointers", description: "Practice pointer exercises from Chapter 4", subject: "C Programming", category: "study", dueDate: daysFromNow(2), priority: "medium", status: "todo" },
      { user: student.id, title: "Start AI hackathon application", description: "Research team and write project idea", subject: "", category: "career", dueDate: daysFromNow(2), priority: "high", status: "todo" },
      { user: student.id, title: "Python practice: pandas basics", description: "Complete 5 pandas exercises", subject: "Python Programming", category: "study", dueDate: daysFromNow(3), priority: "medium", status: "todo" },
      { user: student.id, title: "Update LinkedIn profile", description: "Add semester 2 skills and projects", subject: "", category: "career", dueDate: daysFromNow(5), priority: "low", status: "todo" },
      { user: student.id, title: "Math problem set 3", description: "Problems 1-10 from unit 3", subject: "Mathematics", category: "study", dueDate: daysFromNow(-1), priority: "medium", status: "done", completedAt: new Date(Date.now() - 2 * DAY_MS) },
      { user: student.id, title: "Watch DBMS normalization video", description: "3NF and BCNF examples", subject: "DBMS", category: "study", dueDate: daysFromNow(-2), priority: "low", status: "done", completedAt: new Date(Date.now() - 3 * DAY_MS) }
    ]
  });
  await prisma.exam.createMany({
    data: [
      { college: college.id, subject: cProg.id, subjectName: "C Programming", semester: 2, title: "C Programming Unit Test 2", date: daysFromNow(5), startTime: "10:00", endTime: "12:00", room: "Hall B", maxMarks: 50, type: "quiz" },
      { college: college.id, subject: dbms.id, subjectName: "DBMS", semester: 2, title: "DBMS Mid-Semester Exam", date: daysFromNow(12), startTime: "10:00", endTime: "13:00", room: "Hall A", maxMarks: 100, type: "midterm" },
      { college: college.id, subject: math.id, subjectName: "Mathematics", semester: 2, title: "Mathematics Mid-Semester Exam", date: daysFromNow(15), startTime: "14:00", endTime: "17:00", room: "Hall C", maxMarks: 100, type: "midterm" }
    ]
  });
  const examNoticeContent = "Mid-semester examinations begin on 15 September.\n\nDBMS \u2014 15 September, 10 AM, Hall A.\nMathematics \u2014 18 September, 2 PM, Hall C.\n\nStudents must fill the examination form before 5 September. Forms are available in the examination cell. Late submission will attract a penalty fee of \u20B9500.\n\nContact the examination cell for any queries.";
  const examNotice = await prisma.notice.create({
    data: {
      college: college.id,
      title: "Important: Mid-Semester Examination Schedule",
      content: examNoticeContent,
      category: "exam",
      important: true,
      date: daysFromNow(-1),
      createdBy: admin.id,
      aiSummary: { ...fallbackNoticeSummary("Important: Mid-Semester Examination Schedule", examNoticeContent), generatedAt: /* @__PURE__ */ new Date() }
    }
  });
  await prisma.notice.createMany({
    data: [
      { college: college.id, title: "TechFest 2026 Registrations Open", content: "IIIT Ropar TechFest 2026 registrations are now open. Workshops, hackathons, and coding competitions across 3 days. Register on the student portal before 20 September.", category: "event", important: false, date: daysFromNow(-2), createdBy: admin.id },
      { college: college.id, title: "Library Timings Extended During Exams", content: "The central library will remain open until 10 PM from 1 September to 20 September for exam preparation. No books will be issued during this period.", category: "general", important: false, date: daysFromNow(-3), createdBy: admin.id },
      { college: college.id, title: "Placement Drive: Infosys & TCS Campus Visit", content: "Campus placements for final-year students begin in October. Pre-placement talks and mock interviews will be conducted by the placement cell. Register your interest in the placement office.", category: "placement", important: true, date: daysFromNow(-4), createdBy: admin.id },
      { college: college.id, title: "Holiday: Independence Day", content: "The college will remain closed on 15 August on account of Independence Day. Classes resume on 16 August.", category: "holiday", important: false, date: daysFromNow(-6), createdBy: admin.id }
    ]
  });
  await prisma.event.createMany({
    data: [
      { college: college.id, title: "AI & ML Workshop", description: "Hands-on workshop covering machine learning fundamentals with Python. Bring your laptops!", category: "workshop", date: daysFromNow(6), startTime: "10:00", endTime: "16:00", location: "Seminar Hall", organizer: "AI/ML Club", registrationLink: "https://forms.gle/demo", createdBy: faculty2.id },
      { college: college.id, title: "IIIT Ropar Hackathon 2026", description: "24-hour hackathon. Build something that solves a real campus problem. Prizes worth \u20B950,000.", category: "hackathon", date: daysFromNow(10), startTime: "09:00", endTime: "09:00", location: "Main Auditorium", organizer: "Coding Club", createdBy: faculty.id },
      { college: college.id, title: "Industry Talk: Careers in Data Science", description: "Guest lecture by alumni working at a top analytics firm. Networking session after.", category: "talk", date: daysFromNow(8), startTime: "15:00", endTime: "17:00", location: "Lecture Hall 2", organizer: "Placement Cell", createdBy: admin.id },
      { college: college.id, title: "Cultural Fest: IIIT Ropar Utsav", description: "Music, dance, drama and art competitions across the campus.", category: "fest", date: daysFromNow(14), startTime: "10:00", endTime: "18:00", location: "Open Air Theatre", organizer: "Cultural Committee", createdBy: admin.id }
    ]
  });
  const codingClub = await prisma.club.create({
    data: {
      college: college.id,
      name: "Coding Club",
      description: "Competitive programming, DSA practice and hackathon teams.",
      category: "technical",
      facultyAdvisor: "Prof. Rohan Mehta",
      members: [student.id, student2.id],
      followers: [student.id],
      announcements: [{ title: "DSA Practice Hour", content: "Join us every Friday at 5 PM in Lab 2.", date: daysFromNow(-2) }]
    }
  });
  await prisma.club.createMany({
    data: [
      { college: college.id, name: "AI/ML Club", description: "Learn machine learning, deep learning and build AI projects.", category: "technical", facultyAdvisor: "Prof. Sneha Iyer", members: [student.id], followers: [student.id], announcements: [{ title: "ML Basics Workshop", content: "This Saturday, 10 AM, Seminar Hall.", date: daysFromNow(-1) }] },
      { college: college.id, name: "Robotics Club", description: "Build robots and compete in national robotics competitions.", category: "technical", facultyAdvisor: "Prof. Rohan Mehta", announcements: [{ title: "RoboWar entries open", content: "Register your team for the inter-college RoboWar.", date: daysFromNow(-3) }] },
      { college: college.id, name: "Photography Club", description: "Campus photography, editing workshops and photo walks.", category: "cultural" },
      { college: college.id, name: "Debate & Literary Society", description: "Debates, MUNs, poetry and creative writing.", category: "cultural" },
      { college: college.id, name: "Music Society", description: "Band practice, open mics and music production.", category: "cultural" }
    ]
  });
  const opportunityRows = [];
  const sampleOpps = [
    {
      title: "Google Summer of Code 2026",
      organization: "Google",
      category: "internship",
      status: "verified",
      description: "Google Summer of Code is a global program that pays students to contribute to open-source software. Work with mentors from top open-source organizations.",
      skillsRequired: ["Git", "Programming", "Open Source"],
      eligibility: "Open to all students enrolled in or accepted to an accredited institution. 18+ years.",
      mode: "remote",
      location: "Remote (Global)",
      stipend: "$3,000 USD stipend",
      prize: "",
      deadline: daysFromNow(45),
      applyLink: "https://summerofcode.withgoogle.com/",
      sourceUrl: "https://summerofcode.withgoogle.com/",
      applyUrl: "https://summerofcode.withgoogle.com/",
      requirements: ["Google account", "Project proposal"],
      applicationProcess: "Submit project proposal on the GSoC portal.",
      tags: ["google", "open-source", "internship"],
      experienceLevel: "fresher",
      verifiedBy: admin.id,
      createdBy: admin.id
    },
    {
      title: "Smart India Hackathon 2026",
      organization: "AICTE / Government of India",
      category: "hackathon",
      status: "verified",
      description: "National-level hackathon organized by the Government of India. Build solutions for real government and industry problem statements.",
      skillsRequired: ["Programming", "Problem Solving"],
      eligibility: "Students enrolled in recognized Indian institutions.",
      mode: "onsite",
      location: "Various Cities, India",
      stipend: "",
      prize: "\u20B91,00,000+ per team",
      deadline: daysFromNow(60),
      applyLink: "https://www.sih.gov.in/",
      sourceUrl: "https://www.sih.gov.in/",
      applyUrl: "https://www.sih.gov.in/",
      requirements: ["Team of 5-6 members", "Valid college ID"],
      applicationProcess: "Register on SIH portal, select problem statement, qualify rounds.",
      tags: ["government", "hackathon", "india"],
      experienceLevel: "fresher",
      verifiedBy: admin.id,
      createdBy: admin.id
    },
    {
      title: "AICTE PM Scholarship Scheme",
      organization: "AICTE / Government of India",
      category: "scholarship",
      status: "verified",
      description: "Scholarship for students of technical courses (B.Tech, BCA, etc.) from AICTE-approved institutions. Covers tuition and hostel fees.",
      skillsRequired: [],
      eligibility: "Students enrolled in AICTE-approved institutions. Income criteria apply.",
      mode: "remote",
      location: "India",
      stipend: "Up to \u20B950,000/year",
      prize: "",
      deadline: daysFromNow(90),
      applyLink: "https://scholarships.gov.in/",
      sourceUrl: "https://scholarships.gov.in/",
      applyUrl: "https://scholarships.gov.in/",
      requirements: ["Aadhaar card", "Income certificate", "Marksheets"],
      applicationProcess: "Apply on National Scholarship Portal.",
      tags: ["government", "scholarship", "india"],
      experienceLevel: "any",
      verifiedBy: admin.id,
      createdBy: admin.id
    }
  ];
  const opportunities = [];
  for (const row of sampleOpps) {
    opportunities.push(await prisma.opportunity.create({ data: row }));
  }
  if (opportunities.length > 0) {
    await prisma.application.createMany({
      data: [
        {
          student: student.id,
          opportunity: opportunities[0].id,
          status: "applied",
          appliedDate: /* @__PURE__ */ new Date(),
          notes: "Applied via Google Summer of Code portal.",
          timeline: [{ status: "applied" }]
        },
        {
          student: student.id,
          opportunity: opportunities[1].id,
          status: "saved",
          timeline: [{ status: "saved" }]
        }
      ]
    });
  }
  const notifs = [
    { user: student.id, category: "academic", title: "\u23F0 DBMS assignment due tomorrow", message: '"ER Diagram & Normalization Assignment" is due tomorrow.', link: "/assignments", icon: "alarm-clock", priority: "high", read: false },
    { user: student.id, category: "attendance", title: "\u26A0\uFE0F Mathematics attendance at 67%", message: "Attend the next 5 classes to reach your 75% target.", link: "/attendance", icon: "percent", priority: "high", read: false },
    { user: student.id, category: "college", title: "\u{1F4E2} Important: Mid-Semester Examination Schedule", message: "Mid-semester examinations begin 15 September. Form deadline: 5 September.", link: "/college", icon: "megaphone", priority: "high", read: false },
    { user: student.id, category: "ai", title: "\u{1F9E0} Your AI Daily Plan is ready", message: "Open the AI Daily Planner to see today's focus.", link: "/ai/planner", icon: "sparkles", priority: "medium", read: false },
    { user: student.id, category: "system", title: "Welcome to CAMPUSCONNECT, Aarav! \u{1F44B}", message: "Your AI-powered campus is ready. IIIT Ropar.", link: "/dashboard", icon: "sparkles", priority: "low", read: true }
  ];
  if (opportunities.length > 0) {
    notifs.push({ user: student.id, category: "opportunity", title: "\u{1F3AF} New opportunities available!", message: "Fresh opportunities from IITs, Google, and government portals are now live.", link: "/opportunities", icon: "target", priority: "high", read: false });
  }
  await prisma.notification.createMany({ data: notifs });
  console.log("[seed] \u2705 Demo data seeded");
  console.log("   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  console.log("   \u{1F393} Student : student@demo.campusconnect / demo1234");
  console.log("   \u{1F468}\u200D\u{1F3EB} Faculty : faculty@demo.campusconnect / demo1234");
  console.log("   \u{1F6E1}\uFE0F  Admin  : admin@demo.campusconnect / demo1234");
  console.log("   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  return { seeded: true };
}
async function reseed() {
  await ensureSeed({ force: true });
}
async function ensureSampleOpportunities() {
  const d1 = await prisma.opportunity.deleteMany({ where: { applyLink: { contains: "example.com" } } });
  const d2 = await prisma.opportunity.deleteMany({ where: { sourceUrl: { contains: "example.com" } } });
  const d3 = await prisma.opportunity.deleteMany({ where: { applyUrl: { contains: "example.com" } } });
  const d4 = await prisma.opportunity.deleteMany({ where: { applyUrl: "" } });
  const d5 = await prisma.opportunity.deleteMany({ where: { applyUrl: "", applyLink: "" } });
  const d6 = await prisma.opportunity.deleteMany({ where: { applyUrl: { contains: "ge.iitm.ac.in" } } });
  const d7 = await prisma.opportunity.deleteMany({ where: { applyUrl: { contains: "example.com" } } });
  const d8 = await prisma.opportunity.deleteMany({ where: { sourceUrl: { contains: "example.com" } } });
  const totalDeleted = d1.count + d2.count + d3.count + d4.count + d5.count + d6.count + d7.count + d8.count;
  if (totalDeleted > 0) console.log(`[seed] Cleaned ${totalDeleted} dummy/broken opportunities`);
  const samples = [
    // ─── GOOGLE / BIG TECH (8) ───
    {
      title: "Google Summer of Code 2026",
      organization: "Google",
      category: "internship",
      status: "verified",
      description: "Global program paying students to contribute to open-source. Work with mentors from top organizations worldwide.",
      skillsRequired: ["Git", "Programming"],
      eligibility: "Open to all students. 18+ years.",
      mode: "remote",
      location: "Global",
      stipend: "$3,000 USD",
      prize: "",
      deadline: daysFromNow(45),
      applyUrl: "https://summerofcode.withgoogle.com/",
      sourceUrl: "https://summerofcode.withgoogle.com/",
      tags: ["google", "open-source"],
      experienceLevel: "fresher"
    },
    {
      title: "Google Ada Lovelace Scholarship for Women in CS",
      organization: "Google",
      category: "scholarship",
      status: "verified",
      description: "Scholarship supporting women in computer science. Includes mentorship, networking, and a stipend.",
      skillsRequired: ["Computer Science"],
      eligibility: "Women students in CS or related fields.",
      mode: "remote",
      location: "Global",
      stipend: "$10,000 USD",
      prize: "",
      deadline: daysFromNow(60),
      applyUrl: "https://buildyourfuture.withgoogle.com/",
      sourceUrl: "https://buildyourfuture.withgoogle.com/",
      tags: ["google", "scholarship", "women"],
      experienceLevel: "fresher"
    },
    {
      title: "Google Code Jam",
      organization: "Google",
      category: "competition",
      status: "verified",
      description: "Global programming competition by Google. Solve algorithmic challenges and compete for prizes.",
      skillsRequired: ["Programming", "Algorithms"],
      eligibility: "Open to all.",
      mode: "remote",
      location: "Online",
      stipend: "",
      prize: "$15,000 first prize",
      deadline: daysFromNow(50),
      applyUrl: "https://codingcompetitions.withgoogle.com/",
      sourceUrl: "https://codingcompetitions.withgoogle.com/",
      tags: ["google", "competitive"],
      experienceLevel: "any"
    },
    {
      title: "Microsoft Imagine Cup",
      organization: "Microsoft",
      category: "competition",
      status: "verified",
      description: "Global student technology competition. Build innovative solutions using Microsoft technologies.",
      skillsRequired: ["Programming"],
      eligibility: "Students aged 16+.",
      mode: "remote",
      location: "Online",
      stipend: "",
      prize: "$100,000",
      deadline: daysFromNow(80),
      applyUrl: "https://imaginecup.microsoft.com/en-us/",
      sourceUrl: "https://imaginecup.microsoft.com/en-us/",
      tags: ["microsoft", "innovation"],
      experienceLevel: "fresher"
    },
    {
      title: "Meta University Program",
      organization: "Meta",
      category: "training",
      status: "verified",
      description: "Intensive summer program for underrepresented students in tech. Learn from Meta engineers.",
      skillsRequired: ["Python", "Programming"],
      eligibility: "Underrepresented students in CS.",
      mode: "hybrid",
      location: "Menlo Park, CA",
      stipend: "Paid",
      prize: "",
      deadline: daysFromNow(40),
      applyUrl: "https://www.metacareers.com/",
      sourceUrl: "https://www.metacareers.com/",
      tags: ["meta", "training", "diversity"],
      experienceLevel: "fresher"
    },
    {
      title: "Samsung PRISM Research Program",
      organization: "Samsung R&D",
      category: "research",
      status: "verified",
      description: "Research program for B.Tech students. Work on AI, IoT, and mobile technology with Samsung mentors.",
      skillsRequired: ["Python", "AI", "Programming"],
      eligibility: "B.Tech 3rd/4th year students.",
      mode: "hybrid",
      location: "Bangalore, India",
      stipend: "\u20B915,000/month",
      prize: "",
      deadline: daysFromNow(30),
      applyUrl: "https://research.samsung.com/PRISM",
      sourceUrl: "https://research.samsung.com/PRISM",
      tags: ["samsung", "research", "ai"],
      experienceLevel: "junior"
    },
    // ─── GOVERNMENT INDIA (10) ───
    {
      title: "Smart India Hackathon 2026",
      organization: "AICTE / Government of India",
      category: "hackathon",
      status: "verified",
      description: "National hackathon. Build solutions for real government problem statements. 48-hour event across India.",
      skillsRequired: ["Programming", "Problem Solving"],
      eligibility: "Students of recognized Indian institutions.",
      mode: "onsite",
      location: "Various Cities, India",
      stipend: "",
      prize: "\u20B91,00,000+ per team",
      deadline: daysFromNow(60),
      applyUrl: "https://www.sih.gov.in/",
      sourceUrl: "https://www.sih.gov.in/",
      tags: ["government", "hackathon"],
      experienceLevel: "fresher"
    },
    {
      title: "AICTE PM Scholarship Scheme",
      organization: "AICTE / Government of India",
      category: "scholarship",
      status: "verified",
      description: "Scholarship for B.Tech/BCA students from AICTE-approved institutions. Covers tuition and hostel fees.",
      skillsRequired: [],
      eligibility: "AICTE-approved institution students. Income criteria apply.",
      mode: "remote",
      location: "India",
      stipend: "Up to \u20B950,000/year",
      prize: "",
      deadline: daysFromNow(90),
      applyUrl: "https://scholarships.gov.in/",
      sourceUrl: "https://scholarships.gov.in/",
      tags: ["government", "scholarship"],
      experienceLevel: "any"
    },
    {
      title: "National Scholarship Portal (NSP)",
      organization: "Ministry of Education, India",
      category: "scholarship",
      status: "verified",
      description: "Centralized portal for all government scholarships. Pre-matric, post-matric, and merit-cum-means scholarships.",
      skillsRequired: [],
      eligibility: "Indian students across all levels.",
      mode: "remote",
      location: "India",
      stipend: "Varies by scheme",
      prize: "",
      deadline: daysFromNow(120),
      applyUrl: "https://scholarships.gov.in/",
      sourceUrl: "https://scholarships.gov.in/",
      tags: ["government", "scholarship", "india"],
      experienceLevel: "any"
    },
    {
      title: "MyGov Innovation Challenge",
      organization: "MyGov India",
      category: "competition",
      status: "verified",
      description: "Government innovation challenges. Build tech solutions for real governance problems.",
      skillsRequired: ["Programming"],
      eligibility: "Indian citizens, students welcome.",
      mode: "remote",
      location: "India",
      stipend: "",
      prize: "Up to \u20B95,00,000",
      deadline: daysFromNow(45),
      applyUrl: "https://mygov.in/",
      sourceUrl: "https://mygov.in/",
      tags: ["government", "innovation"],
      experienceLevel: "any"
    },
    {
      title: "DRDO Research Fellowship",
      organization: "DRDO",
      category: "research",
      status: "verified",
      description: "Research fellowship at DRDO labs. Work on cutting-edge defence technology projects with top scientists.",
      skillsRequired: ["Engineering", "Research"],
      eligibility: "B.Tech/M.Tech students in relevant fields.",
      mode: "onsite",
      location: "New Delhi, India",
      stipend: "\u20B925,000-31,000/month",
      prize: "",
      deadline: daysFromNow(30),
      applyUrl: "https://www.drdo.gov.in/",
      sourceUrl: "https://www.drdo.gov.in/",
      tags: ["drdo", "government", "research"],
      experienceLevel: "junior"
    },
    {
      title: "ISRO Summer Internship",
      organization: "ISRO",
      category: "internship",
      status: "verified",
      description: "Summer internship at ISRO centers. Work on space technology, satellite systems, and rocket science.",
      skillsRequired: ["Engineering", "Programming"],
      eligibility: "Engineering students (3rd/4th year).",
      mode: "onsite",
      location: "Bangalore, India",
      stipend: "\u20B910,000/month",
      prize: "",
      deadline: daysFromNow(20),
      applyUrl: "https://www.isro.gov.in/",
      sourceUrl: "https://www.isro.gov.in/",
      tags: ["isro", "government", "space", "internship"],
      experienceLevel: "junior"
    },
    {
      title: "CSIR Summer Research Fellowship",
      organization: "CSIR",
      category: "research",
      status: "verified",
      description: "Research fellowship at CSIR laboratories. Work on scientific and engineering research projects.",
      skillsRequired: ["Science", "Engineering"],
      eligibility: "B.Tech/MSc/BCA students with strong academics.",
      mode: "onsite",
      location: "Various CSIR Labs, India",
      stipend: "\u20B915,000/month",
      prize: "",
      deadline: daysFromNow(40),
      applyUrl: "https://www.csir.res.in/",
      sourceUrl: "https://www.csir.res.in/",
      tags: ["csir", "government", "research"],
      experienceLevel: "fresher"
    },
    {
      title: "PM Scholarship Scheme for Students",
      organization: "Government of India",
      category: "scholarship",
      status: "verified",
      description: "Scholarship for wards of ex-servicemen and widows. Covers professional courses including B.Tech, BCA, MBA.",
      skillsRequired: [],
      eligibility: "Wards of ex-servicemen/widows in professional courses.",
      mode: "remote",
      location: "India",
      stipend: "\u20B92,500-3,000/month",
      prize: "",
      deadline: daysFromNow(60),
      applyUrl: "https://scholarships.gov.in/",
      sourceUrl: "https://scholarships.gov.in/",
      tags: ["government", "scholarship"],
      experienceLevel: "any"
    },
    {
      title: "Nirmaan Scholarship Program",
      organization: "Nirmaan Organisation",
      category: "scholarship",
      status: "verified",
      description: "Scholarship for meritorious students from economically weaker backgrounds.",
      skillsRequired: [],
      eligibility: "Students with family income < \u20B96 LPA.",
      mode: "remote",
      location: "India",
      stipend: "Up to \u20B930,000/year",
      prize: "",
      deadline: daysFromNow(45),
      applyUrl: "https://www.nirmaan.org/",
      sourceUrl: "https://www.nirmaan.org/",
      tags: ["scholarship", "india"],
      experienceLevel: "any"
    },
    {
      title: "Digital India Internship Portal",
      organization: "Government of India",
      category: "internship",
      status: "verified",
      description: "Government internship opportunities across ministries and departments. Build real digital India solutions.",
      skillsRequired: ["Programming"],
      eligibility: "Indian students and graduates.",
      mode: "hybrid",
      location: "India",
      stipend: "\u20B910,000-20,000/month",
      prize: "",
      deadline: daysFromNow(60),
      applyUrl: "https://digitalindia.gov.in/",
      sourceUrl: "https://digitalindia.gov.in/",
      tags: ["government", "internship", "digital"],
      experienceLevel: "fresher"
    },
    // ─── IITs (6) ───
    {
      title: "IIT Delhi Internship Portal",
      organization: "IIT Delhi",
      category: "internship",
      status: "verified",
      description: "Summer research internship program at IIT Delhi. Work with faculty on cutting-edge research.",
      skillsRequired: ["Research", "Programming"],
      eligibility: "B.Tech students with 7.5+ CGPA.",
      mode: "onsite",
      location: "New Delhi, India",
      stipend: "\u20B910,000/month",
      prize: "",
      deadline: daysFromNow(25),
      applyUrl: "https://www.iitd.ac.in/",
      sourceUrl: "https://www.iitd.ac.in/",
      tags: ["iit", "research", "internship"],
      experienceLevel: "fresher"
    },
    {
      title: "IIT Madras Scholarships & Internships",
      organization: "IIT Madras",
      category: "internship",
      status: "verified",
      description: "Internships at IIT Madras. Work with startups and research groups on real-world projects.",
      skillsRequired: ["Programming", "Engineering"],
      eligibility: "Engineering students.",
      mode: "onsite",
      location: "Chennai, India",
      stipend: "\u20B98,000-20,000/month",
      prize: "",
      deadline: daysFromNow(35),
      applyUrl: "https://www.iitm.ac.in/",
      sourceUrl: "https://www.iitm.ac.in/",
      tags: ["iit", "internship", "research"],
      experienceLevel: "fresher"
    },
    {
      title: "IIT Roorkee Research Opportunities",
      organization: "IIT Roorkee",
      category: "research",
      status: "verified",
      description: "Research and internship opportunities at IIT Roorkee. Multiple departments offering positions.",
      skillsRequired: ["Research", "Engineering"],
      eligibility: "B.Tech/MSc students.",
      mode: "onsite",
      location: "Roorkee, India",
      stipend: "\u20B95,000-12,000/month",
      prize: "",
      deadline: daysFromNow(30),
      applyUrl: "https://www.iitr.ac.in/",
      sourceUrl: "https://www.iitr.ac.in/",
      tags: ["iit", "research"],
      experienceLevel: "fresher"
    },
    {
      title: "IIT Goa Internship Program",
      organization: "IIT Goa",
      category: "internship",
      status: "verified",
      description: "Summer internship opportunities at IIT Goa. Work on research projects across engineering departments.",
      skillsRequired: ["Programming"],
      eligibility: "B.Tech students.",
      mode: "onsite",
      location: "Goa, India",
      stipend: "\u20B95,000-8,000/month",
      prize: "",
      deadline: daysFromNow(25),
      applyUrl: "https://www.iitgoa.ac.in/",
      sourceUrl: "https://www.iitgoa.ac.in/",
      tags: ["iit", "internship"],
      experienceLevel: "fresher"
    },
    {
      title: "IIT Mandi Research Fellowship",
      organization: "IIT Mandi",
      category: "research",
      status: "verified",
      description: "Research fellowship at IIT Mandi. Focus on AI, energy, and advanced materials research.",
      skillsRequired: ["Research"],
      eligibility: "B.Tech/MSc students with good academics.",
      mode: "onsite",
      location: "Mandi, Himachal Pradesh",
      stipend: "\u20B98,000/month",
      prize: "",
      deadline: daysFromNow(30),
      applyUrl: "https://www.iitmandi.ac.in/",
      sourceUrl: "https://www.iitmandi.ac.in/",
      tags: ["iit", "research", "fellowship"],
      experienceLevel: "fresher"
    },
    {
      title: "IIT Kanpur Summer Fellowship Program",
      organization: "IIT Kanpur",
      category: "research",
      status: "verified",
      description: "8-week summer fellowship at IIT Kanpur. Research exposure with faculty mentors and lab access.",
      skillsRequired: ["Research", "Academic"],
      eligibility: "B.Tech/MSc students with strong academics.",
      mode: "onsite",
      location: "Kanpur, India",
      stipend: "\u20B98,000/month",
      prize: "",
      deadline: daysFromNow(20),
      applyUrl: "https://www.iitk.ac.in/",
      sourceUrl: "https://www.iitk.ac.in/",
      tags: ["iit", "fellowship", "research"],
      experienceLevel: "fresher"
    },
    // ─── NITs (3) ───
    {
      title: "NIT Rourkela Internship Program",
      organization: "NIT Rourkela",
      category: "internship",
      status: "verified",
      description: "Summer internship at NIT Rourkela. Research and development projects across engineering departments.",
      skillsRequired: ["Programming", "Engineering"],
      eligibility: "B.Tech students.",
      mode: "onsite",
      location: "Rourkela, India",
      stipend: "\u20B95,000-10,000/month",
      prize: "",
      deadline: daysFromNow(30),
      applyUrl: "https://www.nitrkl.ac.in/",
      sourceUrl: "https://www.nitrkl.ac.in/",
      tags: ["nit", "internship"],
      experienceLevel: "fresher"
    },
    // ─── IIITs (3) ───
    {
      title: "IIIT Hyderabad Research Internships",
      organization: "IIIT Hyderabad",
      category: "internship",
      status: "verified",
      description: "Research internships at IIIT Hyderabad. Work on AI, NLP, computer vision, and robotics projects.",
      skillsRequired: ["Python", "Machine Learning"],
      eligibility: "B.Tech students with CGPA 7.0+.",
      mode: "onsite",
      location: "Hyderabad, India",
      stipend: "\u20B98,000/month",
      prize: "",
      deadline: daysFromNow(25),
      applyUrl: "https://www.iiit.ac.in/",
      sourceUrl: "https://www.iiit.ac.in/",
      tags: ["iiit", "research", "ai"],
      experienceLevel: "fresher"
    },
    {
      title: "IIIT Bangalore Innovation Internships",
      organization: "IIIT Bangalore",
      category: "internship",
      status: "verified",
      description: "Innovation and research internships at IIIT Bangalore. Focus: AI, data science, IoT, cybersecurity.",
      skillsRequired: ["Programming", "Data Science"],
      eligibility: "B.Tech/BCA students.",
      mode: "onsite",
      location: "Bangalore, India",
      stipend: "\u20B910,000/month",
      prize: "",
      deadline: daysFromNow(30),
      applyUrl: "https://www.iiitb.ac.in/",
      sourceUrl: "https://www.iiitb.ac.in/",
      tags: ["iiit", "innovation", "internship"],
      experienceLevel: "fresher"
    },
    // ─── COMPETITIONS / HACKATHONS (8) ───
    {
      title: "ACM-ICPC Asia Regional Contest",
      organization: "ACM",
      category: "competition",
      status: "verified",
      description: "Prestigious team programming contest. Teams of 3 solve algorithmic problems in 5 hours.",
      skillsRequired: ["C++", "Algorithms", "Teamwork"],
      eligibility: "University students (teams of 3).",
      mode: "onsite",
      location: "Various Cities, India",
      stipend: "",
      prize: "Medals + Recognition",
      deadline: daysFromNow(90),
      applyUrl: "https://icpc.global/",
      sourceUrl: "https://icpc.global/",
      tags: ["acm", "competitive", "teamwork"],
      experienceLevel: "any"
    },
    {
      title: "Unstop \u2014 Competitions & Internships",
      organization: "Unstop",
      category: "competition",
      status: "verified",
      description: "Platform for hackathons, competitions, internships, and more from top companies.",
      skillsRequired: [],
      eligibility: "All students.",
      mode: "hybrid",
      location: "India",
      stipend: "Varies",
      prize: "",
      deadline: daysFromNow(45),
      applyUrl: "https://unstop.com/",
      sourceUrl: "https://unstop.com/",
      tags: ["unstop", "hackathon", "internship"],
      experienceLevel: "any"
    },
    {
      title: "Wellfound \u2014 Startup Jobs",
      organization: "Wellfound",
      category: "job",
      status: "verified",
      description: "Find jobs at innovative startups. Remote-friendly positions with equity options.",
      skillsRequired: [],
      eligibility: "Open to all.",
      mode: "remote",
      location: "Global",
      stipend: "Varies + Equity",
      prize: "",
      deadline: daysFromNow(90),
      applyUrl: "https://wellfound.com/jobs",
      sourceUrl: "https://wellfound.com/jobs",
      tags: ["startup", "jobs"],
      experienceLevel: "fresher"
    },
    {
      title: "Internshala \u2014 Tech Internships",
      organization: "Internshala",
      category: "internship",
      status: "verified",
      description: "Browse thousands of verified tech internships. Web dev, app dev, data science, and more.",
      skillsRequired: [],
      eligibility: "All students.",
      mode: "remote",
      location: "India",
      stipend: "\u20B91,000-25,000/month",
      prize: "",
      deadline: daysFromNow(60),
      applyUrl: "https://internshala.com/",
      sourceUrl: "https://internshala.com/",
      tags: ["internshala", "internship"],
      experienceLevel: "fresher"
    },
    {
      title: "Hackathon.com \u2014 Global Hackathons",
      organization: "Hackathon.com",
      category: "hackathon",
      status: "verified",
      description: "Find and join hackathons worldwide. In-person and online events from top organizers.",
      skillsRequired: [],
      eligibility: "All students.",
      mode: "hybrid",
      location: "Global",
      stipend: "Varies",
      prize: "",
      deadline: daysFromNow(45),
      applyUrl: "https://www.hackathon.com/",
      sourceUrl: "https://www.hackathon.com/",
      tags: ["hackathon", "global"],
      experienceLevel: "any"
    },
    {
      title: "TechGig \u2014 Coding Challenges & Jobs",
      organization: "TechGig",
      category: "competition",
      status: "verified",
      description: "Competitive coding challenges, hackathons, and tech job listings from top Indian companies.",
      skillsRequired: ["Programming"],
      eligibility: "All students and professionals.",
      mode: "remote",
      location: "India",
      stipend: "",
      prize: "Prizes + Jobs",
      deadline: daysFromNow(30),
      applyUrl: "https://www.techgig.com/",
      sourceUrl: "https://www.techgig.com/",
      tags: ["techgig", "competitive", "jobs"],
      experienceLevel: "any"
    },
    {
      title: "Edabit \u2014 Coding Challenges",
      organization: "Edabit",
      category: "training",
      status: "verified",
      description: "Fun bite-sized coding challenges. Level up your programming skills with progressive difficulty.",
      skillsRequired: ["Programming"],
      eligibility: "All students.",
      mode: "remote",
      location: "Online",
      stipend: "",
      prize: "",
      deadline: daysFromNow(120),
      applyUrl: "https://edabit.com/challenges",
      sourceUrl: "https://edabit.com/challenges",
      tags: ["coding", "practice"],
      experienceLevel: "any"
    },
    // ─── TRAINING / COURSES (5) ───
    {
      title: "AWS Educate \u2014 Free Cloud Training",
      organization: "Amazon Web Services",
      category: "training",
      status: "verified",
      description: "Free cloud computing training and $100 AWS credits. Learn AWS services and earn certificates.",
      skillsRequired: [],
      eligibility: "All students with .edu email.",
      mode: "remote",
      location: "Online",
      stipend: "$100 AWS credits",
      prize: "",
      deadline: daysFromNow(120),
      applyUrl: "https://aws.amazon.com/education/awseducate/",
      sourceUrl: "https://aws.amazon.com/education/awseducate/",
      tags: ["aws", "cloud", "free"],
      experienceLevel: "any"
    },
    {
      title: "NVIDIA Deep Learning Institute",
      organization: "NVIDIA",
      category: "training",
      status: "verified",
      description: "Free GPU-accelerated training courses. Learn deep learning, computer vision, and NLP.",
      skillsRequired: ["Python", "Machine Learning"],
      eligibility: "All students and professionals.",
      mode: "remote",
      location: "Online",
      stipend: "",
      prize: "Certificates",
      deadline: daysFromNow(120),
      applyUrl: "https://www.nvidia.com/en-us/training/",
      sourceUrl: "https://www.nvidia.com/en-us/training/",
      tags: ["nvidia", "ai", "training"],
      experienceLevel: "any"
    },
    {
      title: "IBM SkillsBuild \u2014 Free Tech Training",
      organization: "IBM",
      category: "training",
      status: "verified",
      description: "Free courses on AI, cloud, cybersecurity, and data science. Earn IBM digital badges.",
      skillsRequired: [],
      eligibility: "All students.",
      mode: "remote",
      location: "Online",
      stipend: "",
      prize: "Digital badges",
      deadline: daysFromNow(120),
      applyUrl: "https://skillsbuild.org/",
      sourceUrl: "https://skillsbuild.org/",
      tags: ["ibm", "training", "free"],
      experienceLevel: "any"
    },
    {
      title: "Harvard CS50 \u2014 Introduction to CS",
      organization: "Harvard University",
      category: "training",
      status: "verified",
      description: "World-famous free CS course. Learn C, Python, SQL, web development. Certificate available.",
      skillsRequired: [],
      eligibility: "All students.",
      mode: "remote",
      location: "Online",
      stipend: "",
      prize: "Certificate",
      deadline: daysFromNow(120),
      applyUrl: "https://cs50.harvard.edu/",
      sourceUrl: "https://cs50.harvard.edu/",
      tags: ["harvard", "cs", "training"],
      experienceLevel: "any"
    },
    {
      title: "Kaggle Competitions",
      organization: "Kaggle",
      category: "competition",
      status: "verified",
      description: "Data science and ML competitions. Solve real-world problems with datasets from top companies.",
      skillsRequired: ["Python", "Machine Learning", "Data Science"],
      eligibility: "Open to all.",
      mode: "remote",
      location: "Online",
      stipend: "",
      prize: "Up to $100,000",
      deadline: daysFromNow(30),
      applyUrl: "https://www.kaggle.com/competitions",
      sourceUrl: "https://www.kaggle.com/competitions",
      tags: ["kaggle", "ml", "data-science"],
      experienceLevel: "any"
    },
    // ─── RESEARCH (2) ───
    {
      title: "Google Research Internship",
      organization: "Google Research",
      category: "internship",
      status: "verified",
      description: "Research internship at Google. Work on ML, NLP, computer vision, and systems research.",
      skillsRequired: ["Research", "Python", "Machine Learning"],
      eligibility: "PhD/Masters students in CS.",
      mode: "onsite",
      location: "Bangalore, India",
      stipend: "Competitive",
      prize: "",
      deadline: daysFromNow(30),
      applyUrl: "https://research.google/careers/",
      sourceUrl: "https://research.google/careers/",
      tags: ["google", "research"],
      experienceLevel: "mid"
    },
    // ─── FELLOWSHIPS (3) ───
    {
      title: "Teach For India Fellowship",
      organization: "Teach For India",
      category: "fellowship",
      status: "verified",
      description: "2-year fellowship teaching in underserved schools. Leadership development and community impact.",
      skillsRequired: ["Leadership", "Communication"],
      eligibility: "Graduates with strong leadership.",
      mode: "onsite",
      location: "Various Cities, India",
      stipend: "\u20B920,000-25,000/month",
      prize: "",
      deadline: daysFromNow(60),
      applyUrl: "https://www.teachforindia.org/",
      sourceUrl: "https://www.teachforindia.org/",
      tags: ["fellowship", "teaching", "leadership"],
      experienceLevel: "fresher"
    },
    {
      title: "Outreachy \u2014 Internships for Underrepresented Groups",
      organization: "Outreachy",
      category: "internship",
      status: "verified",
      description: "Paid internships in open source for underrepresented people in tech. 3-month remote internships.",
      skillsRequired: ["Git", "Programming"],
      eligibility: "Underrepresented genders in tech.",
      mode: "remote",
      location: "Global",
      stipend: "$7,000 USD",
      prize: "",
      deadline: daysFromNow(50),
      applyUrl: "https://www.outreachy.org/",
      sourceUrl: "https://www.outreachy.org/",
      tags: ["open-source", "diversity", "internship"],
      experienceLevel: "fresher"
    },
    {
      title: "MLH Fellowship \u2014 Open Source Track",
      organization: "MLH",
      category: "fellowship",
      status: "verified",
      description: "12-week paid fellowship contributing to open source. Remote with stipend and mentorship.",
      skillsRequired: ["Programming", "Git"],
      eligibility: "Students and recent grads.",
      mode: "remote",
      location: "Global",
      stipend: "$5,000 USD",
      prize: "",
      deadline: daysFromNow(40),
      applyUrl: "https://fellowship.mlh.io/",
      sourceUrl: "https://fellowship.mlh.io/",
      tags: ["mlh", "open-source", "fellowship"],
      experienceLevel: "fresher"
    }
  ];
  let inserted = 0;
  for (const sample of samples) {
    const existing = await prisma.opportunity.findFirst({
      where: { title: sample.title, organization: sample.organization }
    });
    if (!existing) {
      await prisma.opportunity.create({ data: sample });
      inserted++;
    }
  }
  if (inserted > 0) console.log(`[seed] \u2705 Inserted ${inserted} real opportunities (${samples.length} total in seed list)`);
  else console.log("[seed] All real opportunities already exist in database");
}
var DAY_MS, DEMO_PASSWORD;
var init_seedService = __esm({
  "server/src/services/seedService.js"() {
    init_prisma();
    init_userUtils();
    init_fallbacks();
    DAY_MS = 864e5;
    DEMO_PASSWORD = "demo1234";
  }
});

// server/src/app.js
var app_exports = {};
__export(app_exports, {
  default: () => app_default
});
module.exports = __toCommonJS(app_exports);
var import_express27 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_helmet = __toESM(require("helmet"), 1);
var import_path5 = __toESM(require("path"), 1);
var import_fs4 = __toESM(require("fs"), 1);
var import_url2 = require("url");
var import_multer2 = __toESM(require("multer"), 1);
var import_express_rate_limit = require("express-rate-limit");
init_env();

// server/src/routes/auth.js
var import_express = require("express");
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_express_validator2 = require("express-validator");
init_env();
init_prisma();

// server/src/middleware/auth.js
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
init_env();
init_prisma();

// server/src/utils/ApiError.js
var ApiError = class _ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
  static badRequest(message = "Bad request", details) {
    return new _ApiError(400, message, details);
  }
  static unauthorized(message = "Unauthorized") {
    return new _ApiError(401, message);
  }
  static forbidden(message = "Forbidden") {
    return new _ApiError(403, message);
  }
  static notFound(message = "Not found") {
    return new _ApiError(404, message);
  }
  static conflict(message = "Conflict") {
    return new _ApiError(409, message);
  }
};

// server/src/utils/asyncHandler.js
var asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// server/src/middleware/auth.js
var auth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized("Authentication required. Please log in.");
  let payload;
  try {
    payload = import_jsonwebtoken.default.verify(token, env.JWT_SECRET);
  } catch {
    throw ApiError.unauthorized("Session expired or invalid. Please log in again.");
  }
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) throw ApiError.unauthorized("Account not found.");
  if (!user.active) throw ApiError.forbidden("This account has been deactivated.");
  req.user = user;
  req.token = token;
  next();
});
var optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = import_jsonwebtoken.default.verify(token, env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (user && user.active) req.user = user;
  } catch {
  }
  next();
});

// server/src/middleware/validate.js
var import_express_validator = require("express-validator");
function validate(req, res, next) {
  const errors = (0, import_express_validator.validationResult)(req);
  if (errors.isEmpty()) return next();
  const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  throw ApiError.badRequest("Validation failed", details);
}

// server/src/routes/auth.js
init_userUtils();

// server/src/services/notificationService.js
init_prisma();
var CATEGORY_PREF_MAP = {
  college: "collegeAnnouncements",
  academic: "deadlineReminders",
  attendance: "attendanceAlerts",
  opportunity: "deadlineReminders",
  career: "aiRecommendations",
  ai: "aiRecommendations",
  system: null
};
async function createNotification(userId, { category = "system", title, message = "", link = "", icon = "bell", priority = "medium" }) {
  try {
    const pref = await prisma.userPreference.findUnique({ where: { user: userId } });
    const prefKey = CATEGORY_PREF_MAP[category];
    if (pref && prefKey && pref.notifications?.[prefKey] === false) {
      return null;
    }
    return await prisma.notification.create({ data: { user: userId, category, title, message, link, icon, priority } });
  } catch (err) {
    console.error("[notifications] create failed", err.message);
    return null;
  }
}

// server/src/routes/auth.js
var router = (0, import_express.Router)();
function signToken(user) {
  return import_jsonwebtoken2.default.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}
async function ensureCollege(name) {
  if (!name) return null;
  const trimmed = name.trim();
  let college = await prisma.college.findFirst({ where: { name: trimmed } });
  if (!college) {
    college = await prisma.college.create({
      data: { name: trimmed, code: trimmed.slice(0, 6).toUpperCase().replace(/\s+/g, "_") }
    });
  }
  return college;
}
async function setupNewUser(user, extra) {
  await prisma.userPreference.upsert({
    where: { user: user.id },
    update: {},
    create: { user: user.id }
  });
  if (user.role === "student") {
    await prisma.studentProfile.upsert({
      where: { user: user.id },
      update: {},
      create: {
        user: user.id,
        college: user.college,
        degree: extra?.degree || "",
        course: extra?.course || "",
        semester: Number(extra?.semester) || 1,
        year: Number(extra?.year) || 1,
        section: extra?.section || ""
      }
    });
  }
  if (user.role === "faculty") {
    await prisma.facultyProfile.upsert({
      where: { user: user.id },
      update: {},
      create: {
        user: user.id,
        college: user.college,
        employeeId: extra?.employeeId || "",
        department: extra?.department || "",
        designation: extra?.designation || "",
        subjects: extra?.subjects || [],
        classes: extra?.classes || []
      }
    });
  }
  await createNotification(user.id, {
    category: "system",
    title: `Welcome to CAMPUSCONNECT, ${user.name.split(" ")[0]}! \u{1F44B}`,
    message: user.role === "student" ? "Complete your profile and onboarding to unlock AI-powered recommendations." : user.role === "faculty" ? "Set up your faculty profile to manage classes and assignments." : "Admin access approved. Manage your campus from the dashboard.",
    link: user.role === "student" ? "/profile" : "/dashboard",
    icon: "sparkles",
    priority: "medium"
  });
}
router.post(
  "/register",
  [
    (0, import_express_validator2.body)("name").trim().isLength({ min: 2 }).withMessage("Full name is required"),
    (0, import_express_validator2.body)("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    (0, import_express_validator2.body)("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    (0, import_express_validator2.body)("role").isIn(["student", "faculty", "admin"]).withMessage("Role must be student, faculty, or admin")
  ],
  validate,
  asyncHandler(async (req, res) => {
    const {
      name,
      email,
      password,
      college: collegeName,
      role = "student",
      // Student fields
      degree,
      course,
      semester,
      year,
      section,
      // Faculty fields
      employeeId,
      department,
      designation,
      subjects,
      classes,
      // Admin fields
      inviteCode
    } = req.body;
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) throw ApiError.conflict("An account with this email already exists. Please log in.");
    if (role === "admin") {
      const validCode = process.env.ADMIN_INVITE_CODE || "CAMPUS-ADMIN-2026";
      if (inviteCode !== validCode) {
        throw ApiError.forbidden("Invalid admin invite code. Admin registration requires authorization.");
      }
    }
    const college = await ensureCollege(collegeName);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: await hashPassword(password),
        role,
        college: college?.id,
        approved: role === "student" ? true : false
        // students auto-approved, faculty/admin need approval
      }
    });
    await setupNewUser(user, { degree, course, semester, year, section, employeeId, department, designation, subjects, classes });
    const token = signToken(user);
    res.status(201).json({ token, user: toSafeUser(user), onboarded: false });
  })
);
router.post(
  "/login",
  [(0, import_express_validator2.body)("email").isEmail().withMessage("Valid email is required"), (0, import_express_validator2.body)("password").notEmpty().withMessage("Password is required")],
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !await comparePassword(password, user.password)) {
      throw ApiError.unauthorized("Invalid email or password.");
    }
    if (!user.active) throw ApiError.forbidden("This account has been deactivated.");
    if ((user.role === "faculty" || user.role === "admin") && !user.approved) {
      throw ApiError.forbidden("Your account is pending admin approval. Please contact your college administrator.");
    }
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: /* @__PURE__ */ new Date() } });
    const token = signToken(user);
    res.json({ token, user: toSafeUser(user), onboarded: user.onboarded });
  })
);
router.post(
  "/google",
  [(0, import_express_validator2.body)("email").isEmail().withMessage("Valid email is required"), (0, import_express_validator2.body)("name").optional().trim()],
  validate,
  asyncHandler(async (req, res) => {
    const { email, name, college: collegeName, course, semester, section } = req.body;
    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      const college = await ensureCollege(collegeName);
      user = await prisma.user.create({
        data: {
          name: name || email.split("@")[0],
          email: email.toLowerCase(),
          password: await hashPassword(import_crypto.default.randomBytes(24).toString("hex")),
          role: "student",
          college: college?.id,
          emailVerified: true
        }
      });
      await setupNewUser(user, { course, semester, section });
    }
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: /* @__PURE__ */ new Date() } });
    const token = signToken(user);
    res.json({ token, user: toSafeUser(user), onboarded: user.onboarded });
  })
);
router.post(
  "/forgot-password",
  [(0, import_express_validator2.body)("email").isEmail().withMessage("Valid email is required")],
  validate,
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.json({ message: "If that email is registered, a reset link has been sent." });
    }
    const resetToken = import_crypto.default.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1e3) }
    });
    console.log(`[auth] Password reset for ${email}: ${env.PUBLIC_URL}/reset-password?token=${resetToken}`);
    res.json({ message: "If that email is registered, a reset link has been sent." });
  })
);
router.post(
  "/reset-password",
  [(0, import_express_validator2.body)("token").notEmpty().withMessage("Token is required"), (0, import_express_validator2.body)("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")],
  validate,
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const user = await prisma.user.findFirst({ where: { resetToken: token, resetTokenExpiry: { gt: /* @__PURE__ */ new Date() } } });
    if (!user) throw ApiError.badRequest("This reset link is invalid or has expired.");
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(password), resetToken: null, resetTokenExpiry: null }
    });
    res.json({ message: "Password updated. You can now log in." });
  })
);
router.get(
  "/verify-email/:token",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findFirst({ where: { verificationToken: req.params.token } });
    if (!user) throw ApiError.badRequest("Invalid verification link.");
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, verificationToken: null } });
    res.json({ message: "Email verified successfully." });
  })
);
router.get("/me", auth, asyncHandler(async (req, res) => {
  let profile = null;
  if (req.user.role === "student") {
    profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
    if (profile?.resume) {
      const resume = await prisma.resume.findUnique({ where: { id: profile.resume } });
      if (resume) profile.resume = resume;
    }
  } else if (req.user.role === "faculty") {
    profile = await prisma.facultyProfile.findFirst({ where: { user: req.user.id } });
  }
  res.json({ user: toSafeUser(req.user), studentProfile: profile });
}));
router.post("/logout", (req, res) => res.json({ message: "Logged out" }));
var auth_default = router;

// server/src/routes/users.js
var import_express2 = require("express");
var import_express_validator3 = require("express-validator");
init_prisma();
init_userUtils();

// server/src/services/profileService.js
function profileStrength(profile) {
  const checks = [
    { label: "Academic details (course, semester)", done: Boolean(profile.course && profile.semester), weight: 15 },
    { label: "Skills", done: (profile.skills || []).length >= 3, weight: 20 },
    { label: "Interests", done: (profile.interests || []).length >= 2, weight: 10 },
    { label: "Career goal", done: Boolean(profile.careerGoal), weight: 15 },
    { label: "Resume", done: Boolean(profile.resume), weight: 15 },
    { label: "GitHub / portfolio", done: Boolean(profile.github || profile.portfolio), weight: 10 },
    { label: "Preferred location & mode", done: Boolean(profile.preferredLocation || profile.remotePreference !== "any"), weight: 5 },
    { label: "LinkedIn", done: Boolean(profile.linkedin), weight: 5 },
    { label: "Learning hours", done: profile.weeklyLearningHours > 0, weight: 5 }
  ];
  const completed = checks.filter((c) => c.done).map((c) => c.label);
  const missing = checks.filter((c) => !c.done).map((c) => c.label);
  const score = Math.round(checks.reduce((acc, c) => acc + (c.done ? c.weight : 0), 0));
  return { score, completed, missing };
}

// server/src/utils/upload.js
var import_multer = __toESM(require("multer"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_meta3 = {};
var uploadsDir;
try {
  const { fileURLToPath: fileURLToPath3 } = require("url");
  const __filename = fileURLToPath3(import_meta3.url);
  uploadsDir = import_path2.default.resolve(import_path2.default.dirname(__filename), "../../uploads");
} catch {
  uploadsDir = "/tmp/cc-uploads";
}
import_fs.default.mkdirSync(uploadsDir, { recursive: true });
var storage = import_multer.default.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safe}`);
  }
});
var upload = (0, import_multer.default)({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/") || file.mimetype.includes("text") || file.mimetype.includes("document")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, image and document uploads are allowed"));
    }
  }
});
var uploadsDirPath = uploadsDir;
function fileUrl(req, filename) {
  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
}

// server/src/routes/users.js
var import_fs2 = __toESM(require("fs"), 1);
var import_path3 = __toESM(require("path"), 1);
var router2 = (0, import_express2.Router)();
router2.use(auth);
router2.get("/me", asyncHandler(async (req, res) => {
  res.json({ user: toSafeUser(req.user) });
}));
router2.patch(
  "/me",
  [(0, import_express_validator3.body)("name").optional().trim().isLength({ min: 2 }), (0, import_express_validator3.body)("phone").optional().trim(), (0, import_express_validator3.body)("avatar").optional().trim(), (0, import_express_validator3.body)("bio").optional().trim().isLength({ max: 500 })],
  validate,
  asyncHandler(async (req, res) => {
    const allowed = ["name", "phone", "avatar", "bio", "designation"];
    const data = {};
    allowed.forEach((k) => {
      if (req.body[k] !== void 0) data[k] = req.body[k];
    });
    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json({ user: toSafeUser(user) });
  })
);
router2.post("/avatar", upload.single("avatar"), asyncHandler(async (req, res) => {
  if (!req.file) throw new Error("No file uploaded");
  if (req.user.avatar) {
    const oldPath = import_path3.default.join(uploadsDirPath, req.user.avatar);
    try {
      import_fs2.default.unlinkSync(oldPath);
    } catch {
    }
  }
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { avatar: req.file.filename } });
  res.json({ user: toSafeUser(user), avatar: req.file.filename });
}));
router2.get("/profile-strength", asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  if (!profile) return res.json({ score: 0, completed: [], missing: [] });
  res.json(profileStrength(profile));
}));
router2.get("/preferences", asyncHandler(async (req, res) => {
  let pref = await prisma.userPreference.findUnique({ where: { user: req.user.id } });
  if (!pref) pref = await prisma.userPreference.create({ data: { user: req.user.id } });
  res.json(pref);
}));
router2.patch("/preferences", asyncHandler(async (req, res) => {
  const { notifications, defaultView, weeklyDigest } = req.body;
  const data = {};
  if (notifications !== void 0) data.notifications = notifications;
  if (defaultView !== void 0) data.defaultView = defaultView;
  if (weeklyDigest !== void 0) data.weeklyDigest = weeklyDigest;
  const pref = await prisma.userPreference.upsert({
    where: { user: req.user.id },
    update: data,
    create: { user: req.user.id, ...data }
  });
  res.json(pref);
}));
var users_default = router2;

// server/src/routes/students.js
var import_express3 = require("express");
var import_express_validator4 = require("express-validator");

// server/src/middleware/roles.js
var requireRole = (...roles) => (req, res, next) => {
  if (!req.user) throw ApiError.unauthorized();
  if (!roles.includes(req.user.role)) {
    throw ApiError.forbidden("You do not have permission to perform this action.");
  }
  next();
};
var requireStudent = requireRole("student");
var requireFaculty = requireRole("faculty", "admin");
var requireAdmin = requireRole("admin");

// server/src/routes/students.js
init_prisma();
init_attendanceService();
init_matchingEngine();

// server/src/services/deadlineEngine.js
init_helpers();
function groupDeadlines(items) {
  const groups = { today: [], tomorrow: [], week: [], later: [], overdue: [] };
  for (const item of items) {
    if (!item.date) continue;
    const diff = daysBetween(/* @__PURE__ */ new Date(), item.date);
    if (diff < 0) groups.overdue.push({ ...item, diff });
    else if (diff === 0) groups.today.push({ ...item, diff });
    else if (diff === 1) groups.tomorrow.push({ ...item, diff });
    else if (diff <= 7) groups.week.push({ ...item, diff });
    else groups.later.push({ ...item, diff });
  }
  const sortByDate = (a, b) => new Date(a.date) - new Date(b.date);
  Object.values(groups).forEach((g) => g.sort(sortByDate));
  return groups;
}

// server/src/services/ai/index.js
init_gemini();

// server/src/services/ai/groq.js
var import_groq_sdk = __toESM(require("groq-sdk"), 1);
init_env();
init_gemini();
var _client2 = null;
function client2() {
  if (!env.GROQ_API_KEY) return null;
  if (!_client2) _client2 = new import_groq_sdk.default({ apiKey: env.GROQ_API_KEY });
  return _client2;
}
var MODEL2 = "openai/gpt-oss-20b";
var _quotaLogged2 = false;
var _quotaUntil = 0;
async function askGroq(systemPrompt, userPrompt, { json = false, temperature = 0.7 } = {}) {
  const c = client2();
  if (!c) {
    return askGemini(systemPrompt, userPrompt, { temperature, json });
  }
  if (_quotaUntil && Date.now() < _quotaUntil) {
    return askGemini(systemPrompt, userPrompt, { temperature, json });
  }
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ];
      const params = {
        model: MODEL2,
        messages,
        temperature,
        max_tokens: json ? 2048 : 1024
      };
      if (json) {
        params.response_format = { type: "json_object" };
      }
      const completion = await c.chat.completions.create(params);
      const text = completion.choices?.[0]?.message?.content || "";
      _quotaLogged2 = false;
      _quotaUntil = 0;
      return text.trim();
    } catch (err) {
      const message = err?.message || "";
      if (/rate_limit|429|quota|RESOURCE_EXHAUSTED/i.test(message)) {
        if (!_quotaLogged2) {
          console.warn("[groq] rate limited / quota hit \u2014 cooldown 60s, then retry. Falling back to Gemini for now.");
          _quotaLogged2 = true;
        }
        _quotaUntil = Date.now() + 6e4;
        return askGemini(systemPrompt, userPrompt, { temperature, json });
      }
      const retriable = /503|500|UNAVAILABLE|ECONNREFUSED/i.test(message);
      if (!retriable || attempt === maxAttempts) {
        if (attempt === maxAttempts) console.warn("[groq] all", maxAttempts, "attempts failed \u2014 falling back to Gemini");
        return askGemini(systemPrompt, userPrompt, { temperature, json });
      }
      await new Promise((resolve) => setTimeout(resolve, 1e3 * attempt));
    }
  }
  return askGemini(systemPrompt, userPrompt, { temperature, json });
}

// server/src/services/ai/nvidia.js
init_env();
var NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
var MODEL3 = "meta/llama-3.1-8b-instruct";
var _quotaUntil2 = 0;
var _quotaLogged3 = false;
var NVIDIA_TIMEOUT_MS = 3e4;
async function askNvidia(systemPrompt, userPrompt, { json = false, temperature = 0.7 } = {}) {
  const { askGemini: askGemini2 } = await Promise.resolve().then(() => (init_gemini(), gemini_exports));
  if (!env.NVIDIA_API_KEY) {
    return askGemini2(systemPrompt, userPrompt, { temperature, json });
  }
  if (_quotaUntil2 && Date.now() < _quotaUntil2) {
    return askGemini2(systemPrompt, userPrompt, { temperature, json });
  }
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const body20 = {
        model: MODEL3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature,
        max_tokens: json ? 2048 : 1024
      };
      if (json) {
        body20.response_format = { type: "json_object" };
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), NVIDIA_TIMEOUT_MS);
      let res;
      try {
        res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.NVIDIA_API_KEY}`
          },
          body: JSON.stringify(body20),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        if (res.status === 429 || /rate.?limit|quota|RESOURCE_EXHAUSTED/i.test(errText)) {
          if (!_quotaLogged3) {
            console.warn("[nvidia] rate limited / quota hit \u2014 cooldown 60s, falling back to Gemini");
            _quotaLogged3 = true;
          }
          _quotaUntil2 = Date.now() + 6e4;
          return askGemini2(systemPrompt, userPrompt, { temperature, json });
        }
        if (res.status >= 500 && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1e3 * attempt));
          continue;
        }
        console.warn(`[nvidia] HTTP ${res.status}: ${errText.slice(0, 200)}`);
        if (attempt === maxAttempts) {
          return askGemini2(systemPrompt, userPrompt, { temperature, json });
        }
      }
      const data = await res.json();
      const text = (data.choices?.[0]?.message?.content || "").trim();
      if (text) {
        _quotaLogged3 = false;
        _quotaUntil2 = 0;
        console.log(`[nvidia] responded via ${MODEL3} (${text.length} chars)`);
        return text;
      }
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1e3 * attempt));
        continue;
      }
      return askGemini2(systemPrompt, userPrompt, { temperature, json });
    } catch (err) {
      const msg = err?.message || "";
      const isAbort = err?.name === "AbortError";
      const retriable = /503|500|ECONNREFUSED|ETIMEDOUT|fetch failed/i.test(msg) || isAbort;
      if (isAbort) {
        if (attempt === maxAttempts) {
          console.warn(`[nvidia] ${MODEL3} timed out after ${maxAttempts} attempts \u2014 falling back to Gemini`);
          return askGemini2(systemPrompt, userPrompt, { temperature, json });
        }
        await new Promise((r) => setTimeout(r, 1e3 * attempt));
        continue;
      }
      if (retriable && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1e3 * attempt));
        continue;
      }
      if (attempt === maxAttempts) {
        console.warn(`[nvidia] all ${maxAttempts} attempts failed (${msg}) \u2014 falling back to Gemini`);
        return askGemini2(systemPrompt, userPrompt, { temperature, json });
      }
    }
  }
  return askGemini2(systemPrompt, userPrompt, { temperature, json });
}

// server/src/services/ai/index.js
init_fallbacks();
init_env();
var provider = aiProvider();
var aiMode = () => provider;
async function askAI(systemPrompt, userPrompt, opts = {}) {
  const nvidiaResult = await askNvidia(systemPrompt, userPrompt, opts);
  if (nvidiaResult) return nvidiaResult;
  const geminiResult = await askGemini(systemPrompt, userPrompt, opts);
  if (geminiResult) return geminiResult;
  return askGroq(systemPrompt, userPrompt, opts);
}
var aiService = {
  mode: aiMode(),
  async matchExplanation(profile, opp, match) {
    const { score, breakdown, reasons } = match;
    const userPrompt = `Student: course=${profile.course}, semester=${profile.semester}, skills=${(profile.skills || []).map((s) => s.name + ":" + s.level).join(", ")}, interests=${(profile.interests || []).join(", ")}, careerGoal=${profile.careerGoal}, remotePreference=${profile.remotePreference}
Opportunity: title=${opp.title}, organization=${opp.organization}, category=${opp.category}, skillsRequired=${(opp.skillsRequired || []).join(", ")}, eligibility=${opp.eligibility}, mode=${opp.mode}, location=${opp.location}, deadline=${opp.deadline?.toISOString?.() || opp.deadline}
Match score: ${score}/100. Dimension breakdown: ${JSON.stringify(breakdown)}. Reasons: ${(reasons || []).join("; ")}`;
    const result = await askAI(
      'You are the AI match explainer for CAMPUSCONNECT. Explain in 3-5 short bullet lines why this opportunity matches the student, why the weak dimensions are weak, and whether the deadline is urgent. Use plain text with bullet lines starting with "-". Do not invent facts.',
      userPrompt
    );
    if (result) return result;
    return fallbackMatchExplanation(profile, opp, match);
  },
  async dailyPlan(ctx) {
    const result = await askAI(
      'You are the AI daily planner for CAMPUSCONNECT. Build a realistic time-blocked daily plan (array of {time:"HH:MM", title, type} where type is class|task|break|study|career|free) plus a one-sentence summary. Include meals, breaks, and free time. Respond ONLY with JSON: {"items":[...],"summary":"..."}',
      `Date: ${ctx.date}
Today's timetable: ${JSON.stringify(ctx.timetable)}
Pending tasks: ${JSON.stringify(ctx.tasks)}
Deadlines: ${JSON.stringify(ctx.deadlines)}
Top opportunity: ${JSON.stringify(ctx.topOpportunity)}
Attendance warning: ${ctx.attendanceWarning}`,
      { json: true, temperature: 0.6 }
    );
    if (result) {
      const parsed = parseJsonLoose(result);
      if (parsed && Array.isArray(parsed.items)) {
        return { items: parsed.items, summary: parsed.summary || "Your AI daily plan.", fromAI: true };
      }
    }
    return { ...fallbackDailyPlan(ctx), fromAI: false };
  },
  async chat(message, ctx, history = []) {
    const contextParts = [];
    if (ctx.student) contextParts.push(`Student: ${ctx.student.name || "Unknown"}, Course: ${ctx.student.course || "N/A"}, Semester: ${ctx.student.semester || "N/A"}`);
    if (ctx.timetable?.length) {
      const todaySlots = ctx.timetable.filter((s) => {
        const today = (/* @__PURE__ */ new Date()).getDay();
        return s.day === today;
      });
      if (todaySlots.length) contextParts.push(`Today's classes: ${todaySlots.map((s) => `${s.startTime}-${s.endTime || ""} ${s.subjectName} in ${s.room || "TBA"}`).join("; ")}`);
    }
    if (ctx.attendance?.overall) {
      const o = ctx.attendance.overall;
      contextParts.push(`Attendance: ${o.percentage}% (${o.attended}/${o.total} classes attended). Status: ${o.health}. ${o.needed > 0 ? `Need ${o.needed} more consecutive classes to reach ${o.target}%.` : "Attendance is healthy."}`);
    }
    if (ctx.deadlines?.length) contextParts.push(`Upcoming deadlines: ${ctx.deadlines.map((d) => `${d.label} \u2014 ${d.diff === 0 ? "TODAY" : d.diff === 1 ? "tomorrow" : `in ${d.diff} days`}`).join("; ")}`);
    if (ctx.tasks?.length) contextParts.push(`Pending tasks: ${ctx.tasks.map((t) => t.title).join("; ")}`);
    if (ctx.opportunities?.length) contextParts.push(`Top matching opportunities: ${ctx.opportunities.slice(0, 3).map((o) => `${o.opportunity?.title || o.title} at ${o.opportunity?.organization || o.organization} (${o.score}% match)`).join("; ")}`);
    if (ctx.notices?.length) contextParts.push(`Recent notices: ${ctx.notices.map((n) => n.title).join("; ")}`);
    if (ctx.events?.length) contextParts.push(`Upcoming events: ${ctx.events.map((e) => e.title).join("; ")}`);
    const structuredContext = contextParts.join("\n");
    const historyStr = history.length ? "\n\nRecent conversation:\n" + history.slice(-6).map((h) => `${h.role === "user" ? "Student" : "Assistant"}: ${h.content}`).join("\n") : "";
    const systemPrompt = `You are CAMPUSCONNECT AI \u2014 a smart, friendly, context-aware assistant for college students in India.

REAL STUDENT DATA (use this to give SPECIFIC answers):
${structuredContext}
${historyStr}

RULES:
1. ALWAYS use the student's REAL data above to answer. Reference specific classes, subjects, numbers, deadlines by name.
2. Be conversational, warm, and motivating \u2014 like a helpful senior, not a robot.
3. Give ACTIONABLE advice: what to do, when to do it, how to do it.
4. For attendance questions: give specific numbers, calculations, and actionable steps.
5. For timetable questions: list actual classes with times and rooms.
6. For career/skills questions: reference their actual skills, course, semester, and goals.
7. For general questions: relate the answer back to their campus life when possible.
8. Use emojis sparingly but naturally.
9. Keep responses concise (3-6 sentences) unless the question needs more detail.
10. If you don't have enough info, say what specific info would help and where to find it in the app.`;
    const result = await askAI(systemPrompt, message, { temperature: 0.7 });
    if (result) return { reply: result, intent: "ai" };
    const intent = detectIntent(message);
    return { reply: fallbackChatReply(intent, ctx), intent };
  },
  async resumeAnalysis(text, profile) {
    const result = await askAI(
      'You are an expert resume analyst. Analyse this resume text for a student. Return ONLY JSON: {"score":0-100,"strengths":["..."],"weaknesses":["..."],"missingSkills":["..."],"improvements":["..."],"atsFriendly":true|false,"parsed":{"education":[],"skills":[],"projects":[],"experience":[],"certifications":[]}}',
      `Career goal: ${profile?.careerGoal || "unknown"}
Resume text:
${text.slice(0, 6e3)}`,
      { json: true, temperature: 0.4 }
    );
    if (result) {
      const parsed = parseJsonLoose(result);
      if (parsed && typeof parsed.score === "number") return { ...parsed, fromAI: true };
    }
    return { ...fallbackResumeAnalysis(text), fromAI: false };
  },
  async skillGap(profile, careerGoal) {
    const result = await askAI(
      `You are a career skill-gap analyst. Given the student's skills and chosen career goal, return ONLY JSON: {"gaps":["..."],"recommended":"...","resources":{"courses":[],"projects":[],"hackathons":[],"internships":[],"training":[]}}`,
      `Career goal: ${careerGoal}
Current skills: ${JSON.stringify(profile.skills || [])}
Course: ${profile.course}, semester: ${profile.semester}`,
      { json: true, temperature: 0.5 }
    );
    if (result) {
      const parsed = parseJsonLoose(result);
      if (parsed && Array.isArray(parsed.gaps)) {
        return { ...parsed, fromAI: true };
      }
    }
    const fbResult = skillGapFromProfile(profile, careerGoal);
    return { ...fbResult, resources: resourcesForSkill(fbResult.recommended), fromAI: false };
  },
  async roadmap(careerGoal, profileSkills) {
    const result = await askAI(
      'Generate a career roadmap (ordered list of skill milestones with status "Not Started"|"Learning"|"Completed") for the given career goal. Return ONLY JSON: {"steps":[{"skill":"...","status":"..."}]}',
      `Career goal: ${careerGoal}
Known skills: ${JSON.stringify(profileSkills)}`,
      { json: true, temperature: 0.4 }
    );
    if (result) {
      const parsed = parseJsonLoose(result);
      if (parsed && Array.isArray(parsed.steps)) {
        return parsed.steps.map((s, i) => ({ skill: s.skill, status: s.status || "Not Started", order: i }));
      }
    }
    return fallbackRoadmap(careerGoal, profileSkills);
  },
  async projects(profile) {
    const result = await askAI(
      'Recommend 3-4 portfolio projects for this student. Return ONLY JSON: [{"title":"...","difficulty":"Easy|Medium|Hard","time":"...","skillsGained":[],"techStack":[],"features":[],"portfolioValue":"..."}]',
      `Skills: ${JSON.stringify((profile.skills || []).map((s) => s.name))}
Career goal: ${profile.careerGoal}
Interests: ${JSON.stringify(profile.interests || [])}`,
      { json: true, temperature: 0.6 }
    );
    if (result) {
      const parsed = parseJsonLoose(result);
      if (Array.isArray(parsed)) return parsed;
    }
    return fallbackProjects(profile);
  },
  async noticeSummary(title, content) {
    const result = await askAI(
      'You summarise college notices for students. Return ONLY JSON: {"summary":"2-3 sentence plain summary","importantDates":["..."],"deadline":"...","actionRequired":"...","examDetails":"..."}',
      `Notice title: ${title}
Notice content:
${content.slice(0, 4e3)}`,
      { json: true, temperature: 0.3 }
    );
    if (result) {
      const parsed = parseJsonLoose(result);
      if (parsed && parsed.summary) return { ...parsed, fromAI: true };
    }
    return { ...fallbackNoticeSummary(title, content), fromAI: false };
  },
  async applicationAssist(profile, opp, resumeText) {
    const result = await askAI(
      'You are an application assistant. Generate a cover letter, a short personal introduction, and an answer to "Why should we select you?" for this student applying to this opportunity. Return ONLY JSON: {"coverLetter":"...","introduction":"...","whyYou":"..."}',
      `Student profile: ${JSON.stringify(profile)}
Opportunity: title=${opp.title}, org=${opp.organization}, category=${opp.category}, description=${(opp.description || "").slice(0, 800)}
Resume text:
${(resumeText || "").slice(0, 2500)}`,
      { json: true, temperature: 0.7 }
    );
    if (result) {
      const parsed = parseJsonLoose(result);
      if (parsed && parsed.coverLetter) return { ...parsed, fromAI: true };
    }
    return { ...fallbackApplicationAssist(profile, opp, resumeText), fromAI: false };
  },
  async weeklyReview(data) {
    const result = await askAI(
      "Write a 3-5 sentence weekly review for a student based on these stats. Be encouraging and specific. Plain text only.",
      JSON.stringify(data),
      { temperature: 0.6 }
    );
    if (result) return { insight: result, fromAI: true };
    return { insight: fallbackWeeklyReview(data), fromAI: false };
  },
  async profileInsights(profile) {
    const result = await askAI(
      `Give 2-3 short, specific insights about this student's profile: where they are strong, what to improve, and how it relates to their career goal. Plain text, bullet lines starting with "-".`,
      JSON.stringify(profile),
      { temperature: 0.6 }
    );
    if (result) return { insights: result, fromAI: true };
    return { insights: fallbackProfileInsights(profile), fromAI: false };
  },
  async searchParse(query2) {
    const result = await askAI(
      'Convert this natural language query into structured opportunity filters. Return ONLY JSON: {"text":"...","category":null|"internship"|"hackathon"|"job"|"scholarship"|"training"|"workshop"|"competition"|"fellowship"|"research"|"conference","mode":null|"remote"|"onsite"|"hybrid","location":null|"...","skills":[],"urgent":boolean}',
      query2,
      { json: true, temperature: 0.2 }
    );
    if (result) {
      const parsed = parseJsonLoose(result);
      if (parsed && (parsed.text || parsed.category || parsed.skills)) return { ...parsed, fromAI: true };
    }
    return { ...fallbackSearchParse(query2), fromAI: false };
  },
  async prioritize(tasks) {
    return fallbackPrioritize(tasks);
  },
  proactiveActions(ctx) {
    return fallbackProactiveActions(ctx);
  }
};

// server/src/routes/students.js
init_helpers();
var router3 = (0, import_express3.Router)();
router3.use(auth, requireStudent);
var cache = /* @__PURE__ */ new Map();
function cached(key, ttlMs = 3e4) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) return hit.data;
  return null;
}
function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}
function getProfile(userId) {
  return prisma.studentProfile.findFirst({ where: { user: userId } });
}
router3.get("/me/enrollment", asyncHandler(async (req, res) => {
  const enrollment = await prisma.enrollment.findFirst({
    where: { student: req.user.id, status: "active" },
    orderBy: { semester: "desc" }
  });
  if (!enrollment) return res.json({ enrollment: null });
  const [course, section] = await Promise.all([
    prisma.course.findUnique({ where: { id: enrollment.course } }),
    prisma.section.findUnique({ where: { id: enrollment.section } })
  ]);
  res.json({ enrollment: { ...enrollment, courseDetails: course, sectionDetails: section } });
}));
router3.get("/courses", asyncHandler(async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { college: req.user.college, active: true },
    orderBy: { name: "asc" }
  });
  const coursesWithSections = await Promise.all(
    courses.map(async (course) => {
      const sections = await prisma.section.findMany({
        where: { course: course.id },
        orderBy: [{ semester: "asc" }, { name: "asc" }]
      });
      return { ...course, sections };
    })
  );
  res.json({ courses: coursesWithSections });
}));
router3.post("/enroll", asyncHandler(async (req, res) => {
  const { courseId, sectionId, semester } = req.body;
  if (!courseId || !sectionId || !semester) {
    throw ApiError.badRequest("courseId, sectionId, and semester are required");
  }
  const existing = await prisma.enrollment.findFirst({
    where: { student: req.user.id, course: courseId, semester: Number(semester) }
  });
  if (existing) throw ApiError.conflict("Already enrolled in this course for this semester");
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw ApiError.notFound("Course not found");
  const section = await prisma.section.findFirst({ where: { id: sectionId, course: courseId } });
  if (!section) throw ApiError.notFound("Section not found for this course");
  const currentCount = await prisma.enrollment.count({ where: { section: sectionId, status: "active" } });
  if (currentCount >= section.maxStudents) throw ApiError.badRequest("Section is full");
  const enrollment = await prisma.enrollment.create({
    data: {
      student: req.user.id,
      course: courseId,
      section: sectionId,
      semester: Number(semester),
      year: Number(semester) <= 2 ? 1 : Number(semester) <= 4 ? 2 : Number(semester) <= 6 ? 3 : 4,
      status: "active",
      enrollmentNumber: req.body.enrollmentNumber || ""
    }
  });
  await prisma.studentProfile.updateMany({
    where: { user: req.user.id },
    data: {
      course: course.name,
      degree: course.name.split(" ")[0],
      semester: Number(semester),
      section: section.name,
      enrollment: enrollment.id
    }
  });
  res.status(201).json({ enrollment });
}));
router3.get("/me/profile", asyncHandler(async (req, res) => {
  let profile = await getProfile(req.user.id);
  if (!profile) {
    profile = await prisma.studentProfile.create({ data: { user: req.user.id, college: req.user.college } });
  }
  if (profile.resume) {
    const resume = await prisma.resume.findUnique({ where: { id: profile.resume } });
    if (resume) profile.resume = resume;
  }
  res.json(profile);
}));
router3.patch("/me/profile", asyncHandler(async (req, res) => {
  const existing = await getProfile(req.user.id);
  let profile = existing;
  const allowed = [
    "college",
    "degree",
    "course",
    "semester",
    "year",
    "section",
    "enrollmentNumber",
    "bio",
    "linkedin",
    "github",
    "portfolio",
    "skills",
    "interests",
    "careerGoal",
    "preferredLocation",
    "remotePreference",
    "weeklyLearningHours",
    "preferredOpportunityTypes",
    "experienceYears",
    "roadmap"
  ];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== void 0) data[k] = req.body[k];
  });
  if (existing) {
    profile = await prisma.studentProfile.update({ where: { id: existing.id }, data });
  } else {
    profile = await prisma.studentProfile.create({
      data: { user: req.user.id, college: req.user.college, ...data }
    });
  }
  if (req.body.completeOnboarding) {
    await prisma.user.update({ where: { id: req.user.id }, data: { onboarded: true } });
  }
  cache.delete(`dashboard:${req.user.id}`);
  res.json(profile);
}));
router3.get("/dashboard", asyncHandler(async (req, res) => {
  const cacheKey = `dashboard:${req.user.id}`;
  const cachedData = cached(cacheKey, 2e4);
  if (cachedData) return res.json(cachedData);
  const profile = await getProfile(req.user.id);
  if (!profile) throw ApiError.notFound("Student profile not found. Complete onboarding first.");
  const userId = req.user.id;
  const collegeId = req.user.college;
  const today = /* @__PURE__ */ new Date();
  const dayIndex = today.getDay();
  const [slots, attendanceRecords, tasks, assignments, exams, notices, events, applications] = await Promise.all([
    prisma.timetableSlot.findMany({ where: { student: userId }, orderBy: { startTime: "asc" } }),
    prisma.attendance.findMany({ where: { student: userId }, orderBy: { date: "asc" } }),
    prisma.task.findMany({ where: { user: userId } }),
    prisma.assignment.findMany({ where: { college: collegeId, semester: profile.semester }, orderBy: { dueDate: "asc" } }),
    prisma.exam.findMany({ where: { college: collegeId, semester: profile.semester, date: { gte: new Date(Date.now() - 864e5) } }, orderBy: { date: "asc" } }),
    prisma.notice.findMany({ where: { college: collegeId }, orderBy: { date: "desc" }, take: 5 }),
    prisma.event.findMany({ where: { college: collegeId, date: { gte: /* @__PURE__ */ new Date() } }, orderBy: { date: "asc" }, take: 5 }),
    prisma.application.findMany({ where: { student: userId } })
  ]);
  const oppIds = [...new Set(applications.map((a) => a.opportunity).filter(Boolean))];
  if (oppIds.length) {
    const opps = await prisma.opportunity.findMany({ where: { id: { in: oppIds } } });
    const oppMap = new Map(opps.map((o) => [o.id, o]));
    for (const app2 of applications) {
      if (oppMap.has(app2.opportunity)) app2.opportunity = oppMap.get(app2.opportunity);
    }
  }
  const groups = {};
  for (const r of attendanceRecords) {
    (groups[r.subjectName] = groups[r.subjectName] || []).push(r);
  }
  const attendance = buildAttendanceReport(groups);
  const deadlineItems = [];
  for (const a of assignments) {
    if (a.dueDate >= new Date(Date.now() - 864e5)) {
      const sub = a.submissions?.find((s) => String(s.student) === String(userId));
      if (!sub || sub.status === "pending") deadlineItems.push({ label: `Assignment: ${a.title}`, date: a.dueDate, ref: `assignment:${a.id}`, link: "/assignments", type: "assignment" });
    }
  }
  for (const e of exams) deadlineItems.push({ label: `Exam: ${e.title}`, date: e.date, ref: `exam:${e.id}`, link: "/college", type: "exam" });
  for (const t of tasks) {
    if (t.status !== "done" && t.dueDate) deadlineItems.push({ label: `Task: ${t.title}`, date: t.dueDate, ref: `task:${t.id}`, link: "/tasks", type: "task" });
  }
  for (const app2 of applications) {
    if (app2.opportunity?.deadline && app2.status !== "rejected" && app2.status !== "selected") {
      deadlineItems.push({ label: `Application: ${app2.opportunity.title}`, date: app2.opportunity.deadline, ref: `opportunity:${app2.opportunity.id}`, link: `/opportunities/${app2.opportunity.id}`, type: "opportunity" });
    }
  }
  const deadlines = groupDeadlines(deadlineItems);
  const verifiedOpps = await prisma.opportunity.findMany({ where: { status: "verified", deadline: { gte: /* @__PURE__ */ new Date() } }, take: 80 });
  const ranked = rankOpportunities(profile, verifiedOpps, 8);
  const topOpportunity = ranked[0];
  const needsAttention = [];
  if (attendance.overall.total && attendance.overall.health !== "safe") {
    needsAttention.push({ severity: attendance.overall.health === "critical" ? "critical" : "warning", title: `Attendance is ${attendance.overall.percentage}%`, message: `Attend the next ${attendance.overall.needed || 1} classes to reach the ${attendance.overall.target}% target.`, link: "/attendance" });
  }
  if (deadlines.tomorrow.length) needsAttention.push({ severity: "warning", title: `${deadlines.tomorrow.length} deadline${deadlines.tomorrow.length > 1 ? "s" : ""} tomorrow`, message: deadlines.tomorrow.map((d) => d.label).join(", "), link: "/tasks" });
  if (deadlines.today.length) needsAttention.push({ severity: "critical", title: `${deadlines.today.length} deadline${deadlines.today.length > 1 ? "s" : ""} today`, message: deadlines.today.map((d) => d.label).join(", "), link: "/tasks" });
  if (topOpportunity && topOpportunity.score >= 80 && daysBetween(/* @__PURE__ */ new Date(), topOpportunity.opportunity.deadline) <= 3) {
    needsAttention.push({ severity: "critical", title: `${topOpportunity.opportunity.title} closes in ${daysBetween(/* @__PURE__ */ new Date(), topOpportunity.opportunity.deadline)} day(s)`, message: `You have a ${topOpportunity.score}% match \u2014 complete the application today.`, link: `/opportunities/${topOpportunity.opportunity.id}` });
  }
  const importantNotice = notices.find((n) => n.important);
  if (importantNotice) needsAttention.push({ severity: "info", title: importantNotice.title, message: "New important college notice", link: "/college" });
  if (attendance.overall.total && attendance.overall.health === "safe" && needsAttention.length === 0) {
    needsAttention.push({ severity: "info", title: "All caught up! \u{1F389}", message: "No urgent issues. A good day to learn a new skill or apply to an opportunity.", link: "/opportunities" });
  }
  let aiRecommendation = { text: "", opportunity: null };
  if (topOpportunity && topOpportunity.score >= 70) {
    const reasons = topOpportunity.reasons || [];
    const explanation = reasons.length ? reasons.map((r) => `- ${r}`).join("\n") + `

Match score: ${topOpportunity.score}% \u2014 a strong fit for your profile!` : `This ${topOpportunity.opportunity.category} matches your profile with a ${topOpportunity.score}% score. Check it out before the deadline!`;
    aiRecommendation = { text: explanation, opportunity: topOpportunity.opportunity, score: topOpportunity.score };
  } else {
    aiRecommendation.text = `No high-match opportunities right now. ${attendance.overall.total ? `Keep attendance above ${attendance.overall.target}% ` : ""}and complete pending tasks \u2014 I'll alert you when something relevant opens up.`;
  }
  const todaySlots = slots.filter((s) => s.day === dayIndex && s.type !== "free");
  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const activeApplications = applications.filter((a) => ["applied", "shortlisted", "interview"].includes(a.status));
  const result = {
    profile,
    todaySchedule: slots.filter((s) => s.day === dayIndex).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    stats: {
      todayClasses: todaySlots.length,
      attendancePercentage: attendance.overall.percentage,
      attendanceHealth: attendance.overall.health,
      pendingTasks: pendingTasks.length,
      upcomingDeadlines: deadlines.today.length + deadlines.tomorrow.length + deadlines.week.length,
      opportunityMatches: ranked.filter((r) => r.score >= 70).length,
      activeApplications: activeApplications.length
    },
    attendance: { overall: attendance.overall, trend: attendance.trend, forecast: forecastMessage(attendance.overall) },
    deadlines: { today: deadlines.today, tomorrow: deadlines.tomorrow, week: deadlines.week },
    needsAttention,
    aiRecommendation,
    topOpportunities: ranked.slice(0, 3),
    recentNotices: notices,
    upcomingEvents: events
  };
  setCache(cacheKey, result);
  res.json(result);
}));
router3.get("/ai-explanation", asyncHandler(async (req, res) => {
  const profile = await getProfile(req.user.id);
  if (!profile) throw ApiError.notFound("Student profile not found.");
  const verifiedOpps = await prisma.opportunity.findMany({ where: { status: "verified", deadline: { gte: /* @__PURE__ */ new Date() } }, take: 80 });
  const ranked = rankOpportunities(profile, verifiedOpps, 8);
  const top = ranked[0];
  if (!top || top.score < 70) {
    return res.json({ text: "No high-match opportunities right now.", opportunity: null, score: 0 });
  }
  const explanation = await aiService.matchExplanation(profile, top.opportunity, top);
  res.json({ text: explanation, opportunity: top.opportunity, score: top.score });
}));
router3.get("/weekly-review", asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const [records, tasks, applications, events] = await Promise.all([
    prisma.attendance.findMany({ where: { student: userId, date: { gte: weekAgo } } }),
    prisma.task.findMany({ where: { user: userId, updatedAt: { gte: weekAgo } } }),
    prisma.application.findMany({ where: { student: userId, updatedAt: { gte: weekAgo } } }),
    prisma.recommendationEvent.findMany({ where: { user: userId, createdAt: { gte: weekAgo } } })
  ]);
  const classesTotal = records.length;
  const classesAttended = records.filter((r) => r.status === "present").length;
  const tasksCompleted = tasks.filter((t) => t.status === "done").length;
  const skillsPracticed = [...new Set(tasks.filter((t) => t.status === "done" && t.subject).map((t) => t.subject))];
  const data = {
    classesAttended,
    classesTotal,
    tasksCompleted,
    tasksTotal: tasksCompleted + tasks.filter((t) => t.status !== "done").length,
    opportunitiesViewed: events.filter((e) => e.type === "viewed").length,
    applications: applications.length,
    skillsPracticed
  };
  const review = await aiService.weeklyReview(data);
  res.json({ ...data, insight: review.insight, fromAI: review.fromAI });
}));
router3.post("/recommendation-event", asyncHandler(async (req, res) => {
  const { type, opportunity, category, metadata } = req.body;
  if (!["viewed", "saved", "applied", "dismissed", "not-interested", "searched", "clicked"].includes(type)) {
    throw ApiError.badRequest("Invalid event type");
  }
  await prisma.recommendationEvent.create({ data: { user: req.user.id, type, opportunity, category, metadata: metadata || {} } });
  res.status(201).json({ ok: true });
}));
router3.get("/today-plan", asyncHandler(async (req, res) => {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const plan = await prisma.aIPlan.findFirst({ where: { student: req.user.id, date: today } });
  res.json({ plan });
}));
var students_default = router3;

// server/src/routes/colleges.js
var import_express4 = require("express");
init_prisma();
var router4 = (0, import_express4.Router)();
router4.get("/", optionalAuth, asyncHandler(async (req, res) => {
  const { search } = req.query;
  const where = search ? { name: { contains: search, mode: "insensitive" } } : {};
  const colleges = await prisma.college.findMany({ where, orderBy: { name: "asc" } });
  res.json({ colleges });
}));
router4.get("/my", auth, asyncHandler(async (req, res) => {
  if (!req.user.college) return res.json({ college: null, counts: {} });
  const college = await prisma.college.findUnique({ where: { id: req.user.college } });
  if (!college) return res.json({ college: null, counts: {} });
  const [notices, events, clubs, faculty, subjects] = await Promise.all([
    prisma.notice.findMany({ where: { college: college.id }, orderBy: { date: "desc" }, take: 20 }),
    prisma.event.findMany({ where: { college: college.id, date: { gte: /* @__PURE__ */ new Date() } }, orderBy: { date: "asc" }, take: 20 }),
    prisma.club.findMany({ where: { college: college.id }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { college: college.id, role: "faculty" }, select: { id: true, name: true, email: true, designation: true }, take: 50 }),
    prisma.subject.findMany({ where: { college: college.id }, select: { id: true, name: true, code: true, semester: true, faculty: true }, take: 100 })
  ]);
  res.json({
    college,
    counts: { notices: notices.length, events: events.length, clubs: clubs.length, faculty: faculty.length, subjects: subjects.length },
    notices,
    events,
    clubs,
    faculty,
    subjects
  });
}));
var colleges_default = router4;

// server/src/routes/timetable.js
var import_express5 = require("express");
var import_express_validator5 = require("express-validator");
init_prisma();
init_helpers();
var router5 = (0, import_express5.Router)();
router5.use(auth, requireStudent);
function detectConflicts(slots) {
  const conflicts = [];
  const byDay = {};
  for (const s of slots) (byDay[s.day] = byDay[s.day] || []).push(s);
  for (const [day, list] of Object.entries(byDay)) {
    const sorted = [...list].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        if (timeToMinutes(b.startTime) < timeToMinutes(a.endTime)) {
          conflicts.push({
            day: Number(day),
            a: { id: a.id, subjectName: a.subjectName, startTime: a.startTime, endTime: a.endTime },
            b: { id: b.id, subjectName: b.subjectName, startTime: b.startTime, endTime: b.endTime }
          });
        }
      }
    }
  }
  return conflicts;
}
router5.get("/", asyncHandler(async (req, res) => {
  const slots = await prisma.timetableSlot.findMany({ where: { student: req.user.id }, orderBy: [{ day: "asc" }, { startTime: "asc" }] });
  res.json({ slots, conflicts: detectConflicts(slots) });
}));
router5.get("/conflicts", asyncHandler(async (req, res) => {
  const slots = await prisma.timetableSlot.findMany({ where: { student: req.user.id } });
  res.json({ conflicts: detectConflicts(slots) });
}));
router5.post(
  "/",
  [
    (0, import_express_validator5.body)("subjectName").trim().notEmpty().withMessage("Subject is required"),
    (0, import_express_validator5.body)("day").isInt({ min: 0, max: 6 }).withMessage("Day must be 0-6"),
    (0, import_express_validator5.body)("startTime").matches(/^\d{2}:\d{2}$/).withMessage("Start time must be HH:MM"),
    (0, import_express_validator5.body)("endTime").matches(/^\d{2}:\d{2}$/).withMessage("End time must be HH:MM")
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { subjectName, subject, teacherName, room, day, startTime, endTime, color, type = "class" } = req.body;
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) throw ApiError.badRequest("End time must be after start time");
    const slot = await prisma.timetableSlot.create({
      data: {
        student: req.user.id,
        college: req.user.college,
        subject: subject || void 0,
        subjectName: subjectName.trim(),
        teacherName: teacherName || "",
        room: room || "",
        day: Number(day),
        startTime,
        endTime,
        color: color || "#6366f1",
        type
      }
    });
    res.status(201).json({ slot });
  })
);
router5.patch("/:id", asyncHandler(async (req, res) => {
  const slot = await prisma.timetableSlot.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!slot) throw ApiError.notFound("Timetable slot not found");
  const allowed = ["subjectName", "subject", "teacherName", "room", "day", "startTime", "endTime", "color", "type"];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== void 0) data[k] = req.body[k];
  });
  if (data.endTime && data.startTime && timeToMinutes(data.endTime) <= timeToMinutes(data.startTime)) {
    throw ApiError.badRequest("End time must be after start time");
  }
  const updated = await prisma.timetableSlot.update({ where: { id: slot.id }, data });
  res.json({ slot: updated });
}));
router5.post("/:id/duplicate", asyncHandler(async (req, res) => {
  const slot = await prisma.timetableSlot.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!slot) throw ApiError.notFound("Timetable slot not found");
  const copy = await prisma.timetableSlot.create({
    data: {
      student: slot.student,
      college: slot.college,
      subject: slot.subject,
      subjectName: slot.subjectName,
      teacherName: slot.teacherName,
      room: slot.room,
      day: Number(req.body.day ?? slot.day),
      startTime: slot.startTime,
      endTime: slot.endTime,
      color: slot.color,
      type: slot.type
    }
  });
  res.status(201).json({ slot: copy });
}));
router5.delete("/:id", asyncHandler(async (req, res) => {
  const res2 = await prisma.timetableSlot.deleteMany({ where: { id: req.params.id, student: req.user.id } });
  if (!res2.count) throw ApiError.notFound("Timetable slot not found");
  res.json({ message: "Slot deleted" });
}));
var timetable_default = router5;

// server/src/routes/attendance.js
var import_express6 = require("express");
var import_express_validator6 = require("express-validator");
init_prisma();
init_attendanceService();
var router6 = (0, import_express6.Router)();
router6.use(auth, requireStudent);
async function buildReport(userId) {
  const records = await prisma.attendance.findMany({ where: { student: userId }, orderBy: { date: "asc" } });
  const groups = {};
  for (const r of records) (groups[r.subjectName] = groups[r.subjectName] || []).push(r);
  const report = buildAttendanceReport(groups);
  return { records, report };
}
router6.get("/", asyncHandler(async (req, res) => {
  const { records, report } = await buildReport(req.user.id);
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  const subjects = await prisma.subject.findMany({ where: { college: req.user.college, semester: profile?.semester || 1 } });
  res.json({ ...report, records, subjects });
}));
router6.get("/forecast", asyncHandler(async (req, res) => {
  const { report } = await buildReport(req.user.id);
  res.json({
    overall: report.overall,
    forecast: report.overall.total ? report.overall.subjects || [] : [],
    message: forecastMessage(report.overall)
  });
}));
router6.post(
  "/",
  [
    (0, import_express_validator6.body)("subjectName").trim().notEmpty().withMessage("Subject is required"),
    (0, import_express_validator6.body)("date").isISO8601().withMessage("Valid date required"),
    (0, import_express_validator6.body)("status").isIn(["present", "absent", "holiday"]).withMessage("Invalid status")
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { subjectName, subject, date, status } = req.body;
    const dateObj = new Date(date);
    const existing = await prisma.attendance.findFirst({ where: { student: req.user.id, subjectName, date: dateObj } });
    if (existing) {
      const record2 = await prisma.attendance.update({ where: { id: existing.id }, data: { status } });
      return res.json({ record: record2 });
    }
    const record = await prisma.attendance.create({
      data: {
        student: req.user.id,
        subject: subject || void 0,
        subjectName: subjectName.trim(),
        date: dateObj,
        status,
        markedBy: req.user.id
      }
    });
    res.status(201).json({ record });
  })
);
router6.patch("/:id", asyncHandler(async (req, res) => {
  const record = await prisma.attendance.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!record) throw ApiError.notFound("Attendance record not found");
  let data = {};
  if (req.body.status) {
    if (!["present", "absent", "holiday"].includes(req.body.status)) throw ApiError.badRequest("Invalid status");
    data = { status: req.body.status };
  }
  const updated = await prisma.attendance.update({ where: { id: record.id }, data });
  res.json({ record: updated });
}));
router6.delete("/:id", asyncHandler(async (req, res) => {
  const res2 = await prisma.attendance.deleteMany({ where: { id: req.params.id, student: req.user.id } });
  if (!res2.count) throw ApiError.notFound("Attendance record not found");
  res.json({ message: "Record deleted" });
}));
router6.post("/advice", asyncHandler(async (req, res) => {
  const { report } = await buildReport(req.user.id);
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  const gemini = await aiService.chat(`My attendance is ${report.overall.percentage}%. What should I do?`, {
    attendance: { overall: report.overall },
    student: profile
  });
  res.json({ advice: gemini.reply, overall: report.overall, message: forecastMessage(report.overall) });
}));
var attendance_default = router6;

// server/src/routes/assignments.js
var import_express7 = require("express");
var import_express_validator7 = require("express-validator");
init_prisma();
var router7 = (0, import_express7.Router)();
router7.use(auth);
async function attachFaculty(assignments) {
  if (!assignments.length) return assignments;
  const ids = [...new Set(assignments.map((a) => a.faculty).filter(Boolean))];
  if (!ids.length) return assignments;
  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  const map = new Map(users.map((u) => [u.id, { _id: u.id, name: u.name }]));
  for (const a of assignments) {
    if (map.has(a.faculty)) a.faculty = map.get(a.faculty);
  }
  return assignments;
}
router7.get("/", asyncHandler(async (req, res) => {
  const { status } = req.query;
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  const where = { college: req.user.college };
  if (profile) where.semester = profile.semester;
  if (status === "done" || status === "pending") {
    const all = await prisma.assignment.findMany({ where, orderBy: { dueDate: "asc" } });
    const filtered = all.filter((a) => {
      const sub = a.submissions?.find((s) => String(s.student) === String(req.user.id));
      const done = sub && ["submitted", "graded"].includes(sub.status);
      return status === "done" ? done : !done;
    });
    return res.json({ assignments: filtered });
  }
  let assignments = await prisma.assignment.findMany({ where, orderBy: { dueDate: "asc" } });
  assignments = await attachFaculty(assignments);
  res.json({ assignments });
}));
router7.get("/:id", asyncHandler(async (req, res) => {
  let assignment = await prisma.assignment.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!assignment) throw ApiError.notFound("Assignment not found");
  [assignment] = await attachFaculty([assignment]);
  res.json({ assignment });
}));
router7.patch("/:id/submit", asyncHandler(async (req, res) => {
  const assignment = await prisma.assignment.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!assignment) throw ApiError.notFound("Assignment not found");
  const submissions = assignment.submissions || [];
  const idx = submissions.findIndex((s) => String(s.student) === String(req.user.id));
  if (idx === -1) {
    submissions.push({ student: req.user.id, status: "submitted", submittedAt: /* @__PURE__ */ new Date() });
  } else {
    submissions[idx] = { ...submissions[idx], status: "submitted", submittedAt: /* @__PURE__ */ new Date() };
  }
  const updated = await prisma.assignment.update({ where: { id: assignment.id }, data: { submissions } });
  res.json({ assignment: updated });
}));
router7.post(
  "/",
  requireFaculty,
  [
    (0, import_express_validator7.body)("title").trim().notEmpty().withMessage("Title is required"),
    (0, import_express_validator7.body)("dueDate").isISO8601().withMessage("Valid due date required"),
    (0, import_express_validator7.body)("semester").optional().isInt({ min: 1 })
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { title, description, subject, subjectName, type, dueDate, priority, semester, maxMarks } = req.body;
    const assignment = await prisma.assignment.create({
      data: {
        college: req.user.college,
        subject: subject || void 0,
        subjectName: subjectName || "",
        faculty: req.user.id,
        semester: Number(semester) || 1,
        title: title.trim(),
        description: description || "",
        type: type || "assignment",
        dueDate: new Date(dueDate),
        priority: priority || "medium",
        maxMarks: Number(maxMarks) || 100
      }
    });
    res.status(201).json({ assignment });
  })
);
router7.patch("/:id", requireFaculty, asyncHandler(async (req, res) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id } });
  if (!assignment) throw ApiError.notFound("Assignment not found");
  const allowed = ["title", "description", "subject", "subjectName", "type", "dueDate", "priority", "maxMarks"];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== void 0) data[k] = req.body[k];
  });
  const updated = await prisma.assignment.update({ where: { id: assignment.id }, data });
  res.json({ assignment: updated });
}));
router7.delete("/:id", requireFaculty, asyncHandler(async (req, res) => {
  await prisma.assignment.deleteMany({ where: { id: req.params.id } });
  res.json({ message: "Assignment deleted" });
}));
var assignments_default = router7;

// server/src/routes/tasks.js
var import_express8 = require("express");
var import_express_validator8 = require("express-validator");
init_prisma();
var router8 = (0, import_express8.Router)();
router8.use(auth);
router8.get("/", asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = { user: req.user.id };
  if (status) where.status = status;
  const tasks = await prisma.task.findMany({ where, orderBy: { createdAt: "desc" } });
  res.json({ tasks });
}));
router8.get("/prioritized", asyncHandler(async (req, res) => {
  const tasks = await prisma.task.findMany({ where: { user: req.user.id } });
  const prioritized = await aiService.prioritize(tasks);
  res.json({ tasks: prioritized });
}));
router8.post(
  "/",
  [(0, import_express_validator8.body)("title").trim().notEmpty().withMessage("Title is required")],
  validate,
  asyncHandler(async (req, res) => {
    const { title, description, subject, category, dueDate, priority } = req.body;
    const task = await prisma.task.create({
      data: {
        user: req.user.id,
        title: title.trim(),
        description: description || "",
        subject: subject || "",
        category: category || "study",
        dueDate: dueDate ? new Date(dueDate) : void 0,
        priority: priority || "medium"
      }
    });
    res.status(201).json({ task });
  })
);
router8.patch("/:id", asyncHandler(async (req, res) => {
  const task = await prisma.task.findFirst({ where: { id: req.params.id, user: req.user.id } });
  if (!task) throw ApiError.notFound("Task not found");
  const allowed = ["title", "description", "subject", "category", "dueDate", "priority", "status"];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== void 0) data[k] = req.body[k];
  });
  if (data.status === "done" && !task.completedAt) data.completedAt = /* @__PURE__ */ new Date();
  if (data.status && data.status !== "done") data.completedAt = null;
  const updated = await prisma.task.update({ where: { id: task.id }, data });
  res.json({ task: updated });
}));
router8.delete("/:id", asyncHandler(async (req, res) => {
  const res2 = await prisma.task.deleteMany({ where: { id: req.params.id, user: req.user.id } });
  if (!res2.count) throw ApiError.notFound("Task not found");
  res.json({ message: "Task deleted" });
}));
var tasks_default = router8;

// server/src/routes/exams.js
var import_express9 = require("express");
var import_express_validator9 = require("express-validator");
init_prisma();
var router9 = (0, import_express9.Router)();
router9.use(auth);
router9.get("/", asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  const where = { college: req.user.college };
  if (profile) where.semester = profile.semester;
  const exams = await prisma.exam.findMany({ where, orderBy: { date: "asc" } });
  res.json({ exams });
}));
router9.post(
  "/",
  requireFaculty,
  [(0, import_express_validator9.body)("title").trim().notEmpty().withMessage("Title is required"), (0, import_express_validator9.body)("date").isISO8601().withMessage("Valid date required")],
  validate,
  asyncHandler(async (req, res) => {
    const { title, subject, subjectName, semester, date, startTime, endTime, room, maxMarks, type } = req.body;
    const exam = await prisma.exam.create({
      data: {
        college: req.user.college,
        title: title.trim(),
        subject: subject || void 0,
        subjectName: subjectName || "",
        semester: Number(semester) || 1,
        date: new Date(date),
        startTime: startTime || "10:00",
        endTime: endTime || "13:00",
        room: room || "",
        maxMarks: Number(maxMarks) || 100,
        type: type || "midterm"
      }
    });
    const students = await prisma.user.findMany({ where: { college: req.user.college, role: "student" }, select: { id: true } });
    await Promise.all(
      students.map(
        (s) => createNotification(s.id, {
          category: "academic",
          title: `New exam: ${exam.title}`,
          message: `${exam.subjectName || exam.title} on ${new Date(exam.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at ${exam.startTime}`,
          link: "/college",
          icon: "graduation-cap",
          priority: "high"
        })
      )
    );
    res.status(201).json({ exam });
  })
);
router9.delete("/:id", requireFaculty, asyncHandler(async (req, res) => {
  await prisma.exam.deleteMany({ where: { id: req.params.id } });
  res.json({ message: "Exam deleted" });
}));
var exams_default = router9;

// server/src/routes/notices.js
var import_express10 = require("express");
var import_express_validator10 = require("express-validator");
init_prisma();
var router10 = (0, import_express10.Router)();
router10.use(auth);
async function attachCreatedBy(notices) {
  if (!notices.length) return notices;
  const ids = [...new Set(notices.map((n) => n.createdBy).filter(Boolean))];
  if (!ids.length) return notices;
  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, role: true } });
  const map = new Map(users.map((u) => [u.id, { _id: u.id, name: u.name, role: u.role }]));
  for (const n of notices) {
    if (map.has(n.createdBy)) n.createdBy = map.get(n.createdBy);
  }
  return notices;
}
router10.get("/", asyncHandler(async (req, res) => {
  const where = { college: req.user.college };
  if (req.query.important === "true") where.important = true;
  if (req.query.category) where.category = req.query.category;
  let notices = await prisma.notice.findMany({ where, orderBy: { date: "desc" }, take: 60 });
  notices = await attachCreatedBy(notices);
  res.json({ notices });
}));
router10.get("/:id", asyncHandler(async (req, res) => {
  let notice = await prisma.notice.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!notice) throw ApiError.notFound("Notice not found");
  [notice] = await attachCreatedBy([notice]);
  res.json({ notice });
}));
router10.post(
  "/",
  requireFaculty,
  upload.single("attachment"),
  [(0, import_express_validator10.body)("title").trim().notEmpty().withMessage("Title is required"), (0, import_express_validator10.body)("content").trim().notEmpty().withMessage("Content is required")],
  validate,
  asyncHandler(async (req, res) => {
    const { title, content, category, important, expiryDate } = req.body;
    const notice = await prisma.notice.create({
      data: {
        college: req.user.college,
        title: title.trim(),
        content: content.trim(),
        category: category || "general",
        important: important === "true" || important === true,
        expiryDate: expiryDate ? new Date(expiryDate) : void 0,
        createdBy: req.user.id,
        attachments: req.file ? [fileUrl(req, req.file.filename)] : []
      }
    });
    const students = await prisma.user.findMany({ where: { college: req.user.college, role: "student" }, select: { id: true } });
    await Promise.all(
      students.map(
        (s) => createNotification(s.id, {
          category: "college",
          title: notice.title,
          message: "New college notice",
          link: "/college",
          icon: "megaphone",
          priority: notice.important ? "high" : "medium"
        })
      )
    );
    res.status(201).json({ notice });
  })
);
router10.post("/:id/summarize", requireFaculty, asyncHandler(async (req, res) => {
  const notice = await prisma.notice.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!notice) throw ApiError.notFound("Notice not found");
  const result = await aiService.noticeSummary(notice.title, notice.content);
  const aiSummary = {
    summary: result.summary,
    importantDates: result.importantDates || [],
    deadline: result.deadline || "",
    actionRequired: result.actionRequired || "",
    examDetails: result.examDetails || "",
    generatedAt: /* @__PURE__ */ new Date()
  };
  const updated = await prisma.notice.update({ where: { id: notice.id }, data: { aiSummary } });
  res.json({ notice: updated, fromAI: result.fromAI === true });
}));
router10.patch("/:id", requireFaculty, asyncHandler(async (req, res) => {
  const notice = await prisma.notice.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!notice) throw ApiError.notFound("Notice not found");
  const allowed = ["title", "content", "category", "important", "expiryDate"];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== void 0) data[k] = req.body[k];
  });
  const updated = await prisma.notice.update({ where: { id: notice.id }, data });
  res.json({ notice: updated });
}));
router10.delete("/:id", requireFaculty, asyncHandler(async (req, res) => {
  await prisma.notice.deleteMany({ where: { id: req.params.id } });
  res.json({ message: "Notice deleted" });
}));
var notices_default = router10;

// server/src/routes/events.js
var import_express11 = require("express");
var import_express_validator11 = require("express-validator");
init_prisma();
var router11 = (0, import_express11.Router)();
router11.use(auth);
router11.get("/", asyncHandler(async (req, res) => {
  const where = { college: req.user.college };
  if (req.query.upcoming === "true") where.date = { gte: /* @__PURE__ */ new Date() };
  const events = await prisma.event.findMany({ where, orderBy: { date: "asc" }, take: 60 });
  res.json({ events });
}));
router11.get("/:id", asyncHandler(async (req, res) => {
  const event = await prisma.event.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!event) throw ApiError.notFound("Event not found");
  res.json({ event });
}));
router11.post(
  "/",
  requireFaculty,
  [(0, import_express_validator11.body)("title").trim().notEmpty().withMessage("Title is required"), (0, import_express_validator11.body)("date").isISO8601().withMessage("Valid date required")],
  validate,
  asyncHandler(async (req, res) => {
    const { title, description, category, date, startTime, endTime, location, organizer, registrationLink } = req.body;
    const event = await prisma.event.create({
      data: {
        college: req.user.college,
        title: title.trim(),
        description: description || "",
        category: category || "general",
        date: new Date(date),
        startTime: startTime || "10:00",
        endTime: endTime || "16:00",
        location: location || "",
        organizer: organizer || "",
        registrationLink: registrationLink || "",
        createdBy: req.user.id
      }
    });
    res.status(201).json({ event });
  })
);
router11.post("/:id/register", asyncHandler(async (req, res) => {
  const event = await prisma.event.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!event) throw ApiError.notFound("Event not found");
  const registeredStudents = event.registeredStudents || [];
  if (!registeredStudents.some((s) => String(s) === String(req.user.id))) {
    registeredStudents.push(req.user.id);
  }
  const updated = await prisma.event.update({ where: { id: event.id }, data: { registeredStudents } });
  res.json({ event: updated, registered: true });
}));
router11.post("/:id/save", asyncHandler(async (req, res) => {
  const event = await prisma.event.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!event) throw ApiError.notFound("Event not found");
  const savedBy = [...event.savedBy || []];
  const idx = savedBy.findIndex((s) => String(s) === String(req.user.id));
  if (idx === -1) savedBy.push(req.user.id);
  else savedBy.splice(idx, 1);
  const updated = await prisma.event.update({ where: { id: event.id }, data: { savedBy } });
  res.json({ event: updated, saved: idx === -1 });
}));
router11.patch("/:id", requireFaculty, asyncHandler(async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) throw ApiError.notFound("Event not found");
  const allowed = ["title", "description", "category", "date", "startTime", "endTime", "location", "organizer", "registrationLink"];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== void 0) data[k] = req.body[k];
  });
  const updated = await prisma.event.update({ where: { id: event.id }, data });
  res.json({ event: updated });
}));
router11.delete("/:id", requireFaculty, asyncHandler(async (req, res) => {
  await prisma.event.deleteMany({ where: { id: req.params.id } });
  res.json({ message: "Event deleted" });
}));
var events_default = router11;

// server/src/routes/clubs.js
var import_express12 = require("express");
var import_express_validator12 = require("express-validator");
init_prisma();
var router12 = (0, import_express12.Router)();
router12.use(auth);
router12.get("/", asyncHandler(async (req, res) => {
  const clubs = await prisma.club.findMany({ where: { college: req.user.college }, orderBy: { name: "asc" } });
  const enriched = clubs.map((c) => ({
    ...c,
    isMember: (c.members || []).some((m) => String(m) === String(req.user.id)),
    isFollowing: (c.followers || []).some((f) => String(f) === String(req.user.id))
  }));
  res.json({ clubs: enriched });
}));
router12.get("/:id", asyncHandler(async (req, res) => {
  const club = await prisma.club.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!club) throw ApiError.notFound("Club not found");
  res.json({
    club: {
      ...club,
      isMember: (club.members || []).some((m) => String(m) === String(req.user.id)),
      isFollowing: (club.followers || []).some((f) => String(f) === String(req.user.id))
    }
  });
}));
router12.post("/:id/join", asyncHandler(async (req, res) => {
  const club = await prisma.club.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!club) throw ApiError.notFound("Club not found");
  const members = [...club.members || []];
  if (!members.some((m) => String(m) === String(req.user.id))) members.push(req.user.id);
  const updated = await prisma.club.update({ where: { id: club.id }, data: { members } });
  res.json({ club: updated, isMember: true });
}));
router12.post("/:id/follow", asyncHandler(async (req, res) => {
  const club = await prisma.club.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!club) throw ApiError.notFound("Club not found");
  const followers = [...club.followers || []];
  const idx = followers.findIndex((f) => String(f) === String(req.user.id));
  if (idx === -1) followers.push(req.user.id);
  else followers.splice(idx, 1);
  const updated = await prisma.club.update({ where: { id: club.id }, data: { followers } });
  res.json({ club: updated, isFollowing: idx === -1 });
}));
router12.post(
  "/",
  requireFaculty,
  [(0, import_express_validator12.body)("name").trim().notEmpty().withMessage("Name is required")],
  validate,
  asyncHandler(async (req, res) => {
    const { name, description, category, logo, facultyAdvisor } = req.body;
    const club = await prisma.club.create({
      data: {
        college: req.user.college,
        name: name.trim(),
        description: description || "",
        category: category || "technical",
        logo: logo || "",
        facultyAdvisor: facultyAdvisor || ""
      }
    });
    res.status(201).json({ club });
  })
);
router12.post("/:id/announcements", requireFaculty, asyncHandler(async (req, res) => {
  const club = await prisma.club.findUnique({ where: { id: req.params.id } });
  if (!club) throw ApiError.notFound("Club not found");
  const { title, content } = req.body;
  const announcements = [{ title: title || "Announcement", content: content || "", date: /* @__PURE__ */ new Date() }, ...club.announcements || []];
  const updated = await prisma.club.update({ where: { id: club.id }, data: { announcements } });
  res.json({ club: updated });
}));
var clubs_default = router12;

// server/src/routes/opportunities.js
var import_express13 = require("express");
var import_express_validator13 = require("express-validator");
init_prisma();
init_matchingEngine();
init_helpers();
var router13 = (0, import_express13.Router)();
async function studentContext(userId) {
  if (!userId) return null;
  return prisma.studentProfile.findFirst({ where: { user: userId } });
}
router13.get("/", optionalAuth, asyncHandler(async (req, res) => {
  const { category, mode, location, skills, search, sort = "match", page = 1, limit = 20, urgent, status, source, paid, institution, cursor } = req.query;
  const where = {};
  if (req.user?.role === "admin") {
    if (status) where.status = status;
  } else {
    where.status = "verified";
  }
  if (category && category !== "all") where.category = category;
  if (mode && mode !== "all") where.mode = mode;
  if (location && location !== "all") where.location = { contains: location, mode: "insensitive" };
  if (source && source !== "all") {
    where.source = { contains: source, mode: "insensitive" };
  }
  if (paid === "paid") where.stipend = { not: "" };
  if (paid === "free") where.stipend = "";
  if (institution && institution !== "all") {
    where.organization = { contains: institution, mode: "insensitive" };
  }
  if (skills) {
    const skillList = String(skills).split(",").map((s) => s.trim()).filter(Boolean);
    if (skillList.length) where.skillsRequired = { hasSome: skillList };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { organization: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { eligibility: { contains: search, mode: "insensitive" } }
    ];
  }
  if (urgent === "true") where.deadline = { gte: /* @__PURE__ */ new Date(), lte: new Date(Date.now() + 7 * 864e5) };
  const takeNum = Math.min(Number(limit), 50);
  const profile = await studentContext(req.user?.id);
  if (cursor) {
    const cursorOpp = await prisma.opportunity.findUnique({ where: { id: cursor }, select: { postedDate: true, id: true } });
    if (cursorOpp) {
      where.OR = [
        { postedDate: { lt: cursorOpp.postedDate } },
        { postedDate: cursorOpp.postedDate, id: { lt: cursor.id } }
      ];
    }
  }
  if (profile) {
    const fetchLimit = cursor ? takeNum * 3 : Math.max(takeNum * 5, 200);
    const allOpps = await prisma.opportunity.findMany({ where, orderBy: [{ postedDate: "desc" }, { id: "desc" }], take: fetchLimit });
    const hasProfile = (profile.skills || []).length > 0 || (profile.interests || []).length > 0 || profile.careerGoal;
    let ranked = allOpps.map((o) => ({ ...computeMatch(profile, o), opportunity: o }));
    ranked.sort((a, b) => {
      if (sort === "deadline") return new Date(a.opportunity.deadline) - new Date(b.opportunity.deadline);
      if (sort === "newest") return new Date(b.opportunity.postedDate) - new Date(a.opportunity.postedDate);
      if (sort === "source") return a.opportunity.organization.localeCompare(b.opportunity.organization);
      return b.score - a.score;
    });
    if (hasProfile) {
      ranked = ranked.filter((r) => {
        if (r.score < 15) return false;
        const studentSkillNames = (profile.skills || []).map((s) => s.name.toLowerCase());
        const oppRequired = (r.opportunity.skillsRequired || []).map((s) => s.toLowerCase());
        if (studentSkillNames.length && oppRequired.length) {
          const skillOverlap = oppRequired.some((s) => studentSkillNames.some((st) => st.includes(s) || s.includes(st)));
          const studentInterests = (profile.interests || []).map((i) => i.toLowerCase());
          const oppText = [r.opportunity.title, r.opportunity.description, r.opportunity.category, ...r.opportunity.tags || []].join(" ").toLowerCase();
          const interestOverlap = studentInterests.some((i) => oppText.includes(i.toLowerCase()));
          const careerMatch = profile.careerGoal && oppText.includes(profile.careerGoal.toLowerCase());
          return skillOverlap || interestOverlap || careerMatch;
        }
        return true;
      });
    }
    const totalFiltered = ranked.length;
    const skip = cursor ? 0 : (Number(page) - 1) * takeNum;
    const paginated = ranked.slice(skip, skip + takeNum);
    const nextCursor = paginated.length === takeNum ? paginated[paginated.length - 1].opportunity.id : null;
    res.json({ opportunities: paginated, total: totalFiltered, page: Number(page), limit: takeNum, nextCursor, hasMore: paginated.length === takeNum, profile });
  } else {
    const skip = cursor ? 0 : (Number(page) - 1) * takeNum;
    const total = await prisma.opportunity.count({ where });
    const opportunities = await prisma.opportunity.findMany({ where, orderBy: [{ postedDate: "desc" }, { id: "desc" }], skip, take: takeNum });
    const nextCursor = opportunities.length === takeNum ? opportunities[opportunities.length - 1].id : null;
    res.json({ opportunities, total, page: Number(page), limit: takeNum, nextCursor, hasMore: opportunities.length === takeNum });
  }
}));
router13.get("/sources", optionalAuth, asyncHandler(async (req, res) => {
  const sources = await prisma.opportunity.groupBy({
    by: ["organization"],
    _count: { id: true },
    where: { status: "verified" },
    orderBy: { _count: { id: "desc" } }
  });
  res.json({ sources: sources.map((s) => ({ name: s.organization, count: s._count.id })) });
}));
router13.get("/trending", optionalAuth, asyncHandler(async (req, res) => {
  const where = { status: "verified", deadline: { gte: /* @__PURE__ */ new Date() }, postedDate: { gte: new Date(Date.now() - 14 * 864e5) } };
  const recent = await prisma.opportunity.findMany({ where, take: 40 });
  const profile = await studentContext(req.user?.id);
  const scored = profile ? recent.map((o) => ({ ...computeMatch(profile, o), opportunity: o })) : recent.map((o) => ({ score: 0, opportunity: o }));
  scored.sort((a, b) => b.score - a.score || new Date(b.opportunity.postedDate) - new Date(a.opportunity.postedDate));
  res.json({ opportunities: scored.slice(0, 6) });
}));
router13.post("/search", optionalAuth, asyncHandler(async (req, res) => {
  const { query: query2 } = req.body;
  if (!query2) throw ApiError.badRequest("Search query is required");
  const filters = await aiService.searchParse(query2);
  const where = { status: "verified" };
  if (filters.category) where.category = filters.category;
  if (filters.mode) where.mode = filters.mode;
  if (filters.location) where.location = { contains: filters.location, mode: "insensitive" };
  if (filters.skills?.length) where.skillsRequired = { hasSome: filters.skills };
  if (filters.urgent) where.deadline = { gte: /* @__PURE__ */ new Date(), lte: new Date(Date.now() + 7 * 864e5) };
  if (filters.text) {
    const t = filters.text;
    where.OR = [
      { title: { contains: t, mode: "insensitive" } },
      { organization: { contains: t, mode: "insensitive" } },
      { description: { contains: t, mode: "insensitive" } }
    ];
  }
  const opps = await prisma.opportunity.findMany({ where, take: 20 });
  const profile = await studentContext(req.user?.id);
  const results = profile ? opps.map((o) => ({ ...computeMatch(profile, o), opportunity: o })).sort((a, b) => b.score - a.score) : opps.map((o) => ({ score: 0, opportunity: o }));
  if (req.user) {
    await prisma.recommendationEvent.create({ data: { user: req.user.id, type: "searched", metadata: { query: query2 } } });
  }
  res.json({ results, filters, fromAI: filters.fromAI === true });
}));
router13.get("/:id", optionalAuth, asyncHandler(async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opp) throw ApiError.notFound("Opportunity not found");
  const profile = await studentContext(req.user?.id);
  let match = null;
  let application = null;
  if (profile) {
    match = computeMatch(profile, opp);
    application = req.user ? await prisma.application.findFirst({ where: { student: req.user.id, opportunity: opp.id } }) : null;
  }
  if (req.user) {
    const existing = await prisma.recommendationEvent.findFirst({ where: { user: req.user.id, type: "viewed", opportunity: opp.id } });
    if (!existing) {
      await prisma.recommendationEvent.create({ data: { user: req.user.id, type: "viewed", opportunity: opp.id, category: opp.category } });
    }
  }
  res.json({ opportunity: opp, match, application });
}));
router13.get("/:id/ai-analysis", optionalAuth, asyncHandler(async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opp) throw ApiError.notFound("Opportunity not found");
  const profile = await studentContext(req.user?.id);
  if (!profile) return res.json({ match: null, explanation: "Complete your profile to see AI analysis.", skillGaps: [], difficulty: "N/A", urgency: "N/A" });
  const match = computeMatch(profile, opp);
  const explanation = await aiService.matchExplanation(profile, opp, match);
  const have = new Set((profile.skills || []).map((s) => s.name.toLowerCase()));
  const skillGaps = (opp.skillsRequired || []).filter((s) => !have.has(s.toLowerCase()));
  const diff = daysBetween(/* @__PURE__ */ new Date(), opp.deadline);
  const difficulty = opp.experienceLevel === "fresher" || !opp.experienceLevel ? "Beginner-friendly" : opp.experienceLevel === "junior" ? "Moderate" : "Competitive";
  const urgency = diff < 0 ? "Expired" : diff === 0 ? "Due today" : diff <= 2 ? "Critical" : diff <= 7 ? "High" : diff <= 14 ? "Medium" : "Low";
  res.json({ match, explanation, skillGaps, difficulty, urgency, deadlineInDays: diff });
}));
router13.post(
  "/",
  requireFaculty,
  [
    (0, import_express_validator13.body)("title").trim().notEmpty().withMessage("Title is required"),
    (0, import_express_validator13.body)("organization").trim().notEmpty().withMessage("Organization is required"),
    (0, import_express_validator13.body)("category").isIn(["internship", "hackathon", "job", "scholarship", "training", "workshop", "competition", "fellowship", "research", "conference"]).withMessage("Invalid category"),
    (0, import_express_validator13.body)("deadline").isISO8601().withMessage("Valid deadline required")
  ],
  validate,
  asyncHandler(async (req, res) => {
    const data = req.body;
    const opp = await prisma.opportunity.create({
      data: {
        title: data.title.trim(),
        organization: data.organization.trim(),
        category: data.category,
        description: data.description || "",
        skillsRequired: data.skillsRequired || [],
        eligibility: data.eligibility || "",
        courseRestrictions: data.courseRestrictions || [],
        experienceLevel: data.experienceLevel || "any",
        location: data.location || "Remote",
        mode: data.mode || "remote",
        stipend: data.stipend || "",
        prize: data.prize || "",
        deadline: new Date(data.deadline),
        applyLink: data.applyLink || "",
        requirements: data.requirements || [],
        applicationProcess: data.applicationProcess || "",
        tags: data.tags || [],
        status: req.user.role === "admin" ? "verified" : "pending",
        createdBy: req.user.id
      }
    });
    res.status(201).json({ opportunity: opp });
  })
);
router13.post("/:id/save", auth, asyncHandler(async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opp) throw ApiError.notFound("Opportunity not found");
  let app2 = await prisma.application.findFirst({ where: { student: req.user.id, opportunity: opp.id } });
  if (!app2) {
    app2 = await prisma.application.create({ data: { student: req.user.id, opportunity: opp.id, status: "saved", timeline: [{ status: "saved" }] } });
  }
  await prisma.recommendationEvent.create({ data: { user: req.user.id, type: "saved", opportunity: opp.id, category: opp.category } });
  res.json({ application: app2, saved: true });
}));
router13.post("/:id/apply", auth, asyncHandler(async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opp) throw ApiError.notFound("Opportunity not found");
  const applyUrl = opp.applyUrl || opp.applyLink || opp.sourceUrl || "";
  try {
    await prisma.recommendationEvent.create({ data: { user: req.user.id, type: "applied", opportunity: opp.id, category: opp.category } });
  } catch {
  }
  res.json({ applyUrl, source: opp.organization, title: opp.title });
}));
router13.patch("/:id", requireAdmin, asyncHandler(async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opp) throw ApiError.notFound("Opportunity not found");
  const allowed = ["title", "organization", "category", "description", "skillsRequired", "eligibility", "courseRestrictions", "experienceLevel", "location", "mode", "stipend", "prize", "deadline", "applyLink", "applyUrl", "sourceUrl", "requirements", "applicationProcess", "tags", "status"];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== void 0) data[k] = req.body[k];
  });
  const updated = await prisma.opportunity.update({ where: { id: opp.id }, data });
  res.json({ opportunity: updated });
}));
router13.post("/:id/verify", requireAdmin, asyncHandler(async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opp) throw ApiError.notFound("Opportunity not found");
  const updated = await prisma.opportunity.update({ where: { id: opp.id }, data: { status: "verified", verifiedBy: req.user.id } });
  const profiles = await prisma.studentProfile.findMany({ select: { user: true }, distinct: ["user"] });
  await Promise.all(profiles.map((p) => createNotification(p.user, { category: "opportunity", title: `New verified opportunity: ${updated.title}`, message: `${updated.organization} \u2014 ${updated.category}`, link: `/opportunities/${updated.id}`, icon: "briefcase", priority: "medium" })));
  res.json({ opportunity: updated });
}));
router13.post("/:id/reject", auth, requireAdmin, asyncHandler(async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opp) throw ApiError.notFound("Opportunity not found");
  const updated = await prisma.opportunity.update({ where: { id: opp.id }, data: { status: "rejected" } });
  res.json({ opportunity: updated });
}));
router13.delete("/:id", auth, requireAdmin, asyncHandler(async (req, res) => {
  await prisma.opportunity.deleteMany({ where: { id: req.params.id } });
  res.json({ message: "Opportunity deleted" });
}));
router13.post("/validate-urls", auth, requireAdmin, asyncHandler(async (req, res) => {
  const opportunities = await prisma.opportunity.findMany({
    where: { status: "verified" },
    select: { id: true, title: true, applyUrl: true, applyLink: true, sourceUrl: true }
  });
  let fixed = 0;
  let removed = 0;
  for (const opp of opportunities) {
    let bestUrl = "";
    for (const url of [opp.applyUrl, opp.applyLink, opp.sourceUrl]) {
      if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
        bestUrl = url;
        break;
      }
    }
    if (bestUrl && bestUrl !== opp.applyUrl) {
      await prisma.opportunity.update({
        where: { id: opp.id },
        data: { applyUrl: bestUrl, sourceUrl: bestUrl }
      });
      fixed++;
    } else if (!bestUrl) {
      await prisma.opportunity.update({
        where: { id: opp.id },
        data: { status: "pending" }
      });
      removed++;
    }
  }
  res.json({ message: `Fixed ${fixed} URLs, ${removed} marked as pending`, fixed, removed });
}));
var opportunities_default = router13;

// server/src/routes/opportunitySync.js
var import_express14 = require("express");

// server/src/services/opportunities/aggregator.js
init_prisma();

// server/src/services/opportunities/connectors/base.js
var BaseConnector = class {
  /**
   * @param {Object} config
   * @param {string} config.id - unique connector ID (e.g., 'iit-delhi-careers')
   * @param {string} config.name - human-readable name (e.g., 'IIT Delhi Career Portal')
   * @param {string} config.source - source organization (e.g., 'IIT Delhi')
   * @param {string} config.type - 'rss' | 'scraper' | 'api' | 'manual'
   * @param {string} config.baseUrl
   * @param {number} [config.rateLimitMs=2000] - delay between requests
   */
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.source = config.source;
    this.type = config.type;
    this.baseUrl = config.baseUrl;
    this.rateLimitMs = config.rateLimitMs || 2e3;
  }
  /**
   * Fetch opportunities from this source.
   * Must be implemented by subclasses.
   * @returns {Promise<NormalizedOpp[]>}
   */
  async fetch() {
    throw new Error(`${this.id}: fetch() not implemented`);
  }
  /**
   * Parse a category string from source into our standard categories.
   */
  parseCategory(raw) {
    if (!raw) return "other";
    const lower = raw.toLowerCase().trim();
    if (/intern/.test(lower)) return "internship";
    if (/hack|cod(e|ing)/.test(lower)) return "hackathon";
    if (/job|position|role|recruit/.test(lower)) return "job";
    if (/scholar|fellow|grant|aid/.test(lower)) return "scholarship";
    if (/train|boot/.test(lower)) return "training";
    if (/workshop|seminar/.test(lower)) return "workshop";
    if (/compet|contest|challenge/.test(lower)) return "competition";
    if (/fellow/.test(lower)) return "fellowship";
    if (/research|lab|phd/.test(lower)) return "research";
    if (/conf|summit|symposium/.test(lower)) return "conference";
    return "other";
  }
  /**
   * Parse mode from raw string.
   */
  parseMode(raw) {
    if (!raw) return "onsite";
    const lower = raw.toLowerCase();
    if (/remote|online|virtual|anywhere/.test(lower)) return "remote";
    if (/hybrid/.test(lower)) return "hybrid";
    return "onsite";
  }
  /**
   * Extract deadline from various formats.
   */
  parseDeadline(raw) {
    if (!raw) return null;
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch {
    }
    const match = raw.match(/(\d{1,2})\s*[-/]\s*(\d{1,2})\s*[-/]\s*(\d{2,4})/);
    if (match) {
      const d = /* @__PURE__ */ new Date(`${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    return null;
  }
  /**
   * Delay for rate limiting.
   */
  async delay() {
    return new Promise((r) => setTimeout(r, this.rateLimitMs));
  }
  /**
   * Safe fetch with timeout and error handling.
   */
  async safeFetch(url, options = {}) {
    const timeout = options.timeout || 15e3;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "User-Agent": "CampusConnect/1.0 (Academic Platform)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8",
          ...options.headers || {}
        }
      });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      console.warn(`[connector:${this.id}] fetch failed for ${url}: ${err.message}`);
      return null;
    }
  }
  /**
   * Generate a unique external ID from title + organization.
   */
  generateExternalId(title, org) {
    const slug = `${title}|${org}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return slug.slice(0, 128);
  }
};

// server/src/services/opportunities/connectors/iit-connectors.js
var IITDelhiConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "iit-delhi",
      name: "IIT Delhi Career Portal",
      source: "IIT Delhi",
      type: "scraper",
      baseUrl: "https://home.iitd.ac.in"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching IIT Delhi opportunities`);
    const items = [];
    const urls = [
      "https://home.iitd.ac.in/placement",
      "https://careerdev.iitd.ac.in/"
    ];
    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : `https://home.iitd.ac.in${href}`;
        items.push(this.normalize(cleanTitle, fullUrl, "IIT Delhi"));
      }
      const broadPattern = /<a[^>]*href="([^"]*)"[^>]*class="[^"]*(?:list|card|item|opp)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
      while ((match = broadPattern.exec(html)) !== null) {
        const [, href, content] = match;
        const text = this.stripHTML(content).trim();
        if (text.length > 10 && text.length < 200) {
          const fullUrl = href.startsWith("http") ? href : `https://home.iitd.ac.in${href}`;
          items.push(this.normalize(text, fullUrl, "IIT Delhi"));
        }
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} IIT Delhi opportunities`);
    return items;
  }
  normalize(title, url, org) {
    return {
      title,
      organization: org,
      category: this.parseCategory(title),
      description: `Opportunity from ${org}: ${title}`,
      sourceUrl: url,
      applyUrl: url,
      location: "New Delhi, India",
      mode: "onsite",
      deadline: null,
      skillsRequired: [],
      stipend: "",
      prize: "",
      tags: ["iit", "iit-delhi", "career"],
      externalId: this.generateExternalId(title, org),
      eligibility: "IIT Delhi students and eligible external candidates",
      requirements: []
    };
  }
  stripHTML(html) {
    return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  }
};
var IITMadrasConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "iit-madras",
      name: "IIT Madras Career Cell",
      source: "IIT Madras",
      type: "scraper",
      baseUrl: "https://www.iitm.ac.in"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching IIT Madras opportunities`);
    const items = [];
    const urls = [
      "https://www.iitm.ac.in/placements",
      "https://www.cse.iitm.ac.in/opportunities",
      "https://dfrl.iitm.ac.in/opportunities.html"
    ];
    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train|workshop)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, url).href;
        items.push({
          title: cleanTitle,
          organization: "IIT Madras",
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from IIT Madras: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: "Chennai, India",
          mode: "onsite",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["iit", "iit-madras", "career"],
          externalId: this.generateExternalId(cleanTitle, "IIT Madras"),
          eligibility: "IIT Madras students and eligible external candidates",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} IIT Madras opportunities`);
    return items;
  }
};
var IITRoorkeeConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "iit-roorkee",
      name: "IIT Roorkee Placement Cell",
      source: "IIT Roorkee",
      type: "scraper",
      baseUrl: "https://www.iitr.ac.in"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching IIT Roorkee opportunities`);
    const items = [];
    const urls = [
      "https://www.iitr.ac.in/placement",
      "https://crc.iitr.ac.in/"
    ];
    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, url).href;
        items.push({
          title: cleanTitle,
          organization: "IIT Roorkee",
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from IIT Roorkee: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: "Roorkee, Uttarakhand, India",
          mode: "onsite",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["iit", "iit-roorkee", "career"],
          externalId: this.generateExternalId(cleanTitle, "IIT Roorkee"),
          eligibility: "IIT Roorkee students and eligible external candidates",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} IIT Roorkee opportunities`);
    return items;
  }
};
var IITBombayConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "iit-bombay",
      name: "IIT Bombay Career Cell",
      source: "IIT Bombay",
      type: "scraper",
      baseUrl: "https://www.iitb.ac.in"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching IIT Bombay opportunities`);
    const items = [];
    const urls = [
      "https://www.iitb.ac.in/placements",
      "https://cc.iitb.ac.in/"
    ];
    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, url).href;
        items.push({
          title: cleanTitle,
          organization: "IIT Bombay",
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from IIT Bombay: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: "Mumbai, Maharashtra, India",
          mode: "onsite",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["iit", "iit-bombay", "career"],
          externalId: this.generateExternalId(cleanTitle, "IIT Bombay"),
          eligibility: "IIT Bombay students and eligible external candidates",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} IIT Bombay opportunities`);
    return items;
  }
};
var IITKanpurConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "iit-kanpur",
      name: "IIT Kanpur Career Cell",
      source: "IIT Kanpur",
      type: "scraper",
      baseUrl: "https://www.iitk.ac.in"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching IIT Kanpur opportunities`);
    const items = [];
    const urls = [
      "https://www.iitk.ac.in/career",
      "https://www.iitk.ac.in/careerdev"
    ];
    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, url).href;
        items.push({
          title: cleanTitle,
          organization: "IIT Kanpur",
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from IIT Kanpur: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: "Kanpur, UP, India",
          mode: "onsite",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["iit", "iit-kanpur", "career"],
          externalId: this.generateExternalId(cleanTitle, "IIT Kanpur"),
          eligibility: "IIT Kanpur students and eligible external candidates",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} IIT Kanpur opportunities`);
    return items;
  }
};
var IITKharagpurConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "iit-kharagpur",
      name: "IIT Kharagpur Career Cell",
      source: "IIT Kharagpur",
      type: "scraper",
      baseUrl: "https://www.iitkgp.ac.in"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching IIT Kharagpur opportunities`);
    const items = [];
    const urls = [
      "https://www.iitkgp.ac.in/placement",
      "https://www.iitkgp.ac.in/career"
    ];
    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, url).href;
        items.push({
          title: cleanTitle,
          organization: "IIT Kharagpur",
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from IIT Kharagpur: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: "Kharagpur, West Bengal, India",
          mode: "onsite",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["iit", "iit-kharagpur", "career"],
          externalId: this.generateExternalId(cleanTitle, "IIT Kharagpur"),
          eligibility: "IIT Kharagpur students and eligible external candidates",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} IIT Kharagpur opportunities`);
    return items;
  }
};
var IITHyderabadConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "iit-hyderabad",
      name: "IIT Hyderabad Career Cell",
      source: "IIT Hyderabad",
      type: "scraper",
      baseUrl: "https://www.iith.ac.in"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching IIT Hyderabad opportunities`);
    const items = [];
    const urls = [
      "https://www.iith.ac.in/placements",
      "https://www.iith.ac.in/career"
    ];
    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, url).href;
        items.push({
          title: cleanTitle,
          organization: "IIT Hyderabad",
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from IIT Hyderabad: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: "Hyderabad, Telangana, India",
          mode: "onsite",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["iit", "iit-hyderabad", "career"],
          externalId: this.generateExternalId(cleanTitle, "IIT Hyderabad"),
          eligibility: "IIT Hyderabad students and eligible external candidates",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} IIT Hyderabad opportunities`);
    return items;
  }
};
var IITGuwahatiConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "iit-guwahati",
      name: "IIT Guwahati Career Cell",
      source: "IIT Guwahati",
      type: "scraper",
      baseUrl: "https://www.iitg.ac.in"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching IIT Guwahati opportunities`);
    const items = [];
    const urls = [
      "https://www.iitg.ac.in/placements",
      "https://www.iitg.ac.in/career"
    ];
    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, url).href;
        items.push({
          title: cleanTitle,
          organization: "IIT Guwahati",
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from IIT Guwahati: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: "Guwahati, Assam, India",
          mode: "onsite",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["iit", "iit-guwahati", "career"],
          externalId: this.generateExternalId(cleanTitle, "IIT Guwahati"),
          eligibility: "IIT Guwahati students and eligible external candidates",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} IIT Guwahati opportunities`);
    return items;
  }
};

// server/src/services/opportunities/connectors/nit-iiit-connectors.js
var NITConnector = class extends BaseConnector {
  /**
   * @param {Object} config
   * @param {string} config.nitName - e.g., 'NIT Trichy'
   * @param {string} config.code - e.g., 'NITT'
   * @param {string} config.baseUrl - e.g., 'https://www.nitt.edu'
   * @param {string[]} [config.paths] - paths to scrape
   */
  constructor(config) {
    super({
      id: `nit-${config.code?.toLowerCase() || config.nitName.toLowerCase().replace(/\s+/g, "-")}`,
      name: `${config.nitName} Career Portal`,
      source: config.nitName,
      type: "scraper",
      baseUrl: config.baseUrl
    });
    this.nitPaths = config.paths || ["/placements", "/career"];
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching ${this.source} opportunities`);
    const items = [];
    for (const p of this.nitPaths) {
      const url = `${this.baseUrl}${p}`;
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train|placement|recruit)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, this.baseUrl).href;
        items.push({
          title: cleanTitle,
          organization: this.source,
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from ${this.source}: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: this.source,
          mode: "onsite",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["nit", this.source.toLowerCase().replace(/\s+/g, "-"), "career"],
          externalId: this.generateExternalId(cleanTitle, this.source),
          eligibility: `${this.source} students and eligible external candidates`,
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} ${this.source} opportunities`);
    return items;
  }
};
var IIITConnector = class extends BaseConnector {
  constructor(config) {
    super({
      id: `iiit-${config.code?.toLowerCase() || config.iiitName.toLowerCase().replace(/\s+/g, "-")}`,
      name: `${config.iiitName} Career Portal`,
      source: config.iiitName,
      type: "scraper",
      baseUrl: config.baseUrl
    });
    this.iiitPaths = config.paths || ["/placements", "/career"];
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching ${this.source} opportunities`);
    const items = [];
    for (const p of this.iiitPaths) {
      const url = `${this.baseUrl}${p}`;
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train|placement|recruit)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, this.baseUrl).href;
        items.push({
          title: cleanTitle,
          organization: this.source,
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from ${this.source}: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: this.source,
          mode: "onsite",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["iiit", this.source.toLowerCase().replace(/\s+/g, "-"), "career"],
          externalId: this.generateExternalId(cleanTitle, this.source),
          eligibility: `${this.source} students and eligible external candidates`,
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} ${this.source} opportunities`);
    return items;
  }
};
var NIT_TRICHY = new NITConnector({
  nitName: "NIT Trichy",
  code: "NITT",
  baseUrl: "https://www.nitt.edu",
  paths: ["/placements", "/career"]
});
var NIT_WARANGAL = new NITConnector({
  nitName: "NIT Warangal",
  code: "NITW",
  baseUrl: "https://www.nitw.ac.in",
  paths: ["/placements", "/crc"]
});
var NIT_CALICUT = new NITConnector({
  nitName: "NIT Calicut",
  code: "NITC",
  baseUrl: "https://www.nitc.ac.in",
  paths: ["/placements", "/career"]
});
var NIT_SURATHKAL = new NITConnector({
  nitName: "NIT Surathkal",
  code: "NITK",
  baseUrl: "https://www.nitk.ac.in",
  paths: ["/placements", "/crc"]
});
var NIT_ROURKELA = new NITConnector({
  nitName: "NIT Rourkela",
  code: "NITR",
  baseUrl: "https://www.nitrkl.ac.in",
  paths: ["/placements", "/crc"]
});
var IIIT_HYDERABAD = new IIITConnector({
  iiitName: "IIIT Hyderabad",
  code: "IIITH",
  baseUrl: "https://www.iiit.ac.in",
  paths: ["/placements", "/career"]
});
var IIIT_ALLAHABAD = new IIITConnector({
  iiitName: "IIIT Allahabad",
  code: "IIITA",
  baseUrl: "https://www.iiita.ac.in",
  paths: ["/placements", "/career"]
});
var IIIT_BANGALORE = new IIITConnector({
  iiitName: "IIIT Bangalore",
  code: "IIITB",
  baseUrl: "https://www.iiitb.ac.in",
  paths: ["/placements", "/career"]
});
var IIIT_DELHI = new IIITConnector({
  iiitName: "IIIT Delhi",
  code: "IIITD",
  baseUrl: "https://www.iiitd.ac.in",
  paths: ["/placements", "/career"]
});
var IIIT_DHARWAD = new IIITConnector({
  iiitName: "IIIT Dharwad",
  code: "IIITDHD",
  baseUrl: "https://www.iiitdwd.ac.in",
  paths: ["/placements", "/career"]
});
var IIIT_RANCHI = new IIITConnector({
  iiitName: "IIIT Ranchi",
  code: "IIITR",
  baseUrl: "https://www.iiitranchi.ac.in",
  paths: ["/placements", "/career"]
});

// server/src/services/opportunities/connectors/platform-connectors.js
var InternshalaConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "internshala",
      name: "Internshala",
      source: "Internshala",
      type: "rss",
      baseUrl: "https://internshala.com"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching Internshala opportunities`);
    const items = [];
    const categories = [
      { url: "https://internshala.com/internships", type: "internship" },
      { url: "https://internshala.com/jobs", type: "job" }
    ];
    for (const cat of categories) {
      const res = await this.safeFetch(cat.url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const cardPattern = /<div[^>]*class="[^"]*individual_internship[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        const block = match[1];
        const titleMatch = block.match(/<a[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
        const companyMatch = block.match(/<p[^>]*class="[^"]*company[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        const locationMatch = block.match(/<p[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        const stipendMatch = block.match(/<span[^>]*class="[^"]*stipend[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const linkMatch = block.match(/<a[^>]*href="([^"]*)"[^>]*class="[^"]*title[^"]*"/i);
        const title = this.stripHTML(titleMatch?.[1] || "").trim();
        if (!title || title.length < 5) continue;
        const company = this.stripHTML(companyMatch?.[1] || "").trim() || "Various Companies";
        const location = this.stripHTML(locationMatch?.[1] || "").trim() || "India";
        const stipend = this.stripHTML(stipendMatch?.[1] || "").trim();
        const href = linkMatch?.[1] || "";
        const fullUrl = href.startsWith("http") ? href : `https://internshala.com${href}`;
        items.push({
          title,
          organization: company,
          category: cat.type,
          description: `${title} at ${company} via Internshala`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location,
          mode: /remote|work from home|wfh/i.test(location) ? "remote" : "onsite",
          deadline: null,
          skillsRequired: [],
          stipend,
          prize: "",
          tags: ["internshala", cat.type],
          externalId: this.generateExternalId(title, company),
          eligibility: "Open to all students",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} Internshala opportunities`);
    return items;
  }
  stripHTML(html) {
    return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8211;/g, "-").replace(/\s+/g, " ").trim();
  }
};
var GovScholarshipConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "gov-scholarships",
      name: "Government Scholarships Portal",
      source: "Government of India",
      type: "scraper",
      baseUrl: "https://scholarships.gov.in"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching government scholarships`);
    const items = [];
    const urls = [
      "https://scholarships.gov.in/public/nssh/STUDENT/SchemeDetails",
      "https://www.myscheme.gov.in/search/scholarship"
    ];
    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const cardPattern = /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        const [, href, titleRaw] = match;
        const title = this.stripHTML(titleRaw).trim();
        if (!title || title.length < 5 || /login|register|sign/i.test(title)) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, url).href;
        items.push({
          title,
          organization: "Government of India",
          category: "scholarship",
          description: `Government scholarship: ${title}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: "India",
          mode: "remote",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["government", "scholarship", "india"],
          externalId: this.generateExternalId(title, "Government of India"),
          eligibility: "Indian students as per scheme eligibility",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} government scholarships`);
    return items;
  }
  stripHTML(html) {
    return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  }
};
var MyGovConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "mygov",
      name: "MyGov Innovation Challenges",
      source: "MyGov India",
      type: "scraper",
      baseUrl: "https://www.mygov.in"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching MyGov challenges`);
    const items = [];
    const urls = [
      "https://www.mygov.in/challenge",
      "https://innovate.mygov.in/"
    ];
    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:challenge|hack|innovat|compet|contest)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : `https://www.mygov.in${href}`;
        items.push({
          title: cleanTitle,
          organization: "MyGov India",
          category: this.parseCategory(cleanTitle),
          description: `Government innovation challenge: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: "India",
          mode: "remote",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["mygov", "government", "innovation"],
          externalId: this.generateExternalId(cleanTitle, "MyGov India"),
          eligibility: "Indian citizens, students welcome",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} MyGov challenges`);
    return items;
  }
};
var KaggleConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "kaggle",
      name: "Kaggle Competitions",
      source: "Kaggle",
      type: "api",
      baseUrl: "https://www.kaggle.com"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching Kaggle competitions`);
    const items = [];
    const res = await this.safeFetch("https://www.kaggle.com/api/v1/competitions/list?sortBy=recentlyCreated&page=1");
    if (res && res.ok) {
      try {
        const data = await res.json();
        for (const comp of data || []) {
          const title = comp.title || comp.name;
          if (!title) continue;
          items.push({
            title,
            organization: "Kaggle",
            category: "competition",
            description: comp.description || `${title} - Kaggle competition`,
            sourceUrl: `https://www.kaggle.com/competitions/${comp.ref}`,
            applyUrl: `https://www.kaggle.com/competitions/${comp.ref}`,
            location: "Online",
            mode: "remote",
            deadline: comp.deadline || null,
            skillsRequired: comp.tags || [],
            stipend: "",
            prize: comp.reward || "",
            tags: ["kaggle", "data-science", "ml", "competition"],
            externalId: comp.ref || this.generateExternalId(title, "Kaggle"),
            eligibility: "Open to all",
            requirements: []
          });
        }
      } catch (err) {
        console.warn(`[connector:${this.id}] Failed to parse Kaggle API: ${err.message}`);
      }
    }
    if (items.length === 0) {
      const html = await this.safeFetch("https://www.kaggle.com/competitions");
      if (html && html.ok) {
        const text = await html.text();
        const cardPattern = /<a[^>]*href="\/competitions\/([^"]*)"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/gi;
        let match;
        while ((match = cardPattern.exec(text)) !== null) {
          const [, ref, title] = match;
          const cleanTitle = this.stripHTML(title).trim();
          if (!cleanTitle || cleanTitle.length < 3) continue;
          items.push({
            title: cleanTitle,
            organization: "Kaggle",
            category: "competition",
            description: `${cleanTitle} - Kaggle competition`,
            sourceUrl: `https://www.kaggle.com/competitions/${ref}`,
            applyUrl: `https://www.kaggle.com/competitions/${ref}`,
            location: "Online",
            mode: "remote",
            deadline: null,
            skillsRequired: [],
            stipend: "",
            prize: "",
            tags: ["kaggle", "competition"],
            externalId: ref,
            eligibility: "Open to all",
            requirements: []
          });
        }
      }
    }
    console.log(`[connector:${this.id}] Found ${items.length} Kaggle competitions`);
    return items;
  }
  stripHTML(html) {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
};
var GoogleEducationConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "google-education",
      name: "Google for Education",
      source: "Google",
      type: "scraper",
      baseUrl: "https://edu.google.com"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching Google Education opportunities`);
    const items = [];
    const urls = [
      "https://buildyourfuture.withgoogle.com/programs",
      "https://edu.google.com/intl/ALL_in/programs/"
    ];
    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:scholar|fellow|intern|train|program|hack)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, url).href;
        items.push({
          title: cleanTitle,
          organization: "Google",
          category: this.parseCategory(cleanTitle),
          description: `Google education program: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: "India",
          mode: "hybrid",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["google", "education", "tech"],
          externalId: this.generateExternalId(cleanTitle, "Google"),
          eligibility: "Students enrolled in degree programs",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} Google Education opportunities`);
    return items;
  }
};

// server/src/services/opportunities/connectors/additional-platforms.js
var UnstopConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "unstop",
      name: "Unstop (Dare2Compete)",
      source: "Unstop",
      type: "scraper",
      baseUrl: "https://unstop.com"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching Unstop opportunities`);
    const items = [];
    const categories = [
      { url: "https://unstop.com/hackathons", type: "hackathon" },
      { url: "https://unstop.com/competitions", type: "competition" },
      { url: "https://unstop.com/internships", type: "internship" },
      { url: "https://unstop.com/jobs", type: "job" },
      { url: "https://unstop.com/scholarships", type: "scholarship" }
    ];
    for (const cat of categories) {
      const res = await this.safeFetch(cat.url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const cardPattern = /<div[^>]*class="[^"]*card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        const block = match[1];
        const titleMatch = block.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
        const linkMatch = block.match(/<a[^>]*href="([^"]*)"[^>]*>/i);
        const orgMatch = block.match(/<span[^>]*>([\s\S]*?)<\/span>/i);
        const deadlineMatch = block.match(/deadline[:\s]*([\s\S]*?)(?:<|$)/i);
        const title = this.stripHTML(titleMatch?.[1] || "").trim();
        if (!title || title.length < 5) continue;
        if (/login|sign|register/i.test(title)) continue;
        const href = linkMatch?.[1] || "";
        const fullUrl = href.startsWith("http") ? href : `https://unstop.com${href}`;
        const org = this.stripHTML(orgMatch?.[1] || "").trim() || "Various";
        const deadline = this.parseDeadline(deadlineMatch?.[1] || "");
        items.push({
          title,
          organization: org,
          category: cat.type,
          description: `${title} \u2014 ${cat.type} on Unstop`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: "India",
          mode: "remote",
          deadline,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["unstop", cat.type],
          externalId: this.generateExternalId(title, "Unstop"),
          eligibility: "Open to college students",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} Unstop opportunities`);
    return items;
  }
  stripHTML(html) {
    return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8211;/g, "-").replace(/\s+/g, " ").trim();
  }
};
var LinkedInJobsConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "linkedin-jobs",
      name: "LinkedIn Jobs India",
      source: "LinkedIn",
      type: "rss",
      baseUrl: "https://www.linkedin.com"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching LinkedIn jobs RSS`);
    const items = [];
    const feeds = [
      "https://www.linkedin.com/jobs/search/?keywords=internship&location=India&f_TPR=r604800",
      "https://www.linkedin.com/jobs/search/?keywords=entry+level&location=India&f_TPR=r604800"
    ];
    for (const feedUrl of feeds) {
      const res = await this.safeFetch(feedUrl, {
        headers: { Accept: "text/html,application/xhtml+xml" }
      });
      if (!res || !res.ok) continue;
      const html = await res.text();
      const cardPattern = /<a[^>]*href="(\/jobs\/view\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        const [, href, content] = match;
        const titleMatch = content.match(/<span[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const companyMatch = content.match(/<span[^>]*class="[^"]*company[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const locationMatch = content.match(/<span[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const title = this.stripHTML(titleMatch?.[1] || "").trim();
        if (!title || title.length < 3) continue;
        const company = this.stripHTML(companyMatch?.[1] || "").trim() || "Various";
        const location = this.stripHTML(locationMatch?.[1] || "").trim() || "India";
        const fullUrl = href.startsWith("http") ? href : `https://www.linkedin.com${href}`;
        items.push({
          title,
          organization: company,
          category: "job",
          description: `${title} at ${company} via LinkedIn`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location,
          mode: /remote|wfh/i.test(location) ? "remote" : "onsite",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["linkedin", "job"],
          externalId: this.generateExternalId(title, company),
          eligibility: "Open to all",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} LinkedIn jobs`);
    return items;
  }
  stripHTML(html) {
    return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  }
};
var WellfoundConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "wellfound",
      name: "Wellfound (AngelList)",
      source: "Wellfound",
      type: "scraper",
      baseUrl: "https://wellfound.com"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching Wellfound opportunities`);
    const items = [];
    const urls = [
      "https://wellfound.com/jobs",
      "https://wellfound.com/internships"
    ];
    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const cardPattern = /<a[^>]*href="(\/jobs\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        const [, href, content] = match;
        const title = this.stripHTML(content.match(/<(?:h[2-4]|span)[^>]*>([\s\S]*?)<\/(?:h[2-4]|span)>/i)?.[1] || "").trim();
        if (!title || title.length < 3) continue;
        const fullUrl = href.startsWith("http") ? href : `https://wellfound.com${href}`;
        items.push({
          title,
          organization: "Startup",
          category: "job",
          description: `${title} \u2014 startup job on Wellfound`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: "India / Remote",
          mode: "remote",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["wellfound", "startup", "job"],
          externalId: this.generateExternalId(title, "Wellfound"),
          eligibility: "Open to all",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} Wellfound opportunities`);
    return items;
  }
  stripHTML(html) {
    return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  }
};
var DRDOConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "drdo",
      name: "DRDO Career Portal",
      source: "DRDO",
      type: "scraper",
      baseUrl: "https://www.drdo.gov.in"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching DRDO opportunities`);
    const items = [];
    const urls = [
      "https://www.drdo.gov.in/drdo/careers",
      "https://www.drdo.gov.in/drdo/recruitment"
    ];
    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|research|fellow|scholar|train|recruit|apprentice|project)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, this.baseUrl).href;
        items.push({
          title: cleanTitle,
          organization: "DRDO",
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from DRDO: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: "New Delhi, India",
          mode: "onsite",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["drdo", "government", "defence", "research"],
          externalId: this.generateExternalId(cleanTitle, "DRDO"),
          eligibility: "Indian citizens. Engineering/Science students eligible for internships.",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} DRDO opportunities`);
    return items;
  }
};
var ISROConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "isro",
      name: "ISRO Career Portal",
      source: "ISRO",
      type: "scraper",
      baseUrl: "https://www.isro.gov.in"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching ISRO opportunities`);
    const items = [];
    const urls = [
      "https://www.isro.gov.in/careers",
      "https://www.isro.gov.in/internships",
      "https://www.isro.gov.in/recruitment"
    ];
    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|research|fellow|train|recruit|apprentice|project)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, this.baseUrl).href;
        items.push({
          title: cleanTitle,
          organization: "ISRO",
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from ISRO: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: "Bangalore, India",
          mode: "onsite",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["isro", "government", "space", "research"],
          externalId: this.generateExternalId(cleanTitle, "ISRO"),
          eligibility: "Indian citizens. Engineering/Science students eligible.",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} ISRO opportunities`);
    return items;
  }
};
var CSIRConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "csir",
      name: "CSIR Portal",
      source: "CSIR",
      type: "scraper",
      baseUrl: "https://www.csir.res.in"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching CSIR opportunities`);
    const items = [];
    const urls = [
      "https://www.csir.res.in/careers",
      "https://www.csir.res.in/internships"
    ];
    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|research|fellow|scholar|train|recruit)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, this.baseUrl).href;
        items.push({
          title: cleanTitle,
          organization: "CSIR",
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from CSIR: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: "New Delhi, India",
          mode: "onsite",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["csir", "government", "research"],
          externalId: this.generateExternalId(cleanTitle, "CSIR"),
          eligibility: "Indian citizens. Science/Engineering students.",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} CSIR opportunities`);
    return items;
  }
};
var IIMConnector = class extends BaseConnector {
  constructor(config) {
    super({
      id: `iim-${config.code?.toLowerCase() || config.iimName.toLowerCase().replace(/\s+/g, "-")}`,
      name: `${config.iimName} Career Portal`,
      source: config.iimName,
      type: "scraper",
      baseUrl: config.baseUrl
    });
    this.iimPaths = config.paths || ["/placements", "/career", "/iprs"];
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching ${this.source} opportunities`);
    const items = [];
    for (const p of this.iimPaths) {
      const url = `${this.baseUrl}${p}`;
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|hack|research|fellow|scholar|train|placement|recruit|competition)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, this.baseUrl).href;
        items.push({
          title: cleanTitle,
          organization: this.source,
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from ${this.source}: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: this.source,
          mode: "onsite",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["iim", this.source.toLowerCase().replace(/\s+/g, "-"), "management"],
          externalId: this.generateExternalId(cleanTitle, this.source),
          eligibility: `${this.source} students and eligible external candidates`,
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} ${this.source} opportunities`);
    return items;
  }
};
var IIM_AHMEDABAD = new IIMConnector({
  iimName: "IIM Ahmedabad",
  code: "IIMA",
  baseUrl: "https://www.iima.ac.in",
  paths: ["/placements", "/career"]
});
var IIM_BANGALORE = new IIMConnector({
  iimName: "IIM Bangalore",
  code: "IIMB",
  baseUrl: "https://www.iimb.ac.in",
  paths: ["/placements", "/career"]
});
var IIM_CALCUTTA = new IIMConnector({
  iimName: "IIM Calcutta",
  code: "IIMC",
  baseUrl: "https://www.iimcal.ac.in",
  paths: ["/placements", "/career"]
});
var IIM_LUCKNOW = new IIMConnector({
  iimName: "IIM Lucknow",
  code: "IIML",
  baseUrl: "https://www.iiml.ac.in",
  paths: ["/placements", "/career"]
});
var GovInternshipPortalConnector = class extends BaseConnector {
  constructor() {
    super({
      id: "gov-internship-portal",
      name: "Government Internship Portal",
      source: "Government of India",
      type: "scraper",
      baseUrl: "https://internship.gov.in"
    });
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching government internships`);
    const items = [];
    const urls = [
      "https://internship.gov.in/",
      "https://www.myscheme.gov.in/search/internship"
    ];
    for (const url of urls) {
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const cardPattern = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        const [, href, content] = match;
        const title = this.stripHTML(content).trim();
        if (title.length < 5 || /login|register|sign|menu|home/i.test(title)) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, this.baseUrl).href;
        items.push({
          title,
          organization: "Government of India",
          category: "internship",
          description: `Government internship: ${title}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: "India",
          mode: "remote",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["government", "internship", "india"],
          externalId: this.generateExternalId(title, "GovInternship"),
          eligibility: "Indian students as per scheme eligibility",
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} government internships`);
    return items;
  }
  stripHTML(html) {
    return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  }
};
var CentralUniversityConnector = class extends BaseConnector {
  constructor(config) {
    super({
      id: `cu-${config.code}`,
      name: `${config.name} Portal`,
      source: config.name,
      type: "scraper",
      baseUrl: config.baseUrl
    });
    this.cuPaths = config.paths || ["/recruitment", "/careers"];
  }
  async fetch() {
    console.log(`[connector:${this.id}] Fetching ${this.source} opportunities`);
    const items = [];
    for (const p of this.cuPaths) {
      const url = `${this.baseUrl}${p}`;
      const res = await this.safeFetch(url);
      if (!res || !res.ok) continue;
      const html = await res.text();
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:intern|job|research|fellow|scholar|train|recruit|apprentice|project)[^<]*)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const [, href, title] = match;
        const cleanTitle = title.trim();
        if (cleanTitle.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : new URL(href, this.baseUrl).href;
        items.push({
          title: cleanTitle,
          organization: this.source,
          category: this.parseCategory(cleanTitle),
          description: `Opportunity from ${this.source}: ${cleanTitle}`,
          sourceUrl: fullUrl,
          applyUrl: fullUrl,
          location: this.source,
          mode: "onsite",
          deadline: null,
          skillsRequired: [],
          stipend: "",
          prize: "",
          tags: ["central-university", this.source.toLowerCase().replace(/\s+/g, "-")],
          externalId: this.generateExternalId(cleanTitle, this.source),
          eligibility: `${this.source} students and eligible candidates`,
          requirements: []
        });
      }
      await this.delay();
    }
    console.log(`[connector:${this.id}] Found ${items.length} ${this.source} opportunities`);
    return items;
  }
};
var DU_DELHI = new CentralUniversityConnector({
  name: "University of Delhi",
  code: "DU",
  baseUrl: "https://www.du.ac.in",
  paths: ["/recruitment", "/iprcell"]
});
var JNU_DELHI = new CentralUniversityConnector({
  name: "Jawaharlal Nehru University",
  code: "JNU",
  baseUrl: "https://www.jnu.ac.in",
  paths: ["/recruitment", "/career"]
});
var BHU_VARANASI = new CentralUniversityConnector({
  name: "Banaras Hindu University",
  code: "BHU",
  baseUrl: "https://www.bhu.ac.in",
  paths: ["/recruitment", "/career"]
});
var AMU_ALIGARH = new CentralUniversityConnector({
  name: "Aligarh Muslim University",
  code: "AMU",
  baseUrl: "https://www.amu.ac.in",
  paths: ["/recruitment", "/career"]
});

// server/src/services/opportunities/connectors/index.js
var connectors = [
  // ─── IITs ───
  new IITDelhiConnector(),
  new IITMadrasConnector(),
  new IITRoorkeeConnector(),
  new IITBombayConnector(),
  new IITKanpurConnector(),
  new IITKharagpurConnector(),
  new IITHyderabadConnector(),
  new IITGuwahatiConnector(),
  // ─── NITs ───
  NIT_TRICHY,
  NIT_WARANGAL,
  NIT_CALICUT,
  NIT_SURATHKAL,
  NIT_ROURKELA,
  // ─── IIITs ───
  IIIT_HYDERABAD,
  IIIT_ALLAHABAD,
  IIIT_BANGALORE,
  IIIT_DELHI,
  IIIT_DHARWAD,
  IIIT_RANCHI,
  // ─── IIMs ───
  IIM_AHMEDABAD,
  IIM_BANGALORE,
  IIM_CALCUTTA,
  IIM_LUCKNOW,
  // ─── Central Universities ───
  DU_DELHI,
  JNU_DELHI,
  BHU_VARANASI,
  AMU_ALIGARH,
  // ─── Government Organizations ───
  new DRDOConnector(),
  new ISROConnector(),
  new CSIRConnector(),
  new GovScholarshipConnector(),
  new GovInternshipPortalConnector(),
  new MyGovConnector(),
  // ─── Platforms ───
  new InternshalaConnector(),
  new UnstopConnector(),
  new KaggleConnector(),
  new GoogleEducationConnector(),
  new LinkedInJobsConnector(),
  new WellfoundConnector()
];
function getConnectorIds() {
  return connectors.map((c) => c.id);
}

// server/src/services/opportunities/aggregator.js
async function fetchAllOpportunities({ connectorIds = null, dryRun = false, retries = 1 } = {}) {
  const startTime = Date.now();
  const activeConnectors = connectorIds ? connectors.filter((c) => connectorIds.includes(c.id)) : connectors;
  console.log(`[aggregator] Starting fetch from ${activeConnectors.length} connectors...`);
  let total = 0;
  let stored = 0;
  let duplicates = 0;
  let errors = 0;
  const byConnector = {};
  for (const connector of activeConnectors) {
    let lastError = null;
    let items = [];
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[aggregator] Retrying ${connector.id} (attempt ${attempt + 1})...`);
          await new Promise((r) => setTimeout(r, 3e3));
        }
        items = await connector.fetch();
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        console.warn(`[aggregator] ${connector.id} attempt ${attempt + 1} failed: ${err.message}`);
      }
    }
    if (lastError) {
      console.error(`[aggregator] Connector ${connector.id} failed after ${retries + 1} attempts: ${lastError.message}`);
      byConnector[connector.id] = { fetched: 0, stored: 0, duplicates: 0, error: lastError.message };
      errors++;
      continue;
    }
    total += items.length;
    byConnector[connector.id] = { fetched: items.length, stored: 0, duplicates: 0 };
    for (const item of items) {
      try {
        const result = await storeOpportunity(item, connector, dryRun);
        if (result === "stored") {
          stored++;
          byConnector[connector.id].stored++;
        } else if (result === "duplicate") {
          duplicates++;
          byConnector[connector.id].duplicates++;
        }
      } catch (err) {
        console.warn(`[aggregator] Failed to store: ${item.title}: ${err.message}`);
        errors++;
      }
    }
    console.log(`[aggregator] ${connector.id}: fetched=${items.length}, stored=${byConnector[connector.id].stored}, dupes=${byConnector[connector.id].duplicates}`);
  }
  const elapsed = ((Date.now() - startTime) / 1e3).toFixed(1);
  console.log(`[aggregator] \u2705 Done in ${elapsed}s \u2014 total=${total}, stored=${stored}, duplicates=${duplicates}, errors=${errors}`);
  return { total, stored, duplicates, errors, byConnector, elapsed };
}
async function storeOpportunity(item, connector, dryRun = false) {
  const externalId = item.externalId || null;
  const source = item.organization || connector.source;
  if (externalId) {
    const existing = await prisma.opportunity.findFirst({
      where: {
        externalId,
        source: { contains: source, mode: "insensitive" }
      }
    });
    if (existing) {
      const updateData = { lastSynced: /* @__PURE__ */ new Date() };
      if (item.deadline) updateData.deadline = new Date(item.deadline);
      if (item.description && item.description !== existing.description) updateData.description = item.description;
      if (item.applyUrl && item.applyUrl !== existing.applyUrl) updateData.applyUrl = item.applyUrl;
      if (item.sourceUrl && item.sourceUrl !== existing.sourceUrl) updateData.sourceUrl = item.sourceUrl;
      await prisma.opportunity.update({ where: { id: existing.id }, data: updateData });
      return "duplicate";
    }
  }
  const titleLower = (item.title || "").toLowerCase().trim();
  if (titleLower.length > 10) {
    const existing = await prisma.opportunity.findFirst({
      where: {
        title: { contains: item.title, mode: "insensitive" },
        organization: { contains: source, mode: "insensitive" },
        status: { notIn: ["expired", "rejected"] }
      }
    });
    if (existing) {
      await prisma.opportunity.update({
        where: { id: existing.id },
        data: { lastSynced: /* @__PURE__ */ new Date() }
      });
      return "duplicate";
    }
  }
  if (dryRun) return "stored";
  await prisma.opportunity.create({
    data: {
      title: item.title,
      organization: source,
      category: item.category || "other",
      description: item.description || "",
      skillsRequired: item.skillsRequired || [],
      eligibility: item.eligibility || "",
      courseRestrictions: item.courseRestrictions || [],
      degreeRestrictions: item.degreeRestrictions || [],
      yearMin: item.yearMin || 1,
      yearMax: item.yearMax || 4,
      semesterMin: item.semesterMin || 1,
      semesterMax: item.semesterMax || 8,
      mandatorySkills: item.mandatorySkills || [],
      experienceLevel: item.experienceLevel || "any",
      location: item.location || "India",
      mode: item.mode || "onsite",
      stipend: item.stipend || "",
      prize: item.prize || "",
      deadline: item.deadline ? new Date(item.deadline) : new Date(Date.now() + 90 * 864e5),
      postedDate: /* @__PURE__ */ new Date(),
      applyLink: item.applyUrl || item.sourceUrl || "",
      sourceUrl: item.sourceUrl || "",
      applyUrl: item.applyUrl || "",
      sourceConnector: connector.id,
      source: `fetched:${source}`,
      externalId,
      requirements: item.requirements || [],
      applicationProcess: item.applicationProcess || "",
      tags: item.tags || [],
      status: "verified",
      lastSynced: /* @__PURE__ */ new Date(),
      expiresAt: item.deadline ? new Date(item.deadline) : new Date(Date.now() + 90 * 864e5)
    }
  });
  return "stored";
}
async function archiveExpiredOpportunities() {
  const result = await prisma.opportunity.updateMany({
    where: {
      status: "verified",
      deadline: { lt: /* @__PURE__ */ new Date() }
    },
    data: {
      status: "expired"
    }
  });
  if (result.count > 0) console.log(`[aggregator] Archived ${result.count} expired opportunities`);
  return result.count;
}
async function getSyncStatus() {
  const connectorStats = await prisma.opportunity.groupBy({
    by: ["sourceConnector"],
    _count: { id: true },
    _max: { lastSynced: true },
    where: { sourceConnector: { not: "" } }
  });
  const totalFetched = await prisma.opportunity.count({
    where: { sourceConnector: { not: "" } }
  });
  const totalManual = await prisma.opportunity.count({
    where: { sourceConnector: "" }
  });
  const totalVerified = await prisma.opportunity.count({
    where: { status: "verified" }
  });
  const totalExpired = await prisma.opportunity.count({
    where: { status: "expired" }
  });
  return {
    totalFetched,
    totalManual,
    totalVerified,
    totalExpired,
    totalAll: totalFetched + totalManual,
    connectors: connectorStats.map((s) => ({
      id: s.sourceConnector,
      count: s._count.id,
      lastSynced: s._max.lastSynced
    }))
  };
}

// server/src/routes/opportunitySync.js
var router14 = (0, import_express14.Router)();
router14.get("/status", auth, requireAdmin, asyncHandler(async (req, res) => {
  const status = await getSyncStatus();
  const availableConnectors = connectors.map((c) => ({
    id: c.id,
    name: c.name,
    source: c.source,
    type: c.type
  }));
  res.json({ ...status, availableConnectors });
}));
router14.post("/", auth, requireAdmin, asyncHandler(async (req, res) => {
  const { connectorIds, dryRun } = req.body || {};
  const ids = Array.isArray(connectorIds) && connectorIds.length > 0 ? connectorIds : null;
  console.log(`[sync] Admin ${req.user.id} triggered sync (connectors: ${ids ? ids.join(",") : "all"}, dryRun: ${!!dryRun})`);
  const syncPromise = fetchAllOpportunities({ connectorIds: ids, dryRun: !!dryRun });
  res.json({
    message: "Sync started",
    connectors: ids || getConnectorIds(),
    dryRun: !!dryRun
  });
  syncPromise.then((result) => {
    console.log(`[sync] Completed:`, JSON.stringify(result));
  }).catch((err) => {
    console.error(`[sync] Failed:`, err.message);
  });
}));
router14.post("/archive", auth, requireAdmin, asyncHandler(async (req, res) => {
  const count = await archiveExpiredOpportunities();
  res.json({ message: `Archived ${count} expired opportunities`, count });
}));
var opportunitySync_default = router14;

// server/src/routes/applications.js
var import_express15 = require("express");
init_prisma();
var router15 = (0, import_express15.Router)();
router15.use(auth, requireStudent);
var STATUS_FLOW = ["saved", "planning", "applied", "shortlisted", "interview", "selected", "rejected"];
async function attachOpportunity(applications) {
  if (!applications.length) return applications;
  const ids = [...new Set(applications.map((a) => a.opportunity).filter(Boolean))];
  if (!ids.length) return applications;
  const opps = await prisma.opportunity.findMany({ where: { id: { in: ids } } });
  const map = new Map(opps.map((o) => [o.id, o]));
  for (const a of applications) {
    if (map.has(a.opportunity)) a.opportunity = map.get(a.opportunity);
  }
  return applications;
}
router15.get("/", asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = { student: req.user.id };
  if (status && STATUS_FLOW.includes(status)) where.status = status;
  let applications = await prisma.application.findMany({ where, orderBy: { updatedAt: "desc" } });
  applications = await attachOpportunity(applications);
  res.json({ applications });
}));
router15.get("/analytics", asyncHandler(async (req, res) => {
  const apps = await prisma.application.findMany({ where: { student: req.user.id } });
  const count = (s) => apps.filter((a) => a.status === s).length;
  const counts = {
    saved: count("saved"),
    planning: count("planning"),
    applied: count("applied"),
    shortlisted: count("shortlisted"),
    interview: count("interview"),
    selected: count("selected"),
    rejected: count("rejected")
  };
  const decided = counts.selected + counts.rejected;
  const successRate = decided ? Math.round(counts.selected / decided * 100) : 0;
  res.json({ counts, total: apps.length, active: apps.filter((a) => ["applied", "shortlisted", "interview"].includes(a.status)).length, successRate });
}));
router15.post("/", asyncHandler(async (req, res) => {
  const { opportunityId, status = "saved", notes = "" } = req.body;
  if (!opportunityId) throw ApiError.badRequest("opportunityId is required");
  const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opp) throw ApiError.notFound("Opportunity not found");
  if (!STATUS_FLOW.includes(status)) throw ApiError.badRequest("Invalid status");
  let app2 = await prisma.application.findFirst({ where: { student: req.user.id, opportunity: opp.id } });
  if (app2) {
    const data = { notes };
    if (app2.status !== status) {
      data.status = status;
      data.timeline = [...app2.timeline || [], { status }];
      if (status === "applied" && !app2.appliedDate) data.appliedDate = /* @__PURE__ */ new Date();
    }
    app2 = await prisma.application.update({ where: { id: app2.id }, data });
  } else {
    app2 = await prisma.application.create({
      data: {
        student: req.user.id,
        opportunity: opp.id,
        status,
        notes,
        timeline: [{ status }],
        appliedDate: status === "applied" ? /* @__PURE__ */ new Date() : void 0
      }
    });
  }
  res.status(201).json({ application: app2 });
}));
router15.patch("/:id", asyncHandler(async (req, res) => {
  const app2 = await prisma.application.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!app2) throw ApiError.notFound("Application not found");
  const data = {};
  if (req.body.status) {
    if (!STATUS_FLOW.includes(req.body.status)) throw ApiError.badRequest("Invalid status");
    if (app2.status !== req.body.status) {
      data.status = req.body.status;
      data.timeline = [...app2.timeline || [], { status: req.body.status }];
      if (req.body.status === "applied" && !app2.appliedDate) data.appliedDate = /* @__PURE__ */ new Date();
    }
  }
  if (req.body.notes !== void 0) data.notes = req.body.notes;
  const updated = await prisma.application.update({ where: { id: app2.id }, data });
  res.json({ application: updated });
}));
router15.delete("/:id", asyncHandler(async (req, res) => {
  const res2 = await prisma.application.deleteMany({ where: { id: req.params.id, student: req.user.id } });
  if (!res2.count) throw ApiError.notFound("Application not found");
  res.json({ message: "Application removed" });
}));
router15.post("/:id/ai-assist", asyncHandler(async (req, res) => {
  const app2 = await prisma.application.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!app2) throw ApiError.notFound("Application not found");
  const opp = app2.opportunity ? await prisma.opportunity.findUnique({ where: { id: app2.opportunity } }) : null;
  if (!opp) throw ApiError.notFound("Opportunity not found");
  const [profile, resume] = await Promise.all([
    prisma.studentProfile.findFirst({ where: { user: req.user.id } }),
    prisma.resume.findFirst({ where: { student: req.user.id }, orderBy: { createdAt: "desc" } })
  ]);
  const result = await aiService.applicationAssist(
    { ...profile || {}, userName: req.user.name },
    opp,
    resume?.extractedText || ""
  );
  const aiAssist = {
    coverLetter: result.coverLetter,
    introduction: result.introduction,
    whyYou: result.whyYou,
    generatedAt: /* @__PURE__ */ new Date()
  };
  const updated = await prisma.application.update({ where: { id: app2.id }, data: { aiAssist } });
  res.json({ aiAssist: updated.aiAssist, fromAI: result.fromAI === true });
}));
var applications_default = router15;

// server/src/routes/resumes.js
var import_express16 = require("express");
var import_fs3 = __toESM(require("fs"), 1);
var import_path4 = __toESM(require("path"), 1);
init_prisma();
init_fallbacks();
var router16 = (0, import_express16.Router)();
router16.use(auth, requireStudent);
async function extractPdfText(filePath) {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(import_fs3.default.readFileSync(filePath));
  return data.text || "";
}
router16.post("/upload", upload.single("resume"), asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("Please upload a PDF resume");
  let record = await prisma.resume.create({
    data: {
      student: req.user.id,
      filename: req.file.originalname,
      filePath: req.file.filename,
      fileType: req.file.mimetype || "application/pdf",
      fileSize: req.file.size
    }
  });
  let extractedText = "";
  try {
    if (req.file.mimetype === "application/pdf") {
      extractedText = await extractPdfText(req.file.path);
    }
  } catch (err) {
    console.error("[resumes] PDF extraction failed:", err.message);
  }
  record = await prisma.resume.update({ where: { id: record.id }, data: { extractedText } });
  res.status(201).json({ resume: record });
}));
router16.get("/", asyncHandler(async (req, res) => {
  const resumes = await prisma.resume.findMany({ where: { student: req.user.id }, orderBy: { createdAt: "desc" } });
  res.json({ resumes });
}));
router16.get("/:id", asyncHandler(async (req, res) => {
  const resume = await prisma.resume.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!resume) throw ApiError.notFound("Resume not found");
  res.json({ resume });
}));
router16.post("/:id/analyze", asyncHandler(async (req, res) => {
  const resume = await prisma.resume.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!resume) throw ApiError.notFound("Resume not found");
  if (!resume.extractedText) throw ApiError.badRequest("Could not extract text from this resume. Please upload a text-based PDF.");
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  const analysis = await aiService.resumeAnalysis(resume.extractedText, profile);
  const analysisWithDate = { ...analysis, generatedAt: /* @__PURE__ */ new Date() };
  const updated = await prisma.resume.update({ where: { id: resume.id }, data: { analysis: analysisWithDate } });
  if (profile) {
    await prisma.studentProfile.update({ where: { id: profile.id }, data: { resume: resume.id } });
  }
  res.json({ resume: updated, fromAI: analysis.fromAI === true });
}));
router16.get("/:id/compare/:opportunityId", asyncHandler(async (req, res) => {
  const resume = await prisma.resume.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!resume) throw ApiError.notFound("Resume not found");
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.opportunityId } });
  if (!opp) throw ApiError.notFound("Opportunity not found");
  const resumeSkills = resume.analysis?.parsed?.skills?.length ? resume.analysis.parsed.skills : (await Promise.resolve().then(() => (init_fallbacks(), fallbacks_exports))).extractSkills(resume.extractedText);
  const result = fallbackResumeAlignment(resumeSkills, opp);
  res.json({ ...result, opportunity: opp });
}));
router16.delete("/:id", asyncHandler(async (req, res) => {
  const resume = await prisma.resume.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!resume) throw ApiError.notFound("Resume not found");
  try {
    import_fs3.default.unlinkSync(import_path4.default.join(uploadsDirPath, resume.filePath));
  } catch {
  }
  await prisma.studentProfile.updateMany({ where: { user: req.user.id, resume: resume.id }, data: { resume: null } });
  await prisma.resume.deleteMany({ where: { id: resume.id } });
  res.json({ message: "Resume deleted" });
}));
var resumes_default = router16;

// server/src/routes/ai.js
var import_express17 = require("express");
var import_express_validator14 = require("express-validator");
init_prisma();
init_attendanceService();
init_matchingEngine();
init_helpers();
var router17 = (0, import_express17.Router)();
router17.use(auth, requireStudent);
async function gatherContext(userId) {
  const [profile, user] = await Promise.all([
    prisma.studentProfile.findFirst({ where: { user: userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } })
  ]);
  const collegeId = profile?.college;
  const today = /* @__PURE__ */ new Date();
  const [slots, attendanceRecords, tasks, assignments, exams, notices, events, opportunities] = await Promise.all([
    prisma.timetableSlot.findMany({ where: { student: userId } }),
    prisma.attendance.findMany({ where: { student: userId } }),
    prisma.task.findMany({ where: { user: userId }, orderBy: { createdAt: "desc" } }),
    collegeId ? prisma.assignment.findMany({ where: { college: collegeId, semester: profile?.semester }, orderBy: { dueDate: "asc" } }) : [],
    collegeId ? prisma.exam.findMany({ where: { college: collegeId, semester: profile?.semester, date: { gte: /* @__PURE__ */ new Date() } }, orderBy: { date: "asc" } }) : [],
    collegeId ? prisma.notice.findMany({ where: { college: collegeId }, orderBy: { date: "desc" }, take: 5 }) : [],
    collegeId ? prisma.event.findMany({ where: { college: collegeId, date: { gte: /* @__PURE__ */ new Date() } }, orderBy: { date: "asc" }, take: 5 }) : [],
    prisma.opportunity.findMany({ where: { status: "verified", deadline: { gte: /* @__PURE__ */ new Date() } }, take: 60 })
  ]);
  const groups = {};
  for (const r of attendanceRecords) (groups[r.subjectName] = groups[r.subjectName] || []).push(r);
  const attendance = buildAttendanceReport(groups);
  const deadlineItems = [];
  assignments.forEach((a) => {
    if (a.dueDate >= new Date(Date.now() - 864e5)) deadlineItems.push({ label: `Assignment: ${a.title}`, date: a.dueDate });
  });
  exams.forEach((e) => deadlineItems.push({ label: `Exam: ${e.title}`, date: e.date }));
  tasks.filter((t) => t.status !== "done" && t.dueDate).forEach((t) => deadlineItems.push({ label: `Task: ${t.title}`, date: t.dueDate }));
  const deadlines = groupDeadlines(deadlineItems);
  const allDeadlines = [...deadlines.overdue, ...deadlines.today, ...deadlines.tomorrow, ...deadlines.week, ...deadlines.later].slice(0, 8);
  const ranked = profile ? rankOpportunities(profile, opportunities, 5) : [];
  return {
    profile,
    student: { name: user?.name, course: profile?.course, semester: profile?.semester },
    timetable: slots,
    attendance: { overall: attendance.overall, trend: attendance.trend },
    tasks: tasks.slice(0, 5),
    deadlines: allDeadlines,
    opportunities: ranked,
    notices: notices.slice(0, 3),
    events: events.slice(0, 3)
  };
}
router17.post(
  "/chat",
  [(0, import_express_validator14.body)("message").trim().notEmpty().withMessage("Message is required")],
  validate,
  asyncHandler(async (req, res) => {
    const ctx = await gatherContext(req.user.id);
    const history = Array.isArray(req.body.history) ? req.body.history : [];
    const result = await aiService.chat(req.body.message, ctx, history);
    res.json(result);
  })
);
router17.post(
  "/daily-plan",
  [(0, import_express_validator14.body)("date").optional().isISO8601()],
  validate,
  asyncHandler(async (req, res) => {
    const date = req.body.date ? new Date(req.body.date) : /* @__PURE__ */ new Date();
    date.setHours(0, 0, 0, 0);
    const ctx = await gatherContext(req.user.id);
    const topOpportunity = ctx.opportunities?.[0];
    const attendanceWarning = ctx.attendance?.overall?.total > 0 && ctx.attendance.overall.health !== "safe";
    const planData = await aiService.dailyPlan({
      date: date.toISOString().slice(0, 10),
      timetable: ctx.timetable,
      tasks: ctx.tasks,
      deadlines: ctx.deadlines,
      topOpportunity: topOpportunity ? { ...topOpportunity.opportunity, score: topOpportunity.score } : null,
      attendanceWarning
    });
    const plan = await prisma.aIPlan.upsert({
      where: { student_date: { student: req.user.id, date } },
      update: { items: planData.items, summary: planData.summary, source: "daily" },
      create: { student: req.user.id, date, items: planData.items, summary: planData.summary, source: "daily" }
    });
    res.json({ plan, fromAI: planData.fromAI === true });
  })
);
router17.get("/daily-plan", asyncHandler(async (req, res) => {
  const date = startOfToday();
  let plan = await prisma.aIPlan.findFirst({ where: { student: req.user.id, date } });
  if (!plan) {
    const ctx = await gatherContext(req.user.id);
    const topOpportunity = ctx.opportunities?.[0];
    const planData = await aiService.dailyPlan({
      date: date.toISOString().slice(0, 10),
      timetable: ctx.timetable,
      tasks: ctx.tasks,
      deadlines: ctx.deadlines,
      topOpportunity: topOpportunity ? { ...topOpportunity.opportunity, score: topOpportunity.score } : null,
      attendanceWarning: ctx.attendance?.overall?.total > 0 && ctx.attendance.overall.health !== "safe"
    });
    plan = await prisma.aIPlan.create({ data: { student: req.user.id, date, items: planData.items, summary: planData.summary } });
  }
  res.json({ plan });
}));
router17.patch("/daily-plan/:id", asyncHandler(async (req, res) => {
  const plan = await prisma.aIPlan.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!plan) throw ApiError.notFound("Plan not found");
  const data = {};
  if (req.body.accepted !== void 0) data.accepted = req.body.accepted;
  if (req.body.summary !== void 0) data.summary = req.body.summary;
  if (Array.isArray(req.body.items)) data.items = req.body.items;
  if (req.body.itemIndex !== void 0 && req.body.status) {
    const idx = Number(req.body.itemIndex);
    const items = [...plan.items || []];
    if (items[idx]) {
      if (req.body.status === "snoozed") {
        items.splice(idx, 1);
        data.items = items;
      } else {
        items[idx] = { ...items[idx], status: req.body.status };
        data.items = items;
      }
    }
  }
  const updated = await prisma.aIPlan.update({ where: { id: plan.id }, data });
  res.json({ plan: updated });
}));
router17.post("/skill-gap", asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  if (!profile) throw ApiError.notFound("Complete your profile first");
  const careerGoal = req.body.careerGoal || profile.careerGoal;
  if (!careerGoal) throw ApiError.badRequest("Set a career goal first");
  const result = await aiService.skillGap(profile, careerGoal);
  res.json(result);
}));
router17.post("/roadmap", asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  if (!profile) throw ApiError.notFound("Complete your profile first");
  const careerGoal = req.body.careerGoal || profile.careerGoal;
  if (!careerGoal) throw ApiError.badRequest("Set a career goal first");
  const steps = await aiService.roadmap(careerGoal, profile.skills);
  const existing = new Map((profile.roadmap || []).map((r) => [r.skill.toLowerCase(), r.status]));
  const merged = steps.map((s, i) => ({ skill: s.skill, status: existing.get(s.skill.toLowerCase()) || s.status || "Not Started", order: i }));
  await prisma.studentProfile.update({ where: { id: profile.id }, data: { roadmap: merged, careerGoal } });
  res.json({ roadmap: merged });
}));
router17.post("/projects", asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  if (!profile) throw ApiError.notFound("Complete your profile first");
  const projects = await aiService.projects(profile);
  res.json({ projects });
}));
router17.post("/profile-insights", asyncHandler(async (req, res) => {
  let profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  if (!profile) throw ApiError.notFound("Complete your profile first");
  if (profile.resume) {
    const resume = await prisma.resume.findUnique({ where: { id: profile.resume } });
    if (resume) profile.resume = resume;
  }
  const result = await aiService.profileInsights(profile);
  res.json(result);
}));
router17.get("/proactive-alerts", asyncHandler(async (req, res) => {
  const ctx = await gatherContext(req.user.id);
  const apps = await prisma.application.findMany({ where: { student: req.user.id }, select: { opportunity: true } });
  const applications = apps.map((a) => a.opportunity);
  const actions = aiService.proactiveActions({
    deadlines: ctx.deadlines,
    topOpportunities: ctx.opportunities,
    attendance: ctx.attendance,
    applications
  });
  res.json({ actions });
}));
router17.get("/status", (req, res) => {
  res.json({ mode: aiService.mode });
});
var ai_default = router17;

// server/src/routes/messages.js
var import_express18 = require("express");
var import_express_validator15 = require("express-validator");
init_prisma();
var router18 = (0, import_express18.Router)();
router18.use(auth);
router18.get("/contacts", asyncHandler(async (req, res) => {
  if (!req.user.college) return res.json({ contacts: [] });
  const otherRole = req.user.role === "student" ? "faculty" : req.user.role === "faculty" ? "student" : null;
  if (!otherRole) return res.json({ contacts: [] });
  const users = await prisma.user.findMany({
    where: { college: req.user.college, role: otherRole, active: true },
    select: { id: true, name: true, email: true, designation: true, role: true },
    orderBy: { name: "asc" },
    take: 100
  });
  res.json({ contacts: users });
}));
router18.get("/conversations", asyncHandler(async (req, res) => {
  const me = req.user.id;
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: me }, { receiverId: me }] },
    orderBy: { createdAt: "desc" },
    take: 500
  });
  const convos = /* @__PURE__ */ new Map();
  for (const m of messages) {
    const otherId = m.senderId === me ? m.receiverId : m.senderId;
    if (!convos.has(otherId)) {
      convos.set(otherId, { otherId, lastMessage: m.content, lastAt: m.createdAt, unread: 0 });
    }
    if (m.receiverId === me && !m.read) convos.get(otherId).unread++;
  }
  const ids = [...convos.keys()];
  const users = ids.length ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, designation: true, role: true } }) : [];
  const userMap = new Map(users.map((u) => [u.id, u]));
  const conversations = [...convos.values()].map((c) => ({ ...c, _id: c.otherId, user: userMap.get(c.otherId) || null })).filter((c) => c.user).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  res.json({ conversations });
}));
router18.get("/:userId", asyncHandler(async (req, res) => {
  const me = req.user.id;
  const other = await prisma.user.findUnique({
    where: { id: req.params.userId },
    select: { id: true, name: true, designation: true, role: true, email: true }
  });
  if (!other) throw ApiError.notFound("User not found");
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: me, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: me }
      ]
    },
    orderBy: { createdAt: "asc" }
  });
  await prisma.message.updateMany({
    where: { senderId: req.params.userId, receiverId: me, read: false },
    data: { read: true }
  });
  res.json({ user: other, messages });
}));
router18.post(
  "/",
  [
    (0, import_express_validator15.body)("receiverId").notEmpty().withMessage("Receiver is required"),
    (0, import_express_validator15.body)("content").trim().notEmpty().withMessage("Message is required").isLength({ max: 2e3 }).withMessage("Message is too long")
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { receiverId, content } = req.body;
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) throw ApiError.notFound("User not found");
    if (receiver.id === req.user.id) throw ApiError.badRequest("You cannot message yourself");
    if (req.user.role !== "admin" && receiver.college !== req.user.college) {
      throw ApiError.forbidden("You can only message people in your college");
    }
    const message = await prisma.message.create({
      data: { senderId: req.user.id, receiverId, content: content.trim() }
    });
    await createNotification(receiverId, {
      category: "message",
      title: `${req.user.name.split(" ")[0]} messaged you`,
      message: content.trim().slice(0, 80),
      link: "/messages",
      icon: "message",
      priority: "medium"
    });
    res.status(201).json({ message });
  })
);
var messages_default = router18;

// server/src/routes/notifications.js
var import_express19 = require("express");
init_prisma();
var router19 = (0, import_express19.Router)();
router19.use(auth);
router19.get("/", asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const where = { user: req.user.id };
  if (req.query.category) where.category = req.query.category;
  if (req.query.unread === "true") where.read = false;
  const total = await prisma.notification.count({ where });
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit
  });
  res.json({ notifications, total, page, limit });
}));
router19.get("/unread-count", asyncHandler(async (req, res) => {
  const count = await prisma.notification.count({ where: { user: req.user.id, read: false } });
  res.json({ count });
}));
router19.patch("/:id/read", asyncHandler(async (req, res) => {
  const res2 = await prisma.notification.updateMany({ where: { id: req.params.id, user: req.user.id }, data: { read: true } });
  if (!res2.count) throw ApiError.notFound("Notification not found");
  const notif = await prisma.notification.findUnique({ where: { id: req.params.id } });
  res.json({ notification: notif });
}));
router19.post("/read-all", asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { user: req.user.id, read: false }, data: { read: true } });
  res.json({ message: "All notifications marked as read" });
}));
router19.delete("/:id", asyncHandler(async (req, res) => {
  await prisma.notification.deleteMany({ where: { id: req.params.id, user: req.user.id } });
  res.json({ message: "Notification deleted" });
}));
var notifications_default = router19;

// server/src/routes/admin.js
var import_express20 = require("express");
var import_express_validator16 = require("express-validator");
init_prisma();
init_userUtils();
var router20 = (0, import_express20.Router)();
router20.use(auth, requireAdmin);
router20.get("/analytics", asyncHandler(async (req, res) => {
  const cid = req.user.college;
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const collegeCourses = await prisma.course.findMany({ where: { college: cid }, select: { id: true } });
  const courseIds = collegeCourses.map((c) => c.id);
  const [students, faculty, departments, courses, sections, subjects, enrollments, notices, events, clubs, activeUsers] = await Promise.all([
    prisma.user.count({ where: { role: "student", college: cid } }),
    prisma.user.count({ where: { role: "faculty", college: cid } }),
    prisma.department.count({ where: { college: cid } }),
    prisma.course.count({ where: { college: cid } }),
    courseIds.length > 0 ? prisma.section.count({ where: { course: { in: courseIds } } }) : 0,
    prisma.subject.count({ where: { college: cid } }),
    courseIds.length > 0 ? prisma.enrollment.count({ where: { course: { in: courseIds } } }) : 0,
    prisma.notice.count({ where: { college: cid } }).catch(() => 0),
    prisma.event.count({ where: { college: cid } }).catch(() => 0),
    prisma.club.count({ where: { college: cid } }).catch(() => 0),
    prisma.user.count({ where: { college: cid, lastLoginAt: { gte: weekAgo } } })
  ]);
  const pendingUsers = await prisma.user.count({ where: { college: cid, approved: false } });
  res.json({
    college: { id: cid },
    totals: { students, faculty, departments, courses, sections, subjects, enrollments, notices, events, clubs },
    engagement: { activeUsers, pendingUsers }
  });
}));
router20.get("/college-info", asyncHandler(async (req, res) => {
  const college = await prisma.college.findUnique({ where: { id: req.user.college } });
  if (!college) throw ApiError.notFound("College not found");
  res.json({ college });
}));
router20.get("/students", asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 15 } = req.query;
  const where = { role: "student", college: req.user.college };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } }
    ];
  }
  const total = await prisma.user.count({ where });
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit)
  });
  const userIds = users.map((u) => u.id);
  const profiles = await prisma.studentProfile.findMany({ where: { user: { in: userIds } } });
  const profileMap = new Map(profiles.map((p) => [p.user, p]));
  const enrollments = await prisma.enrollment.findMany({
    where: { student: { in: userIds } },
    include: { course: true, section: true }
  });
  const enrollMap = /* @__PURE__ */ new Map();
  for (const e of enrollments) {
    if (!enrollMap.has(e.student)) enrollMap.set(e.student, []);
    enrollMap.get(e.student).push(e);
  }
  res.json({
    students: users.map((u) => ({
      ...toSafeUser(u),
      profile: profileMap.get(u.id),
      enrollments: enrollMap.get(u.id) || []
    })),
    total,
    page: Number(page)
  });
}));
router20.patch("/students/:id", asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound("Student not found");
  if (user.college !== req.user.college) throw ApiError.forbidden("Access denied");
  const data = {};
  if (req.body.active !== void 0) data.active = req.body.active;
  if (req.body.role) data.role = req.body.role;
  const updated = await prisma.user.update({ where: { id: user.id }, data });
  res.json({ user: toSafeUser(updated) });
}));
router20.delete("/students/:id", asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound("Student not found");
  if (user.college !== req.user.college) throw ApiError.forbidden("Access denied");
  await prisma.user.deleteMany({ where: { id: req.params.id } });
  await prisma.studentProfile.deleteMany({ where: { user: req.params.id } });
  res.json({ message: "Student deleted" });
}));
router20.get("/faculty", asyncHandler(async (req, res) => {
  const faculty = await prisma.user.findMany({
    where: { role: "faculty", college: req.user.college },
    orderBy: { name: "asc" }
  });
  const facIds = faculty.map((f) => f.id);
  const profiles = await prisma.facultyProfile.findMany({ where: { user: { in: facIds } } });
  const profileMap = new Map(profiles.map((p) => [p.user, p]));
  const assignments = await prisma.facultyAssignment.findMany({
    where: { faculty: { in: facIds } }
  });
  const assignMap = /* @__PURE__ */ new Map();
  for (const a of assignments) {
    if (!assignMap.has(a.faculty)) assignMap.set(a.faculty, []);
    assignMap.get(a.faculty).push(a);
  }
  res.json({
    faculty: faculty.map((f) => ({
      ...toSafeUser(f),
      profile: profileMap.get(f.id),
      assignments: assignMap.get(f.id) || []
    }))
  });
}));
router20.post(
  "/faculty",
  [(0, import_express_validator16.body)("name").trim().notEmpty().withMessage("Name is required"), (0, import_express_validator16.body)("email").isEmail().withMessage("Valid email required")],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password = "faculty1234", designation } = req.body;
    if (await prisma.user.findUnique({ where: { email: email.toLowerCase() } })) throw ApiError.conflict("User with this email already exists");
    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.toLowerCase(), password: await hashPassword(password), role: "faculty", designation: designation || "", college: req.user.college, approved: true }
    });
    res.status(201).json({ user: toSafeUser(user) });
  })
);
router20.patch("/faculty/:id", asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound("Faculty not found");
  if (user.college !== req.user.college) throw ApiError.forbidden("Access denied");
  const data = {};
  if (req.body.designation !== void 0) data.designation = req.body.designation;
  if (req.body.name !== void 0) data.name = req.body.name;
  if (req.body.active !== void 0) data.active = req.body.active;
  const updated = await prisma.user.update({ where: { id: user.id }, data });
  res.json({ user: toSafeUser(updated) });
}));
router20.delete("/faculty/:id", asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound("Faculty not found");
  if (user.college !== req.user.college) throw ApiError.forbidden("Access denied");
  await prisma.user.deleteMany({ where: { id: req.params.id } });
  res.json({ message: "Faculty deleted" });
}));
router20.get("/departments", asyncHandler(async (req, res) => {
  const departments = await prisma.department.findMany({ where: { college: req.user.college } });
  const headIds = [...new Set(departments.map((d) => d.head).filter(Boolean))];
  if (headIds.length) {
    const heads = await prisma.user.findMany({ where: { id: { in: headIds } }, select: { id: true, name: true } });
    const map = new Map(heads.map((h) => [h.id, { _id: h.id, name: h.name }]));
    for (const d of departments) {
      if (map.has(d.head)) d.head = map.get(d.head);
    }
  }
  res.json({ departments });
}));
router20.post("/departments", asyncHandler(async (req, res) => {
  const { name, code, head } = req.body;
  const dep = await prisma.department.create({ data: { college: req.user.college, name, code, head } });
  res.status(201).json({ department: dep });
}));
router20.patch("/departments/:id", asyncHandler(async (req, res) => {
  const dep = await prisma.department.findUnique({ where: { id: req.params.id } });
  if (!dep) throw ApiError.notFound("Department not found");
  if (dep.college !== req.user.college) throw ApiError.forbidden("Access denied");
  const data = {};
  if (req.body.name !== void 0) data.name = req.body.name;
  if (req.body.head !== void 0) data.head = req.body.head;
  const updated = await prisma.department.update({ where: { id: dep.id }, data });
  res.json({ department: updated });
}));
router20.delete("/departments/:id", asyncHandler(async (req, res) => {
  const dep = await prisma.department.findUnique({ where: { id: req.params.id } });
  if (!dep) throw ApiError.notFound("Department not found");
  if (dep.college !== req.user.college) throw ApiError.forbidden("Access denied");
  await prisma.department.deleteMany({ where: { id: req.params.id } });
  res.json({ message: "Department deleted" });
}));
router20.get("/subjects", asyncHandler(async (req, res) => {
  const subjects = await prisma.subject.findMany({ where: { college: req.user.college } });
  const facIds = [...new Set(subjects.map((s) => s.faculty).filter(Boolean))];
  if (facIds.length) {
    const users = await prisma.user.findMany({ where: { id: { in: facIds } }, select: { id: true, name: true } });
    const map = new Map(users.map((u) => [u.id, { _id: u.id, name: u.name }]));
    for (const s of subjects) {
      if (map.has(s.faculty)) s.faculty = map.get(s.faculty);
    }
  }
  res.json({ subjects });
}));
router20.post("/subjects", asyncHandler(async (req, res) => {
  const { name, code, semester, faculty, department, credits } = req.body;
  const subject = await prisma.subject.create({ data: { college: req.user.college, name, code, semester: Number(semester) || 1, faculty, department, credits } });
  res.status(201).json({ subject });
}));
router20.patch("/subjects/:id", asyncHandler(async (req, res) => {
  const subject = await prisma.subject.findUnique({ where: { id: req.params.id } });
  if (!subject) throw ApiError.notFound("Subject not found");
  if (subject.college !== req.user.college) throw ApiError.forbidden("Access denied");
  const allowed = ["name", "code", "semester", "faculty", "department", "credits"];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== void 0) data[k] = req.body[k];
  });
  const updated = await prisma.subject.update({ where: { id: subject.id }, data });
  res.json({ subject: updated });
}));
router20.delete("/subjects/:id", asyncHandler(async (req, res) => {
  const subject = await prisma.subject.findUnique({ where: { id: req.params.id } });
  if (!subject) throw ApiError.notFound("Subject not found");
  if (subject.college !== req.user.college) throw ApiError.forbidden("Access denied");
  await prisma.subject.deleteMany({ where: { id: req.params.id } });
  res.json({ message: "Subject deleted" });
}));
router20.get("/colleges", asyncHandler(async (req, res) => {
  const colleges = await prisma.college.findMany({ orderBy: { name: "asc" } });
  res.json({ colleges });
}));
router20.post("/colleges", asyncHandler(async (req, res) => {
  const { name, code, city, state, website, contactEmail, contactPhone } = req.body;
  const college = await prisma.college.create({ data: { name, code, city, state, website, contactEmail, contactPhone } });
  res.status(201).json({ college });
}));
router20.get("/pending-opportunities", asyncHandler(async (req, res) => {
  const opportunities = await prisma.opportunity.findMany({
    where: { college: req.user.college, status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  res.json({ opportunities });
}));
router20.get("/pending-users", asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { college: req.user.college, approved: false, role: { in: ["faculty", "admin"] } },
    orderBy: { createdAt: "desc" }
  });
  const userIds = users.map((u) => u.id);
  const profiles = await prisma.facultyProfile.findMany({ where: { user: { in: userIds } } });
  const profileMap = new Map(profiles.map((p) => [p.user, p]));
  res.json({ users: users.map((u) => ({ ...toSafeUser(u), facultyProfile: profileMap.get(u.id) })) });
}));
router20.post("/approve-user/:id", asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound("User not found");
  if (user.college !== req.user.college) throw ApiError.forbidden("Access denied");
  const updated = await prisma.user.update({ where: { id: user.id }, data: { approved: true } });
  await createNotification(user.id, {
    category: "system",
    title: "Account Approved! \u{1F389}",
    message: "Your account has been approved. You can now access all features.",
    link: "/dashboard",
    icon: "check-circle",
    priority: "high"
  });
  res.json({ user: toSafeUser(updated) });
}));
router20.post("/reject-user/:id", asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound("User not found");
  if (user.college !== req.user.college) throw ApiError.forbidden("Access denied");
  await prisma.user.delete({ where: { id: user.id } });
  res.json({ message: "User rejected and removed" });
}));
router20.post("/broadcast", asyncHandler(async (req, res) => {
  const { title, message, category = "college", link = "" } = req.body;
  if (!title || !message) throw ApiError.badRequest("title and message are required");
  const students = await prisma.user.findMany({ where: { role: "student", college: req.user.college }, select: { id: true } });
  await Promise.all(students.map((s) => createNotification(s.id, { category, title, message, link, icon: "megaphone", priority: "high" })));
  res.json({ message: `Broadcast sent to ${students.length} students` });
}));
var admin_default = router20;

// server/src/routes/faculty.js
var import_express21 = require("express");
var import_express_validator17 = require("express-validator");
init_prisma();
var router21 = (0, import_express21.Router)();
router21.use(auth, requireFaculty);
router21.get("/dashboard", asyncHandler(async (req, res) => {
  const facultyId = req.user.id;
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayIndex = today.getDay();
  const [subjects, assignments, notices, events, todaySessions, recentSessions] = await Promise.all([
    prisma.subject.findMany({ where: { college: req.user.college, faculty: facultyId }, orderBy: { name: "asc" } }),
    prisma.assignment.findMany({ where: { college: req.user.college, faculty: facultyId }, orderBy: { dueDate: "asc" } }),
    prisma.notice.findMany({ where: { college: req.user.college, createdBy: facultyId }, orderBy: { date: "desc" }, take: 10 }),
    prisma.event.findMany({ where: { college: req.user.college }, orderBy: { date: "asc" }, take: 10 }),
    prisma.attendanceSession.findMany({ where: { faculty: facultyId, date: { gte: today, lt: tomorrow } }, orderBy: { startTime: "asc" } }),
    prisma.attendanceSession.findMany({ where: { faculty: facultyId }, orderBy: { date: "desc" }, take: 5 })
  ]);
  const subjectIds = subjects.map((s) => s.id);
  const timetableSlots = subjectIds.length ? await prisma.timetableSlot.findMany({ where: { college: req.user.college, subject: { in: subjectIds }, day: dayIndex }, orderBy: { startTime: "asc" } }).catch(() => []) : [];
  const studentCount = await prisma.user.count({ where: { college: req.user.college, role: "student" } });
  const pendingSessions = await prisma.attendanceSession.count({
    where: { faculty: facultyId, status: "draft" }
  });
  res.json({
    stats: {
      classes: subjects.length,
      assignments: assignments.length,
      notices: notices.length,
      students: studentCount,
      todaySessions: todaySessions.length,
      pendingSessions
    },
    subjects,
    assignments,
    notices,
    events,
    todaySchedule: timetableSlots,
    todaySessions,
    recentSessions
  });
}));
router21.get("/classes", asyncHandler(async (req, res) => {
  const subjects = await prisma.subject.findMany({ where: { college: req.user.college, faculty: req.user.id }, orderBy: { name: "asc" } });
  res.json({ subjects });
}));
router21.post(
  "/announcements",
  [(0, import_express_validator17.body)("title").trim().notEmpty().withMessage("Title is required"), (0, import_express_validator17.body)("content").trim().notEmpty().withMessage("Content is required")],
  validate,
  asyncHandler(async (req, res) => {
    const { title, content, category = "general", important = false } = req.body;
    const notice = await prisma.notice.create({
      data: {
        college: req.user.college,
        title: title.trim(),
        content: content.trim(),
        category,
        important: important === true || important === "true",
        createdBy: req.user.id
      }
    });
    const students = await prisma.user.findMany({ where: { college: req.user.college, role: "student" }, select: { id: true } });
    await Promise.all(students.map((s) => createNotification(s.id, { category: "college", title: notice.title, message: "New announcement from faculty", link: "/college", icon: "megaphone", priority: notice.important ? "high" : "medium" })));
    res.status(201).json({ notice });
  })
);
router21.post(
  "/resources",
  [(0, import_express_validator17.body)("title").trim().notEmpty().withMessage("Title is required")],
  validate,
  asyncHandler(async (req, res) => {
    const { title, description, subjectName, semester, url, type } = req.body;
    const resource = await prisma.resource.create({
      data: {
        college: req.user.college,
        title: title.trim(),
        description: description || "",
        subjectName: subjectName || "",
        semester: Number(semester) || 1,
        url: url || "",
        type: type || "link",
        faculty: req.user.id
      }
    });
    res.status(201).json({ resource });
  })
);
router21.get("/resources", asyncHandler(async (req, res) => {
  let resources = await prisma.resource.findMany({ where: { college: req.user.college }, orderBy: { createdAt: "desc" } });
  const facIds = [...new Set(resources.map((r) => r.faculty).filter(Boolean))];
  if (facIds.length) {
    const users = await prisma.user.findMany({ where: { id: { in: facIds } }, select: { id: true, name: true } });
    const map = new Map(users.map((u) => [u.id, { _id: u.id, name: u.name }]));
    for (const r of resources) {
      if (map.has(r.faculty)) r.faculty = map.get(r.faculty);
    }
  }
  res.json({ resources });
}));
router21.delete("/resources/:id", asyncHandler(async (req, res) => {
  const resource = await prisma.resource.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!resource) throw ApiError.notFound("Resource not found");
  if (resource.faculty !== req.user.id && req.user.role !== "admin") {
    throw ApiError.forbidden("You can only delete your own resources");
  }
  await prisma.resource.delete({ where: { id: resource.id } });
  res.json({ message: "Resource deleted" });
}));
router21.get("/students", asyncHandler(async (req, res) => {
  const { semester } = req.query;
  const subjects = await prisma.subject.findMany({ where: { college: req.user.college, faculty: req.user.id } });
  const semesters = [...new Set(subjects.map((s) => s.semester))];
  let students = await prisma.user.findMany({
    where: { college: req.user.college, role: "student" },
    select: { id: true, name: true, email: true, phone: true, avatar: true, createdAt: true },
    orderBy: { name: "asc" }
  });
  const studentIds = students.map((s) => s.id);
  const profiles = await prisma.studentProfile.findMany({ where: { user: { in: studentIds } } });
  const profileMap = new Map(profiles.map((p) => [p.user, p]));
  let filteredStudents = students;
  if (semester) {
    filteredStudents = students.filter((s) => {
      const profile = profileMap.get(s.id);
      return profile && profile.semester === Number(semester);
    });
  } else {
    filteredStudents = students.filter((s) => {
      const profile = profileMap.get(s.id);
      return profile && semesters.includes(profile.semester);
    });
  }
  for (const s of filteredStudents) {
    s.profile = profileMap.get(s.id) || null;
  }
  const studentIdsFiltered = filteredStudents.map((s) => s.id);
  const attendanceRecords = await prisma.attendance.findMany({
    where: { student: { in: studentIdsFiltered }, subjectName: { in: subjects.map((s) => s.name) } }
  });
  const attendanceMap = {};
  for (const r of attendanceRecords) {
    if (!attendanceMap[r.student]) attendanceMap[r.student] = { total: 0, present: 0 };
    attendanceMap[r.student].total++;
    if (r.status === "present") attendanceMap[r.student].present++;
  }
  for (const s of filteredStudents) {
    const att = attendanceMap[s.id];
    s.attendance = att ? { total: att.total, present: att.present, percentage: att.total ? Math.round(att.present / att.total * 100) : 0 } : { total: 0, present: 0, percentage: 0 };
  }
  const grouped = {};
  for (const s of filteredStudents) {
    const sem = s.profile?.semester || 1;
    if (!grouped[sem]) grouped[sem] = [];
    grouped[sem].push(s);
  }
  res.json({
    students: filteredStudents,
    grouped,
    semesters,
    subjects,
    total: filteredStudents.length
  });
}));
router21.patch("/assignments/:id/grade", asyncHandler(async (req, res) => {
  const { studentId, marks, feedback } = req.body;
  if (!studentId) throw ApiError.badRequest("studentId is required");
  const assignment = await prisma.assignment.findFirst({ where: { id: req.params.id, college: req.user.college, faculty: req.user.id } });
  if (!assignment) throw ApiError.notFound("Assignment not found");
  const submissions = assignment.submissions || [];
  const idx = submissions.findIndex((s) => String(s.student) === String(studentId));
  if (idx === -1) throw ApiError.notFound("No submission found for this student");
  submissions[idx] = {
    ...submissions[idx],
    status: "graded",
    marks: Number(marks) || 0,
    feedback: feedback || "",
    gradedAt: /* @__PURE__ */ new Date(),
    gradedBy: req.user.id
  };
  await prisma.assignment.update({ where: { id: assignment.id }, data: { submissions } });
  await createNotification(studentId, {
    category: "academic",
    title: `Assignment graded: ${assignment.title}`,
    message: `You received ${marks}/${assignment.maxMarks} marks`,
    link: "/assignments",
    icon: "clipboard",
    priority: "medium"
  });
  res.json({ assignment: { ...assignment, submissions } });
}));
router21.get("/me/profile", asyncHandler(async (req, res) => {
  let profile = await prisma.facultyProfile.findFirst({ where: { user: req.user.id } });
  if (!profile) {
    profile = await prisma.facultyProfile.create({ data: { user: req.user.id, college: req.user.college } });
  }
  res.json(profile);
}));
router21.patch("/me/profile", asyncHandler(async (req, res) => {
  const existing = await prisma.facultyProfile.findFirst({ where: { user: req.user.id } });
  const allowed = ["employeeId", "department", "designation", "subjects", "classes", "bio"];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== void 0) data[k] = req.body[k];
  });
  if (existing) {
    const profile = await prisma.facultyProfile.update({ where: { id: existing.id }, data });
    res.json(profile);
  } else {
    const profile = await prisma.facultyProfile.create({ data: { user: req.user.id, college: req.user.college, ...data } });
    res.json(profile);
  }
}));
var faculty_default = router21;

// server/src/routes/faculty-attendance.js
var import_express22 = require("express");
var import_express_validator18 = require("express-validator");
init_prisma();
var import_crypto2 = __toESM(require("crypto"), 1);
var router22 = (0, import_express22.Router)();
router22.use(auth, requireFaculty);
router22.get("/courses", asyncHandler(async (req, res) => {
  const facultyId = req.user.id;
  const assignments = await prisma.facultyAssignment.findMany({
    where: { faculty: facultyId, active: true }
  });
  const courseIds = [...new Set(assignments.map((a) => a.course))];
  const sectionIds = [...new Set(assignments.map((a) => a.section).filter(Boolean))];
  const subjectIds = [...new Set(assignments.map((a) => a.subject).filter(Boolean))];
  const [courses, sections, subjects] = await Promise.all([
    prisma.course.findMany({ where: { id: { in: courseIds } } }),
    sectionIds.length ? prisma.section.findMany({ where: { id: { in: sectionIds } } }) : [],
    subjectIds.length ? prisma.subject.findMany({ where: { id: { in: subjectIds } } }) : []
  ]);
  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const sectionMap = new Map(sections.map((s) => [s.id, s]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const enriched = assignments.map((a) => ({
    ...a,
    courseDetails: courseMap.get(a.course) || null,
    sectionDetails: sectionMap.get(a.section) || null,
    subjectDetails: subjectMap.get(a.subject) || null
  }));
  res.json({ assignments: enriched, courses, sections, subjects });
}));
router22.get("/today", asyncHandler(async (req, res) => {
  const facultyId = req.user.id;
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const assignments = await prisma.facultyAssignment.findMany({
    where: { faculty: facultyId, active: true }
  });
  const courseIds = [...new Set(assignments.map((a) => a.course))];
  const sectionIds = [...new Set(assignments.map((a) => a.section).filter(Boolean))];
  const subjectIds = [...new Set(assignments.map((a) => a.subject).filter(Boolean))];
  const [courses, sections, subjects] = await Promise.all([
    prisma.course.findMany({ where: { id: { in: courseIds } } }),
    sectionIds.length ? prisma.section.findMany({ where: { id: { in: sectionIds } } }) : [],
    subjectIds.length ? prisma.subject.findMany({ where: { id: { in: subjectIds } } }) : []
  ]);
  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const sectionMap = new Map(sections.map((s) => [s.id, s]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const subjectList = assignments.map((a) => ({
    id: a.subject,
    name: subjectMap.get(a.subject)?.name || "Unknown Subject",
    code: subjectMap.get(a.subject)?.code || "",
    color: subjectMap.get(a.subject)?.color || "#6366f1",
    semester: a.semester,
    course: a.course,
    courseName: courseMap.get(a.course)?.name || "",
    section: a.section,
    sectionName: sectionMap.get(a.section)?.name || "",
    assignmentId: a.id
  }));
  const todaySessions = await prisma.attendanceSession.findMany({
    where: {
      faculty: facultyId,
      date: { gte: today, lt: tomorrow }
    },
    orderBy: { startTime: "asc" }
  });
  const sessionSubjectIds = new Set(todaySessions.map((s) => s.subject));
  const pendingSubjects = subjectList.filter((s) => !sessionSubjectIds.has(s.id));
  res.json({
    subjects: subjectList,
    todaySessions,
    pendingSubjects,
    totalSubjects: subjectList.length,
    completedSessions: todaySessions.length,
    pendingSessions: pendingSubjects.length
  });
}));
router22.post(
  "/session",
  [
    (0, import_express_validator18.body)("subjectId").trim().notEmpty().withMessage("Subject is required"),
    (0, import_express_validator18.body)("date").isISO8601().withMessage("Valid date required")
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { subjectId, date, startTime, endTime, notes, courseId, sectionId } = req.body;
    const facultyId = req.user.id;
    const assignment = await prisma.facultyAssignment.findFirst({
      where: {
        faculty: facultyId,
        subject: subjectId,
        active: true
      }
    });
    if (!assignment) throw ApiError.notFound("Subject not found or not assigned to you");
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    const course = courseId || assignment.course;
    const section = sectionId || assignment.section;
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    const existing = await prisma.attendanceSession.findFirst({
      where: {
        faculty: facultyId,
        subject: subjectId,
        date: dateObj
      }
    });
    if (existing) {
      throw ApiError.conflict("Attendance session already exists for this subject on this date");
    }
    const session = await prisma.attendanceSession.create({
      data: {
        id: import_crypto2.default.randomBytes(10).toString("base64url").slice(0, 20),
        faculty: facultyId,
        subject: subjectId,
        subjectName: subject?.name || "Unknown",
        course: course || null,
        section: section || null,
        semester: assignment.semester,
        date: dateObj,
        startTime: startTime || "",
        endTime: endTime || "",
        notes: notes || "",
        status: "draft"
      }
    });
    res.status(201).json({ session });
  })
);
router22.get("/session/:id/students", asyncHandler(async (req, res) => {
  const session = await prisma.attendanceSession.findFirst({
    where: { id: req.params.id, faculty: req.user.id }
  });
  if (!session) throw ApiError.notFound("Session not found");
  let students = [];
  if (session.course) {
    const enrollWhere = {
      course: session.course,
      status: "active"
    };
    if (session.section) {
      enrollWhere.section = session.section;
    }
    if (session.semester) {
      enrollWhere.semester = session.semester;
    }
    const enrollments = await prisma.enrollment.findMany({
      where: enrollWhere
    });
    const studentIds = enrollments.map((e) => e.student);
    if (studentIds.length > 0) {
      students = await prisma.user.findMany({
        where: { id: { in: studentIds }, role: "student", active: true },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true
        },
        orderBy: { name: "asc" }
      });
      const enrollmentMap = new Map(enrollments.map((e) => [e.student, e]));
      for (const s of students) {
        s.enrollment = enrollmentMap.get(s.id) || null;
      }
    }
  }
  const existingRecords = await prisma.attendance.findMany({
    where: { sessionId: session.id }
  });
  const recordMap = new Map(existingRecords.map((r) => [r.student, r]));
  for (const s of students) {
    const record = recordMap.get(s.id);
    s.attendanceStatus = record ? record.status : null;
    s.attendanceRecordId = record ? record.id : null;
  }
  res.json({
    session,
    students,
    total: students.length,
    marked: existingRecords.length,
    pending: students.length - existingRecords.length
  });
}));
router22.post(
  "/session/:id/mark",
  [
    (0, import_express_validator18.body)("records").isArray().withMessage("Records array required"),
    (0, import_express_validator18.body)("records.*.studentId").trim().notEmpty().withMessage("Student ID required"),
    (0, import_express_validator18.body)("records.*.status").isIn(["present", "absent", "late", "holiday"]).withMessage("Invalid status")
  ],
  validate,
  asyncHandler(async (req, res) => {
    const session = await prisma.attendanceSession.findFirst({
      where: { id: req.params.id, faculty: req.user.id }
    });
    if (!session) throw ApiError.notFound("Session not found");
    if (session.status === "finalized") {
      throw ApiError.badRequest("Cannot modify finalized attendance");
    }
    const { records } = req.body;
    const results = [];
    for (const record of records) {
      const { studentId, status, notes } = record;
      const existing = await prisma.attendance.findFirst({
        where: {
          student: studentId,
          subject: session.subject,
          date: session.date
        }
      });
      if (existing) {
        const updated = await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status,
            markedBy: req.user.id,
            sessionId: session.id,
            notes: notes || ""
          }
        });
        results.push(updated);
      } else {
        const created = await prisma.attendance.create({
          data: {
            id: import_crypto2.default.randomBytes(8).toString("base64url").slice(0, 15),
            student: studentId,
            subject: session.subject,
            subjectName: session.subjectName,
            date: session.date,
            status,
            markedBy: req.user.id,
            sessionId: session.id,
            course: session.course,
            section: session.section,
            semester: session.semester,
            notes: notes || ""
          }
        });
        results.push(created);
      }
    }
    await prisma.attendanceSession.update({
      where: { id: session.id },
      data: { status: "submitted" }
    });
    res.json({
      message: `Attendance marked for ${results.length} students`,
      records: results
    });
  })
);
router22.post("/session/:id/mark-all", asyncHandler(async (req, res) => {
  const session = await prisma.attendanceSession.findFirst({
    where: { id: req.params.id, faculty: req.user.id }
  });
  if (!session) throw ApiError.notFound("Session not found");
  if (session.status === "finalized") {
    throw ApiError.badRequest("Cannot modify finalized attendance");
  }
  let studentIds = [];
  if (session.course) {
    const enrollWhere = { course: session.course, status: "active" };
    if (session.section) enrollWhere.section = session.section;
    if (session.semester) enrollWhere.semester = session.semester;
    const enrollments = await prisma.enrollment.findMany({ where: enrollWhere });
    studentIds = enrollments.map((e) => e.student);
  }
  const results = [];
  for (const studentId of studentIds) {
    const existing = await prisma.attendance.findFirst({
      where: {
        student: studentId,
        subject: session.subject,
        date: session.date
      }
    });
    if (existing) {
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: { status: "present", markedBy: req.user.id, sessionId: session.id }
      });
      results.push(updated);
    } else {
      const created = await prisma.attendance.create({
        data: {
          id: import_crypto2.default.randomBytes(8).toString("base64url").slice(0, 15),
          student: studentId,
          subject: session.subject,
          subjectName: session.subjectName,
          date: session.date,
          status: "present",
          markedBy: req.user.id,
          sessionId: session.id,
          course: session.course,
          section: session.section,
          semester: session.semester
        }
      });
      results.push(created);
    }
  }
  await prisma.attendanceSession.update({
    where: { id: session.id },
    data: { status: "submitted" }
  });
  res.json({
    message: `All ${results.length} students marked present`,
    records: results
  });
}));
router22.post("/session/:id/finalize", asyncHandler(async (req, res) => {
  const session = await prisma.attendanceSession.findFirst({
    where: { id: req.params.id, faculty: req.user.id }
  });
  if (!session) throw ApiError.notFound("Session not found");
  const updated = await prisma.attendanceSession.update({
    where: { id: session.id },
    data: { status: "finalized" }
  });
  res.json({ session: updated, message: "Attendance finalized" });
}));
router22.get("/history", asyncHandler(async (req, res) => {
  const { subjectId, startDate, endDate, page = 1, limit = 20 } = req.query;
  const facultyId = req.user.id;
  const where = { faculty: facultyId };
  if (subjectId) where.subject = subjectId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  const total = await prisma.attendanceSession.count({ where });
  const sessions = await prisma.attendanceSession.findMany({
    where,
    orderBy: { date: "desc" },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit)
  });
  const sessionsWithStats = await Promise.all(
    sessions.map(async (session) => {
      const records = await prisma.attendance.findMany({
        where: { sessionId: session.id }
      });
      const present = records.filter((r) => r.status === "present").length;
      const absent = records.filter((r) => r.status === "absent").length;
      const late = records.filter((r) => r.status === "late").length;
      const total2 = records.length;
      return {
        ...session,
        stats: {
          total: total2,
          present,
          absent,
          late,
          percentage: total2 ? Math.round(present / total2 * 100) : 0
        }
      };
    })
  );
  res.json({
    sessions: sessionsWithStats,
    total,
    page: Number(page)
  });
}));
router22.patch(
  "/record/:id",
  [
    (0, import_express_validator18.body)("status").isIn(["present", "absent", "late", "holiday"]).withMessage("Invalid status")
  ],
  validate,
  asyncHandler(async (req, res) => {
    const record = await prisma.attendance.findUnique({
      where: { id: req.params.id }
    });
    if (!record) throw ApiError.notFound("Attendance record not found");
    if (record.sessionId) {
      const session = await prisma.attendanceSession.findFirst({
        where: { id: record.sessionId, faculty: req.user.id }
      });
      if (!session) throw ApiError.forbidden("You can only correct your own attendance records");
    }
    const { status, notes } = req.body;
    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        status,
        notes: notes || record.notes,
        markedBy: req.user.id
      }
    });
    res.json({ record: updated });
  })
);
router22.get("/report", asyncHandler(async (req, res) => {
  const { subjectId, startDate, endDate } = req.query;
  const facultyId = req.user.id;
  if (!subjectId) throw ApiError.badRequest("subjectId is required");
  const assignment = await prisma.facultyAssignment.findFirst({
    where: { faculty: facultyId, subject: subjectId, active: true }
  });
  if (!assignment) throw ApiError.notFound("Subject not found or not assigned to you");
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  const where = { subject: subjectId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  const records = await prisma.attendance.findMany({
    where,
    orderBy: { date: "asc" }
  });
  const studentMap = {};
  for (const record of records) {
    if (!studentMap[record.student]) {
      studentMap[record.student] = {
        student: record.student,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        holiday: 0
      };
    }
    studentMap[record.student].total++;
    if (record.status === "present") studentMap[record.student].present++;
    else if (record.status === "absent") studentMap[record.student].absent++;
    else if (record.status === "late") studentMap[record.student].late++;
    else if (record.status === "holiday") studentMap[record.student].holiday++;
  }
  const studentIds = Object.keys(studentMap);
  const users = studentIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, name: true, email: true }
  }) : [];
  const userMap = new Map(users.map((u) => [u.id, u]));
  const report = studentIds.map((id) => {
    const stats = studentMap[id];
    const user = userMap.get(id);
    return {
      ...stats,
      name: user?.name || "Unknown",
      email: user?.email || "",
      percentage: stats.total ? Math.round(stats.present / stats.total * 100) : 0
    };
  });
  report.sort((a, b) => a.name.localeCompare(b.name));
  const totalClasses = records.length > 0 ? new Set(records.map((r) => r.date.toISOString().slice(0, 10))).size : 0;
  const overallPresent = records.filter((r) => r.status === "present").length;
  const overallTotal = records.length;
  res.json({
    subject: { id: subject.id, name: subject.name, code: subject.code },
    report,
    summary: {
      totalStudents: report.length,
      totalClasses,
      overallPercentage: overallTotal ? Math.round(overallPresent / overallTotal * 100) : 0,
      averageAttendance: report.length ? Math.round(report.reduce((sum, r) => sum + r.percentage, 0) / report.length) : 0,
      lowAttendance: report.filter((r) => r.percentage < 75).length
    }
  });
}));
var faculty_attendance_default = router22;

// server/src/routes/courses.js
var import_express23 = require("express");
var import_express_validator19 = require("express-validator");
init_prisma();
var router23 = (0, import_express23.Router)();
router23.get("/", optionalAuth, asyncHandler(async (req, res) => {
  const collegeId = req.query.collegeId || req.user?.college;
  const where = collegeId ? { college: collegeId, active: true } : { active: true };
  const courses = await prisma.course.findMany({
    where,
    orderBy: { name: "asc" }
  });
  const coursesWithSections = await Promise.all(
    courses.map(async (course) => {
      const sections = await prisma.section.findMany({
        where: { course: course.id },
        orderBy: [{ semester: "asc" }, { name: "asc" }]
      });
      return { ...course, sections };
    })
  );
  res.json({ courses: coursesWithSections });
}));
router23.get("/:id", asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id }
  });
  if (!course) throw ApiError.notFound("Course not found");
  const sections = await prisma.section.findMany({
    where: { course: course.id },
    orderBy: [{ semester: "asc" }, { name: "asc" }]
  });
  const sectionsWithCounts = await Promise.all(
    sections.map(async (section) => {
      const enrollmentCount = await prisma.enrollment.count({
        where: { section: section.id, status: "active" }
      });
      return { ...section, enrollmentCount };
    })
  );
  res.json({ course, sections: sectionsWithCounts });
}));
router23.post(
  "/",
  requireAdmin,
  [
    (0, import_express_validator19.body)("name").trim().notEmpty().withMessage("Course name is required"),
    (0, import_express_validator19.body)("code").trim().notEmpty().withMessage("Course code is required")
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, code, department, duration, totalSemesters, description } = req.body;
    const existing = await prisma.course.findFirst({
      where: { college: req.user.college, code: code.trim() }
    });
    if (existing) throw ApiError.conflict("Course with this code already exists");
    const course = await prisma.course.create({
      data: {
        college: req.user.college,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        department: department || null,
        duration: Number(duration) || 4,
        totalSemesters: Number(totalSemesters) || 8,
        description: description || ""
      }
    });
    res.status(201).json({ course });
  })
);
router23.patch("/:id", requireAdmin, asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) throw ApiError.notFound("Course not found");
  const allowed = ["name", "code", "department", "duration", "totalSemesters", "description", "active"];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== void 0) data[k] = req.body[k];
  });
  const updated = await prisma.course.update({
    where: { id: course.id },
    data
  });
  res.json({ course: updated });
}));
router23.delete("/:id", requireAdmin, asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) throw ApiError.notFound("Course not found");
  const enrollmentCount = await prisma.enrollment.count({
    where: { course: course.id }
  });
  if (enrollmentCount > 0) {
    throw ApiError.badRequest("Cannot delete course with active enrollments. Deactivate it instead.");
  }
  await prisma.course.delete({ where: { id: course.id } });
  res.json({ message: "Course deleted" });
}));
router23.get("/:courseId/sections", asyncHandler(async (req, res) => {
  const sections = await prisma.section.findMany({
    where: { course: req.params.courseId },
    orderBy: [{ semester: "asc" }, { name: "asc" }]
  });
  const sectionsWithCounts = await Promise.all(
    sections.map(async (section) => {
      const enrollmentCount = await prisma.enrollment.count({
        where: { section: section.id, status: "active" }
      });
      return { ...section, enrollmentCount };
    })
  );
  res.json({ sections: sectionsWithCounts });
}));
router23.post(
  "/:courseId/sections",
  requireAdmin,
  [
    (0, import_express_validator19.body)("name").trim().notEmpty().withMessage("Section name is required"),
    (0, import_express_validator19.body)("semester").isInt({ min: 1 }).withMessage("Valid semester required")
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, semester, code, maxStudents } = req.body;
    const courseId = req.params.courseId;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound("Course not found");
    const existing = await prisma.section.findFirst({
      where: { course: courseId, semester: Number(semester), name: name.trim() }
    });
    if (existing) throw ApiError.conflict("Section already exists for this semester");
    const section = await prisma.section.create({
      data: {
        course: courseId,
        name: name.trim(),
        code: code || name.trim().charAt(0).toUpperCase(),
        semester: Number(semester),
        maxStudents: Number(maxStudents) || 60
      }
    });
    res.status(201).json({ section });
  })
);
router23.delete("/sections/:id", requireAdmin, asyncHandler(async (req, res) => {
  const section = await prisma.section.findUnique({ where: { id: req.params.id } });
  if (!section) throw ApiError.notFound("Section not found");
  const enrollmentCount = await prisma.enrollment.count({
    where: { section: section.id, status: "active" }
  });
  if (enrollmentCount > 0) {
    throw ApiError.badRequest("Cannot delete section with active enrollments");
  }
  await prisma.section.delete({ where: { id: section.id } });
  res.json({ message: "Section deleted" });
}));
router23.get("/enrollments/:courseId", asyncHandler(async (req, res) => {
  const { semester, sectionId } = req.query;
  const where = { course: req.params.courseId, status: "active" };
  if (semester) where.semester = Number(semester);
  if (sectionId) where.section = sectionId;
  const enrollments = await prisma.enrollment.findMany({
    where,
    orderBy: [{ semester: "asc" }, { createdAt: "asc" }]
  });
  const studentIds = enrollments.map((e) => e.student);
  const users = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, name: true, email: true, phone: true }
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const sectionIds = [...new Set(enrollments.map((e) => e.section))];
  const sections = await prisma.section.findMany({
    where: { id: { in: sectionIds } }
  });
  const sectionMap = new Map(sections.map((s) => [s.id, s]));
  const enriched = enrollments.map((e) => ({
    ...e,
    studentDetails: userMap.get(e.student) || null,
    sectionDetails: sectionMap.get(e.section) || null
  }));
  res.json({ enrollments: enriched, total: enriched.length });
}));
router23.post(
  "/enroll",
  [
    (0, import_express_validator19.body)("studentId").trim().notEmpty().withMessage("Student ID required"),
    (0, import_express_validator19.body)("courseId").trim().notEmpty().withMessage("Course ID required"),
    (0, import_express_validator19.body)("sectionId").trim().notEmpty().withMessage("Section ID required"),
    (0, import_express_validator19.body)("semester").isInt({ min: 1 }).withMessage("Valid semester required")
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { studentId, courseId, sectionId, semester, year, enrollmentNumber } = req.body;
    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== "student") {
      throw ApiError.notFound("Student not found");
    }
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound("Course not found");
    const section = await prisma.section.findFirst({
      where: { id: sectionId, course: courseId }
    });
    if (!section) throw ApiError.notFound("Section not found for this course");
    const existing = await prisma.enrollment.findFirst({
      where: { student: studentId, course: courseId, semester: Number(semester) }
    });
    if (existing) throw ApiError.conflict("Student already enrolled in this course for this semester");
    const currentCount = await prisma.enrollment.count({
      where: { section: sectionId, status: "active" }
    });
    if (currentCount >= section.maxStudents) {
      throw ApiError.badRequest("Section is full");
    }
    const enrollment = await prisma.enrollment.create({
      data: {
        student: studentId,
        course: courseId,
        section: sectionId,
        semester: Number(semester),
        year: Number(year) || 1,
        enrollmentNumber: enrollmentNumber || "",
        status: "active"
      }
    });
    await prisma.studentProfile.updateMany({
      where: { user: studentId },
      data: {
        course: course.name,
        semester: Number(semester),
        section: section.name,
        enrollment: enrollment.id
      }
    });
    res.status(201).json({ enrollment });
  })
);
router23.post("/bulk-enroll", requireAdmin, asyncHandler(async (req, res) => {
  const { studentIds, courseId, sectionId, semester, year } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw ApiError.badRequest("studentIds array is required");
  }
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw ApiError.notFound("Course not found");
  const section = await prisma.section.findFirst({
    where: { id: sectionId, course: courseId }
  });
  if (!section) throw ApiError.notFound("Section not found");
  const results = { enrolled: 0, skipped: 0, errors: [] };
  for (const studentId of studentIds) {
    try {
      const existing = await prisma.enrollment.findFirst({
        where: { student: studentId, course: courseId, semester: Number(semester) }
      });
      if (existing) {
        results.skipped++;
        continue;
      }
      await prisma.enrollment.create({
        data: {
          student: studentId,
          course: courseId,
          section: sectionId,
          semester: Number(semester),
          year: Number(year) || 1,
          status: "active"
        }
      });
      results.enrolled++;
    } catch (err) {
      results.errors.push({ studentId, error: err.message });
    }
  }
  res.json({ message: `Enrolled ${results.enrolled} students`, ...results });
}));
router23.patch("/enrollment/:id", requireAdmin, asyncHandler(async (req, res) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: req.params.id }
  });
  if (!enrollment) throw ApiError.notFound("Enrollment not found");
  const allowed = ["section", "status", "year", "enrollmentNumber"];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== void 0) data[k] = req.body[k];
  });
  const updated = await prisma.enrollment.update({
    where: { id: enrollment.id },
    data
  });
  res.json({ enrollment: updated });
}));
var courses_default = router23;

// server/src/routes/faculty-assignment.js
var import_express24 = require("express");
init_prisma();
var import_crypto3 = __toESM(require("crypto"), 1);
var router24 = (0, import_express24.Router)();
router24.get("/", auth, asyncHandler(async (req, res) => {
  const where = {};
  if (req.user.role === "admin") {
    where.college = req.user.college;
  } else if (req.user.role === "faculty") {
    where.faculty = req.user.id;
  } else {
    throw ApiError.forbidden("Not authorized");
  }
  const assignments = await prisma.facultyAssignment.findMany({
    where,
    orderBy: [{ semester: "asc" }, { createdAt: "desc" }]
  });
  const enriched = await Promise.all(assignments.map(async (a) => {
    const faculty = await prisma.user.findUnique({ where: { id: a.faculty }, select: { id: true, name: true, email: true } });
    const course = await prisma.course.findUnique({ where: { id: a.course }, select: { id: true, name: true, code: true } });
    const section = a.section ? await prisma.section.findUnique({ where: { id: a.section }, select: { id: true, name: true, semester: true } }) : null;
    const subject = a.subject ? await prisma.subject.findUnique({ where: { id: a.subject }, select: { id: true, name: true, code: true } }) : null;
    return { ...a, facultyDetails: faculty, courseDetails: course, sectionDetails: section, subjectDetails: subject };
  }));
  res.json({ assignments: enriched });
}));
router24.post("/", auth, requireAdmin, asyncHandler(async (req, res) => {
  const { facultyId, courseId, sectionId, subjectId, semester, academicYear } = req.body;
  if (!facultyId || !courseId || !semester) {
    throw ApiError.badRequest("facultyId, courseId, and semester are required");
  }
  const facultyUser = await prisma.user.findUnique({ where: { id: facultyId } });
  if (!facultyUser || facultyUser.role !== "faculty") {
    throw ApiError.badRequest("Invalid faculty ID");
  }
  if (facultyUser.college !== req.user.college) {
    throw ApiError.forbidden("Faculty not in your college");
  }
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.college !== req.user.college) {
    throw ApiError.badRequest("Invalid course");
  }
  const existing = await prisma.facultyAssignment.findFirst({
    where: {
      faculty: facultyId,
      course: courseId,
      section: sectionId || null,
      semester: parseInt(semester),
      academicYear: academicYear || "2025-2026"
    }
  });
  if (existing) {
    throw ApiError.conflict("Faculty already assigned to this course/section");
  }
  const assignment = await prisma.facultyAssignment.create({
    data: {
      id: import_crypto3.default.randomBytes(10).toString("base64url").slice(0, 25),
      faculty: facultyId,
      course: courseId,
      section: sectionId || null,
      subject: subjectId || null,
      semester: parseInt(semester),
      academicYear: academicYear || "2025-2026",
      college: req.user.college
    }
  });
  res.status(201).json({ assignment });
}));
router24.delete("/:id", auth, requireAdmin, asyncHandler(async (req, res) => {
  const assignment = await prisma.facultyAssignment.findUnique({ where: { id: req.params.id } });
  if (!assignment) throw ApiError.notFound("Assignment not found");
  if (assignment.college !== req.user.college) throw ApiError.forbidden("Not your college");
  await prisma.facultyAssignment.delete({ where: { id: req.params.id } });
  res.json({ message: "Assignment removed" });
}));
router24.get("/my-courses", auth, requireFaculty, asyncHandler(async (req, res) => {
  const assignments = await prisma.facultyAssignment.findMany({
    where: { faculty: req.user.id, active: true },
    orderBy: [{ semester: "asc" }]
  });
  const courses = await Promise.all(assignments.map(async (a) => {
    const course = await prisma.course.findUnique({ where: { id: a.course } });
    const section = a.section ? await prisma.section.findUnique({ where: { id: a.section } }) : null;
    const where = { course: a.course, status: "active" };
    if (a.section) where.section = a.section;
    const studentCount = await prisma.enrollment.count({ where });
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        /* will resolve manually */
      }
    });
    const students = await Promise.all(enrollments.map(async (e) => {
      const user = await prisma.user.findUnique({ where: { id: e.student }, select: { id: true, name: true, email: true } });
      return { ...e, studentDetails: user };
    }));
    return {
      assignmentId: a.id,
      course,
      section,
      semester: a.semester,
      academicYear: a.academicYear,
      studentCount,
      students
    };
  }));
  res.json({ courses });
}));
router24.get("/my-faculty", auth, requireStudent, asyncHandler(async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { student: req.user.id, status: "active" }
  });
  const facultyList = [];
  for (const e of enrollments) {
    const assignments = await prisma.facultyAssignment.findMany({
      where: {
        course: e.course,
        semester: e.semester,
        active: true,
        OR: [
          { section: e.section },
          { section: null }
          // null means all sections
        ]
      }
    });
    for (const a of assignments) {
      const faculty = await prisma.user.findUnique({ where: { id: a.faculty }, select: { id: true, name: true, email: true, designation: true } });
      const course = await prisma.course.findUnique({ where: { id: a.course }, select: { id: true, name: true, code: true } });
      const section = a.section ? await prisma.section.findUnique({ where: { id: a.section }, select: { id: true, name: true } }) : null;
      const exists = facultyList.find((f) => f.facultyId === a.faculty && f.courseId === a.course);
      if (!exists && faculty) {
        facultyList.push({
          facultyId: a.faculty,
          facultyDetails: faculty,
          courseId: a.course,
          courseDetails: course,
          sectionDetails: section,
          semester: a.semester
        });
      }
    }
  }
  res.json({ faculty: facultyList });
}));
router24.get("/faculty-list", auth, requireAdmin, asyncHandler(async (req, res) => {
  const faculty = await prisma.user.findMany({
    where: { role: "faculty", college: req.user.college },
    select: { id: true, name: true, email: true, designation: true },
    orderBy: { name: "asc" }
  });
  res.json({ faculty });
}));
var faculty_assignment_default = router24;

// server/src/routes/support.js
var import_express25 = require("express");
var import_express_validator20 = require("express-validator");
init_prisma();
var router25 = (0, import_express25.Router)();
var HELP_CATEGORIES = [
  { id: "account", label: "Account & Login", icon: "user" },
  { id: "academic", label: "Academic Features", icon: "graduation-cap" },
  { id: "opportunity", label: "Opportunities & Applications", icon: "briefcase" },
  { id: "ai", label: "AI Assistant", icon: "sparkles" },
  { id: "technical", label: "Technical Issues", icon: "bug" },
  { id: "general", label: "General Inquiry", icon: "help-circle" }
];
router25.get("/categories", auth, asyncHandler(async (req, res) => {
  res.json({ categories: HELP_CATEGORIES });
}));
router25.get("/faqs", auth, asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const where = { active: true };
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { question: { contains: search, mode: "insensitive" } },
      { answer: { contains: search, mode: "insensitive" } }
    ];
  }
  const faqs = await prisma.fAQ.findMany({ where, orderBy: { order: "asc" } });
  res.json({ faqs });
}));
router25.post(
  "/tickets",
  auth,
  [
    (0, import_express_validator20.body)("subject").trim().notEmpty().withMessage("Subject is required"),
    (0, import_express_validator20.body)("description").trim().notEmpty().withMessage("Description is required"),
    (0, import_express_validator20.body)("category").trim().notEmpty().withMessage("Category is required")
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { subject, description, category, priority = "medium", attachment = "" } = req.body;
    const ticket = await prisma.supportTicket.create({
      data: {
        user: req.user.id,
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        attachment,
        userRole: req.user.role
      }
    });
    res.status(201).json({ ticket });
  })
);
router25.get("/tickets", auth, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const where = { user: req.user.id };
  if (status) where.status = status;
  const total = await prisma.supportTicket.count({ where });
  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit)
  });
  res.json({ tickets, total, page: Number(page) });
}));
router25.get("/tickets/:id", auth, asyncHandler(async (req, res) => {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
  if (!ticket) throw ApiError.notFound("Ticket not found");
  if (ticket.user !== req.user.id && req.user.role !== "admin") {
    throw ApiError.forbidden("Access denied");
  }
  res.json({ ticket });
}));
router25.get("/admin/tickets", auth, requireAdmin, asyncHandler(async (req, res) => {
  const { status, priority, category, search, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
    ];
  }
  const total = await prisma.supportTicket.count({ where });
  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit)
  });
  const userIds = [...new Set(tickets.map((t) => t.user))];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true, role: true } });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const enriched = tickets.map((t) => ({ ...t, _user: userMap.get(t.user) || null }));
  res.json({ tickets: enriched, total, page: Number(page) });
}));
router25.get("/admin/stats", auth, requireAdmin, asyncHandler(async (req, res) => {
  const [total, open, inProgress, resolved, closed] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: "open" } }),
    prisma.supportTicket.count({ where: { status: "in_progress" } }),
    prisma.supportTicket.count({ where: { status: "resolved" } }),
    prisma.supportTicket.count({ where: { status: "closed" } })
  ]);
  const byPriority = (await prisma.supportTicket.groupBy({ by: ["priority"], _count: { _all: true } })).map((g) => ({ _id: g.priority, count: g._count._all }));
  const byCategory = (await prisma.supportTicket.groupBy({ by: ["category"], _count: { _all: true } })).map((g) => ({ _id: g.category, count: g._count._all }));
  res.json({ total, open, inProgress, resolved, closed, byPriority, byCategory });
}));
router25.patch("/admin/tickets/:id", auth, requireAdmin, asyncHandler(async (req, res) => {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
  if (!ticket) throw ApiError.notFound("Ticket not found");
  const data = {};
  if (req.body.status) data.status = req.body.status;
  if (req.body.assignedTo !== void 0) data.assignedTo = req.body.assignedTo;
  if (req.body.response) {
    data.response = req.body.response;
    data.responseAt = /* @__PURE__ */ new Date();
  }
  const updated = await prisma.supportTicket.update({ where: { id: ticket.id }, data });
  if (data.response || data.status) {
    const statusMsg = data.status ? `Status updated to "${data.status.replace("_", " ")}"` : "has been responded to";
    await createNotification(ticket.user, {
      category: "system",
      title: `Support Ticket ${statusMsg}`,
      message: data.response ? data.response.slice(0, 200) : `Your ticket "${ticket.subject}" ${statusMsg}.`,
      link: `/support/tickets/${ticket.id}`,
      icon: "life-buoy",
      priority: "medium"
    });
  }
  res.json({ ticket: updated });
}));
router25.delete("/admin/tickets/:id", auth, requireAdmin, asyncHandler(async (req, res) => {
  await prisma.supportTicket.deleteMany({ where: { id: req.params.id } });
  res.json({ message: "Ticket deleted" });
}));
router25.post("/admin/faqs", auth, requireAdmin, asyncHandler(async (req, res) => {
  const { question, answer, category = "general", order = 0 } = req.body;
  if (!question || !answer) throw ApiError.badRequest("question and answer are required");
  const faq = await prisma.fAQ.create({ data: { question, answer, category, order } });
  res.status(201).json({ faq });
}));
router25.patch("/admin/faqs/:id", auth, requireAdmin, asyncHandler(async (req, res) => {
  const faq = await prisma.fAQ.findUnique({ where: { id: req.params.id } });
  if (!faq) throw ApiError.notFound("FAQ not found");
  const data = {};
  if (req.body.question !== void 0) data.question = req.body.question;
  if (req.body.answer !== void 0) data.answer = req.body.answer;
  if (req.body.category !== void 0) data.category = req.body.category;
  if (req.body.order !== void 0) data.order = req.body.order;
  if (req.body.active !== void 0) data.active = req.body.active;
  const updated = await prisma.fAQ.update({ where: { id: faq.id }, data });
  res.json({ faq: updated });
}));
router25.delete("/admin/faqs/:id", auth, requireAdmin, asyncHandler(async (req, res) => {
  await prisma.fAQ.deleteMany({ where: { id: req.params.id } });
  res.json({ message: "FAQ deleted" });
}));
var support_default = router25;

// server/src/routes/push.js
var import_express26 = require("express");
var import_web_push = __toESM(require("web-push"), 1);
init_prisma();
init_env();
var router26 = (0, import_express26.Router)();
router26.use(auth);
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  import_web_push.default.setVapidDetails(
    env.VAPID_EMAIL || "mailto:campusconnect.ia@gmail.com",
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}
router26.get("/vapid-public-key", (req, res) => {
  if (!env.VAPID_PUBLIC_KEY) {
    return res.json({ enabled: false });
  }
  res.json({ enabled: true, publicKey: env.VAPID_PUBLIC_KEY });
});
router26.post("/subscribe", asyncHandler(async (req, res) => {
  const { endpoint, p256dh, auth: authKey } = req.body;
  if (!endpoint || !p256dh || !authKey) {
    throw ApiError.badRequest("Missing push subscription fields");
  }
  const existing = await prisma.pushSubscription.findUnique({
    where: { user_endpoint: { user: req.user.id, endpoint } }
  });
  if (existing) {
    await prisma.pushSubscription.update({
      where: { id: existing.id },
      data: { active: true, p256dh, auth: authKey }
    });
  } else {
    await prisma.pushSubscription.create({
      data: {
        user: req.user.id,
        endpoint,
        p256dh,
        auth: authKey,
        userAgent: req.headers["user-agent"] || ""
      }
    });
  }
  res.json({ success: true, message: "Push subscription saved" });
}));
router26.post("/unsubscribe", asyncHandler(async (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) {
    await prisma.pushSubscription.updateMany({
      where: { user: req.user.id, endpoint },
      data: { active: false }
    });
  } else {
    await prisma.pushSubscription.updateMany({
      where: { user: req.user.id },
      data: { active: false }
    });
  }
  res.json({ success: true });
}));
router26.post("/test", asyncHandler(async (req, res) => {
  if (!env.VAPID_PUBLIC_KEY) {
    throw ApiError.badRequest("Push notifications not configured");
  }
  const subs = await prisma.pushSubscription.findMany({
    where: { user: req.user.id, active: true }
  });
  if (subs.length === 0) {
    throw ApiError.badRequest("No active push subscriptions");
  }
  const payload = JSON.stringify({
    title: "\u{1F514} CampusConnect",
    body: "Push notifications are working! You will receive deadline reminders, attendance alerts, and opportunity updates.",
    icon: "/campusconnect-logo.png",
    tag: "test-notification",
    data: { url: "/notifications" }
  });
  let sent = 0;
  let failed = 0;
  for (const sub of subs) {
    try {
      await import_web_push.default.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
    } catch (err) {
      failed++;
      if (err.statusCode === 404 || err.statusCode === 410) {
        await prisma.pushSubscription.update({
          where: { id: sub.id },
          data: { active: false }
        });
      }
    }
  }
  res.json({ sent, failed, message: `Test notification sent to ${sent} device(s)` });
}));
var push_default = router26;

// server/src/app.js
var import_meta4 = {};
var __dirname;
try {
  __dirname = import_path5.default.dirname((0, import_url2.fileURLToPath)(import_meta4.url));
} catch {
  __dirname = "/tmp";
}
var app = (0, import_express27.default)();
var _seededOpportunities = false;
async function ensureRealOpportunities() {
  try {
    const { ensureSampleOpportunities: ensureSampleOpportunities2 } = await Promise.resolve().then(() => (init_seedService(), seedService_exports));
    await ensureSampleOpportunities2();
  } catch (err) {
    console.warn("[app] Failed to ensure sample opportunities:", err?.message);
  }
}
app.set("trust proxy", 1);
app.use((0, import_helmet.default)());
var allowedOrigins = [env.PUBLIC_URL, "http://localhost:5173", "http://localhost:5000"].filter(Boolean);
app.use(
  (0, import_cors.default)({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true
  })
);
app.use(import_express27.default.json({ limit: "2mb" }));
function addIdAliases(value) {
  if (Array.isArray(value)) {
    for (const item of value) addIdAliases(item);
    return value;
  }
  if (value && typeof value === "object") {
    if (typeof value.id === "string" && value._id === void 0) value._id = value.id;
    for (const v of Object.values(value)) addIdAliases(v);
  }
  return value;
}
app.use((req, res, next) => {
  const original = res.json.bind(res);
  res.json = (body20) => original(addIdAliases(body20));
  next();
});
app.use(
  "/api",
  (0, import_express_rate_limit.rateLimit)({
    windowMs: 60 * 1e3,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
  })
);
app.use("/uploads", import_express27.default.static(import_path5.default.resolve(__dirname, "../uploads")));
var routes = {
  "/api/auth": auth_default,
  "/api/users": users_default,
  "/api/students": students_default,
  "/api/colleges": colleges_default,
  "/api/timetable": timetable_default,
  "/api/attendance": attendance_default,
  "/api/assignments": assignments_default,
  "/api/tasks": tasks_default,
  "/api/exams": exams_default,
  "/api/notices": notices_default,
  "/api/events": events_default,
  "/api/clubs": clubs_default,
  "/api/opportunities": opportunities_default,
  "/api/opportunities/sync": opportunitySync_default,
  "/api/applications": applications_default,
  "/api/resumes": resumes_default,
  "/api/ai": ai_default,
  "/api/messages": messages_default,
  "/api/notifications": notifications_default,
  "/api/admin": admin_default,
  "/api/faculty": faculty_default,
  "/api/faculty-attendance": faculty_attendance_default,
  "/api/courses": courses_default,
  "/api/faculty-assignment": faculty_assignment_default,
  "/api/support": support_default,
  "/api/push": push_default
};
for (const [prefix, router27] of Object.entries(routes)) app.use(prefix, router27);
app.use(async (req, res, next) => {
  next();
  if (!_seededOpportunities) {
    _seededOpportunities = true;
    ensureRealOpportunities().catch((err) => {
      console.warn("[app] Background seeding failed:", err?.message);
    });
  }
});
app.get("/api/health", (req, res) => res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() }));
var clientDist = import_path5.default.resolve(__dirname, "../../client/dist");
if (import_fs4.default.existsSync(clientDist)) {
  app.use(import_express27.default.static(clientDist));
  app.get(/^\/(?!api|uploads).*/, (req, res) => {
    res.sendFile(import_path5.default.join(clientDist, "index.html"));
  });
}
app.use("/api", (req, res, next) => next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`)));
app.use((err, req, res, next) => {
  const isMulter = err instanceof import_multer2.default.MulterError || err?.message?.toLowerCase?.().includes("upload");
  if (isMulter) return res.status(400).json({ error: err.message });
  const status = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Something went wrong on the server.";
  console.error("[error]", err?.message || err, err?.stack?.substring(0, 300));
  res.status(status).json({ error: message, details: err.details || void 0 });
});
var app_default = app;
