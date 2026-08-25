import { Router } from 'express';
import { body } from 'express-validator';
import { auth, optionalAuth } from '../middleware/auth.js';
import { requireFaculty, requireAdmin } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { computeMatch, rankOpportunities } from '../services/matchingEngine.js';
import { aiService } from '../services/ai/index.js';
import { daysBetween, relativeDay } from '../utils/helpers.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();

async function studentContext(userId) {
  if (!userId) return null;
  return prisma.studentProfile.findFirst({ where: { user: userId } });
}

// GET /api/opportunities — filterable, paginated, match-scored for students
// Supports both page-based and cursor-based (infinite scroll) pagination
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { category, mode, location, skills, search, sort = 'match', page = 1, limit = 20, urgent, status, source, paid, institution, cursor } = req.query;
  const where = {};

  if (req.user?.role === 'admin') {
    if (status) where.status = status;
  } else {
    where.status = 'verified';
  }
  if (category && category !== 'all') where.category = category;
  if (mode && mode !== 'all') where.mode = mode;
  if (location && location !== 'all') where.location = { contains: location, mode: 'insensitive' };
  if (source && source !== 'all') {
    where.source = { contains: source, mode: 'insensitive' };
  }
  if (paid === 'paid') where.stipend = { not: '' };
  if (paid === 'free') where.stipend = '';
  if (institution && institution !== 'all') {
    where.organization = { contains: institution, mode: 'insensitive' };
  }
  if (skills) {
    const skillList = String(skills).split(',').map((s) => s.trim()).filter(Boolean);
    if (skillList.length) where.skillsRequired = { hasSome: skillList };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { organization: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { eligibility: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (urgent === 'true') where.deadline = { gte: new Date(), lte: new Date(Date.now() + 7 * 86400000) };

  const takeNum = Math.min(Number(limit), 50); // cap at 50 per page
  const profile = await studentContext(req.user?.id);

  // Cursor-based pagination: use postedDate + id as cursor for stable infinite scroll
  if (cursor) {
    const cursorOpp = await prisma.opportunity.findUnique({ where: { id: cursor }, select: { postedDate: true, id: true } });
    if (cursorOpp) {
      where.OR = [
        { postedDate: { lt: cursorOpp.postedDate } },
        { postedDate: cursorOpp.postedDate, id: { lt: cursor.id } },
      ];
    }
  }

  if (profile) {
    // Students: fetch more opportunities for scoring, then paginate the ranked results.
    const fetchLimit = cursor ? takeNum * 3 : Math.max(takeNum * 5, 200);
    const allOpps = await prisma.opportunity.findMany({ where, orderBy: [{ postedDate: 'desc' }, { id: 'desc' }], take: fetchLimit });
    const hasProfile = (profile.skills || []).length > 0 || (profile.interests || []).length > 0 || profile.careerGoal;
    let ranked = allOpps.map((o) => ({ ...computeMatch(profile, o), opportunity: o }));
    ranked.sort((a, b) => {
      if (sort === 'deadline') return new Date(a.opportunity.deadline) - new Date(b.opportunity.deadline);
      if (sort === 'newest') return new Date(b.opportunity.postedDate) - new Date(a.opportunity.postedDate);
      if (sort === 'source') return a.opportunity.organization.localeCompare(b.opportunity.organization);
      return b.score - a.score;
    });
    // Filter out low-relevance opportunities for students with defined profiles
    if (hasProfile) {
      ranked = ranked.filter((r) => {
        if (r.score < 15) return false;
        const studentSkillNames = (profile.skills || []).map((s) => s.name.toLowerCase());
        const oppRequired = (r.opportunity.skillsRequired || []).map((s) => s.toLowerCase());
        if (studentSkillNames.length && oppRequired.length) {
          const skillOverlap = oppRequired.some((s) => studentSkillNames.some((st) => st.includes(s) || s.includes(st)));
          const studentInterests = (profile.interests || []).map((i) => i.toLowerCase());
          const oppText = [r.opportunity.title, r.opportunity.description, r.opportunity.category, ...(r.opportunity.tags || [])].join(' ').toLowerCase();
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
    // Non-students: simple DB pagination
    const skip = cursor ? 0 : (Number(page) - 1) * takeNum;
    const total = await prisma.opportunity.count({ where });
    const opportunities = await prisma.opportunity.findMany({ where, orderBy: [{ postedDate: 'desc' }, { id: 'desc' }], skip, take: takeNum });
    const nextCursor = opportunities.length === takeNum ? opportunities[opportunities.length - 1].id : null;
    res.json({ opportunities, total, page: Number(page), limit: takeNum, nextCursor, hasMore: opportunities.length === takeNum });
  }
}));

// GET /api/opportunities/sources — list available sources for filter dropdown
router.get('/sources', optionalAuth, asyncHandler(async (req, res) => {
  const sources = await prisma.opportunity.groupBy({
    by: ['organization'],
    _count: { id: true },
    where: { status: 'verified' },
    orderBy: { _count: { id: 'desc' } },
  });
  res.json({ sources: sources.map((s) => ({ name: s.organization, count: s._count.id })) });
}));

// GET /api/opportunities/trending
router.get('/trending', optionalAuth, asyncHandler(async (req, res) => {
  const where = { status: 'verified', deadline: { gte: new Date() }, postedDate: { gte: new Date(Date.now() - 14 * 86400000) } };
  const recent = await prisma.opportunity.findMany({ where, take: 40 });
  const profile = await studentContext(req.user?.id);
  const scored = profile ? recent.map((o) => ({ ...computeMatch(profile, o), opportunity: o })) : recent.map((o) => ({ score: 0, opportunity: o }));
  scored.sort((a, b) => b.score - a.score || new Date(b.opportunity.postedDate) - new Date(a.opportunity.postedDate));
  res.json({ opportunities: scored.slice(0, 6) });
}));

// POST /api/opportunities/search — AI natural language search
router.post('/search', optionalAuth, asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query) throw ApiError.badRequest('Search query is required');
  const filters = await aiService.searchParse(query);
  const where = { status: 'verified' };
  if (filters.category) where.category = filters.category;
  if (filters.mode) where.mode = filters.mode;
  if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
  if (filters.skills?.length) where.skillsRequired = { hasSome: filters.skills };
  if (filters.urgent) where.deadline = { gte: new Date(), lte: new Date(Date.now() + 7 * 86400000) };
  if (filters.text) {
    const t = filters.text;
    where.OR = [
      { title: { contains: t, mode: 'insensitive' } },
      { organization: { contains: t, mode: 'insensitive' } },
      { description: { contains: t, mode: 'insensitive' } },
    ];
  }
  const opps = await prisma.opportunity.findMany({ where, take: 20 });
  const profile = await studentContext(req.user?.id);
  const results = profile ? opps.map((o) => ({ ...computeMatch(profile, o), opportunity: o })).sort((a, b) => b.score - a.score) : opps.map((o) => ({ score: 0, opportunity: o }));
  if (req.user) {
    await prisma.recommendationEvent.create({ data: { user: req.user.id, type: 'searched', metadata: { query } } });
  }
  res.json({ results, filters, fromAI: filters.fromAI === true });
}));

// GET /api/opportunities/:id — details with match analysis
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opp) throw ApiError.notFound('Opportunity not found');
  const profile = await studentContext(req.user?.id);
  let match = null;
  let application = null;
  if (profile) {
    match = computeMatch(profile, opp);
    application = req.user ? await prisma.application.findFirst({ where: { student: req.user.id, opportunity: opp.id } }) : null;
  }
  if (req.user) {
    const existing = await prisma.recommendationEvent.findFirst({ where: { user: req.user.id, type: 'viewed', opportunity: opp.id } });
    if (!existing) {
      await prisma.recommendationEvent.create({ data: { user: req.user.id, type: 'viewed', opportunity: opp.id, category: opp.category } });
    }
  }
  res.json({ opportunity: opp, match, application });
}));

