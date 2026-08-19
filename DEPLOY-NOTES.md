# 🚀 Deploy Notes — CAMPUSCONNECT (kal se resume karna)

## ✅ Ho chuka hai
- [x] `render.yaml` ban gaya (Render blueprint — build, start command, env vars)
- [x] `package.json` mein Node >= 20 engines add hua
- [x] `server/.env` ban gaya — **JWT_SECRET ready hai** (is file mein; ye gitignored hai, commit nahi hoga)
  - JWT_SECRET: `08c0278f9fc18b2f78b61ba62cfb260de0b0db9a96a339302b93b951932f2860`
- [x] Deploy files commit ho gaye: commit `b765bde` (`master` branch par)
- [x] Client build test pass ✅ (`npm run build` works)

## ⏳ Baaki hai
- [ ] **Supabase DATABASE_URL** — user se asli password wala connection string lena
  - Abhi sirf host mila: `postgresql://postgres:[PASSWORD]@db.lvdlmuqkbtrycvktrpga.supabase.co:5432/postgres`
  - Source: Supabase dashboard → Project Settings → Database → Connection string (URI, password ke saath)
  - Isko `server/.env` mein `DATABASE_URL=` mein dalna
- [ ] **GitHub repo** banana (`campusconnect`, public, khali) + push:
  ```bash
  git remote add origin https://github.com/USERNAME/campusconnect.git
  git branch -M master
  git push -u origin master
  ```
- [ ] **Render service** banana: render.com → New → Blueprint → ye repo
  - Env vars fill karni hain: `DATABASE_URL`, `JWT_SECRET` (upar wala), `GEMINI_API_KEY` (optional, khali chhod sakte ho), `PUBLIC_URL` (live URL)
- [ ] Live verify: `/api/health` + demo login (`student@demo.campusconnect` / `demo1234`)

## 📌 Yaad rakhne wali baatein
- **Uncommitted UI changes** abhi bhi pending hain (user ne sirf deploy files commit karne ko kaha):
  - `client/src/components/Layout.jsx`, `UI.jsx`, `motion.jsx` (new), `index.css`, `pages/Dashboard.jsx`, `pages/admin/AdminOverview.jsx`, `tailwind.config.js`
  - Ye disk par safe hain, bas commit nahi hue — live site mein tab tak nahi aayenge jab tak commit + push na ho
- Live hone ke baad har change: `git add .` → `git commit` → `git push` → Render auto-deploy
- Render free plan: 15 min idle par spin-down, pehla request ~1 min late hota hai — normal hai
- File uploads (resumes) local disk par hain — Render par redeploy par reset ho jayenge (demo ke liye chalega)
