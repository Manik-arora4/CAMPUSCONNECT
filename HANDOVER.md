# CampusConnect — Handover Documentation

## 📋 Project Overview

CampusConnect is a **full-stack college management platform** designed for colleges to manage students, faculty, attendance, courses, and career opportunities.

| Component | Technology |
|-----------|-----------|
| **Frontend** | React + Vite + Tailwind CSS |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma |
| **AI Features** | NVIDIA NIM, Gemini, Groq |
| **Deployment** | Vercel (Serverless) |

---

## 🌐 Live URLs

| URL | Description |
|-----|-------------|
| **App** | https://campusconnect-rho-one.vercel.app |
| **GitHub** | https://github.com/Manik-arora4/CAMPUSCONNECT |

---

## 🔑 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@iet.edu | admin1234 |
| **Faculty** | dr.sharma@iet.edu | faculty1234 |
| **Faculty** | prof.gupta@iet.edu | faculty1234 |
| **Student** | student1@iet.edu | student1234 |
| **Student** | student2@iet.edu | student1234 |

---

## 🗄️ Database Structure

### Tables (25+ models)

```
College → Department → Course → Section → Students
                                    ↓
College → Department → Faculty → Subjects → Assigned Classes
```

**Core Tables:**
| Table | Purpose |
|-------|---------|
| User | All users (Admin, Faculty, Student) |
| StudentProfile | Student details |
| FacultyProfile | Faculty details + assigned subjects |
| College | College info |
| Department | Departments |
| Course | Courses (B.Tech CSE, BCA, etc.) |
| Section | Course sections (A, B) |
| Subject | Subjects per course |
| Enrollment | Student ↔ Course link |
| AttendanceSession | Faculty-created attendance session |
| Attendance | Individual attendance records |
| Notice | College notices |
| Event | College events |
| Opportunity | Job/internship opportunities |
| Application | Student job applications |

---

## 📁 Project Structure

```
campusconnect/
├── api/                    # Vercel serverless entry
│   ├── index.js           # Vercel loader
│   └── _app.cjs           # Bundled Express server (5.5MB)
├── server/                 # Backend source
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── src/
│   │   ├── app.js         # Express app (routes, middleware)
│   │   ├── index.js       # Server entry point
│   │   ├── config/        # DB, env config
│   │   ├── lib/           # Prisma client (lazy-loaded)
│   │   ├── middleware/     # Auth, roles, validation
│   │   ├── routes/        # 23 route files
│   │   ├── services/      # AI, notifications, scheduling
│   │   └── utils/         # Helpers
│   └── .env               # Environment variables
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Routes
│   │   ├── main.jsx       # Entry point
│   │   ├── components/    # Layout, UI components
│   │   ├── context/       # Auth context
│   │   ├── lib/           # API client, helpers
│   │   └── pages/         # All pages
│   │       ├── faculty/   # Faculty pages (Dashboard, Setup, TakeAttendance, AttendanceHistory)
│   │       ├── admin/     # Admin pages
│   │       ├── ai/        # AI pages
│   │       └── ...        # Student pages
│   └── public/            # Static assets
├── scripts/
│   ├── build-vercel.mjs   # Build script
│   └── seed-faculty.mjs   # Database seeder
├── vercel.json             # Vercel config
└── supabase-rls.sql        # Row Level Security policies
```

---

## 🚀 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user |

### Faculty Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/faculty-attendance/today` | Today's classes + sessions |
| GET | `/api/faculty-attendance/courses` | Faculty's assigned courses |
| POST | `/api/faculty-attendance/session` | Create attendance session |
| GET | `/api/faculty-attendance/session/:id/students` | Get students for session |
| POST | `/api/faculty-attendance/session/:id/mark` | Mark attendance (batch) |
| POST | `/api/faculty-attendance/session/:id/mark-all` | Mark all present |
| PATCH | `/api/faculty-attendance/session/:id/finalize` | Finalize session |
| GET | `/api/faculty-attendance/history` | Attendance history |
| GET | `/api/faculty-attendance/report` | Attendance report |

