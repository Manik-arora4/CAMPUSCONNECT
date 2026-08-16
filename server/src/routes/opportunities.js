import { Router } from 'express';
import { body } from 'express-validator';
import { auth, optionalAuth } from '../middleware/auth.js';
import { requireFaculty, requireAdmin } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Opportunity } from '../models/Opportunity.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { Application } from '../models/Application.js';
import { RecommendationEvent } from '../models/RecommendationEvent.js';
import { computeMatch, rankOpportunities } from '../services/matchingEngine.js';
import { aiService } from '../services/ai/index.js';
import { daysBetween, relativeDay } from '../utils/helpers.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();

async function studentContext(userId) {
  if (!userId) return null;
  const profile = await StudentProfile.findOne({ user: userId });
  return profile;
}

// GET /api/opportunities — filterable, paginated, match-scored for students
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { category, mode, location, skills, search, sort = 'match', page = 1, limit = 12, urgent, status } = req.query;
  const filter = {};

  if (req.user?.role === 'admin') {
    if (status) filter.status = status;
  } else {
    filter.status = 'verified';
  }
  if (category && category !== 'all') filter.category = category;
  if (mode && mode !== 'all') filter.mode = mode;
  if (location && location !== 'all') filter.location = { $regex: location, $options: 'i' };
  if (skills) {
    const skillList = String(skills).split(',').map((s) => s.trim()).filter(Boolean);
    if (skillList.length) filter.skillsRequired = { $in: skillList };
  }
  if (search) filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { organization: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } },
    { eligibility: { $regex: search, $options: 'i' } },
  ];
  if (urgent === 'true') filter.deadline = { $gte: new Date(), $lte: new Date(Date.now() + 7 * 86400000) };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Opportunity.countDocuments(filter);
  let opportunities = await Opportunity.find(filter)
    .sort({ postedDate: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const profile = await studentContext(req.user?._id);
  if (profile) {
    const ranked = opportunities.map((o) => ({ ...computeMatch(profile, o), opportunity: o }));
    opportunities = ranked.sort((a, b) => {
      if (sort === 'deadline') return new Date(a.opportunity.deadline) - new Date(b.opportunity.deadline);
      if (sort === 'newest') return new Date(b.opportunity.postedDate) - new Date(a.opportunity.postedDate);
      return b.score - a.score;
    });
    res.json({ opportunities, total, page: Number(page), limit: Number(limit), profile });
  } else {
    res.json({ opportunities, total, page: Number(page), limit: Number(limit) });
  }
}));

// GET /api/opportunities/trending
router.get('/trending', optionalAuth, asyncHandler(async (req, res) => {
  const filter = { status: 'verified', deadline: { $gte: new Date() }, postedDate: { $gte: new Date(Date.now() - 14 * 86400000) } };
  const recent = await Opportunity.find(filter).limit(40).lean();
  const profile = await studentContext(req.user?._id);
  const scored = profile ? recent.map((o) => ({ ...computeMatch(profile, o), opportunity: o })) : recent.map((o) => ({ score: 0, opportunity: o }));
  scored.sort((a, b) => b.score - a.score || new Date(b.opportunity.postedDate) - new Date(a.opportunity.postedDate));
  res.json({ opportunities: scored.slice(0, 6) });
}));

// POST /api/opportunities/search — AI natural language search (spec sections 39-40)
router.post('/search', optionalAuth, asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query) throw ApiError.badRequest('Search query is required');
  const filters = await aiService.searchParse(query);
  const filter = { status: 'verified' };
  if (filters.category) filter.category = filters.category;
  if (filters.mode) filter.mode = filters.mode;
  if (filters.location) filter.location = { $regex: filters.location, $options: 'i' };
  if (filters.skills?.length) filter.skillsRequired = { $in: filters.skills };
  if (filters.urgent) filter.deadline = { $gte: new Date(), $lte: new Date(Date.now() + 7 * 86400000) };
  if (filters.text) {
    const t = filters.text;
    filter.$or = [{ title: { $regex: t, $options: 'i' } }, { organization: { $regex: t, $options: 'i' } }, { description: { $regex: t, $options: 'i' } }];
  }
  const opps = await Opportunity.find(filter).limit(20).lean();
  const profile = await studentContext(req.user?._id);
  const results = profile ? opps.map((o) => ({ ...computeMatch(profile, o), opportunity: o })).sort((a, b) => b.score - a.score) : opps.map((o) => ({ score: 0, opportunity: o }));
  if (req.user) {
    await RecommendationEvent.create({ user: req.user._id, type: 'searched', metadata: { query } });
  }
  res.json({ results, filters, fromAI: filters.fromAI === true });
}));

