import { askGemini, parseJsonLoose } from './gemini.js';
import * as fb from './fallbacks.js';
import { isGeminiEnabled } from '../../config/env.js';

export const aiMode = () => (isGeminiEnabled() ? 'gemini' : 'fallback');

export const aiService = {
  mode: aiMode(),

  async matchExplanation(profile, opp, match) {
    const { score, breakdown, reasons } = match;
    const userPrompt = `Student: course=${profile.course}, semester=${profile.semester}, skills=${(profile.skills || []).map((s) => s.name + ':' + s.level).join(', ')}, interests=${(profile.interests || []).join(', ')}, careerGoal=${profile.careerGoal}, remotePreference=${profile.remotePreference}\nOpportunity: title=${opp.title}, organization=${opp.organization}, category=${opp.category}, skillsRequired=${(opp.skillsRequired || []).join(', ')}, eligibility=${opp.eligibility}, mode=${opp.mode}, location=${opp.location}, deadline=${opp.deadline?.toISOString?.() || opp.deadline}\nMatch score: ${score}/100. Dimension breakdown: ${JSON.stringify(breakdown)}. Reasons: ${(reasons || []).join('; ')}`;
    const gemini = await askGemini(
      'You are the AI match explainer for CAMPUSCONNECT. Explain in 3-5 short bullet lines why this opportunity matches the student, why the weak dimensions are weak, and whether the deadline is urgent. Use plain text with bullet lines starting with "-". Do not invent facts.',
      userPrompt
    );
    if (gemini) return gemini;
    return fb.fallbackMatchExplanation(profile, opp, match);
  },

  async dailyPlan(ctx) {
    const gemini = await askGemini(
      'You are the AI daily planner for CAMPUSCONNECT. Build a realistic time-blocked daily plan (array of {time:"HH:MM", title, type} where type is class|task|break|study|career|free) plus a one-sentence summary. Include meals, breaks, and free time. Respond ONLY with JSON: {"items":[...],"summary":"..."}',
      `Date: ${ctx.date}\nToday's timetable: ${JSON.stringify(ctx.timetable)}\nPending tasks: ${JSON.stringify(ctx.tasks)}\nDeadlines: ${JSON.stringify(ctx.deadlines)}\nTop opportunity: ${JSON.stringify(ctx.topOpportunity)}\nAttendance warning: ${ctx.attendanceWarning}`,
      { json: true, temperature: 0.6 }
    );
    if (gemini) {
      const parsed = parseJsonLoose(gemini);
      if (parsed && Array.isArray(parsed.items)) {
        return { items: parsed.items, summary: parsed.summary || 'Your AI daily plan.', fromAI: true };
      }
    }
    return { ...fb.fallbackDailyPlan(ctx), fromAI: false };
  },

  async chat(message, ctx) {
    const gemini = await askGemini(
      'You are CAMPUSCONNECT\'s context-aware AI assistant for a college student. Use ONLY the provided context to answer. Be concise, friendly, specific, and actionable. If the context lacks the info, say so and suggest what to check.\nContext:\n' + JSON.stringify(ctx),
      message,
      { temperature: 0.7 }
    );
    if (gemini) return { reply: gemini, intent: 'ai' };
    const intent = fb.detectIntent(message);
    return { reply: fb.fallbackChatReply(intent, ctx), intent };
  },

  async resumeAnalysis(text, profile) {
    const gemini = await askGemini(
      'You are an expert resume analyst. Analyse this resume text for a student. Return ONLY JSON: {"score":0-100,"strengths":["..."],"weaknesses":["..."],"missingSkills":["..."],"improvements":["..."],"atsFriendly":true|false,"parsed":{"education":[],"skills":[],"projects":[],"experience":[],"certifications":[]}}',
      `Career goal: ${profile?.careerGoal || 'unknown'}\nResume text:\n${text.slice(0, 6000)}`,
      { json: true, temperature: 0.4 }
    );
    if (gemini) {
      const parsed = parseJsonLoose(gemini);
      if (parsed && typeof parsed.score === 'number') return { ...parsed, fromAI: true };
    }
    return { ...fb.fallbackResumeAnalysis(text), fromAI: false };
  },

  async skillGap(profile, careerGoal) {
    const gemini = await askGemini(
      'You are a career skill-gap analyst. Given the student\'s skills and chosen career goal, return ONLY JSON: {"gaps":["..."],"recommended":"...","resources":{"courses":[],"projects":[],"hackathons":[],"internships":[],"training":[]}}',
      `Career goal: ${careerGoal}\nCurrent skills: ${JSON.stringify(profile.skills || [])}\nCourse: ${profile.course}, semester: ${profile.semester}`,
      { json: true, temperature: 0.5 }
    );
    if (gemini) {
      const parsed = parseJsonLoose(gemini);
      if (parsed && Array.isArray(parsed.gaps)) {
        return { ...parsed, fromAI: true };
      }
    }
    const result = fb.skillGapFromProfile(profile, careerGoal);
    return { ...result, resources: fb.resourcesForSkill(result.recommended), fromAI: false };
  },

  async roadmap(careerGoal, profileSkills) {
    const gemini = await askGemini(
      'Generate a career roadmap (ordered list of skill milestones with status "Not Started"|"Learning"|"Completed") for the given career goal. Return ONLY JSON: {"steps":[{"skill":"...","status":"..."}]}',
      `Career goal: ${careerGoal}\nKnown skills: ${JSON.stringify(profileSkills)}`,
      { json: true, temperature: 0.4 }
    );
    if (gemini) {
      const parsed = parseJsonLoose(gemini);
      if (parsed && Array.isArray(parsed.steps)) {
        return parsed.steps.map((s, i) => ({ skill: s.skill, status: s.status || 'Not Started', order: i }));
      }
    }
    return fb.fallbackRoadmap(careerGoal, profileSkills);
  },

  async projects(profile) {
    const gemini = await askGemini(
      'Recommend 3-4 portfolio projects for this student. Return ONLY JSON: [{"title":"...","difficulty":"Easy|Medium|Hard","time":"...","skillsGained":[],"techStack":[],"features":[],"portfolioValue":"..."}]',
      `Skills: ${JSON.stringify((profile.skills || []).map((s) => s.name))}\nCareer goal: ${profile.careerGoal}\nInterests: ${JSON.stringify(profile.interests || [])}`,
      { json: true, temperature: 0.6 }
    );
    if (gemini) {
      const parsed = parseJsonLoose(gemini);
      if (Array.isArray(parsed)) return parsed;
    }
    return fb.fallbackProjects(profile);
  },

  async noticeSummary(title, content) {
    const gemini = await askGemini(
      'You summarise college notices for students. Return ONLY JSON: {"summary":"2-3 sentence plain summary","importantDates":["..."],"deadline":"...","actionRequired":"...","examDetails":"..."}',
      `Notice title: ${title}\nNotice content:\n${content.slice(0, 4000)}`,
      { json: true, temperature: 0.3 }
    );
    if (gemini) {
      const parsed = parseJsonLoose(gemini);
      if (parsed && parsed.summary) return { ...parsed, fromAI: true };
    }
    return { ...fb.fallbackNoticeSummary(title, content), fromAI: false };
  },

  async applicationAssist(profile, opp, resumeText) {
    const gemini = await askGemini(
      'You are an application assistant. Generate a cover letter, a short personal introduction, and an answer to "Why should we select you?" for this student applying to this opportunity. Return ONLY JSON: {"coverLetter":"...","introduction":"...","whyYou":"..."}',
      `Student profile: ${JSON.stringify(profile)}\nOpportunity: title=${opp.title}, org=${opp.organization}, category=${opp.category}, description=${(opp.description || '').slice(0, 800)}\nResume text:\n${(resumeText || '').slice(0, 2500)}`,
      { json: true, temperature: 0.7 }
    );
    if (gemini) {
      const parsed = parseJsonLoose(gemini);
      if (parsed && parsed.coverLetter) return { ...parsed, fromAI: true };
    }
    return { ...fb.fallbackApplicationAssist(profile, opp, resumeText), fromAI: false };
  },

  async weeklyReview(data) {
    const gemini = await askGemini(
      'Write a 3-5 sentence weekly review for a student based on these stats. Be encouraging and specific. Plain text only.',
      JSON.stringify(data),
      { temperature: 0.6 }
    );
    if (gemini) return { insight: gemini, fromAI: true };
    return { insight: fb.fallbackWeeklyReview(data), fromAI: false };
  },

  async profileInsights(profile) {
    const gemini = await askGemini(
      'Give 2-3 short, specific insights about this student\'s profile: where they are strong, what to improve, and how it relates to their career goal. Plain text, bullet lines starting with "-".',
      JSON.stringify(profile),
      { temperature: 0.6 }
    );
    if (gemini) return { insights: gemini, fromAI: true };
    return { insights: fb.fallbackProfileInsights(profile), fromAI: false };
  },

  async searchParse(query) {
    const gemini = await askGemini(
      'Convert this natural language query into structured opportunity filters. Return ONLY JSON: {"text":"...","category":null|"internship"|"hackathon"|"job"|"scholarship"|"training"|"workshop"|"competition"|"fellowship"|"research"|"conference","mode":null|"remote"|"onsite"|"hybrid","location":null|"...","skills":[],"urgent":boolean}',
      query,
      { json: true, temperature: 0.2 }
    );
    if (gemini) {
      const parsed = parseJsonLoose(gemini);
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
