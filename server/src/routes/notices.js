import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireFaculty } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { aiService } from '../services/ai/index.js';
import { createNotification } from '../services/notificationService.js';
import { upload, fileUrl } from '../utils/upload.js';

const router = Router();
router.use(auth);

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

// GET /api/notices?important=&category=
router.get('/', asyncHandler(async (req, res) => {
  const where = { college: req.user.college };
  if (req.query.important === 'true') where.important = true;
  if (req.query.category) where.category = req.query.category;
  let notices = await prisma.notice.findMany({ where, orderBy: { date: 'desc' }, take: 60 });
  notices = await attachCreatedBy(notices);
  res.json({ notices });
}));

// GET /api/notices/:id
router.get('/:id', asyncHandler(async (req, res) => {
  let notice = await prisma.notice.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!notice) throw ApiError.notFound('Notice not found');
  [notice] = await attachCreatedBy([notice]);
  res.json({ notice });
}));

// POST /api/notices — faculty/admin; optional attachment
router.post(
  '/',
  requireFaculty,
  upload.single('attachment'),
  [body('title').trim().notEmpty().withMessage('Title is required'), body('content').trim().notEmpty().withMessage('Content is required')],
  validate,
  asyncHandler(async (req, res) => {
    const { title, content, category, important, expiryDate } = req.body;
    const notice = await prisma.notice.create({
      data: {
        college: req.user.college,
        title: title.trim(),
        content: content.trim(),
        category: category || 'general',
        important: important === 'true' || important === true,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        createdBy: req.user.id,
        attachments: req.file ? [fileUrl(req, req.file.filename)] : [],
      },
    });
    // Notify college students
    const students = await prisma.user.findMany({ where: { college: req.user.college, role: 'student' }, select: { id: true } });
    await Promise.all(
      students.map((s) =>
        createNotification(s.id, {
          category: 'college',
          title: notice.title,
          message: 'New college notice',
          link: '/college',
          icon: 'megaphone',
          priority: notice.important ? 'high' : 'medium',
        })
      )
    );
    res.status(201).json({ notice });
  })
);

// POST /api/notices/:id/summarize — run AI extraction (title, dates, deadlines, actions, exam details)
router.post('/:id/summarize', requireFaculty, asyncHandler(async (req, res) => {
  const notice = await prisma.notice.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!notice) throw ApiError.notFound('Notice not found');
  const result = await aiService.noticeSummary(notice.title, notice.content);
  const aiSummary = {
    summary: result.summary,
    importantDates: result.importantDates || [],
    deadline: result.deadline || '',
    actionRequired: result.actionRequired || '',
    examDetails: result.examDetails || '',
    generatedAt: new Date(),
  };
  const updated = await prisma.notice.update({ where: { id: notice.id }, data: { aiSummary } });
  res.json({ notice: updated, fromAI: result.fromAI === true });
}));

// PATCH /api/notices/:id
router.patch('/:id', requireFaculty, asyncHandler(async (req, res) => {
  const notice = await prisma.notice.findFirst({ where: { id: req.params.id, college: req.user.college } });
  if (!notice) throw ApiError.notFound('Notice not found');
  const allowed = ['title', 'content', 'category', 'important', 'expiryDate'];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  const updated = await prisma.notice.update({ where: { id: notice.id }, data });
  res.json({ notice: updated });
}));

// DELETE /api/notices/:id
router.delete('/:id', requireFaculty, asyncHandler(async (req, res) => {
  await prisma.notice.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Notice deleted' });
}));

export default router;
