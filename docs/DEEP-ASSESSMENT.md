# Deep assessment — AIBA Arena 2

**Date:** Feb 2026  
**Scope:** Miniapp, backend, API contract, deployment, console errors.

---

## 1. Console errors you’re seeing

| Error | Cause | Severity | What to do |
|-------|--------|----------|------------|
| **css2:1 Failed to load resource: net::ERR_NETWORK_CHANGED** | Transient network (Wi‑Fi/cellular switch, VPN). | Low | Ignore; retry. |
| **chrome-extension://…content_reporter.js — Unexpected token 'export'** | Browser extension injecting ESM as classic script. | None (not your app) | Ignore; or test in Incognito with extensions off. See [MINIAPP-RUNTIME-ERRORS-INVESTIGATION.md](MINIAPP-RUNTIME-ERRORS-INVESTIGATION.md). |
| **404 on /api/economy/me, /api/daily/status, /api/referrals/me, /api/referrals/top, /api/game-modes, /api/tasks** | Requests not reaching your backend, or backend missing routes. | **High** | See §2 and §3 below. |
| **508 on /api/brokers/mine, /api/brokers/starter** | Loop or gateway issue (e.g. proxy loop if backend URL points to miniapp). | **High** | See §2 and §3 below. |

---

## 2. Why 404s and 508s happen (root cause)

### How the miniapp calls the backend

- **Most calls** use `api = createApi(BACKEND_URL)` with  
  `BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'`.
- **Some broker calls** use `proxyApi = createApi('')` (same-origin). Those hit the **miniapp** at `/api/brokers/...`; the Next.js route in `miniapp/src/app/api/brokers/[[...path]]/route.js` **proxies** to `NEXT_PUBLIC_BACKEND_URL/api/brokers/...`.

So:

- If **NEXT_PUBLIC_BACKEND_URL** is **not set** on the **deployed miniapp** (Vercel):
  - In the browser, `BACKEND_URL` is `http://localhost:5000`.
  - All `api.get/post` requests go to the **user’s** localhost, not your backend → connection errors or, if they have something on :5000, 404.
- If **NEXT_PUBLIC_BACKEND_URL** is set to the **miniapp URL** by mistake:
  - Proxy calls go: miniapp → same-origin `/api/brokers/*` → proxy → “backend” (miniapp again) → proxy → … → **508 Loop Detected** (or similar).
- If the **backend** is not deployed, or is an **old build** without those routes, you get **404** from the backend (or gateway).

### Backend route check

All of these **exist** in the backend and are mounted in `backend/app.js`:

- `/api/economy` → economy (includes `/api/economy/me`)
- `/api/daily` → daily (includes `/api/daily/status`)
- `/api/referrals` → referrals (includes `/api/referrals/me`, `/api/referrals/top`)
- `/api/game-modes` → gameModes
- `/api/tasks` → tasks
- `/api/brokers` → brokers (includes `/api/brokers/mine`, `/api/brokers/starter`)

So 404/508 are **not** due to missing route files; they are due to **deployment / env / proxy**.

---

## 3. Deployment and env checklist (fix for 404/508)

Do this in order:

1. **Backend on Vercel**
   - Deploy the **backend** project (Root Directory: `backend/`).
   - Set env (e.g. `MONGO_URI`, `CORS_ORIGIN`, `TELEGRAM_BOT_TOKEN`, etc.).
   - Copy the backend URL, e.g. `https://your-backend.vercel.app`.

2. **Miniapp on Vercel**
   - In the **miniapp** project, set:
     - **NEXT_PUBLIC_BACKEND_URL** = `https://your-backend.vercel.app` (no trailing slash).
   - **Do not** set it to the miniapp URL (would cause proxy loop → 508).
   - Redeploy the miniapp so the new env is in the build.

3. **CORS**
   - In the **backend** project, set **CORS_ORIGIN** to include:
     - Miniapp URL, e.g. `https://aiba-arena2-miniapp.vercel.app`
     - Admin URL if you use it.
   - Redeploy the backend.

4. **Verify**
   - Open the miniapp in the browser; check Network tab.
   - Calls to `/api/economy/me`, `/api/daily/status`, etc. should go to `https://your-backend.vercel.app/...` and return 200 (or 401 if auth is required), not 404.
   - Calls to `/api/brokers/starter` go to same-origin then proxy to backend; they should not return 508.

---

## 4. Architecture summary

| Layer | Tech | Purpose |
|-------|------|--------|
| **Miniapp** | Next.js 13.5 (App Router), React 18 | UI; runs on Vercel; env: `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_APP_URL`. |
| **Backend** | Express, Node, MongoDB | API; runs on Vercel or localhost; auth via `x-telegram-init-data` or `x-telegram-id`. |
| **Broker proxy** | Next.js route `app/api/brokers/[[...path]]` | Forwards same-origin `/api/brokers/*` to `BACKEND_URL/api/brokers/*` to avoid CORS. |
| **Admin** | Next.js | Admin UI; uses same backend URL. |

- **Madge:** No circular dependencies in miniapp `src`.
- **API surface:** Backend has 60+ route modules; miniapp and admin call a large subset (economy, daily, referrals, game-modes, tasks, brokers, marketplace, staking, etc.). See `docs/API-CONTRACT.md`.

---

## 5. Gaps and risks

| Area | Finding | Recommendation |
|------|--------|-----------------|
| **Env in production** | If `NEXT_PUBLIC_BACKEND_URL` is missing or wrong, all backend calls fail (404/connection/508). | Enforce in docs and Vercel: miniapp must have `NEXT_PUBLIC_BACKEND_URL` = backend URL. |
| **508 on broker proxy** | Can occur if backend URL is mis-set to miniapp URL. | Document clearly; consider a startup or build check that backend URL ≠ app URL. |
| **Extension noise** | `content_reporter.js` and similar clutter the console. | Document; optionally show a short “disable extensions if you see errors” note in app or README. |
| **Runtime TDZ** | Chunk 117 “Cannot access 'dw' before initialization” (Next.js runtime). | Pinned Next 13.5.8; see [MINIAPP-RUNTIME-ERRORS-INVESTIGATION.md](MINIAPP-RUNTIME-ERRORS-INVESTIGATION.md). |
| **Backend 404** | All listed routes exist in code; 404 in production = wrong host or old backend deploy. | Ensure backend is deployed from same repo and CORS includes miniapp origin. |

---

## 6. Quick reference

- **Console errors and 404/508 fix:** [APP-DEEP-ASSESSMENT.md](APP-DEEP-ASSESSMENT.md) (checklist and your exact errors).
- **Full detailed assessment (request flow, route audit, file paths):** [DEEP-ASSESSMENT-APP.md](DEEP-ASSESSMENT-APP.md).
- **Miniapp URL:** [https://aiba-arena2-miniapp.vercel.app](https://aiba-arena2-miniapp.vercel.app)
- **Backend:** Must be deployed and its URL set as `NEXT_PUBLIC_BACKEND_URL` in the miniapp project.
- **Deployment and env:** [DEPLOYMENT-AND-ENV.md](DEPLOYMENT-AND-ENV.md)
- **Runtime errors (TDZ, export):** [MINIAPP-RUNTIME-ERRORS-INVESTIGATION.md](MINIAPP-RUNTIME-ERRORS-INVESTIGATION.md)
- **API contract:** [API-CONTRACT.md](API-CONTRACT.md)
