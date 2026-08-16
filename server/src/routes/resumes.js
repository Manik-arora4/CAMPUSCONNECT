import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireStudent } from '../middleware/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { aiService } from '../services/ai/index.js';
import { upload, uploadsDirPath } from '../utils/upload.js';
import { fallbackResumeAlignment } from '../services/ai/fallbacks.js';

const router = Router();
router.use(auth, requireStudent);

async function extractPdfText(filePath) {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(fs.readFileSync(filePath));
  return data.text || '';
}

// POST /api/resumes/upload — multipart file (field name: resume)
router.post('/upload', upload.single('resume'), asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Please upload a PDF resume');
  let record = await prisma.resume.create({
    data: {
      student: req.user.id,
      filename: req.file.originalname,
      filePath: req.file.filename,
      fileType: req.file.mimetype || 'application/pdf',
      fileSize: req.file.size,
    },
  });
  let extractedText = '';
  try {
    if (req.file.mimetype === 'application/pdf') {
      extractedText = await extractPdfText(req.file.path);
    }
  } catch (err) {
    console.error('[resumes] PDF extraction failed:', err.message);
  }
  record = await prisma.resume.update({ where: { id: record.id }, data: { extractedText } });
  res.status(201).json({ resume: record });
}));

// GET /api/resumes
router.get('/', asyncHandler(async (req, res) => {
  const resumes = await prisma.resume.findMany({ where: { student: req.user.id }, orderBy: { createdAt: 'desc' } });
  res.json({ resumes });
}));

// GET /api/resumes/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const resume = await prisma.resume.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!resume) throw ApiError.notFound('Resume not found');
  res.json({ resume });
}));

// POST /api/resumes/:id/analyze — run AI analysis
router.post('/:id/analyze', asyncHandler(async (req, res) => {
  const resume = await prisma.resume.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!resume) throw ApiError.notFound('Resume not found');
  if (!resume.extractedText) throw ApiError.badRequest('Could not extract text from this resume. Please upload a text-based PDF.');
  const profile = await prisma.studentProfile.findFirst({ where: { user: req.user.id } });
  const analysis = await aiService.resumeAnalysis(resume.extractedText, profile);
  const analysisWithDate = { ...analysis, generatedAt: new Date() };
  const updated = await prisma.resume.update({ where: { id: resume.id }, data: { analysis: analysisWithDate } });
  if (profile) {
    await prisma.studentProfile.update({ where: { id: profile.id }, data: { resume: resume.id } });
  }
  res.json({ resume: updated, fromAI: analysis.fromAI === true });
}));

// GET /api/resumes/:id/compare/:opportunityId — resume alignment with an opportunity
router.get('/:id/compare/:opportunityId', asyncHandler(async (req, res) => {
  const resume = await prisma.resume.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!resume) throw ApiError.notFound('Resume not found');
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.opportunityId } });
  if (!opp) throw ApiError.notFound('Opportunity not found');
  const resumeSkills = resume.analysis?.parsed?.skills?.length
    ? resume.analysis.parsed.skills
    : (await import('../services/ai/fallbacks.js')).extractSkills(resume.extractedText);
  const result = fallbackResumeAlignment(resumeSkills, opp);
  res.json({ ...result, opportunity: opp });
}));

// DELETE /api/resumes/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const resume = await prisma.resume.findFirst({ where: { id: req.params.id, student: req.user.id } });
  if (!resume) throw ApiError.notFound('Resume not found');
  try {
    fs.unlinkSync(path.join(uploadsDirPath, resume.filePath));
  } catch { /* ignore */ }
  await prisma.studentProfile.updateMany({ where: { user: req.user.id, resume: resume.id }, data: { resume: null } });
  await prisma.resume.deleteMany({ where: { id: resume.id } });
  res.json({ message: 'Resume deleted' });
}));

export default router;
