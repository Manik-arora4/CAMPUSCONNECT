# 🎓 CAMPUSCONNECT

**Your College. Your Career. Your AI Assistant.**

CAMPUSCONNECT is a full-stack campus management platform for college students, faculty and admins — timetable, attendance, assignments, exams, notices, events, clubs, career opportunities and an AI assistant, all in one place.

---

## ✨ Features

### 👨‍🎓 Student
- **Dashboard** — personalised overview of classes, deadlines and recommendations
- **Timetable & Attendance** — weekly schedule + attendance tracking
- **Assignments & Exams** — due dates, submissions and exam schedule
- **Tasks** — personal to-do list with priority and status
- **Notices, Events & Clubs** — stay updated on campus life
- **Opportunities** — internships, jobs, hackathons; AI-powered matching and one-click applications
- **Resumes** — upload, store and manage your resume
- **AI Assistant** — chat, smart study planner and skills analysis

### 👨‍🏫 Faculty
- Faculty dashboard with class overview
- Create and manage assignments, announcements and resources

### 🛡️ Admin
- Overview with platform stats (totals, funnels, engagement)
- Manage students, faculty, departments, subjects, colleges and opportunities

### 🤖 AI (Google Gemini)
- AI chat assistant for students
- Smart study planner
- Skills gap analysis + career roadmap
- Works in **offline fallback mode** without an API key (deterministic responses); set `GEMINI_API_KEY` for live AI

---

## 🧱 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS, React Router, lucide-react |
| Backend | Node.js, Express 4 |
| Database | **PostgreSQL (Supabase)** via **Prisma ORM** |
| AI | Google Generative AI (Gemini) |
| Auth | JWT + bcrypt, role-based access (student / faculty / admin) |
| Extras | multer (uploads), express-rate-limit, express-validator, pdf-parse |

---

## 📁 Project Structure

```
campusconnect/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── pages/           # student pages (Dashboard, Timetable, Attendance, …)
│       │   ├── admin/       # admin pages
│       │   ├── ai/          # AIChat, AIPlanner, AISkills
│       │   └── faculty/     # faculty pages
│       ├── components/      # Layout, shared UI
│       └── context/         # AuthContext, etc.
├── server/                  # Express backend
│   ├── prisma/
│   │   └── schema.prisma    # 21 Postgres tables (Mongo-compatible shapes)
│   └── src/
│       ├── config/          # env + db setup
│       ├── lib/             # Prisma client singleton
│       ├── routes/          # API route handlers
│       ├── services/        # seed, scheduler, matching engine, Gemini, …
│       ├── middleware/      # auth, role guards
│       └── utils/           # uploads, ApiError, user helpers
└── package.json             # root scripts (concurrently dev)
```

> The API keeps the legacy MongoDB response shapes (`_id`, `createdAt`, `updatedAt`) so the frontend works unchanged — rows are stored with `id` columns in Postgres and an `_id` alias is added to every API response.

---

## 🚀 Quick Start

**Prerequisites:** Node.js 18+, a Postgres database (Supabase works great)

```bash
# 1. Install dependencies (root + server + client)
npm run install:all

# 2. Configure the database
#    Copy server/.env.example → server/.env and set DATABASE_URL, e.g.:
#    DATABASE_URL=postgresql://postgres:password@db.XXXX.supabase.co:5432/postgres

# 3. Create the tables in your Postgres database
npm run db:push --prefix server

# 4. Start both server + client in dev mode
npm run dev
```

- **Client:** http://localhost:5173
- **Server/API:** http://localhost:5000
- **Health check:** http://localhost:5000/api/health

### Demo accounts (seeded automatically on first start)

| Role | Email | Password |
|---|---|---|
| 🎓 Student | `student@demo.campusconnect` | `demo1234` |
| 👨‍🏫 Faculty | `faculty@demo.campusconnect` | `demo1234` |
| 🛡️ Admin | `admin@demo.campusconnect` | `demo1234` |

---

## ⚙️ Configuration

Copy `server/.env.example` → `server/.env` and adjust:

```env
PORT=5000
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d

# PostgreSQL connection string (Supabase / Neon / RDS / local)
DATABASE_URL=postgresql://postgres:password@db.XXXX.supabase.co:5432/postgres

# Leave empty for offline AI fallbacks; set for live Gemini
# Get a key at https://aistudio.google.com/apikey
GEMINI_API_KEY=

DEMO_ADMINS=
PUBLIC_URL=http://localhost:5173
```

---

## 🏗️ Production Build

The server automatically serves the built client from `client/dist` when present, so the whole app runs on a single port:

```bash
npm run build    # builds client → client/dist
npm start        # starts server on port 5000 (serves API + built client)
```

### Deploying
1. Create your Postgres database (Supabase free tier works) and set `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY` (optional) on the host
2. `npm run db:push --prefix server` to create tables
3. `npm run build` on the host
4. Run `npm start` — or deploy the `server/` folder to any Node host (Render, Railway, Fly.io, a VPS, …) and serve `client/dist` from it

---

## 📡 API Overview

All routes are under `/api` (rate-limited, 300 req/min):

- `auth` — register, login, google sign-in, forgot/reset password
- `users`, `students`, `faculty` — user & role management
- `timetable`, `attendance`, `assignments`, `tasks`, `exams` — academics
- `notices`, `events`, `clubs` — campus life
- `opportunities`, `applications`, `resumes` — career
- `ai` — chat, planner, roadmap, skills (Gemini or offline)
- `notifications`, `admin`, `colleges`

---

## 🛠️ Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run server + client together (concurrently) |
| `npm run dev:server` / `npm run dev:client` | Run one side only |
| `npm run seed` | Re-seed demo data (skips if data exists) |
| `npm run db:push --prefix server` | Create/update tables from the Prisma schema |
| `npm run build` | Build the client |
| `npm start` | Start server (serves API + built client) |
