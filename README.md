# ExpenseTrack

A full-stack daily expense tracker with user authentication, PWA support, and cloud deployment.

**Stack:** React + Vite → Vercel | Express + PostgreSQL → Railway

---

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ ([download for Windows](https://www.postgresql.org/download/windows/))

### Automated setup (Windows)
```powershell
.\setup-local.ps1
```
This creates the database and generates `backend/.env` automatically.

### Manual setup
```bash
npm run install:all && npm install
cp backend/.env.example backend/.env
# Edit backend/.env with your PostgreSQL password
psql -U postgres -c "CREATE DATABASE expensetrack;"
npm run dev
```

### Seed sample data (optional)
```bash
cd backend && npm run seed
# Login: test@example.com / password123
```

---

## Deployment

### Step 1 — Push to GitHub
```bash
git init && git add . && git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git
git push -u origin main
```

### Step 2 — Backend on Railway
1. [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select repo → set root directory to `backend`
3. Add service: **New → Database → PostgreSQL** (injects DATABASE_URL automatically)
4. Add variables (Settings → Variables):
   ```
   JWT_SECRET=any-long-random-string
   NODE_ENV=production
   FRONTEND_URL=https://your-app.vercel.app
   ```
5. Settings → Networking → Generate Domain → copy your Railway URL
6. Test: `https://your-railway-url/api/health` → should return `{"status":"ok"}`

### Step 3 — Frontend on Vercel
1. [vercel.com](https://vercel.com) → New Project → import repo
2. Root directory: `frontend` | Framework: Vite
3. Add environment variable:
   ```
   VITE_API_URL=https://your-railway-url.up.railway.app
   ```
4. Deploy → get your Vercel URL
5. Go back to Railway → update `FRONTEND_URL` to your Vercel URL → redeploy

---

## Environment Variables

### backend/.env
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/expensetrack
JWT_SECRET=long-random-string-here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### frontend/.env.production (for manual builds)
```env
VITE_API_URL=https://your-railway-url.up.railway.app
```

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED` on start | PostgreSQL not running — start from Windows Services |
| `password authentication failed` | Wrong password in DATABASE_URL |
| `database does not exist` | Run `psql -U postgres -c "CREATE DATABASE expensetrack;"` |
| Railway deploy fails | Check logs — usually a missing env var |
| Vercel blank page | Check browser console — likely VITE_API_URL not set |
| CORS error in production | FRONTEND_URL on Railway must exactly match your Vercel URL |
