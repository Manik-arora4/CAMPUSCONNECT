import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireFaculty } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Notice } from '../models/Notice.js';
import { User } from '../models/User.js';
import { aiService } from '../services/ai/index.js';
import { createNotification } from '../services/notificationService.js';
import { upload, fileUrl } from '../utils/upload.js';

const router = Router();
router.use(auth);

// GET /api/notices?important=&category=
router.get('/', asyncHandler(async (req, res) => {
  const filter = { college: req.user.college };
  if (req.query.important === 'true') filter.important = true;
  if (req.query.category) filter.category = req.query.category;
  const notices = await Notice.find(filter).sort({ date: -1 }).limit(60).populate('createdBy', 'name role');
  res.json({ notices });
}));

// GET /api/notices/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const notice = await Notice.findOne({ _id: req.params.id, college: req.user.college }).populate('createdBy', 'name role');
  if (!notice) throw ApiError.notFound('Notice not found');
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
    const notice = await Notice.create({
      college: req.user.college,
      title: title.trim(),
      content: content.trim(),
      category: category || 'general',
      important: important === 'true' || important === true,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      createdBy: req.user._id,
      attachments: req.file ? [fileUrl(req, req.file.filename)] : [],
    });
    // Notify college students
    const students = await User.find({ college: req.user.college, role: 'student' });
    await Promise.all(
      students.map((s) =>
        createNotification(s._id, {
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
  const notice = await Notice.findOne({ _id: req.params.id, college: req.user.college });
  if (!notice) throw ApiError.notFound('Notice not found');
  const result = await aiService.noticeSummary(notice.title, notice.content);
  notice.aiSummary = {
    summary: result.summary,
    importantDates: result.importantDates || [],
    deadline: result.deadline || '',
    actionRequired: result.actionRequired || '',
    examDetails: result.examDetails || '',
    generatedAt: new Date(),
  };
  await notice.save();
  res.json({ notice, fromAI: result.fromAI === true });
}));

// PATCH /api/notices/:id
router.patch('/:id', requireFaculty, asyncHandler(async (req, res) => {
  const notice = await Notice.findOne({ _id: req.params.id, college: req.user.college });
  if (!notice) throw ApiError.notFound('Notice not found');
  const allowed = ['title', 'content', 'category', 'important', 'expiryDate'];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) notice[k] = req.body[k];
  });
  await notice.save();
  res.json({ notice });
}));

// DELETE /api/notices/:id
router.delete('/:id', requireFaculty, asyncHandler(async (req, res) => {
  await Notice.findByIdAndDelete(req.params.id);
  res.json({ message: 'Notice deleted' });
}));

export default router;
