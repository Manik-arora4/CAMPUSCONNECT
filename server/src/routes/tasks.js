import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { aiService } from '../services/ai/index.js';

const router = Router();
router.use(auth);

// GET /api/tasks?status= / GET /api/tasks/prioritized
router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = { user: req.user.id };
  if (status) where.status = status;
  const tasks = await prisma.task.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json({ tasks });
}));

router.get('/prioritized', asyncHandler(async (req, res) => {
  const tasks = await prisma.task.findMany({ where: { user: req.user.id } });
  const prioritized = await aiService.prioritize(tasks);
  res.json({ tasks: prioritized });
}));

// POST /api/tasks
router.post(
  '/',
  [body('title').trim().notEmpty().withMessage('Title is required')],
  validate,
  asyncHandler(async (req, res) => {
    const { title, description, subject, category, dueDate, priority } = req.body;
    const task = await prisma.task.create({
      data: {
        user: req.user.id,
        title: title.trim(),
        description: description || '',
        subject: subject || '',
        category: category || 'study',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority: priority || 'medium',
      },
    });
    res.status(201).json({ task });
  })
);

// PATCH /api/tasks/:id — includes status transitions (complete)
router.patch('/:id', asyncHandler(async (req, res) => {
  const task = await prisma.task.findFirst({ where: { id: req.params.id, user: req.user.id } });
  if (!task) throw ApiError.notFound('Task not found');
  const allowed = ['title', 'description', 'subject', 'category', 'dueDate', 'priority', 'status'];
  const data = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  if (data.status === 'done' && !task.completedAt) data.completedAt = new Date();
  if (data.status && data.status !== 'done') data.completedAt = null;
  const updated = await prisma.task.update({ where: { id: task.id }, data });
  res.json({ task: updated });
}));

// DELETE /api/tasks/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const res2 = await prisma.task.deleteMany({ where: { id: req.params.id, user: req.user.id } });
  if (!res2.count) throw ApiError.notFound('Task not found');
  res.json({ message: 'Task deleted' });
}));

export default router;
