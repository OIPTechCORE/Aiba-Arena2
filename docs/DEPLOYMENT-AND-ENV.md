# Deployment & environment — Localhost, Vercel, Telegram

Single guide: run locally, deploy backend and miniapp on Vercel, and open the app from Telegram. Backend can run on **localhost and Vercel**; use the same env names and point the miniapp at the backend you use.

---

## Where to get variables & how to put them in Vercel

### How to add variables in Vercel (any project)

**Path in Vercel:** [Dashboard](https://vercel.com/dashboard) → select **project** → **Settings** → **Environment Variables**.

1. Open [Vercel Dashboard](https://vercel.com/dashboard).
2. Select your **project** (backend, miniapp, or admin-panel).
3. In the top nav, click **Settings**, then in the left sidebar click **Environment Variables**.
4. For each variable:
    - **Key:** exact name (e.g. `MONGO_URI`).
    - **Value:** the secret or value (paste; do not commit).
    - **Environment:** choose **Production** (and optionally Preview/Development if you use Vercel previews).
5. Click **Save**. Redeploy the project so new variables apply (Deployments → … → Redeploy, or push a new commit).

**Important:** Variables added or changed take effect on the **next deployment**. No trailing spaces in keys or values.

---

### Where to get each variable

#### Backend (Vercel backend project or `backend/.env`)

| Variable                              | Where to get it                                      | How / notes                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MONGO_URI**                         | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | 1) Create free cluster. 2) Database Access → Add user (save username/password). 3) Network Access → Add IP `0.0.0.0/0` (or Vercel IPs if you restrict). 4) Clusters → Connect → “Connect your application” → copy URI. Replace `<password>` with your user password. Example: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/aiba_arena?retryWrites=true&w=majority` |
| **APP_ENV**                           | You choose                                           | Use `prod` for production. Use `dev` only for local.                                                                                                                                                                                                                                                                                                                      |
| **CORS_ORIGIN**                       | Your deployed URLs                                   | Comma-separated, no spaces. Example: `https://your-miniapp.vercel.app,https://your-admin.vercel.app`. Get the URLs from your Vercel miniapp and admin project domains after deploy.                                                                                                                                                                                       |
| **TELEGRAM_BOT_TOKEN**                | [Telegram @BotFather](https://t.me/BotFather)        | 1) Open Telegram, search `@BotFather`. 2) Send `/newbot`, follow name/username. 3) BotFather replies with a token like `7123456789:AAH...`. Copy that; this is `TELEGRAM_BOT_TOKEN`. Never share or commit it.                                                                                                                                                            |
| **TELEGRAM_INITDATA_MAX_AGE_SECONDS** | You choose                                           | Recommended `300`–`900` (5–15 minutes). Example: `600`.                                                                                                                                                                                                                                                                                                                   |
| **ADMIN_JWT_SECRET**                  | Generate yourself                                    | At least 32 random characters. Example (Node): `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Or use a password generator; store securely.                                                                                                                                                                                                   |
| **ADMIN_EMAIL**                       | You choose                                           | Email you use to log in to the admin panel (e.g. `admin@yourdomain.com`).                                                                                                                                                                                                                                                                                                 |
| **ADMIN_PASSWORD_HASH**               | From your password                                   | **Production:** use bcrypt hash, not plaintext. In Node: `node -e "const bcrypt=require('bcrypt'); bcrypt.hash('YOUR_PLAIN_PASSWORD', 10).then(h=>console.log(h))"` (run from a folder that has `bcrypt` installed). Copy the long hash into `ADMIN_PASSWORD_HASH`. Leave `ADMIN_PASSWORD` empty in prod.                                                                 |
| **BATTLE_SEED_SECRET**                | Generate yourself                                    | Same as ADMIN_JWT_SECRET: ≥32 random characters. Use a different value than ADMIN_JWT_SECRET.                                                                                                                                                                                                                                                                             |
| **PUBLIC_BASE_URL**                   | Your backend URL                                     | After deploying backend on Vercel, copy its URL (e.g. `https://your-backend.vercel.app`). No trailing slash. Used for broker metadata and links.                                                                                                                                                                                                                          |

#### Optional backend (TON wallets, etc.)

| Variable                                                                                          | Where to get it                                                                                                                                               |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CREATED_BROKERS_WALLET**                                                                        | Your TON wallet address (e.g. from Tonkeeper/TON Space). Users send TON here to create a broker.                                                              |
| **BOOST_TON_WALLET**, **STARS_STORE_WALLET**, **CAR_RACING_WALLET**, **MOTORCYCLE_RACING_WALLET** | Same: create or use a TON wallet; put the **address** (starts with `EQ...`).                                                                                  |
| **LEADER_BOARD_WALLET**, **BOOST_GROUP_WALLET**, **BOOST_PROFILE_WALLET**, **GIFTS_WALLET**       | Same: TON wallet addresses for each feature.                                                                                                                  |
| **TON_PROVIDER_URL**                                                                              | [TON API](https://toncenter.com/api/v2/) or [TonAPI](https://tonapi.io/). Example: `https://toncenter.com/api/v2`. For mainnet claims use a mainnet provider. |
| **TON_API_KEY**                                                                                   | Optional; from the provider (e.g. Toncenter) if you use authenticated requests.                                                                               |

#### Miniapp (Vercel miniapp project)

| Variable                                | Where to get it                                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **NEXT_PUBLIC_BACKEND_URL**             | Your **backend** deployment URL. After the backend is on Vercel, copy it (e.g. `https://your-backend.vercel.app`). No trailing slash. |
| **NEXT_PUBLIC_APP_URL**                 | Optional. Your miniapp URL (e.g. `https://your-miniapp.vercel.app`). Defaults to current origin.                                      |
| **NEXT_PUBLIC_TONCONNECT_MANIFEST_URL** | Optional. Full URL to your TonConnect manifest (e.g. `https://your-miniapp.vercel.app/api/tonconnect-manifest`).                      |

#### Admin panel (Vercel admin project)

| Variable                    | Where to get it                                                             |
| --------------------------- | --------------------------------------------------------------------------- |
| **NEXT_PUBLIC_BACKEND_URL** | Same as miniapp: your backend URL (e.g. `https://your-backend.vercel.app`). |

---

**Production URLs (miniapp + admin):** For copy-paste env values see [Production env — Vercel](PRODUCTION-ENV-VERCEL.md) (miniapp: `https://aiba-arena2-miniapp.vercel.app`, admin: `https://aiba-arena2-admin-panel.vercel.app`, CORS and backend URL).

### Order of operations (Vercel)

1. **Create three Vercel projects** (if not already): one for **backend** (root `backend/`), one for **miniapp** (root `miniapp/`), one for **admin** (root `admin-panel/`). Connect the same repo; set Root Directory per project.
2. **Backend first:** Add all backend env vars in the **backend** project. Deploy. Copy the backend URL (e.g. `https://aiba-backend-xxx.vercel.app`).
3. **Miniapp:** In the **miniapp** project, add `NEXT_PUBLIC_BACKEND_URL` = that backend URL. Deploy. Copy the miniapp URL.
4. **Admin:** In the **admin** project, add `NEXT_PUBLIC_BACKEND_URL` = same backend URL. Deploy.
5. **Backend again:** Set `CORS_ORIGIN` to include your miniapp and admin URLs (comma-separated). Set `PUBLIC_BASE_URL` to the backend URL. Redeploy backend.
6. **Telegram:** In BotFather, set the bot’s menu/URL to your miniapp URL. Put `TELEGRAM_BOT_TOKEN` in the backend project (already done in step 2).

---

**If the miniapp on Vercel is not up to date but the admin is:**

1. Vercel Dashboard → **miniapp** project → **Deployments** → open latest → **⋯** → **Redeploy** (uncheck “Use existing Build Cache” if you changed code).
2. **Settings** → **General** → **Root Directory** must be **`miniapp`**.
3. If the latest miniapp deployment shows **Failed**, open the build logs, fix the error, then push or Redeploy.

**Runtime errors** (e.g. “Unexpected token 'export'” or “Cannot access 'dw' before initialization”): see [Miniapp runtime errors investigation](MINIAPP-RUNTIME-ERRORS-INVESTIGATION.md) for causes and mitigations.

**API 404s / 508 / full app health:** see [Deep assessment — app](DEEP-ASSESSMENT-APP.md) (backend URL, routes, console errors).

---

## Quick reference

| Scenario              | Backend env                                                                                                        | Miniapp env                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **Localhost**         | `backend/.env`: `MONGO_URI`, `APP_ENV=dev`                                                                         | `miniapp/.env.local`: `NEXT_PUBLIC_BACKEND_URL=http://localhost:5000` |
| **Backend on Vercel** | Vercel backend project: `MONGO_URI`, `APP_ENV`, `CORS_ORIGIN`, `TELEGRAM_*`, `ADMIN_JWT_SECRET`, `PUBLIC_BASE_URL` | —                                                                     |
| **Miniapp on Vercel** | —                                                                                                                  | `NEXT_PUBLIC_BACKEND_URL=https://your-backend.vercel.app`             |
| **Telegram**          | Same as Vercel; CORS includes miniapp origin; bot token set                                                        | Miniapp URL = Bot menu; backend URL = Vercel backend                  |

---

## 1. Security first

- **Never commit `.env`** — use `.env.example` only. Rotate any leaked secrets (MongoDB, Telegram token, TON keys, JWT).
- Remove committed `.env` from history: `git filter-repo --path backend/.env --invert-paths` (or `git filter-branch` / BFG), then `git push --force --all`.
- Production: use a secret manager (Vercel/Render/Railway env vars or cloud secrets); set `APP_ENV=prod` and all required vars so fail-fast checks run.

---

## 2. Localhost

**Quick run (terminals + RAM tips):** See **[RUN.md](RUN.md)** for: Terminal 1 (backend), Terminal 2 (miniapp), Terminal 3 (admin optional), `NODE_OPTIONS=--max-old-space-size=4096` on low RAM, and build-vs-dev for miniapp/admin.

### 2.1 Backend

**File:** `backend/.env` (copy from `backend/.env.example`).

| Variable                                                                  | Required | Example                                                |
| ------------------------------------------------------------------------- | -------- | ------------------------------------------------------ |
| `PORT`                                                                    | No       | `5000`                                                 |
| `MONGO_URI`                                                               | **Yes**  | `mongodb://localhost:27017/aiba_arena` or Atlas URI    |
| `APP_ENV`                                                                 | **Yes**  | `dev` (allows `x-telegram-id` without Telegram)        |
| `CORS_ORIGIN`                                                             | No       | Empty or `http://localhost:3000,http://localhost:3001` |
| `ADMIN_JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BATTLE_SEED_SECRET` | No (dev) | Any; prod requires strong values                       |

**Run:** `cd backend && npm start` → `http://localhost:5000`.

### 2.2 Miniapp & admin

**Files:** `miniapp/.env.local`, `admin-panel/.env.local` (copy from `.env.local.example`).

| Variable                  | Required | Example                 |
| ------------------------- | -------- | ----------------------- |
| `NEXT_PUBLIC_BACKEND_URL` | **Yes**  | `http://localhost:5000` |

**Run:** From repo root, `npm install && npm run dev` starts backend (5000), miniapp (3000), admin (3001). Or run each from its directory: `cd miniapp && npm run dev`, etc.

### 2.3 Localhost checklist

- [ ] MongoDB running; `MONGO_URI` and `APP_ENV=dev` in `backend/.env`
- [ ] Backend starts; miniapp has `NEXT_PUBLIC_BACKEND_URL=http://localhost:5000`
- [ ] Open `http://localhost:3000` and test (New broker, Run battle, Market, Referrals)

**Troubleshooting:** Error -102 → start dev server. Admin "Network error" → start backend; set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_JWT_SECRET` in backend; ensure admin `.env.local` has backend URL.

---

## 3. Vercel (backend + miniapp + admin)

### 3.1 Backend (Vercel serverless)

**Vercel project:** Root = `backend/`. Entry: `api/index.js`. Config: `vercel.json`.

**Required env (production):**

| Variable                            | Description                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `MONGO_URI`                         | MongoDB Atlas connection string                                                  |
| `APP_ENV`                           | `prod`                                                                           |
| `CORS_ORIGIN`                       | Comma-separated: `https://your-miniapp.vercel.app,https://your-admin.vercel.app` |
| `TELEGRAM_BOT_TOKEN`                | From @BotFather                                                                  |
| `TELEGRAM_INITDATA_MAX_AGE_SECONDS` | `300`–`900`                                                                      |
| `ADMIN_JWT_SECRET`                  | ≥ 32 characters                                                                  |
| `ADMIN_EMAIL`                       | Admin login                                                                      |
| `ADMIN_PASSWORD_HASH`               | bcrypt hash (no plaintext in prod)                                               |
| `BATTLE_SEED_SECRET`                | ≥ 32 characters                                                                  |

**Recommended:** `PUBLIC_BASE_URL` = backend URL (for broker metadata).

**Optional (features):** `CREATED_BROKERS_WALLET`, `BOOST_TON_WALLET`, `STARS_STORE_WALLET`, `CAR_RACING_WALLET`, `MOTORCYCLE_RACING_WALLET`, `LEADER_BOARD_WALLET`, `BOOST_GROUP_WALLET`, `BOOST_PROFILE_WALLET`, `GIFTS_WALLET`; vault/claims: `ARENA_VAULT_ADDRESS`, `AIBA_JETTON_MASTER`, `ORACLE_PRIVATE_KEY_HEX` (or `ORACLE_SIGNER_URL`+`ORACLE_SIGNER_TOKEN`), `TON_PROVIDER_URL`, `TON_API_KEY`.

### 3.2 Miniapp (Vercel)

**Root:** `miniapp/`. **Required:** `NEXT_PUBLIC_BACKEND_URL` = backend URL (no trailing slash). **Optional:** `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL`.

### 3.3 Admin panel (Vercel)

**Root:** `admin-panel/`. **Required:** `NEXT_PUBLIC_BACKEND_URL` = backend URL.

### 3.4 GitHub & auto-deploy

- Use branch **`main`**; set Vercel Production Branch to `main`. Each push deploys.
- Set GitHub default branch to `main`.

### 3.5 Vercel checklist

- [ ] Backend project: `MONGO_URI`, `APP_ENV`, `CORS_ORIGIN`, `TELEGRAM_*`, `ADMIN_JWT_SECRET`, `PUBLIC_BASE_URL`
- [ ] Miniapp project: `NEXT_PUBLIC_BACKEND_URL` = backend URL
- [ ] Backend `/health` returns `{"ok":true}`; miniapp loads and calls API

---

## 4. Deploying to Telegram

- **Bot:** Create via @BotFather; save `TELEGRAM_BOT_TOKEN` in **backend** env.
- **Backend:** Same as Vercel; `CORS_ORIGIN` must include the miniapp origin (e.g. `https://your-miniapp.vercel.app`). `APP_ENV=prod`, `TELEGRAM_INITDATA_MAX_AGE_SECONDS` set.
- **Mini App URL:** BotFather → your bot → Bot Settings → Menu Button (or /setmenubutton). Set URL to miniapp, e.g. `https://your-miniapp.vercel.app`. HTTPS required.
- **Miniapp:** No extra env; app uses `window.Telegram.WebApp.initData` when opened in Telegram. `NEXT_PUBLIC_BACKEND_URL` must point to production backend.

**Telegram checklist:** [ ] Bot created; token in backend. [ ] CORS includes miniapp. [ ] Menu/link opens miniapp URL. [ ] Open in Telegram and test auth + one flow.

**How it works:** When opened inside Telegram, the client injects the Web App SDK and passes `initData`. The miniapp sends it as `x-telegram-init-data`; the backend verifies it with `TELEGRAM_BOT_TOKEN`. See [Telegram Mini Apps](https://core.telegram.org/bots/webapps).

---

## 5. Mainnet / production readiness

When `APP_ENV=prod` or `NODE_ENV=production`, the backend **refuses to start** if:

- `CORS_ORIGIN` is unset
- `TELEGRAM_BOT_TOKEN` or `TELEGRAM_INITDATA_MAX_AGE_SECONDS` missing or invalid
- `ADMIN_JWT_SECRET` is placeholder or &lt; 32 chars
- `ADMIN_PASSWORD` used without `ADMIN_PASSWORD_HASH` (plaintext disallowed)
- `BATTLE_SEED_SECRET` is placeholder or &lt; 32 chars
- Vault/claims: if `ARENA_VAULT_ADDRESS` or `AIBA_JETTON_MASTER` set, both required plus oracle key and **mainnet** `TON_PROVIDER_URL`
- `ENABLE_LEGACY_PENDING_AIBA_DISPATCH=true`

**Key separation:** Use different keys for contract deployer, reward-claim signer (`ORACLE_*`), admin JWT, Telegram bot, battle seed. Rotate any key that touched a dev machine. Document oracle key rotation (on-chain `set_oracle` + backend secret).

---

## 6. Components summary

| Component   | Local                           | Vercel                              |
| ----------- | ------------------------------- | ----------------------------------- |
| **Backend** | `backend/server.js` (PORT 5000) | `backend/api/index.js` (serverless) |
| **Miniapp** | Next.js, port 3000              | Next.js, root `miniapp`             |
| **Admin**   | Next.js, port 3001              | Next.js, root `admin-panel`         |

**Endpoints:** `GET /health` (uptime), `GET /metrics` (Prometheus). Predeploy: `npm run predeploy:check` (if available).
