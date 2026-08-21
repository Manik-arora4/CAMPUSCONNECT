import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();

// ─── Help Categories ───
const HELP_CATEGORIES = [
  { id: 'account', label: 'Account & Login', icon: 'user' },
  { id: 'academic', label: 'Academic Features', icon: 'graduation-cap' },
  { id: 'opportunity', label: 'Opportunities & Applications', icon: 'briefcase' },
  { id: 'ai', label: 'AI Assistant', icon: 'sparkles' },
  { id: 'technical', label: 'Technical Issues', icon: 'bug' },
  { id: 'general', label: 'General Inquiry', icon: 'help-circle' },
];

router.get('/categories', auth, asyncHandler(async (req, res) => {
  res.json({ categories: HELP_CATEGORIES });
}));

// ─── FAQs ───
router.get('/faqs', auth, asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const where = { active: true };
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { question: { contains: search, mode: 'insensitive' } },
      { answer: { contains: search, mode: 'insensitive' } },
    ];
  }
  const faqs = await prisma.fAQ.findMany({ where, orderBy: { order: 'asc' } });
  res.json({ faqs });
}));

// ─── User: Create Ticket ───
router.post(
  '/tickets',
  auth,
  [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { subject, description, category, priority = 'medium', attachment = '' } = req.body;
    const ticket = await prisma.supportTicket.create({
      data: {
        user: req.user.id,
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        attachment,
        userRole: req.user.role,
      },
    });
    res.status(201).json({ ticket });
  })
);

// ─── User: List My Tickets ───
router.get('/tickets', auth, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const where = { user: req.user.id };
  if (status) where.status = status;
  const total = await prisma.supportTicket.count({ where });
  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  });
  res.json({ tickets, total, page: Number(page) });
}));

// ─── User: Get Single Ticket ───
router.get('/tickets/:id', auth, asyncHandler(async (req, res) => {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
  if (!ticket) throw ApiError.notFound('Ticket not found');
  // Users can only see their own tickets unless they're admin
  if (ticket.user !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('Access denied');
  }
  res.json({ ticket });
}));

// ─── Admin: List All Tickets ───
router.get('/admin/tickets', auth, requireAdmin, asyncHandler(async (req, res) => {
  const { status, priority, category, search, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  const total = await prisma.supportTicket.count({ where });
  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  });
  // Resolve user names
  const userIds = [...new Set(tickets.map((t) => t.user))];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true, role: true } });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const enriched = tickets.map((t) => ({ ...t, _user: userMap.get(t.user) || null }));
  res.json({ tickets: enriched, total, page: Number(page) });
}));

// ─── Admin: Dashboard Stats ───
router.get('/admin/stats', auth, requireAdmin, asyncHandler(async (req, res) => {
  const [total, open, inProgress, resolved, closed] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: 'open' } }),
    prisma.supportTicket.count({ where: { status: 'in_progress' } }),
    prisma.supportTicket.count({ where: { status: 'resolved' } }),
    prisma.supportTicket.count({ where: { status: 'closed' } }),
  ]);
  const byPriority = (await prisma.supportTicket.groupBy({ by: ['priority'], _count: { _all: true } })).map((g) => ({ _id: g.priority, count: g._count._all }));
  const byCategory = (await prisma.supportTicket.groupBy({ by: ['category'], _count: { _all: true } })).map((g) => ({ _id: g.category, count: g._count._all }));
  res.json({ total, open, inProgress, resolved, closed, byPriority, byCategory });
}));

// ─── Admin: Update Ticket (status, assign, respond) ───
router.patch('/admin/tickets/:id', auth, requireAdmin, asyncHandler(async (req, res) => {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
  if (!ticket) throw ApiError.notFound('Ticket not found');
  const data = {};
  if (req.body.status) data.status = req.body.status;
  if (req.body.assignedTo !== undefined) data.assignedTo = req.body.assignedTo;
  if (req.body.response) {
    data.response = req.body.response;
    data.responseAt = new Date();
  }
  const updated = await prisma.supportTicket.update({ where: { id: ticket.id }, data });
  // Notify the ticket owner
  if (data.response || data.status) {
    const statusMsg = data.status ? `Status updated to "${data.status.replace('_', ' ')}"` : 'has been responded to';
    await createNotification(ticket.user, {
      category: 'system',
      title: `Support Ticket ${statusMsg}`,
      message: data.response ? data.response.slice(0, 200) : `Your ticket "${ticket.subject}" ${statusMsg}.`,
      link: `/support/tickets/${ticket.id}`,
      icon: 'life-buoy',
      priority: 'medium',
    });
  }
  res.json({ ticket: updated });
}));

// ─── Admin: Delete Ticket ───
router.delete('/admin/tickets/:id', auth, requireAdmin, asyncHandler(async (req, res) => {
  await prisma.supportTicket.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'Ticket deleted' });
}));

// ─── Admin: FAQ Management ───
router.post('/admin/faqs', auth, requireAdmin, asyncHandler(async (req, res) => {
  const { question, answer, category = 'general', order = 0 } = req.body;
  if (!question || !answer) throw ApiError.badRequest('question and answer are required');
  const faq = await prisma.fAQ.create({ data: { question, answer, category, order } });
  res.status(201).json({ faq });
}));

router.patch('/admin/faqs/:id', auth, requireAdmin, asyncHandler(async (req, res) => {
  const faq = await prisma.fAQ.findUnique({ where: { id: req.params.id } });
  if (!faq) throw ApiError.notFound('FAQ not found');
  const data = {};
  if (req.body.question !== undefined) data.question = req.body.question;
  if (req.body.answer !== undefined) data.answer = req.body.answer;
  if (req.body.category !== undefined) data.category = req.body.category;
  if (req.body.order !== undefined) data.order = req.body.order;
  if (req.body.active !== undefined) data.active = req.body.active;
  const updated = await prisma.fAQ.update({ where: { id: faq.id }, data });
  res.json({ faq: updated });
}));

router.delete('/admin/faqs/:id', auth, requireAdmin, asyncHandler(async (req, res) => {
  await prisma.fAQ.deleteMany({ where: { id: req.params.id } });
  res.json({ message: 'FAQ deleted' });
}));

export default router;
