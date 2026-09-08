const { Router } = require('express');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, handleValidation, asyncHandler } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const where = { user: req.user.id };
  if (req.query.status) where.status = req.query.status;
  const tasks = await prisma.task.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json({ tasks });
}));

router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
], handleValidation, asyncHandler(async (req, res) => {
  const { title, description, subject, category, dueDate, priority } = req.body;
  const task = await prisma.task.create({
    data: {
      user: req.user.id,
      title: title.trim(),
      description: description || '',
      subject: subject || '',
      category: category || 'study',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority || 'medium'
    }
  });
  res.status(201).json({ task });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const task = await prisma.task.findFirst({ where: { id: req.params.id, user: req.user.id } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const allowed = ['title', 'description', 'subject', 'category', 'dueDate', 'priority', 'status'];
  const data = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
  if (data.status === 'done' && !task.completedAt) data.completedAt = new Date();
  if (data.status && data.status !== 'done') data.completedAt = null;
  const updated = await prisma.task.update({ where: { id: task.id }, data });
  res.json({ task: updated });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await prisma.task.deleteMany({ where: { id: req.params.id, user: req.user.id } });
  if (!result.count) return res.status(404).json({ error: 'Task not found' });
  res.json({ message: 'Task deleted' });
}));

module.exports = router;
