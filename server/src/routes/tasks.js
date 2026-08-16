import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Task } from '../models/Task.js';
import { aiService } from '../services/ai/index.js';

const router = Router();
router.use(auth);

// GET /api/tasks?status= / GET /api/tasks/prioritized
router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;
  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  res.json({ tasks });
}));

router.get('/prioritized', asyncHandler(async (req, res) => {
  const tasks = await Task.find({ user: req.user._id });
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
    const task = await Task.create({
      user: req.user._id,
      title: title.trim(),
      description: description || '',
      subject: subject || '',
      category: category || 'study',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority || 'medium',
    });
    res.status(201).json({ task });
  })
);

// PATCH /api/tasks/:id — includes status transitions (complete)
router.patch('/:id', asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) throw ApiError.notFound('Task not found');
  const allowed = ['title', 'description', 'subject', 'category', 'dueDate', 'priority', 'status'];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) task[k] = req.body[k];
  });
  if (task.status === 'done' && !task.completedAt) task.completedAt = new Date();
  if (task.status !== 'done') task.completedAt = undefined;
  await task.save();
  res.json({ task });
}));

// DELETE /api/tasks/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) throw ApiError.notFound('Task not found');
  res.json({ message: 'Task deleted' });
}));

export default router;
