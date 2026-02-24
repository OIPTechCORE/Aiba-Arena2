# Launch today — assessment

**Date:** Feb 2026  
**Goal:** Launch the app today (miniapp live and usable from Telegram or direct URL).

---

## 1. Verdict: **You can launch today** if you complete the checklist below

The app is **launchable** once:

- Backend is deployed and healthy.
- Miniapp talks to the backend (no 404/508).
- Telegram bot opens the miniapp (optional but expected for “launch”).
- Core flow works: open app → create/view broker → run battle → see rewards.

No code change is strictly required if your Vercel env and Telegram setup are correct. The main risk is **wrong or missing env** (especially backend URL and CORS).

---

## 2. Must-do before launch (≈15–30 min)

### 2.1 Backend (Vercel backend project)

| Step | What to do                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------ |
| 1    | **Deploy backend** — Root Directory = `backend`. Latest deployment = **Ready**.                                    |
| 2    | **Env vars** — In backend project → Settings → Environment Variables, set at least:                                |
|      | **MONGO_URI** — MongoDB Atlas URI (replace `<password>`).                                                          |
|      | **APP_ENV** — `prod`.                                                                                              |
|      | **CORS_ORIGIN** — `https://aiba-arena2-miniapp.vercel.app,https://aiba-arena2-admin-panel.vercel.app` (no spaces). |
|      | **TELEGRAM_BOT_TOKEN** — From [@BotFather](https://t.me/BotFather).                                                |
|      | **TELEGRAM_INITDATA_MAX_AGE_SECONDS** — e.g. `600`.                                                                |
|      | **ADMIN_JWT_SECRET** — ≥32 random chars.                                                                           |
|      | **ADMIN_EMAIL** — Your admin login email.                                                                          |
|      | **ADMIN_PASSWORD_HASH** — Bcrypt hash of admin password (see [DEPLOYMENT-AND-ENV.md](DEPLOYMENT-AND-ENV.md)).      |
|      | **BATTLE_SEED_SECRET** — ≥32 random chars (different from ADMIN_JWT_SECRET).                                       |
|      | **PUBLIC_BASE_URL** — Backend URL, e.g. `https://aiba-arena2-backend.vercel.app` (no trailing slash).              |
| 3    | **Redeploy** backend after changing env.                                                                           |
| 4    | **Check health** — Open `https://<your-backend-url>/health` in browser. Expect 200 and a healthy response.         |

If the backend fails to start, check build logs for **PROD_READINESS_FAILED** or missing env (see [DEPLOYMENT-AND-ENV.md](DEPLOYMENT-AND-ENV.md)).

### 2.2 Miniapp (Vercel miniapp project)

| Step | What to do                                                                                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | **Deploy miniapp** — Root Directory = `miniapp`. Latest deployment = **Ready**.                                                                                                |
| 2    | **Env vars** — In miniapp project → Settings → Environment Variables:                                                                                                          |
|      | **NEXT_PUBLIC_BACKEND_URL** — Your **backend** URL, e.g. `https://aiba-arena2-backend.vercel.app` (no trailing slash). **Must not** be the miniapp URL (that causes 508 loop). |
|      | **NEXT_PUBLIC_APP_URL** — Optional; e.g. `https://aiba-arena2-miniapp.vercel.app`.                                                                                             |
| 3    | **Redeploy** miniapp after changing env (NEXT*PUBLIC*\* is baked at build time).                                                                                               |

Copy-paste values: [PRODUCTION-ENV-VERCEL.md](PRODUCTION-ENV-VERCEL.md).

### 2.3 Telegram (so users can open the app from the bot)

| Step | What to do                                                                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | In [@BotFather](https://t.me/BotFather): **Menu Button** or **Bot Settings** → set URL to your miniapp, e.g. `https://aiba-arena2-miniapp.vercel.app`. |
| 2    | Or set **Web App** URL in the bot’s description / menu so “Open App” opens the miniapp.                                                                |

Without this, users can still open the miniapp by visiting the URL in a browser; with it, they open from Telegram.

### 2.4 Quick verification (before calling it “launched”)

| Check               | How                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend health      | `GET https://<backend>/health` → 200.                                                                                                                  |
| Miniapp loads       | Open `https://aiba-arena2-miniapp.vercel.app` (or your miniapp URL).                                                                                   |
| API reaches backend | In browser DevTools → Network: requests to `/api/economy/me`, `/api/game-modes`, etc. should go to **backend** URL and return 200 or 401, **not** 404. |
| Create broker       | In miniapp: Brokers → create starter broker (or use proxy). No 508.                                                                                    |
| Run battle          | Pick broker, pick arena, Run battle. You get a result (score, AIBA, etc.) or a clear error (e.g. no energy).                                           |

If any of these fail, see §4 (troubleshooting).

---

## 3. What can wait (not blocking launch)

| Item                           | Notes                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **Admin panel**                | Optional for day one; needed only to manage game modes / economy / moderation.                                         |
| **TON claims (on-chain AIBA)** | Requires vault + oracle + mainnet TON env. App works without it (off-chain AIBA/NEUR only).                            |
| **Extension / console noise**  | “Unexpected token 'export'” from a browser extension, ERR_NETWORK_CHANGED — not your app; ignore or test in Incognito. |
| **Monitoring / cron**          | Set up soon after launch; not required to open the app.                                                                |
| **Redis**                      | Optional for rate-limit sharing across instances; in-memory works for single instance.                                 |

---

## 4. Troubleshooting (if something fails)

| Symptom                                                             | Likely cause                                               | Fix                                                                                                                                                                          |
| ------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **404** on `/api/economy/me`, `/api/game-modes`, `/api/tasks`, etc. | Requests not reaching backend (wrong host).                | Set **NEXT_PUBLIC_BACKEND_URL** in Vercel **miniapp** to backend URL. Redeploy miniapp.                                                                                      |
| **508** on `/api/brokers/mine` or `/api/brokers/starter`            | Redirect/proxy loop (e.g. backend URL set to miniapp URL). | Set **NEXT_PUBLIC_BACKEND_URL** to **backend** URL only. Redeploy.                                                                                                           |
| **Backend won’t start**                                             | Missing or invalid env; prod checks fail.                  | Check Vercel build/logs for PROD*READINESS_FAILED. Set all required backend env (MONGO_URI, CORS_ORIGIN, TELEGRAM_BOT_TOKEN, ADMIN*\*, BATTLE_SEED_SECRET, PUBLIC_BASE_URL). |
| **401 / telegram auth**                                             | User not coming from Telegram or initData expired.         | Open miniapp from Telegram (or use dev header if in dev). Ensure TELEGRAM_INITDATA_MAX_AGE_SECONDS is reasonable (e.g. 600).                                                 |
| **CORS errors**                                                     | Backend not allowing miniapp origin.                       | **CORS_ORIGIN** in backend must include exact miniapp origin (e.g. `https://aiba-arena2-miniapp.vercel.app`). Redeploy backend.                                              |

Detailed root cause: [DEEP-ASSESSMENT-APP.md](DEEP-ASSESSMENT-APP.md). Env and deployment: [DEPLOYMENT-AND-ENV.md](DEPLOYMENT-AND-ENV.md).

---

## 5. Launch-day checklist (copy and tick)

```
Backend
[ ] Backend project deployed (Root: backend)
[ ] MONGO_URI, APP_ENV=prod, CORS_ORIGIN, TELEGRAM_BOT_TOKEN set
[ ] ADMIN_JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH, BATTLE_SEED_SECRET, PUBLIC_BASE_URL set
[ ] GET /health returns 200

Miniapp
[ ] Miniapp project deployed (Root: miniapp)
[ ] NEXT_PUBLIC_BACKEND_URL = backend URL (not miniapp URL)
[ ] Redeployed after env change
[ ] Miniapp loads; Network tab shows API calls to backend (no 404/508)

Telegram
[ ] Bot menu / Web App URL points to miniapp URL
[ ] (Optional) Open app from bot and run one battle

Verify
[ ] Create broker (starter or proxy)
[ ] Run battle → score and rewards shown
[ ] No 404 on economy/me, game-modes, tasks; no 508 on brokers
```

---

## 6. Summary

| Question                     | Answer                                                                     |
| ---------------------------- | -------------------------------------------------------------------------- |
| Can we launch today?         | **Yes**, if the checklist above is done.                                   |
| Must we ship new code?       | **No**; fix env and redeploy.                                              |
| Main risk?                   | Wrong or missing **NEXT_PUBLIC_BACKEND_URL** or **CORS_ORIGIN** → 404/508. |
| What’s optional for day one? | Admin, on-chain claims, monitoring, Redis.                                 |

**Next step:** Complete §2 (backend + miniapp env + Telegram URL), run §2.4 verification, then treat the app as launched. After that, add monitoring and optional features as needed.
