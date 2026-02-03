# Vercel Environment Variables — Systematic Guide

This guide tells you **exactly which environment variables** to set, **in which Vercel project**, and **where to place them** in the Vercel dashboard. Nothing is omitted.

---

## Your Vercel Projects (Reference)

| # | Project / URL | What it is | Root directory in Vercel |
|---|----------------|------------|---------------------------|
| 1 | **aiba-arena2** → https://aiba-arena2.vercel.app/ | **Miniapp** (Telegram Mini App, Next.js) | `miniapp` |
| 2 | **aiba-arena2-admin-panel** → https://vercel.com/oiptechcores-projects/aiba-arena2-admin-panel | **Admin panel** (operator UI, Next.js) | `admin-panel` |

**Backend:** Your backend (Express API) is **not** one of these two. It runs either:
- on **another host** (e.g. Render, Railway, or a third Vercel project with root `backend/`), or  
- as a **separate Vercel project** (root directory = `backend/`).

All **backend** environment variables (MONGO_URI, TELEGRAM_BOT_TOKEN, etc.) are set **where the backend runs**, not in the miniapp or admin-panel Vercel projects. See [Section 3](#3-backend-environment-variables-where-the-backend-runs) for the full list.

---

## Where to Set Variables in Vercel

For **each project** (miniapp and admin-panel):

1. Open **https://vercel.com/oiptechcores-projects**
2. Click the **project name** (e.g. **aiba-arena2** or **aiba-arena2-admin-panel**)
3. Go to **Settings** → **Environment Variables**
4. For each variable below:
   - **Key** = exact name (e.g. `NEXT_PUBLIC_BACKEND_URL`)
   - **Value** = your value (no quotes in the UI)
   - **Environments** = choose **Production**, **Preview**, and **Development** (or only Production if you only care about prod)
5. Click **Save** after adding/editing.
6. **Redeploy** the project (Deployments → ⋮ on latest → Redeploy) so new variables take effect.

---

## 1. Miniapp (aiba-arena2.vercel.app)

**Vercel:** https://vercel.com/oiptechcores-projects/aiba-arena2  
**Project Settings → Root Directory:** must be **`miniapp`** (so that `miniapp/package.json` and `miniapp/next.config.js` are used).

### Variables to add

| Key | Required | Description | Example / Value | Environments |
|-----|----------|-------------|------------------|--------------|
| **NEXT_PUBLIC_BACKEND_URL** | **Yes** | Full URL of your backend API (no trailing slash). Miniapp calls this for all API requests (battles, brokers, wallet, economy, etc.). | `https://your-backend.vercel.app` or `https://aiba-arena2-api.onrender.com` | Production, Preview, Development |
| **NEXT_PUBLIC_TONCONNECT_MANIFEST_URL** | No | Absolute URL of the TonConnect manifest JSON. If empty, the app uses `https://<miniapp-domain>/api/tonconnect-manifest`. Set only if you host the manifest elsewhere. | `https://aiba-arena2.vercel.app/api/tonconnect-manifest` | Production, Preview (optional) |
| **NEXT_PUBLIC_APP_URL** | No | Canonical base URL of the miniapp (used by `/api/tonconnect-manifest` for `url` and `iconUrl`). If unset, Vercel’s `x-forwarded-proto` / `x-forwarded-host` are used. Set if you use a custom domain. | `https://aiba-arena2.vercel.app` | Production, Preview (optional) |
| **APP_URL** | No | Same as NEXT_PUBLIC_APP_URL but server-only (used in `tonconnect-manifest/route.js`). Prefer NEXT_PUBLIC_APP_URL or leave both unset for default behavior. | `https://aiba-arena2.vercel.app` | Production, Preview (optional) |

### Miniapp checklist

- [ ] **NEXT_PUBLIC_BACKEND_URL** set to your real backend URL (the same URL you will put in **CORS_ORIGIN** on the backend).
- [ ] Root Directory = **miniapp**.
- [ ] Redeploy after changing env vars.

---

## 2. Admin Panel (aiba-arena2-admin-panel)

**Vercel:** https://vercel.com/oiptechcores-projects/aiba-arena2-admin-panel  
**Project Settings → Root Directory:** must be **`admin-panel`**.

### Variables to add

| Key | Required | Description | Example / Value | Environments |
|-----|----------|-------------|------------------|--------------|
| **NEXT_PUBLIC_BACKEND_URL** | **Yes** | Full URL of your backend API (no trailing slash). Admin panel uses this for all requests (login, tasks, ads, economy, moderation, stats, treasury, etc.). | `https://your-backend.vercel.app` or `https://aiba-arena2-api.onrender.com` | Production, Preview, Development |

### Admin panel checklist

- [ ] **NEXT_PUBLIC_BACKEND_URL** set to the **same** backend URL as the miniapp.
- [ ] Root Directory = **admin-panel**.
- [ ] Redeploy after changing env vars.

---

## 3. Backend Environment Variables (Where the Backend Runs)

The backend is **not** the miniapp or admin-panel. It is either:

- A **separate Vercel project** (e.g. **aiba-arena2-backend**) with **Root Directory** = **`backend`**, or  
- Deployed on **Render / Railway / other** — in that case you set these variables in that platform’s “Environment” or “Env Vars” section, **not** in Vercel.

Below is the **full list** of backend environment variables. Set every **required** one where the backend runs; optional ones as needed.

### 3.1 Required (minimum for production)

| Key | Description | Where to get / Example | Note |
|-----|-------------|------------------------|------|
| **MONGO_URI** | MongoDB connection string. | e.g. `mongodb+srv://user:pass@cluster.mongodb.net/aiba_arena?retryWrites=true&w=majority` | Required for DB. |
| **APP_ENV** | `prod` for production (enables strict checks). Use `dev` only for local/staging. | `prod` | With `prod`, CORS, Telegram, admin, battle seed, and vault rules are enforced. |
| **CORS_ORIGIN** | Comma-separated list of allowed origins (no spaces after commas). Must include miniapp and admin URLs. | `https://aiba-arena2.vercel.app,https://aiba-arena2-admin-panel.vercel.app` | If you use custom domains, add them. Required when APP_ENV=prod. |
| **TELEGRAM_BOT_TOKEN** | Telegram Bot token (from BotFather). Used to verify Mini App initData and send “battle win” notifications. | From BotFather | Required when APP_ENV=prod. |
| **TELEGRAM_INITDATA_MAX_AGE_SECONDS** | Max age (seconds) of Telegram initData; reject older. | `300` to `900` (e.g. 900 = 15 min) | Must be set explicitly when APP_ENV=prod. |
| **ADMIN_JWT_SECRET** | Secret used to sign admin JWT. Must be strong (≥ 32 chars). | Long random string (e.g. 64 chars) | Required when APP_ENV=prod; do not use `dev-change-me`. |
| **ADMIN_EMAIL** | Admin login email. | Your admin email | Required when APP_ENV=prod. |
| **ADMIN_PASSWORD_HASH** | bcrypt hash of admin password. Do not use plaintext ADMIN_PASSWORD in production. | e.g. `$2a$10$...` (bcrypt) | Required when APP_ENV=prod. |
| **BATTLE_SEED_SECRET** | Server secret for deterministic battle seeds. Must be strong (≥ 32 chars). | Long random string | Required when APP_ENV=prod; do not use `dev-secret-change-me`. |

### 3.2 Optional but recommended (features / production)

| Key | Description | Example / Value | Note |
|-----|-------------|------------------|------|
| **PORT** | Port the server listens on. | `5000` (Vercel/serverless may ignore) | Often set by host. |
| **RATE_LIMIT_PER_MINUTE** | Global rate limit (requests per minute per IP). | `600` (default) | Tune as needed. |
| **BOOST_TON_WALLET** | TON address that receives boost payments (cost set in Admin → Economy). | TON address | Needed if boosts with TON are used. |
| **LEADER_BOARD_WALLET** | TON address that receives payment when users **pay to create** a guild (not in top N). | TON address | Needed for paid guild create. |
| **BOOST_GROUP_WALLET** | TON address that receives payment when users **boost** a guild. | TON address | Needed for guild boost. |

### 3.3 On-chain reward claims (AIBA withdrawal)

If you want users to **withdraw AIBA** from the app to their TON wallet via the vault, set **all** of these (and keep TON provider mainnet for production):

| Key | Description | Example / Value | Note |
|-----|-------------|------------------|------|
| **ARENA_VAULT_ADDRESS** | ArenaRewardVault contract address (EQ...). | TON address | All three required together. |
| **AIBA_JETTON_MASTER** | AIBA jetton master contract address. | TON address | |
| **ORACLE_PRIVATE_KEY_HEX** | 32-byte ed25519 seed in hex (64 hex chars). Used to sign reward claims. | 64 hex characters | Must match vault’s oracle public key. |
| **TON_PROVIDER_URL** | TON API endpoint (for vault reads, seqno, etc.). | e.g. `https://toncenter.com/api/v2/jsonRPC` (mainnet) | When vault is set, required and must be mainnet in prod. |
| **TON_API_KEY** | API key for TON provider (e.g. TonCenter) to avoid rate limits. | From toncenter.com or your provider | Strongly recommended when using vault. |

### 3.4 Optional / legacy (backend)

| Key | Description | Example / Value | Note |
|-----|-------------|------------------|------|
| **ADMIN_PASSWORD** | Plaintext admin password. **Only for dev.** | — | Do **not** use in production; use ADMIN_PASSWORD_HASH. |
| **ADMIN_SIGNER_TYPE** | Payout signer type. | `stub` (default) | Use `stub` unless you have real payout flow. |
| **ADMIN_WALLET** | Legacy: admin TON wallet. | — | Only for legacy send flow. |
| **ADMIN_MNEMONIC** | Legacy: admin mnemonic. | — | Only for legacy send; never in prod. |
| **ADMIN_JETTON_WALLET** | Legacy: admin jetton wallet. | — | Only for legacy send. |
| **ENABLE_LEGACY_PENDING_AIBA_DISPATCH** | Enable legacy hourly pending-AIBA send. | `false` (default) | Must stay `false` in production. |
| **dailyCapNeurByArena** | JSON object for per-arena NEUR caps. | e.g. `{"prediction":5000000}` | Optional economy tuning. |

---

## 4. Cross-Reference Summary

### URLs that must match

1. **Backend URL**  
   - Same value in:
     - Miniapp: **NEXT_PUBLIC_BACKEND_URL**
     - Admin panel: **NEXT_PUBLIC_BACKEND_URL**
   - And in:
     - Backend: **CORS_ORIGIN** must include both frontend URLs (comma-separated, no trailing slashes).

2. **Example (production)**  
   - Backend: `https://aiba-arena2-api.vercel.app` (or your real backend URL).  
   - Miniapp: `https://aiba-arena2.vercel.app`  
   - Admin: `https://aiba-arena2-admin-panel.vercel.app`  

   Then:
   - **NEXT_PUBLIC_BACKEND_URL** (miniapp and admin) = `https://aiba-arena2-api.vercel.app`
   - **CORS_ORIGIN** (backend) = `https://aiba-arena2.vercel.app,https://aiba-arena2-admin-panel.vercel.app`

### Where each variable lives (quick reference)

| Variable | Set in project |
|----------|----------------|
| NEXT_PUBLIC_BACKEND_URL | Miniapp + Admin panel (both) |
| NEXT_PUBLIC_TONCONNECT_MANIFEST_URL | Miniapp only |
| NEXT_PUBLIC_APP_URL / APP_URL | Miniapp only (optional) |
| MONGO_URI, APP_ENV, CORS_ORIGIN, TELEGRAM_*, ADMIN_*, BATTLE_SEED_SECRET, BOOST_*_WALLET, LEADER_BOARD_WALLET, ARENA_VAULT_*, AIBA_JETTON_MASTER, ORACLE_PRIVATE_KEY_HEX, TON_* | Backend only (Vercel backend project or Render/Railway/etc.) |

---

## 5. Step-by-Step (Copy-Paste Order)

### Step 1: Miniapp (aiba-arena2)

1. Vercel → **aiba-arena2** → **Settings** → **Environment Variables**.
2. Add:
   - **NEXT_PUBLIC_BACKEND_URL** = `https://<your-backend-host>` (your real backend URL).
3. Optionally add **NEXT_PUBLIC_APP_URL** = `https://aiba-arena2.vercel.app` (or your miniapp domain).
4. Save. **Redeploy** the miniapp.

### Step 2: Admin panel (aiba-arena2-admin-panel)

1. Vercel → **aiba-arena2-admin-panel** → **Settings** → **Environment Variables**.
2. Add:
   - **NEXT_PUBLIC_BACKEND_URL** = `https://<your-backend-host>` (same as miniapp).
3. Save. **Redeploy** the admin panel.

### Step 3: Backend (Vercel or other host)

1. Where the backend runs (e.g. Vercel project with root **backend**, or Render/Railway env):
   - Set all **required** backend variables from section 3.1.
   - Set **CORS_ORIGIN** = `https://aiba-arena2.vercel.app,https://aiba-arena2-admin-panel.vercel.app` (or your actual frontend URLs).
   - If using claims: set all vault/TON variables from section 3.3.
   - Optionally set BOOST_* and LEADER_BOARD_* from section 3.2.
2. Redeploy the backend.

### Step 4: Verify

- Open miniapp → check network tab: API calls go to **NEXT_PUBLIC_BACKEND_URL**.
- Open admin panel → log in; requests should go to the same backend.
- Backend logs: no CORS errors; Telegram auth and admin login work.

---

## 6. If Backend Is Also on Vercel

If you create a **third** Vercel project for the backend (e.g. **aiba-arena2-backend**):

- **Root Directory:** `backend`
- **Build:** Vercel will use `backend/vercel.json` (serverless via `api/index.js`).
- Add **every** backend variable from **Section 3** in that project’s **Settings → Environment Variables**.
- **CORS_ORIGIN** must list your miniapp and admin-panel production (and preview if you use them) URLs, comma-separated.

No environment variables from Section 3 belong in the miniapp or admin-panel Vercel projects—only in the backend project or your external backend host.

---

This is the full set: nothing omitted. Use the checklists and tables above to configure both Vercel frontends and your backend.
