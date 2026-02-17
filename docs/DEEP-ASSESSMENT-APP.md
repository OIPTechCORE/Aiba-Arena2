# Deep assessment — AIBA Arena app

Assessment date: Feb 2026. Covers miniapp, backend, API contract, and the console/network errors you reported.

---

## 1. Console / network errors you reported

| What you see | Cause | Action |
|--------------|--------|--------|
| **css2:1 Failed to load resource: net::ERR_NETWORK_CHANGED** | Network changed (Wi‑Fi/cellular/VPN) while loading a resource. | Ignore or retry; not a bug in the app. |
| **chrome-extension://…content_reporter.js … Unexpected token 'export'** | A **browser extension** injects a script that uses ESM but is run as a classic script. | Not from our app. Disable extensions or use Incognito to confirm. See [MINIAPP-RUNTIME-ERRORS-INVESTIGATION.md](MINIAPP-RUNTIME-ERRORS-INVESTIGATION.md). |
| **/api/economy/me, /api/daily/status, /api/referrals/me, /api/referrals/top, /api/game-modes, /api/tasks → 404** | Requests are either (A) going to the **miniapp origin** (no such Next.js route) or (B) the **backend URL is wrong or backend is not running**. | See §2 and §3 below. |
| **/api/brokers/mine, /api/brokers/starter → 508** | HTTP 508 “Loop Detected” usually comes from a **proxy/CDN** (e.g. redirect loop), not from our backend (we never send 508). | Check Vercel/network; ensure backend URL is correct and no redirect loop. |

---

## 2. Where the miniapp sends API requests

- **Main API client:** `api = createApi(getBackendUrl())` in `HomeContent.js` (and trainer page). So `api.get('/api/economy/me')` is sent to **`getBackendUrl()` + `/api/economy/me`**.
- **getBackendUrl()** (in `miniapp/src/lib/api.js`):
  - If `NEXT_PUBLIC_BACKEND_URL` is set (at **build time** on Vercel) → that base URL.
  - Else if in browser and `window.location.origin === 'https://aiba-arena2-miniapp.vercel.app'` → `https://aiba-arena2-backend.vercel.app`.
  - Else → `process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'` (at build time this can be empty → **localhost**).

So if the **miniapp is built on Vercel without `NEXT_PUBLIC_BACKEND_URL`**, the built JS may use `http://localhost:5000` for API calls. In the user’s browser, requests would then go to **their** machine’s localhost → 404 or connection refused. That matches “API 404s” when the backend is actually deployed.

- **Broker proxy:** `proxyApi = createApi('')` → requests to **same origin** (miniapp). So `proxyApi.post('/api/brokers/starter', {})` hits **miniapp** `/api/brokers/starter`, which is handled by the Next.js route `api/brokers/[[...path]]/route.js` and **proxied** to the backend. That path is the only one that works without a correct `getBackendUrl()`.

**Conclusion:** The 404s for `/api/economy/me`, `/api/daily/status`, `/api/referrals/*`, `/api/game-modes`, `/api/tasks` are most likely because the **miniapp is not using the real backend URL** (missing or wrong `NEXT_PUBLIC_BACKEND_URL` on Vercel, or origin check failing).

---

## 3. Backend route audit (miniapp vs backend)

All of these **exist** in the backend and are mounted in `backend/app.js`:

| Miniapp calls | Backend route | Mount in app.js |
|---------------|----------------|-----------------|
| GET /api/economy/me | economy.js `router.get('/me', ...)` | app.use('/api/economy', economy) |
| GET /api/daily/status | daily.js `router.get('/status', ...)` | app.use('/api/daily', daily) |
| GET /api/referrals/me, GET /api/referrals/top | referrals.js | app.use('/api/referrals', referrals) |
| GET /api/game-modes | gameModes.js `router.get('/', ...)` | app.use('/api/game-modes', gameModes) |
| GET /api/tasks | tasks.js `router.get('/', ...)` | app.use('/api/tasks', tasks) |
| GET /api/brokers/mine, POST /api/brokers/starter | brokers.js | app.use('/api/brokers', brokers) |

