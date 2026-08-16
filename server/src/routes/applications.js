import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireStudent } from '../middleware/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { aiService } from '../services/ai/index.js';

const router = Router();
router.use(auth, requireStudent);

const STATUS_FLOW = ['saved', 'planning', 'applied', 'shortlisted', 'interview', 'selected', 'rejected'];

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

// GET /api/applications
router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = { student: req.user.id };
  if (status && STATUS_FLOW.includes(status)) where.status = status;
  let applications = await prisma.application.findMany({ where, orderBy: { updatedAt: 'desc' } });
  applications = await attachOpportunity(applications);
  res.json({ applications });
}));

// GET /api/applications/analytics — funnel + success rate
router.get('/analytics', asyncHandler(async (req, res) => {
  const apps = await prisma.application.findMany({ where: { student: req.user.id } });
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
  const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opp) throw ApiError.notFound('Opportunity not found');
  if (!STATUS_FLOW.includes(status)) throw ApiError.badRequest('Invalid status');
  let app = await prisma.application.findFirst({ where: { student: req.user.id, opportunity: opp.id } });
  if (app) {
    const data = { notes };
    if (app.status !== status) {
      data.status = status;
      data.timeline = [...(app.timeline || []), { status }];
      if (status === 'applied' && !app.appliedDate) data.appliedDate = new Date();
    }
    app = await prisma.application.update({ where: { id: app.id }, data });
  } else {
    app = await prisma.application.create({
      data: {
        student: req.user.id,
        opportunity: opp.id,
        status,
        notes,
        timeline: [{ status }],
        appliedDate: status === 'applied' ? new Date() : undefined,
      },
    });
  }
  res.status(201).json({ application: app });
}));

// PATCH /api/applications/:id — update status/notes
router.patch('/:id', asyncHandler(async (req, res) => {
  const app = await prisma.application.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!app) throw ApiError.notFound('Application not found');
  const data = {};
  if (req.body.status) {
    if (!STATUS_FLOW.includes(req.body.status)) throw ApiError.badRequest('Invalid status');
    if (app.status !== req.body.status) {
      data.status = req.body.status;
      data.timeline = [...(app.timeline || []), { status: req.body.status }];
      if (req.body.status === 'applied' && !app.appliedDate) data.appliedDate = new Date();
    }
  }
  if (req.body.notes !== undefined) data.notes = req.body.notes;
  const updated = await prisma.application.update({ where: { id: app.id }, data });
  res.json({ application: updated });
}));

// DELETE /api/applications/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const res2 = await prisma.application.deleteMany({ where: { id: req.params.id, student: req.user.id } });
  if (!res2.count) throw ApiError.notFound('Application not found');
  res.json({ message: 'Application removed' });
}));

// POST /api/applications/:id/ai-assist — generate cover letter, intro, why-you
router.post('/:id/ai-assist', asyncHandler(async (req, res) => {
  const app = await prisma.application.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!app) throw ApiError.notFound('Application not found');
  const opp = app.opportunity ? await prisma.opportunity.findUnique({ where: { id: app.opportunity } }) : null;
  if (!opp) throw ApiError.notFound('Opportunity not found');
  const [profile, resume] = await Promise.all([
    prisma.studentProfile.findFirst({ where: { user: req.user.id } }),
    prisma.resume.findFirst({ where: { student: req.user.id }, orderBy: { createdAt: 'desc' } }),
  ]);
  const result = await aiService.applicationAssist(
    { ...(profile || {}), userName: req.user.name },
    opp,
    resume?.extractedText || ''
  );
  const aiAssist = {
    coverLetter: result.coverLetter,
    introduction: result.introduction,
    whyYou: result.whyYou,
    generatedAt: new Date(),
  };
  const updated = await prisma.application.update({ where: { id: app.id }, data: { aiAssist } });
  res.json({ aiAssist: updated.aiAssist, fromAI: result.fromAI === true });
}));

export default router;
