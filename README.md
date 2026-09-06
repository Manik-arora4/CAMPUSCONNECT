# CampusConnect 🎓

> A full-stack college management platform — manage students, faculty, attendance, courses, and career opportunities.

## 🌐 Live Demo
**https://campusconnect-rho-one.vercel.app**

## 🔑 Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@iet.edu | admin1234 |
| Faculty | dr.sharma@iet.edu | faculty1234 |
| Student | student1@iet.edu | student1234 |

## 🚀 Features

### Student Module
- Dashboard with enrollment info, attendance stats, AI recommendations
- Course enrollment (database-driven, not hardcoded)
- Attendance tracking (overall %, subject-wise)
- Assignments, tasks, exams, notices
- Job/internship opportunities with AI matching
- Resume builder

### Faculty Module
- First-time setup wizard (College → Dept → Profile → Subjects)
- Take Attendance — select subject → student list → present/absent/late → submit
- Attendance history with filters
- Attendance reports per subject
- Mark all present feature
- Today's classes dashboard

### Admin Module
- College, Department, Course, Section management
- Student and Faculty management
- Notice and Event creation
- Opportunity management
- Support ticket management

### AI Features
- AI Chat Assistant (NVIDIA, Gemini, Groq)
- Daily Planner
- Skill Roadmap
- Job matching with AI scores

## 🛠️ Tech Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **AI:** NVIDIA NIM, Google Gemini, Groq
- **Deployment:** Vercel (Serverless)

## 📦 Local Development

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Setup database
cd ../server
cp .env.example .env  # Add your DATABASE_URL
npx prisma db push
npx prisma generate

# Seed test data
cd .. && node scripts/seed-faculty.mjs

# Run dev servers
cd server && npm run dev
cd ../client && npm run dev
```

## 🚢 Deployment

```bash
# Build client
cd client && npm run build

# Build server bundle
cd .. && npx esbuild server/src/app.js --bundle --platform=node --format=cjs --outfile=api/_app.cjs

# Deploy
npx vercel --yes --prod
```

## 📁 Project Structure
```
campusconnect/
├── api/                  # Vercel serverless entry
├── server/               # Backend (Express + Prisma)
│   ├── prisma/           # Database schema
│   └── src/              # Routes, middleware, services
├── client/               # Frontend (React + Vite)
│   └── src/              # Pages, components, context
├── scripts/              # Build & seed scripts
└── supabase-rls.sql      # Row Level Security policies
```

## 📄 Documentation
- [Handover Guide](./HANDOVER.md)
- [Deployment Notes](./campusconnect/DEPLOY-NOTES.md)
- [Session Summary](./campusconnect/CAMPUSCONNECT_SESSION_SUMMARY.md)

## 📝 License
MIT