### Student
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students/me` | Student profile |
| GET | `/api/students/me/enrollment` | Current enrollment |
| GET | `/api/students/courses` | Available courses |
| POST | `/api/students/enroll` | Enroll in course |
| GET | `/api/students/dashboard` | Dashboard data |
| GET | `/api/students/attendance` | Attendance records |
| GET | `/api/students/attendance/stats` | Attendance statistics |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all courses |
| GET | `/api/courses/:id` | Course detail |
| POST | `/api/courses` | Create course (admin) |
| PUT | `/api/courses/:id` | Update course (admin) |

### Faculty
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/faculty/dashboard` | Faculty dashboard |
| GET | `/api/faculty/me/profile` | Get faculty profile |
| PATCH | `/api/faculty/me/profile` | Update faculty profile |
| GET | `/api/faculty/my-students` | Faculty's students |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Admin dashboard |
| GET | `/api/admin/faculty` | All faculty |
| GET | `/api/admin/students` | All students |
| GET | `/api/admin/colleges` | All colleges |
| GET | `/api/admin/departments` | All departments |
| GET | `/api/admin/subjects` | All subjects |
| GET | `/api/admin/pending-users` | Pending approvals |

---

## 👥 Roles & Permissions

| Feature | Admin | Faculty | Student |
|---------|-------|---------|---------|
| Manage College/Dept/Courses | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| Take Attendance | ❌ | ✅ (own classes) | ❌ |
| Mark Attendance | ❌ | ✅ | ❌ (view only) |
| View Attendance | ✅ (all) | ✅ (own classes) | ✅ (own) |
| View Own Profile | ✅ | ✅ | ✅ |
| Apply to Jobs | ❌ | ❌ | ✅ |
| View Notices | ✅ | ✅ | ✅ |
| Create Notices | ✅ | ✅ | ❌ |

---

## 🛡️ Security

### Row Level Security (RLS)
Run `supabase-rls.sql` in Supabase SQL Editor to enable RLS on all tables.

**Key policies:**
- Students see only their own data
- Faculty see only their assigned classes/students
- Admins see everything
- Unauthorized access returns 403

### JWT Authentication
- Token stored in localStorage
- Auto-attached to all API requests
- Role-based middleware on backend

---

## 🚢 Deployment

### Vercel
1. Push to GitHub
2. Vercel auto-deploys on push
3. Server bundle: `npx esbuild server/src/app.js --bundle --platform=node --format=cjs --outfile=api/_app.cjs`

### Environment Variables (Vercel)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `NVIDIA_API_KEY` | NVIDIA NIM API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GROQ_API_KEY` | Groq API key |

### Database Migration
```bash
cd server
npx prisma db push          # Push schema changes
npx prisma generate         # Generate Prisma client
```

### Seed Test Data
```bash
node scripts/seed-faculty.mjs
```

---

## 📊 Capacity

| Resource | Limit | Practical Size |
|----------|-------|----------------|
| Students | 10,000+ | College-wide |
| Faculty | 500+ | Full staff |
| Storage | 500 MB (free tier) | ~50 MB for 5,000 students |

---

## 🐛 Common Issues

### 1. Vercel 404 on API routes
**Fix:** Ensure `api/_app.cjs` is rebuilt:
```bash
npx esbuild server/src/app.js --bundle --platform=node --format=cjs --outfile=api/_app.cjs
```

### 2. Prisma client not found
**Fix:** Regenerate:
```bash
cd server && npx prisma generate
```

### 3. Database connection timeout
**Fix:** Use direct connection (port 5432) instead of pooler (6543):
```
postgresql://user:pass@db.xxx.supabase.co:5432/postgres
```

### 4. RLS blocking queries
**Fix:** Check `supabase-rls.sql` policies or temporarily disable RLS:
```sql
ALTER TABLE "Attendance" DISABLE ROW LEVEL SECURITY;
```

---

## 📱 Mobile Support

All pages are responsive with:
- Collapsible sidebar (hamburger menu on mobile)
- Responsive grid layouts (1-col → 2-col → 3-col)
- Touch-friendly buttons and inputs
- Mobile-optimized tables (horizontal scroll)

---

## 📞 Support

| Contact | Details |
|---------|---------|
| **Email** | campusconnect.ia@gmail.com |
| **GitHub Issues** | https://github.com/Manik-arora4/CAMPUSCONNECT/issues |

---

## ✅ Post-Deployment Checklist

- [ ] Run `supabase-rls.sql` in Supabase SQL Editor
- [ ] Verify all env vars are set in Vercel
- [ ] Test login for all 3 roles
- [ ] Test faculty attendance flow
- [ ] Test student enrollment
- [ ] Test on mobile devices
- [ ] Check error handling (invalid login, network errors)
- [ ] Verify all buttons work (no dead links)

---

*Generated by CampusConnect Team — August 2026*