// GET /api/opportunities/:id — details with match analysis
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const opp = await Opportunity.findById(req.params.id).lean();
  if (!opp) throw ApiError.notFound('Opportunity not found');
  const profile = await studentContext(req.user?._id);
  let match = null;
  let application = null;
  if (profile) {
    match = computeMatch(profile, opp);
    application = req.user ? await Application.findOne({ student: req.user._id, opportunity: opp._id }) : null;
  }
  if (req.user) {
    await RecommendationEvent.findOneAndUpdate(
      { user: req.user._id, type: 'viewed', opportunity: opp._id },
      { $setOnInsert: { user: req.user._id, type: 'viewed', opportunity: opp._id, category: opp.category } },
      { upsert: true }
    );
  }
  res.json({ opportunity: opp, match, application });
}));

// GET /api/opportunities/:id/ai-analysis — full AI analysis panel
router.get('/:id/ai-analysis', optionalAuth, asyncHandler(async (req, res) => {
  const opp = await Opportunity.findById(req.params.id);
  if (!opp) throw ApiError.notFound('Opportunity not found');
  const profile = await studentContext(req.user?._id);
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
    const opp = await Opportunity.create({
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
      createdBy: req.user._id,
    });
    res.status(201).json({ opportunity: opp });
  })
);

// POST /api/opportunities/:id/save — student saves opportunity
router.post('/:id/save', asyncHandler(async (req, res) => {
  const opp = await Opportunity.findById(req.params.id);
  if (!opp) throw ApiError.notFound('Opportunity not found');
  let app = await Application.findOne({ student: req.user._id, opportunity: opp._id });
  if (!app) {
    app = await Application.create({ student: req.user._id, opportunity: opp._id, status: 'saved', timeline: [{ status: 'saved' }] });
  }
  await RecommendationEvent.create({ user: req.user._id, type: 'saved', opportunity: opp._id, category: opp.category });
  res.json({ application: app, saved: true });
}));

// POST /api/opportunities/:id/apply — student applies
router.post('/:id/apply', asyncHandler(async (req, res) => {
  const opp = await Opportunity.findById(req.params.id);
  if (!opp) throw ApiError.notFound('Opportunity not found');
  let app = await Application.findOne({ student: req.user._id, opportunity: opp._id });
  if (!app) {
    app = await Application.create({ student: req.user._id, opportunity: opp._id, status: 'applied', appliedDate: new Date(), timeline: [{ status: 'applied' }] });
  } else if (app.status === 'saved' || app.status === 'planning') {
    app.status = 'applied';
    app.appliedDate = new Date();
    app.timeline.push({ status: 'applied' });
    await app.save();
  }
  await RecommendationEvent.create({ user: req.user._id, type: 'applied', opportunity: opp._id, category: opp.category });
  await createNotification(req.user._id, {
    category: 'opportunity',
    title: `Application submitted 🎉`,
    message: `You applied to "${opp.title}" at ${opp.organization}. Good luck!`,
    link: '/applications',
    icon: 'send',
    priority: 'medium',
  });
  res.json({ application: app });
}));

// PATCH /api/opportunities/:id — admin edit
router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const opp = await Opportunity.findById(req.params.id);
  if (!opp) throw ApiError.notFound('Opportunity not found');
  const allowed = ['title', 'organization', 'category', 'description', 'skillsRequired', 'eligibility', 'courseRestrictions', 'experienceLevel', 'location', 'mode', 'stipend', 'prize', 'deadline', 'applyLink', 'requirements', 'applicationProcess', 'tags', 'status'];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) opp[k] = req.body[k];
  });
  await opp.save();
  res.json({ opportunity: opp });
}));

// POST /api/opportunities/:id/verify | /reject — admin moderation
router.post('/:id/verify', requireAdmin, asyncHandler(async (req, res) => {
  const opp = await Opportunity.findById(req.params.id);
  if (!opp) throw ApiError.notFound('Opportunity not found');
  opp.status = 'verified';
  opp.verifiedBy = req.user._id;
  await opp.save();
  const students = await StudentProfile.find({}).distinct('user');
  await Promise.all(students.map((s) => createNotification(s, { category: 'opportunity', title: `New verified opportunity: ${opp.title}`, message: `${opp.organization} — ${opp.category}`, link: `/opportunities/${opp._id}`, icon: 'briefcase', priority: 'medium' })));
  res.json({ opportunity: opp });
}));

router.post('/:id/reject', requireAdmin, asyncHandler(async (req, res) => {
  const opp = await Opportunity.findById(req.params.id);
  if (!opp) throw ApiError.notFound('Opportunity not found');
  opp.status = 'rejected';
  await opp.save();
  res.json({ opportunity: opp });
}));

// DELETE /api/opportunities/:id — admin
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  await Opportunity.findByIdAndDelete(req.params.id);
  res.json({ message: 'Opportunity deleted' });
}));

export default router;
