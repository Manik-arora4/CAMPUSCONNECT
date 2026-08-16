import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { requireStudent } from '../middleware/roles.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import fs from 'fs';
import path from 'path';
import { Resume } from '../models/Resume.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { Opportunity } from '../models/Opportunity.js';
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
  const record = await Resume.create({
    student: req.user._id,
    filename: req.file.originalname,
    filePath: req.file.filename,
    fileType: req.file.mimetype || 'application/pdf',
    fileSize: req.file.size,
  });
  let extractedText = '';
  try {
    if (req.file.mimetype === 'application/pdf') {
      extractedText = await extractPdfText(req.file.path);
    }
  } catch (err) {
    console.error('[resumes] PDF extraction failed:', err.message);
  }
  record.extractedText = extractedText;
  await record.save();
  res.status(201).json({ resume: record });
}));

// GET /api/resumes
router.get('/', asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ student: req.user._id }).sort({ createdAt: -1 });
  res.json({ resumes });
}));

// GET /api/resumes/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, student: req.user._id });
  if (!resume) throw ApiError.notFound('Resume not found');
  res.json({ resume });
}));

// POST /api/resumes/:id/analyze — run AI analysis
router.post('/:id/analyze', asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, student: req.user._id });
  if (!resume) throw ApiError.notFound('Resume not found');
  if (!resume.extractedText) throw ApiError.badRequest('Could not extract text from this resume. Please upload a text-based PDF.');
  const profile = await StudentProfile.findOne({ user: req.user._id });
  const analysis = await aiService.resumeAnalysis(resume.extractedText, profile);
  resume.analysis = { ...analysis, generatedAt: new Date() };
  await resume.save();
  if (profile) {
    profile.resume = resume._id;
    await profile.save();
  }
  res.json({ resume, fromAI: analysis.fromAI === true });
}));

// GET /api/resumes/:id/compare/:opportunityId — resume alignment with an opportunity
router.get('/:id/compare/:opportunityId', asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, student: req.user._id });
  if (!resume) throw ApiError.notFound('Resume not found');
  const opp = await Opportunity.findById(req.params.opportunityId);
  if (!opp) throw ApiError.notFound('Opportunity not found');
  const resumeSkills = resume.analysis?.parsed?.skills?.length
    ? resume.analysis.parsed.skills
    : (await import('../services/ai/fallbacks.js')).extractSkills(resume.extractedText);
  const result = fallbackResumeAlignment(resumeSkills, opp);
  res.json({ ...result, opportunity: opp });
}));

// DELETE /api/resumes/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const resume = await Resume.findOneAndDelete({ _id: req.params.id, student: req.user._id });
  if (!resume) throw ApiError.notFound('Resume not found');
  try {
    fs.unlinkSync(path.join(uploadsDirPath, resume.filePath));
  } catch { /* ignore */ }
  await StudentProfile.updateOne({ user: req.user._id, resume: resume._id }, { $unset: { resume: 1 } });
  res.json({ message: 'Resume deleted' });
}));

export default router;
