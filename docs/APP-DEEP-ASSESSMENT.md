# App deep assessment — console errors and 404/508

**Date:** Feb 2026  
**Trigger:** Console errors when loading https://aiba-arena2-miniapp.vercel.app

---

## Your exact console errors → cause and fix

| What you see | Cause | Action |
|--------------|--------|--------|
| **css2:1 Failed to load resource: net::ERR_NETWORK_CHANGED** | Network changed (Wi‑Fi/cellular/VPN) during load. | Ignore or refresh. |
| **chrome-extension://…content_reporter.js: Uncaught SyntaxError: Unexpected token 'export'** | A **browser extension** injects a script that uses ESM but runs as classic script. | Not your app. Ignore, or test in Incognito with extensions disabled. |
| **404** on `/api/economy/me`, `/api/daily/status`, `/api/referrals/me`, `/api/referrals/top`, `/api/game-modes`, `/api/tasks` | Requests are **not reaching your backend** (wrong host or backend not deployed). | Set **NEXT_PUBLIC_BACKEND_URL** in Vercel miniapp to your backend URL. Redeploy miniapp. See checklist below. |
| **508** on `/api/brokers/mine`, `/api/brokers/starter` | **Loop detected**: often because backend URL is set to the **miniapp** URL, so proxy calls miniapp → proxy → miniapp → … | Set **NEXT_PUBLIC_BACKEND_URL** to the **backend** URL only (e.g. `https://aiba-arena2-backend.vercel.app`). Never the miniapp URL. Redeploy. |

---

## First things to check (fix for 404 and 508)

1. **Vercel → Miniapp project → Settings → Environment Variables**
   - **NEXT_PUBLIC_BACKEND_URL** = your **backend** URL (e.g. `https://aiba-arena2-backend.vercel.app`).
   - No trailing slash. Must **not** be the miniapp URL.

2. **Backend**
   - Backend project is deployed and latest deployment is **Ready**.
   - **CORS_ORIGIN** in backend includes the miniapp origin (e.g. `https://aiba-arena2-miniapp.vercel.app`).

3. **Redeploy**
   - After changing env, **redeploy the miniapp** (NEXT_PUBLIC_* is baked at build time).

4. **Verify**
   - Open miniapp → Network tab. Calls to `/api/economy/me`, `/api/tasks`, etc. should go to `https://your-backend.vercel.app/...` and return 200 or 401, not 404.  
   - Broker calls go to same-origin then proxy to backend; they must not return 508.

---

## How the miniapp talks to the backend

- **Most API calls** use `api = createApi(getBackendUrl())`.  
  `getBackendUrl()` returns `NEXT_PUBLIC_BACKEND_URL` if set; else when opened at `https://aiba-arena2-miniapp.vercel.app` it falls back to `https://aiba-arena2-backend.vercel.app`; else `http://localhost:5000`.  
  So if **NEXT_PUBLIC_BACKEND_URL** is **not set** on Vercel, production build still gets the fallback only when `window.location.origin` is exactly that miniapp URL; otherwise you can get wrong host and 404.

- **Broker proxy:** `proxyApi = createApi('')` sends to same-origin `/api/brokers/*`. The Next.js route `miniapp/src/app/api/brokers/[[...path]]/route.js` forwards to `NEXT_PUBLIC_BACKEND_URL/api/brokers/*`. If that env points to the miniapp URL, you get a redirect/proxy loop → **508**.

---

## Backend routes (all exist in code)

These are mounted in `backend/app.js`; 404 in production means the request is hitting the wrong server or an old backend:

- `/api/economy` (includes `/me`)
- `/api/daily` (includes `/status`, `/claim`)
- `/api/referrals` (includes `/me`, `/top`)
- `/api/game-modes`
- `/api/tasks`
- `/api/brokers` (includes `/mine`, `/starter`)

---

## References

- Full deep assessment (root cause, architecture, gaps): [DEEP-ASSESSMENT.md](DEEP-ASSESSMENT.md)
- Full detailed assessment (API request flow, backend route audit, file paths): [DEEP-ASSESSMENT-APP.md](DEEP-ASSESSMENT-APP.md)
- Deployment and env: [DEPLOYMENT-AND-ENV.md](DEPLOYMENT-AND-ENV.md)
- Runtime errors (TDZ, export): [MINIAPP-RUNTIME-ERRORS-INVESTIGATION.md](MINIAPP-RUNTIME-ERRORS-INVESTIGATION.md)
- API contract: [API-CONTRACT.md](API-CONTRACT.md)
