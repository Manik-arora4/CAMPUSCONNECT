import { askGroq } from './groq.js';
import { askGemini, parseJsonLoose } from './gemini.js';
import * as fb from './fallbacks.js';
import { aiProvider } from '../../config/env.js';

const provider = aiProvider();
export const aiMode = () => provider;

// ── Unified AI caller: tries Groq first, falls back to Gemini ──
async function askAI(systemPrompt, userPrompt, opts = {}) {
  // askGroq internally falls back to askGemini → Ollama → null
  return askGroq(systemPrompt, userPrompt, opts);
}

export const aiService = {
  mode: aiMode(),

  async matchExplanation(profile, opp, match) {
    const { score, breakdown, reasons } = match;
    const userPrompt = `Student: course=${profile.course}, semester=${profile.semester}, skills=${(profile.skills || []).map((s) => s.name + ':' + s.level).join(', ')}, interests=${(profile.interests || []).join(', ')}, careerGoal=${profile.careerGoal}, remotePreference=${profile.remotePreference}\nOpportunity: title=${opp.title}, organization=${opp.organization}, category=${opp.category}, skillsRequired=${(opp.skillsRequired || []).join(', ')}, eligibility=${opp.eligibility}, mode=${opp.mode}, location=${opp.location}, deadline=${opp.deadline?.toISOString?.() || opp.deadline}\nMatch score: ${score}/100. Dimension breakdown: ${JSON.stringify(breakdown)}. Reasons: ${(reasons || []).join('; ')}`;
    const result = await askAI(
      'You are the AI match explainer for CAMPUSCONNECT. Explain in 3-5 short bullet lines why this opportunity matches the student, why the weak dimensions are weak, and whether the deadline is urgent. Use plain text with bullet lines starting with "-". Do not invent facts.',
      userPrompt
    );
    if (result) return result;
    return fb.fallbackMatchExplanation(profile, opp, match);
  },

  async dailyPlan(ctx) {
    const result = await askAI(
      'You are the AI daily planner for CAMPUSCONNECT. Build a realistic time-blocked daily plan (array of {time:"HH:MM", title, type} where type is class|task|break|study|career|free) plus a one-sentence summary. Include meals, breaks, and free time. Respond ONLY with JSON: {"items":[...],"summary":"..."}',
      `Date: ${ctx.date}\nToday's timetable: ${JSON.stringify(ctx.timetable)}\nPending tasks: ${JSON.stringify(ctx.tasks)}\nDeadlines: ${JSON.stringify(ctx.deadlines)}\nTop opportunity: ${JSON.stringify(ctx.topOpportunity)}\nAttendance warning: ${ctx.attendanceWarning}`,
      { json: true, temperature: 0.6 }
    );
    if (result) {
      const parsed = parseJsonLoose(result);
      if (parsed && Array.isArray(parsed.items)) {
        return { items: parsed.items, summary: parsed.summary || 'Your AI daily plan.', fromAI: true };
      }
    }
    return { ...fb.fallbackDailyPlan(ctx), fromAI: false };
  },

  async chat(message, ctx, history = []) {
    // Build a rich, structured context string from the student's real data
    const contextParts = [];
    if (ctx.student) contextParts.push(`Student: ${ctx.student.name || 'Unknown'}, Course: ${ctx.student.course || 'N/A'}, Semester: ${ctx.student.semester || 'N/A'}`);
    if (ctx.timetable?.length) {
      const todaySlots = ctx.timetable.filter((s) => {
        const today = new Date().getDay();
        return s.day === today;
      });
      if (todaySlots.length) contextParts.push(`Today's classes: ${todaySlots.map((s) => `${s.startTime}-${s.endTime || ''} ${s.subjectName} in ${s.room || 'TBA'}`).join('; ')}`);
    }
    if (ctx.attendance?.overall) {
      const o = ctx.attendance.overall;
      contextParts.push(`Attendance: ${o.percentage}% (${o.attended}/${o.total} classes attended). Status: ${o.health}. ${o.needed > 0 ? `Need ${o.needed} more consecutive classes to reach ${o.target}%.` : 'Attendance is healthy.'}`);
    }
    if (ctx.deadlines?.length) contextParts.push(`Upcoming deadlines: ${ctx.deadlines.map((d) => `${d.label} — ${d.diff === 0 ? 'TODAY' : d.diff === 1 ? 'tomorrow' : `in ${d.diff} days`}`).join('; ')}`);
    if (ctx.tasks?.length) contextParts.push(`Pending tasks: ${ctx.tasks.map((t) => t.title).join('; ')}`);
    if (ctx.opportunities?.length) contextParts.push(`Top matching opportunities: ${ctx.opportunities.slice(0, 3).map((o) => `${o.opportunity?.title || o.title} at ${o.opportunity?.organization || o.organization} (${o.score}% match)`).join('; ')}`);
    if (ctx.notices?.length) contextParts.push(`Recent notices: ${ctx.notices.map((n) => n.title).join('; ')}`);
    if (ctx.events?.length) contextParts.push(`Upcoming events: ${ctx.events.map((e) => e.title).join('; ')}`);

    const structuredContext = contextParts.join('\n');

    // Build conversation history string
    const historyStr = history.length
      ? '\n\nRecent conversation:\n' + history.slice(-6).map((h) => `${h.role === 'user' ? 'Student' : 'Assistant'}: ${h.content}`).join('\n')
      : '';

    const systemPrompt = `You are CAMPUSCONNECT AI — a smart, friendly, context-aware assistant for college students in India.

REAL STUDENT DATA (use this to give SPECIFIC answers):
${structuredContext}
${historyStr}

RULES:
1. ALWAYS use the student's REAL data above to answer. Reference specific classes, subjects, numbers, deadlines by name.
2. Be conversational, warm, and motivating — like a helpful senior, not a robot.
3. Give ACTIONABLE advice: what to do, when to do it, how to do it.
4. For attendance questions: give specific numbers, calculations, and actionable steps.
5. For timetable questions: list actual classes with times and rooms.
6. For career/skills questions: reference their actual skills, course, semester, and goals.
7. For general questions: relate the answer back to their campus life when possible.
8. Use emojis sparingly but naturally.
9. Keep responses concise (3-6 sentences) unless the question needs more detail.
10. If you don't have enough info, say what specific info would help and where to find it in the app.`;

    const result = await askAI(systemPrompt, message, { temperature: 0.7 });
    if (result) return { reply: result, intent: 'ai' };
    const intent = fb.detectIntent(message);
    return { reply: fb.fallbackChatReply(intent, ctx), intent };
  },

  async resumeAnalysis(text, profile) {
    const result = await askAI(
      'You are an expert resume analyst. Analyse this resume text for a student. Return ONLY JSON: {"score":0-100,"strengths":["..."],"weaknesses":["..."],"missingSkills":["..."],"improvements":["..."],"atsFriendly":true|false,"parsed":{"education":[],"skills":[],"projects":[],"experience":[],"certifications":[]}}',
      `Career goal: ${profile?.careerGoal || 'unknown'}\nResume text:\n${text.slice(0, 6000)}`,
      { json: true, temperature: 0.4 }
    );
    if (result) {
      const parsed = parseJsonLoose(result);
      if (parsed && typeof parsed.score === 'number') return { ...parsed, fromAI: true };
    }
    return { ...fb.fallbackResumeAnalysis(text), fromAI: false };
  },

  async skillGap(profile, careerGoal) {
    const result = await askAI(
      'You are a career skill-gap analyst. Given the student\'s skills and chosen career goal, return ONLY JSON: {"gaps":["..."],"recommended":"...","resources":{"courses":[],"projects":[],"hackathons":[],"internships":[],"training":[]}}',
      `Career goal: ${careerGoal}\nCurrent skills: ${JSON.stringify(profile.skills || [])}\nCourse: ${profile.course}, semester: ${profile.semester}`,
      { json: true, temperature: 0.5 }
    );
    if (result) {
      const parsed = parseJsonLoose(result);
      if (parsed && Array.isArray(parsed.gaps)) {
        return { ...parsed, fromAI: true };
      }
    }
    const fbResult = fb.skillGapFromProfile(profile, careerGoal);
    return { ...fbResult, resources: fb.resourcesForSkill(fbResult.recommended), fromAI: false };
  },

  async roadmap(careerGoal, profileSkills) {
    const result = await askAI(
      'Generate a career roadmap (ordered list of skill milestones with status "Not Started"|"Learning"|"Completed") for the given career goal. Return ONLY JSON: {"steps":[{"skill":"...","status":"..."}]}',
      `Career goal: ${careerGoal}\nKnown skills: ${JSON.stringify(profileSkills)}`,
      { json: true, temperature: 0.4 }
    );
    if (result) {
      const parsed = parseJsonLoose(result);
      if (parsed && Array.isArray(parsed.steps)) {
        return parsed.steps.map((s, i) => ({ skill: s.skill, status: s.status || 'Not Started', order: i }));
      }
    }
    return fb.fallbackRoadmap(careerGoal, profileSkills);
  },

  async projects(profile) {
    const result = await askAI(
      'Recommend 3-4 portfolio projects for this student. Return ONLY JSON: [{"title":"...","difficulty":"Easy|Medium|Hard","time":"...","skillsGained":[],"techStack":[],"features":[],"portfolioValue":"..."}]',
      `Skills: ${JSON.stringify((profile.skills || []).map((s) => s.name))}\nCareer goal: ${profile.careerGoal}\nInterests: ${JSON.stringify(profile.interests || [])}`,
      { json: true, temperature: 0.6 }
    );
    if (result) {
      const parsed = parseJsonLoose(result);
      if (Array.isArray(parsed)) return parsed;
    }
    return fb.fallbackProjects(profile);
  },

  async noticeSummary(title, content) {
    const result = await askAI(
      'You summarise college notices for students. Return ONLY JSON: {"summary":"2-3 sentence plain summary","importantDates":["..."],"deadline":"...","actionRequired":"...","examDetails":"..."}',
      `Notice title: ${title}\nNotice content:\n${content.slice(0, 4000)}`,
      { json: true, temperature: 0.3 }
    );
    if (result) {
      const parsed = parseJsonLoose(result);
      if (parsed && parsed.summary) return { ...parsed, fromAI: true };
    }
    return { ...fb.fallbackNoticeSummary(title, content), fromAI: false };
  },

  async applicationAssist(profile, opp, resumeText) {
    const result = await askAI(
      'You are an application assistant. Generate a cover letter, a short personal introduction, and an answer to "Why should we select you?" for this student applying to this opportunity. Return ONLY JSON: {"coverLetter":"...","introduction":"...","whyYou":"..."}',
      `Student profile: ${JSON.stringify(profile)}\nOpportunity: title=${opp.title}, org=${opp.organization}, category=${opp.category}, description=${(opp.description || '').slice(0, 800)}\nResume text:\n${(resumeText || '').slice(0, 2500)}`,
      { json: true, temperature: 0.7 }
    );
    if (result) {
      const parsed = parseJsonLoose(result);
      if (parsed && parsed.coverLetter) return { ...parsed, fromAI: true };
    }
    return { ...fb.fallbackApplicationAssist(profile, opp, resumeText), fromAI: false };
  },

  async weeklyReview(data) {
    const result = await askAI(
      'Write a 3-5 sentence weekly review for a student based on these stats. Be encouraging and specific. Plain text only.',
      JSON.stringify(data),
      { temperature: 0.6 }
    );
    if (result) return { insight: result, fromAI: true };
    return { insight: fb.fallbackWeeklyReview(data), fromAI: false };
  },

  async profileInsights(profile) {
    const result = await askAI(
      'Give 2-3 short, specific insights about this student\'s profile: where they are strong, what to improve, and how it relates to their career goal. Plain text, bullet lines starting with "-".',
      JSON.stringify(profile),
      { temperature: 0.6 }
    );
    if (result) return { insights: result, fromAI: true };
    return { insights: fb.fallbackProfileInsights(profile), fromAI: false };
  },

  async searchParse(query) {
    const result = await askAI(
      'Convert this natural language query into structured opportunity filters. Return ONLY JSON: {"text":"...","category":null|"internship"|"hackathon"|"job"|"scholarship"|"training"|"workshop"|"competition"|"fellowship"|"research"|"conference","mode":null|"remote"|"onsite"|"hybrid","location":null|"...","skills":[],"urgent":boolean}',
      query,
      { json: true, temperature: 0.2 }
    );
    if (result) {
      const parsed = parseJsonLoose(result);
      if (parsed && (parsed.text || parsed.category || parsed.skills)) return { ...parsed, fromAI: true };
    }
    return { ...fb.fallbackSearchParse(query), fromAI: false };
  },

  async prioritize(tasks) {
    return fb.fallbackPrioritize(tasks);
  },

  proactiveActions(ctx) {
    return fb.fallbackProactiveActions(ctx);
  },
};
