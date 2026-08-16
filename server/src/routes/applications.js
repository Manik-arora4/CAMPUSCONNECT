import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireStudent } from '../middleware/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Application } from '../models/Application.js';
import { Opportunity } from '../models/Opportunity.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { Resume } from '../models/Resume.js';
import { aiService } from '../services/ai/index.js';

const router = Router();
router.use(auth, requireStudent);

const STATUS_FLOW = ['saved', 'planning', 'applied', 'shortlisted', 'interview', 'selected', 'rejected'];

// GET /api/applications
router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { student: req.user._id };
  if (status && STATUS_FLOW.includes(status)) filter.status = status;
  const applications = await Application.find(filter)
    .populate('opportunity')
    .sort({ updatedAt: -1 });
  res.json({ applications });
}));

// GET /api/applications/analytics — funnel + success rate (spec sections 18, 56)
router.get('/analytics', asyncHandler(async (req, res) => {
  const apps = await Application.find({ student: req.user._id });
  const count = (s) => apps.filter((a) => a.status === s).length;
  const counts = {
    saved: count('saved'),
    planning: count('planning'),
    applied: count('applied'),
    shortlisted: count('shortlisted'),
    interview: count('interview'),
    selected: count('selected'),
    rejected: count('rejected'),
  };
  const decided = counts.selected + counts.rejected;
  const successRate = decided ? Math.round((counts.selected / decided) * 100) : 0;
  res.json({ counts, total: apps.length, active: apps.filter((a) => ['applied', 'shortlisted', 'interview'].includes(a.status)).length, successRate });
}));

// POST /api/applications — create/update from opportunity
router.post('/', asyncHandler(async (req, res) => {
  const { opportunityId, status = 'saved', notes = '' } = req.body;
  if (!opportunityId) throw ApiError.badRequest('opportunityId is required');
  const opp = await Opportunity.findById(opportunityId);
  if (!opp) throw ApiError.notFound('Opportunity not found');
  if (!STATUS_FLOW.includes(status)) throw ApiError.badRequest('Invalid status');
  let app = await Application.findOne({ student: req.user._id, opportunity: opp._id });
  if (app) {
    if (app.status !== status) {
      app.status = status;
      app.timeline.push({ status });
      if (status === 'applied' && !app.appliedDate) app.appliedDate = new Date();
    }
    app.notes = notes;
    await app.save();
  } else {
    app = await Application.create({ student: req.user._id, opportunity: opp._id, status, notes, timeline: [{ status }], appliedDate: status === 'applied' ? new Date() : undefined });
  }
  res.status(201).json({ application: app });
}));

// PATCH /api/applications/:id — update status/notes
router.patch('/:id', asyncHandler(async (req, res) => {
  const app = await Application.findOne({ _id: req.params.id, student: req.user._id });
  if (!app) throw ApiError.notFound('Application not found');
  if (req.body.status) {
    if (!STATUS_FLOW.includes(req.body.status)) throw ApiError.badRequest('Invalid status');
    if (app.status !== req.body.status) {
      app.timeline.push({ status: req.body.status });
      if (req.body.status === 'applied' && !app.appliedDate) app.appliedDate = new Date();
      app.status = req.body.status;
    }
  }
  if (req.body.notes !== undefined) app.notes = req.body.notes;
  await app.save();
  res.json({ application: app });
}));

// DELETE /api/applications/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const app = await Application.findOneAndDelete({ _id: req.params.id, student: req.user._id });
  if (!app) throw ApiError.notFound('Application not found');
  res.json({ message: 'Application removed' });
}));

// POST /api/applications/:id/ai-assist — generate cover letter, intro, why-you (spec section 19)
router.post('/:id/ai-assist', asyncHandler(async (req, res) => {
  const app = await Application.findOne({ _id: req.params.id, student: req.user._id }).populate('opportunity');
  if (!app) throw ApiError.notFound('Application not found');
  const [profile, resume] = await Promise.all([
    StudentProfile.findOne({ user: req.user._id }),
    Resume.findOne({ student: req.user._id }).sort({ createdAt: -1 }),
  ]);
  const opp = app.opportunity;
  const result = await aiService.applicationAssist(
    { ...(profile?.toObject?.() || {}), userName: req.user.name },
    opp,
    resume?.extractedText || ''
  );
  app.aiAssist = {
    coverLetter: result.coverLetter,
    introduction: result.introduction,
    whyYou: result.whyYou,
    generatedAt: new Date(),
  };
  await app.save();
  res.json({ aiAssist: app.aiAssist, fromAI: result.fromAI === true });
}));

export default router;
