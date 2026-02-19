# 🚀 Launch Guide — Step-by-Step

**Goal:** Launch AIBA Arena today — miniapp live and usable from Telegram.

---

## ⚡ Quick Launch Checklist

```
✅ Backend deployed & healthy
✅ Miniapp deployed & connected to backend
✅ Telegram bot configured
✅ Core flow tested (create broker → run battle)
```

---

## Step 1: Backend Setup (Vercel)

### 1.1 Deploy Backend Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create/select **backend** project
3. **Root Directory:** `backend`
4. Connect your GitHub repo
5. Deploy

### 1.2 Set Environment Variables

**Vercel:** Backend project → **Settings** → **Environment Variables**

| Variable | Value | How to get |
|----------|-------|------------|
| **MONGO_URI** | `mongodb+srv://user:pass@cluster.mongodb.net/aiba_arena?retryWrites=true&w=majority` | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) → Create cluster → Connect → Copy URI, replace `<password>` |
| **APP_ENV** | `prod` | — |
| **CORS_ORIGIN** | `https://aiba-arena2-miniapp.vercel.app,https://aiba-arena2-admin-panel.vercel.app` | Your miniapp + admin URLs (comma-separated, no spaces) |
| **TELEGRAM_BOT_TOKEN** | `7123456789:AAH...` | [@BotFather](https://t.me/BotFather) → `/newbot` → Copy token |
| **TELEGRAM_INITDATA_MAX_AGE_SECONDS** | `600` | Recommended: 5-15 minutes |
| **ADMIN_JWT_SECRET** | `[32+ random chars]` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| **ADMIN_EMAIL** | `admin@yourdomain.com` | Your admin login email |
| **ADMIN_PASSWORD_HASH** | `$2b$10$...` | Bcrypt hash: `node -e "const bcrypt=require('bcrypt'); bcrypt.hash('YOUR_PASSWORD', 10).then(h=>console.log(h))"` |
| **BATTLE_SEED_SECRET** | `[32+ random chars]` | Different from ADMIN_JWT_SECRET |
| **PUBLIC_BASE_URL** | `https://aiba-arena2-backend.vercel.app` | Your backend URL (no trailing slash) |

**Generate secrets:**
```bash
# ADMIN_JWT_SECRET and BATTLE_SEED_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ADMIN_PASSWORD_HASH (from backend directory with bcrypt installed)
node -e "const bcrypt=require('bcrypt'); bcrypt.hash('YOUR_PASSWORD', 10).then(h=>console.log(h))"
```

### 1.3 Redeploy & Verify

1. **Redeploy** backend after setting env vars
2. **Check health:** Open `https://your-backend-url.vercel.app/health` → Should return `{"ok":true}`
3. **Check logs:** If backend fails, look for `PROD_READINESS_FAILED` in build logs

---

## Step 2: Miniapp Setup (Vercel)

### 2.1 Deploy Miniapp Project

1. Create/select **miniapp** project in Vercel
2. **Root Directory:** `miniapp`
3. Connect same GitHub repo
4. Deploy

### 2.2 Set Environment Variables

**Vercel:** Miniapp project → **Settings** → **Environment Variables**

| Variable | Value |
|----------|-------|
| **NEXT_PUBLIC_BACKEND_URL** | `https://aiba-arena2-backend.vercel.app` ← **Your backend URL** (NOT miniapp URL!) |
| **NEXT_PUBLIC_APP_URL** | `https://aiba-arena2-miniapp.vercel.app` ← Optional |

⚠️ **CRITICAL:** `NEXT_PUBLIC_BACKEND_URL` must be your **backend** URL, not the miniapp URL. Wrong value → 404/508 errors.

### 2.3 Redeploy & Verify

1. **Redeploy** miniapp (env vars are baked at build time)
2. **Open miniapp:** `https://aiba-arena2-miniapp.vercel.app`
3. **Check Network tab:** Requests to `/api/economy/me`, `/api/game-modes` should go to **backend** URL and return 200 or 401, **not** 404

---

## Step 3: Telegram Bot Setup

### 3.1 Create Bot (if not done)

1. Open Telegram, search `@BotFather`
2. Send `/newbot`
3. Follow prompts (name, username)
4. Copy token → Use as `TELEGRAM_BOT_TOKEN` in backend

### 3.2 Set Menu Button / Web App URL

**Option A: Menu Button**
1. In BotFather, send `/mybots` → Select your bot
2. **Bot Settings** → **Menu Button** → **Configure Menu Button**
3. **Button Text:** e.g., "Open App"
4. **URL:** `https://aiba-arena2-miniapp.vercel.app`

**Option B: Web App URL**
1. In BotFather, send `/mybots` → Select your bot
2. **Bot Settings** → **Web App**
3. Set URL: `https://aiba-arena2-miniapp.vercel.app`

---

## Step 4: Verification Tests

### 4.1 Backend Health

```bash
curl https://your-backend-url.vercel.app/health
# Expected: {"ok":true}
```

### 4.2 Miniapp Loads

- Open `https://aiba-arena2-miniapp.vercel.app` in browser
- Should load without errors
- Balance strip should appear (may show 401 if not from Telegram, that's OK)

### 4.3 API Calls Work

**Browser DevTools → Network tab:**
- Requests to `/api/economy/me`, `/api/game-modes`, `/api/tasks` should:
  - Go to **backend** URL (not miniapp URL)
  - Return 200 or 401 (not 404)

### 4.4 Core Flow Test

1. **Create broker:** Brokers tab → Create starter broker → Should succeed (no 508)
2. **Run battle:** Pick broker → Pick arena → Run battle → Should show score and rewards

---

## Step 5: Post-Launch (Optional but Recommended)

### 5.1 MemeFi Daily Rewards Cron

**Set up daily cron job** to distribute MemeFi rewards:

**Vercel Cron (recommended):**
1. Create `vercel.json` in repo root (if not exists):
```json
{
  "crons": [{
    "path": "/api/memefi/cron/daily-rewards",
    "schedule": "0 0 * * *"
  }]
}
```
2. Add header authentication in backend route or use `CRON_SECRET` env var

**Or external scheduler:**
- Call `POST https://your-backend-url.vercel.app/api/memefi/cron/daily-rewards` daily
- Header: `x-cron-secret: YOUR_CRON_SECRET` (set `CRON_SECRET` in backend env)

### 5.2 Seed Redemption Products

**Admin panel or API:**
```bash
POST https://your-backend-url.vercel.app/api/admin/redemption/seed
# Headers: Authorization: Bearer <admin-jwt-token>
```

Creates default products: school_fee_discount_10, lms_premium_1m, exam_prep_unlock, merch_tee

### 5.3 Monitoring

**Health check script:**
```bash
# Set BACKEND_URL env var
node scripts/health-check.js
```

**Or set up Vercel monitoring:**
- Uptime checks for `/health` endpoint
- Alert on failures

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **404 on `/api/economy/me`** | Set `NEXT_PUBLIC_BACKEND_URL` in miniapp to backend URL. Redeploy. |
| **508 on `/api/brokers/starter`** | `NEXT_PUBLIC_BACKEND_URL` is set to miniapp URL (wrong). Change to backend URL. |
| **Backend won't start** | Check logs for `PROD_READINESS_FAILED`. Set all required env vars. |
| **CORS errors** | `CORS_ORIGIN` in backend must include exact miniapp origin. Redeploy backend. |
| **401 / Telegram auth** | Open miniapp from Telegram bot. Or ensure `TELEGRAM_INITDATA_MAX_AGE_SECONDS` is reasonable (600). |

**Detailed troubleshooting:** [DEEP-ASSESSMENT-APP.md](DEEP-ASSESSMENT-APP.md)

---

## Launch Checklist (Copy & Tick)

```
Backend
[ ] Backend project deployed (Root: backend)
[ ] MONGO_URI set (MongoDB Atlas URI with password)
[ ] APP_ENV=prod set
[ ] CORS_ORIGIN set (miniapp + admin URLs, comma-separated)
[ ] TELEGRAM_BOT_TOKEN set (from BotFather)
[ ] TELEGRAM_INITDATA_MAX_AGE_SECONDS=600 set
[ ] ADMIN_JWT_SECRET set (32+ chars)
[ ] ADMIN_EMAIL set
[ ] ADMIN_PASSWORD_HASH set (bcrypt hash)
[ ] BATTLE_SEED_SECRET set (32+ chars, different from ADMIN_JWT_SECRET)
[ ] PUBLIC_BASE_URL set (backend URL, no trailing slash)
[ ] Backend redeployed after env changes
[ ] GET /health returns {"ok":true}

Miniapp
[ ] Miniapp project deployed (Root: miniapp)
[ ] NEXT_PUBLIC_BACKEND_URL set to BACKEND URL (not miniapp URL!)
[ ] NEXT_PUBLIC_APP_URL set (optional)
[ ] Miniapp redeployed after env changes
[ ] Miniapp loads at https://aiba-arena2-miniapp.vercel.app
[ ] Network tab shows API calls going to backend (no 404)

Telegram
[ ] Bot created in BotFather
[ ] TELEGRAM_BOT_TOKEN copied to backend env
[ ] Menu Button or Web App URL set to miniapp URL
[ ] Bot opens miniapp when clicked

Verify
[ ] Create broker works (no 508)
[ ] Run battle works (score and rewards shown)
[ ] No 404 on economy/me, game-modes, tasks
[ ] No 508 on brokers endpoints

Post-Launch (Optional)
[ ] MemeFi cron scheduled (daily rewards)
[ ] Redemption products seeded
[ ] Monitoring set up
```

---

## 🎉 You're Launched!

Once all checks pass:
- ✅ App is live and usable
- ✅ Users can open from Telegram bot
- ✅ Core flow works (create broker → run battle → earn rewards)

**Next steps:**
- Monitor health endpoint
- Set up MemeFi daily rewards cron
- Configure monitoring/alerting
- Add optional features as needed

---

## Quick Reference URLs

| Service | URL |
|---------|-----|
| **Miniapp** | https://aiba-arena2-miniapp.vercel.app |
| **Admin Panel** | https://aiba-arena2-admin-panel.vercel.app |
| **Backend** | https://aiba-arena2-backend.vercel.app (your actual URL) |
| **Backend Health** | https://your-backend-url.vercel.app/health |

---

**Need help?** See:
- [LAUNCH-TODAY-ASSESSMENT.md](LAUNCH-TODAY-ASSESSMENT.md) — Detailed assessment
- [DEPLOYMENT-AND-ENV.md](DEPLOYMENT-AND-ENV.md) — Full env guide
- [PRODUCTION-ENV-VERCEL.md](PRODUCTION-ENV-VERCEL.md) — Copy-paste env values
