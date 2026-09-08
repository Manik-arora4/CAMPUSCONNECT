// CampusConnect API — Main Application Entry
// All routes: Auth, Student, Faculty, Attendance, Courses, College, Notices, Events, etc.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// ========== MIDDLEWARE ==========
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
}));

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.1.0-bcrypt' });
});

// ========== ALL ROUTES ==========

// Authentication
app.use('/api/auth', require('./routes/auth'));

// Student module (dashboard, profile, recommendations)
app.use('/api/student', require('./routes/student'));

// Faculty module (Priority #1)
app.use('/api/faculty', require('./routes/faculty'));

// Faculty-based attendance system (Priority #1)
app.use('/api/attendance', require('./routes/attendance'));

// Database-driven courses & sections
app.use('/api/courses', require('./routes/courses'));

// College
app.use('/api/college', require('./routes/college'));

// Notices
app.use('/api/notices', require('./routes/notices'));

// Events
app.use('/api/events', require('./routes/events'));

// Clubs
app.use('/api/clubs', require('./routes/clubs'));

// Assignments
app.use('/api/assignments', require('./routes/assignments'));

// Tasks
app.use('/api/tasks', require('./routes/tasks'));

// Exams
app.use('/api/exams', require('./routes/exams'));

// Timetable
app.use('/api/timetable', require('./routes/timetable'));

// Opportunities/Jobs
app.use('/api/opportunities', require('./routes/opportunities'));

// Notifications
app.use('/api/notifications', require('./routes/notifications'));

// Messages
app.use('/api/messages', require('./routes/messages'));

// Support & FAQ
app.use('/api/support', require('./routes/support'));

// User Settings/Preferences
app.use('/api/settings', require('./routes/settings'));

// ========== 404 HANDLER ==========
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error('[campusconnect] Error:', err.message);

  if (err.code === 'P2025') return res.status(404).json({ error: 'Record not found' });
  if (err.code === 'P2002') return res.status(409).json({ error: 'Duplicate entry' });
  if (err.status) return res.status(err.status).json({ error: err.message });

  res.status(500).json({ error: 'Internal server error' });
});

// ========== START SERVER (local dev) ==========
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`[campusconnect] Server running on port ${PORT}`));
}

module.exports = app;