// GET /api/opportunities/:id/ai-analysis — full AI analysis panel
router.get('/:id/ai-analysis', optionalAuth, asyncHandler(async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opp) throw ApiError.notFound('Opportunity not found');
  const profile = await studentContext(req.user?.id);
  if (!profile) return res.json({ match: null, explanation: 'Complete your profile to see AI analysis.', skillGaps: [], difficulty: 'N/A', urgency: 'N/A' });

  const match = computeMatch(profile, opp);
  const explanation = await aiService.matchExplanation(profile, opp, match);
  const have = new Set((profile.skills || []).map((s) => s.name.toLowerCase()));
  const skillGaps = (opp.skillsRequired || []).filter((s) => !have.has(s.toLowerCase()));
  const diff = daysBetween(new Date(), opp.deadline);
  const difficulty = opp.experienceLevel === 'fresher' || !opp.experienceLevel ? 'Beginner-friendly' : opp.experienceLevel === 'junior' ? 'Moderate' : 'Competitive';
  const urgency = diff < 0 ? 'Expired' : diff === 0 ? 'Due today' : diff <= 2 ? 'Critical' : diff <= 7 ? 'High' : diff <= 14 ? 'Medium' : 'Low';

  res.json({ match, explanation, skillGaps, difficulty, urgency, deadlineInDays: diff });
}));