So **no missing backend routes** for the failing URLs. The problem is that requests are not reaching the backend (wrong host or backend down).

---

## 4. Required fix: backend URL in production

**On Vercel (miniapp project):**

1. **Settings → Environment Variables**
2. Add (or fix):
   - **Name:** `NEXT_PUBLIC_BACKEND_URL`
   - **Value:** your backend URL, e.g. `https://aiba-arena2-backend.vercel.app` (no trailing slash)
   - **Environment:** Production (and Preview if you use previews)
3. **Redeploy the miniapp** (new build so the variable is baked in).

After that, all `api.get/post(...)` calls will go to the backend and the 404s for economy, daily, referrals, game-modes, tasks should stop (assuming the backend is up and returns 2xx/4xx/5xx, not 404).

---

## 5. Optional: robust backend URL without env

To avoid depending on build-time env for production, you can make the client always use the known backend when on the known miniapp domain (already partially there). In `miniapp/src/lib/api.js`, `getBackendUrl()` already falls back to `https://aiba-arena2-backend.vercel.app` when `window.location.origin === 'https://aiba-arena2-miniapp.vercel.app'`. So if the miniapp is always opened from that exact URL, 404s could still be from:

- Miniapp opened from another origin (e.g. Telegram or a different domain), so the fallback is not used and `process.env.NEXT_PUBLIC_BACKEND_URL` (empty at build) → localhost, or
- CORS / backend not reachable.

**Recommendation:** Set `NEXT_PUBLIC_BACKEND_URL` on Vercel for the miniapp so the backend URL is correct regardless of origin. Optionally extend the origin check to include Telegram’s webview origin if you detect it (e.g. `t.me` or your bot’s miniapp URL).

---

## 6. 508 on /api/brokers/mine and /api/brokers/starter

- The **backend** never sends **508** (no `res.status(508)` in the repo).
- 508 “Loop Detected” usually comes from a **proxy** (e.g. Vercel, or a redirect loop).
- **Brokers/mine** is called with `api.get('/api/brokers/mine')` → goes to **backend** (if baseURL is correct).
- **Brokers/starter** is called with `proxyApi.post('/api/brokers/starter', {})` → goes to **miniapp** → Next.js proxy → backend.

If you see 508 only on these two, possibilities:

- Redirect loop between miniapp and backend (e.g. backend redirects to miniapp, miniapp to backend).
- A proxy in front of the backend returning 508 (e.g. under load or misconfiguration).

**Actions:** After fixing `NEXT_PUBLIC_BACKEND_URL`, if 508 persists: (1) In browser DevTools → Network, check the **request URL** for the 508 responses (miniapp vs backend). (2) Check Vercel backend logs and any custom proxy/redirect rules.

---

## 7. Summary checklist

| Item | Status / action |
|------|------------------|
| Extension “content_reporter” export error | Not our app; ignore or disable extension. |
| ERR_NETWORK_CHANGED | Network event; ignore or retry. |
| 404 on /api/economy/me, daily, referrals, game-modes, tasks | Set **NEXT_PUBLIC_BACKEND_URL** on Vercel miniapp and redeploy. |
| 508 on /api/brokers/mine, /api/brokers/starter | Investigate proxy/redirect; ensure backend URL is correct and backend is healthy. |
| Backend routes | All required routes exist and are mounted; no missing endpoints. |

---

## 8. References

- Backend mount: `backend/app.js`
- Miniapp API base URL: `miniapp/src/lib/api.js` (`getBackendUrl`, `createApi`)
- Miniapp usage: `miniapp/src/app/HomeContent.js` (`api`, `proxyApi`)
- Broker proxy: `miniapp/src/app/api/brokers/[[...path]]/route.js`
- Runtime errors (TDZ, export): [MINIAPP-RUNTIME-ERRORS-INVESTIGATION.md](MINIAPP-RUNTIME-ERRORS-INVESTIGATION.md)
- Deployment and env: [DEPLOYMENT-AND-ENV.md](DEPLOYMENT-AND-ENV.md)
