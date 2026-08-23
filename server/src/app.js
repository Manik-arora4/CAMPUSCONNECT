import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import studentRoutes from './routes/students.js';
import collegeRoutes from './routes/colleges.js';
import timetableRoutes from './routes/timetable.js';
import attendanceRoutes from './routes/attendance.js';
import assignmentRoutes from './routes/assignments.js';
import taskRoutes from './routes/tasks.js';
import examRoutes from './routes/exams.js';
import noticeRoutes from './routes/notices.js';
import eventRoutes from './routes/events.js';
import clubRoutes from './routes/clubs.js';
import opportunityRoutes from './routes/opportunities.js';
import applicationRoutes from './routes/applications.js';
import resumeRoutes from './routes/resumes.js';
import aiRoutes from './routes/ai.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import facultyRoutes from './routes/faculty.js';
import supportRoutes from './routes/support.js';
import pushRoutes from './routes/push.js';
import { ApiError } from './utils/ApiError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', 1);

// Security headers (X-Frame-Options, X-Content-Type-Options, CSP, HSTS, …)
app.use(helmet());

// CORS — only allow the app's own origins (dev server + deployed URL), not any website
const allowedOrigins = [env.PUBLIC_URL, 'http://localhost:5173', 'http://localhost:5000'].filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / server-to-server requests (no Origin header) and known origins only
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

// Keep the legacy MongoDB response shape: every DB row exposes both `id` and `_id`,
// so the frontend keeps working unchanged after the Postgres migration.
function addIdAliases(value) {
  if (Array.isArray(value)) {
    for (const item of value) addIdAliases(item);
    return value;
  }
  if (value && typeof value === 'object') {
    if (typeof value.id === 'string' && value._id === undefined) value._id = value.id;
    for (const v of Object.values(value)) addIdAliases(v);
  }
  return value;
}

app.use((req, res, next) => {
  const original = res.json.bind(res);
  res.json = (body) => original(addIdAliases(body));
  next();
});

app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  })
);

// Uploaded files (resumes, attachments)
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

const routes = {
  '/api/auth': authRoutes,
  '/api/users': userRoutes,
  '/api/students': studentRoutes,
  '/api/colleges': collegeRoutes,
  '/api/timetable': timetableRoutes,
  '/api/attendance': attendanceRoutes,
  '/api/assignments': assignmentRoutes,
  '/api/tasks': taskRoutes,
  '/api/exams': examRoutes,
  '/api/notices': noticeRoutes,
  '/api/events': eventRoutes,
  '/api/clubs': clubRoutes,
  '/api/opportunities': opportunityRoutes,
  '/api/applications': applicationRoutes,
  '/api/resumes': resumeRoutes,
  '/api/ai': aiRoutes,
  '/api/messages': messageRoutes,
  '/api/notifications': notificationRoutes,
  '/api/admin': adminRoutes,
  '/api/faculty': facultyRoutes,
  '/api/support': supportRoutes,
  '/api/push': pushRoutes,
};
for (const [prefix, router] of Object.entries(routes)) app.use(prefix, router);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Serve the built client if present
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api|uploads).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 404 for unknown API routes
app.use('/api', (req, res, next) => next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`)));

// Error handler
app.use((err, req, res, next) => {
  const isMulter = err instanceof multer.MulterError || err?.message?.toLowerCase?.().includes('upload');
  if (isMulter) return res.status(400).json({ error: err.message });
  const status = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Something went wrong on the server.';
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ error: message, details: err.details || undefined });
});

export default app;