// POST /api/opportunities — admin/faculty create
router.post(
  '/',
  requireFaculty,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('organization').trim().notEmpty().withMessage('Organization is required'),
    body('category').isIn(['internship', 'hackathon', 'job', 'scholarship', 'training', 'workshop', 'competition', 'fellowship', 'research', 'conference']).withMessage('Invalid category'),
    body('deadline').isISO8601().withMessage('Valid deadline required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const data = req.body;
    const opp = await prisma.opportunity.create({
      data: {
        title: data.title.trim(),
        organization: data.organization.trim(),
        category: data.category,
        description: data.description || '',
        skillsRequired: data.skillsRequired || [],
        eligibility: data.eligibility || '',
        courseRestrictions: data.courseRestrictions || [],
        experienceLevel: data.experienceLevel || 'any',
        location: data.location || 'Remote',
        mode: data.mode || 'remote',
        stipend: data.stipend || '',
        prize: data.prize || '',
        deadline: new Date(data.deadline),
        applyLink: data.applyLink || '',
        requirements: data.requirements || [],
        applicationProcess: data.applicationProcess || '',
        tags: data.tags || [],
        status: req.user.role === 'admin' ? 'verified' : 'pending',
        createdBy: req.user.id,
      },
    });
    res.status(201).json({ opportunity: opp });
  })
);

// POST /api/opportunities/:id/save — student saves opportunity
router.post('/:id/save', auth, asyncHandler(async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opp) throw ApiError.notFound('Opportunity not found');
  let app = await prisma.application.findFirst({ where: { student: req.user.id, opportunity: opp.id } });
  if (!app) {
    app = await prisma.application.create({ data: { student: req.user.id, opportunity: opp.id, status: 'saved', timeline: [{ status: 'saved' }] } });
  }
  await prisma.recommendationEvent.create({ data: { user: req.user.id, type: 'saved', opportunity: opp.id, category: opp.category } });
  res.json({ application: app, saved: true });
}));

// POST /api/opportunities/:id/apply — redirect to original source website
// This does NOT create an internal application record.
// The Apply button's sole purpose is to take the user to the original application page.
router.post('/:id/apply', auth, asyncHandler(async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opp) throw ApiError.notFound('Opportunity not found');

  // The apply URL is always the original source — never a CampusConnect page
  const applyUrl = opp.applyUrl || opp.applyLink || opp.sourceUrl || '';

  // Track that user clicked apply (for analytics only, no application record)
  try {
    await prisma.recommendationEvent.create({ data: { user: req.user.id, type: 'applied', opportunity: opp.id, category: opp.category } });
  } catch { /* non-critical */ }

  // Return the original source URL so frontend opens it in a new tab
  res.json({ applyUrl, source: opp.organization, title: opp.title });
}));

// PATCH /api/opportunities/:id — admin edit
router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opp) throw ApiError.notFound('Opportunity not found');
  const allowed = ['title', 'organization', 'category', 'description', 'skillsRequired', 'eligibility', 'courseRestrictions', 'experienceLevel', 'location', 'mode', 'stipend', 'prize', 'deadline', 'applyLink', 'requirements', 'applicationProcess', 'tags', 'status'];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  const updated = await prisma.opportunity.update({ where: { id: opp.id }, data });
  res.json({ opportunity: updated });
}));

// POST /api/opportunities/:id/verify | /reject — admin moderation
router.post('/:id/verify', requireAdmin, asyncHandler(async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opp) throw ApiError.notFound('Opportunity not found');
  const updated = await prisma.opportunity.update({ where: { id: opp.id }, data: { status: 'verified', verifiedBy: req.user.id } });
  const profiles = await prisma.studentProfile.findMany({ select: { user: true }, distinct: ['user'] });
  await Promise.all(profiles.map((p) => createNotification(p.user, { category: 'opportunity', title: `New verified opportunity: ${updated.title}`, message: `${updated.organization} — ${updated.category}`, link: `/opportunities/${updated.id}`, icon: 'briefcase', priority: 'medium' })));
  res.json({ opportunity: updated });
}));

router.post('/:id/reject', requireAdmin, asyncHandler(async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opp) throw ApiError.notFound('Opportunity not found');
  const updated = await prisma.opportunity.update({ where: { id: opp.id }, data: { status: 'rejected' } });
  res.json({ opportunity: updated });
}));

// DELETE /api/opportunities/:id — admin
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  await prisma.opportunity.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Opportunity deleted' });
}));

export default router;
