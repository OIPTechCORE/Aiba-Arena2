# Vercel Environment Variables — Systematic Guide

This guide tells you **exactly which environment variables** to set, **in which Vercel project**, **where to place them** in the Vercel dashboard, and **how to obtain or generate** each value. Nothing is omitted.

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
| **BOOST_TON_WALLET** | TON address that receives **battle** boost payments (cost set in Admin → Economy). | TON address | Needed if boosts with TON are used. |
| **LEADER_BOARD_WALLET** | TON address that receives payment when users **pay to create** a guild (not in top N). | TON address | Needed for paid guild create. |
| **BOOST_GROUP_WALLET** | TON address that receives payment when users **boost** a guild. | TON address | Needed for guild boost. |
| **CREATED_BROKERS_WALLET** | TON address that receives payment when users **create a broker with TON** (broker is auto-listed on marketplace). Cost: Admin → Economy `createBrokerCostTonNano` (1–10 TON). | TON address | Needed for “Create broker (pay TON)” in Market tab. |
| **BOOST_PROFILE_WALLET** | TON address that receives payment when users **boost their profile**. Cost: Admin → Economy `boostProfileCostTonNano` (1–10 TON). | TON address | Needed for “Boost your profile” in Wallet tab. |
| **GIFTS_WALLET** | TON address that receives payment when users **send a gift** to another user. Cost: Admin → Economy `giftCostTonNano` (1–10 TON). | TON address | Needed for Gifts in Wallet tab. |
| **STARS_STORE_WALLET** | TON address that receives payment when users buy Stars with TON. Cost: Admin → Economy `starsStorePackPriceTonNano` (1–10 TON). | TON address | Needed for Stars Store TON purchases. |
| **CAR_RACING_WALLET** | TON address that receives payment when users create a car with TON. Cost: Admin → Economy `createCarCostTonNano` (1–10 TON). | TON address | Needed for car creation with TON. |
| **MOTORCYCLE_RACING_WALLET** | TON address that receives payment when users create a bike with TON. Cost: Admin → Economy `createBikeCostTonNano` (1–10 TON). | TON address | Needed for bike creation with TON. |

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

## 4. How to Get Each Environment Variable

This section explains **where to obtain** or **how to generate** every value. Do this *before* or *while* filling in the Vercel (or backend host) Environment Variables.

### 4.1 Frontend variables (miniapp + admin panel)

| Variable | How to get it |
|----------|----------------|
| **NEXT_PUBLIC_BACKEND_URL** | **After** you deploy the backend: use the URL your backend host gives you. **Vercel:** Deploy a project with root `backend` → your backend URL is `https://<project-name>.vercel.app`. **Render / Railway:** Create a Web Service, connect the repo, set root to `backend` → they show the live URL (e.g. `https://aiba-arena2-api.onrender.com`). Copy that URL (no trailing slash). |
| **NEXT_PUBLIC_TONCONNECT_MANIFEST_URL** | Optional. Your miniapp’s public URL + path: `https://<your-miniapp-domain>/api/tonconnect-manifest`. Same as your miniapp deployment URL (e.g. `https://aiba-arena2.vercel.app/api/tonconnect-manifest`). |
| **NEXT_PUBLIC_APP_URL** / **APP_URL** | Your miniapp’s public URL: e.g. `https://aiba-arena2.vercel.app` or your custom domain. Set only if you need to override auto-detection. |

### 4.2 MongoDB — MONGO_URI

**Option A: MongoDB Atlas (recommended for production)**

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign in or create an account.
2. **Create a free cluster:** Clusters → Build a Database → choose M0 (free) → pick a region → Create.
3. **Create a database user:** Database Access → Add New Database User → choose “Password” auth, set a username and a strong password (save them). Give “Atlas admin” or “Read and write to any database”.
4. **Allow network access:** Network Access → Add IP Address → “Allow Access from Anywhere” (0.0.0.0/0) for Vercel/Render, or add your host’s IPs.
5. **Get the connection string:** Databases → Connect on your cluster → “Drivers” (or “Connect your application”) → copy the URI. It looks like `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`. Replace `<username>` and `<password>` with your DB user (URL-encode the password if it has special characters). Add the database name: `.../aiba_arena?retryWrites=...`.

**Option B: Local MongoDB**

- Install [MongoDB Community](https://www.mongodb.com/try/download/community) and start the service. Use: `MONGO_URI=mongodb://localhost:27017/aiba_arena`.

### 4.3 Telegram — TELEGRAM_BOT_TOKEN

1. Open Telegram and search for **@BotFather**.
2. Send **/newbot** (or use **/mybots** if you already have a bot).
3. Follow the prompts: choose a name and a username (must end in `bot`, e.g. `MyAibaArenaBot`).
4. BotFather replies with a message containing **“Use this token to access the HTTP API”** and a long string like `7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`. That string is your **TELEGRAM_BOT_TOKEN**. Copy it and store it securely.

### 4.4 Secrets you generate (ADMIN_JWT_SECRET, BATTLE_SEED_SECRET)

These must be **long, random strings** (at least 32 characters). Never use the example placeholders in production.

**Option A: Node.js (one-liner)**

Run in a terminal (from any folder):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

You get a 64-character hex string. Use one for **ADMIN_JWT_SECRET** and a different one for **BATTLE_SEED_SECRET** (run the command twice, or run once and use the first 32 chars for one and the last 32 for the other).

**Option B: OpenSSL**

```bash
openssl rand -hex 32
```

Use the output as the secret. Generate two separate values for JWT and battle seed.

### 4.5 Admin login — ADMIN_EMAIL and ADMIN_PASSWORD_HASH

- **ADMIN_EMAIL:** Choose any email you will use to log in to the admin panel (e.g. `admin@yourdomain.com`). Type it exactly as you will type it on the login screen.
- **ADMIN_PASSWORD_HASH:** You must store a **bcrypt hash** of your password, not the plain password.

**How to generate the hash:**

**Option A: Node.js (with bcryptjs, already in the backend)**

From the project root:

```bash
cd backend
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('YOUR_CHOSEN_PASSWORD', 10).then(h=>console.log(h))"
```

Replace `YOUR_CHOSEN_PASSWORD` with your real admin password. The script prints a string like `$2a$10$...` — that is **ADMIN_PASSWORD_HASH**. Copy it into your env.

**Option B: Online bcrypt generator**

Use a trusted bcrypt generator (e.g. [bcrypt-generator.com](https://bcrypt-generator.com/) with round 10). Enter your password and copy the hash. Prefer doing this on a trusted machine and never reuse that password elsewhere.

### 4.6 CORS_ORIGIN

You **compose** this yourself from your frontend URLs:

- Miniapp URL (e.g. `https://aiba-arena2.vercel.app`)
- Admin panel URL (e.g. `https://aiba-arena2-admin-panel.vercel.app`)

Format: comma-separated, **no spaces**, no trailing slashes. Example:

`https://aiba-arena2.vercel.app,https://aiba-arena2-admin-panel.vercel.app`

If you add a custom domain later, add it to the same list.

### 4.7 TELEGRAM_INITDATA_MAX_AGE_SECONDS

You **choose** a number. It is the maximum age (in seconds) of the Telegram Mini App `initData` before the backend rejects it. Recommended: **300** (5 minutes) to **900** (15 minutes). Example: `900`.

### 4.8 TON wallets (Super Admin — per product group)

These are **TON blockchain addresses** that receive TON when users pay for various features. Each product group can have its own wallet for clear accounting (see [MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md](MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md)).

1. Create or use a TON wallet (e.g. [Tonkeeper](https://tonkeeper.com/), Telegram Wallet, or another TON-compatible wallet).
2. Get the wallet’s **address** (starts with `EQ...` or `UQ...` in modern form).
3. **BOOST_TON_WALLET** — receives **battle** boost payments (Admin → Economy `boostCostTonNano`).
4. **LEADER_BOARD_WALLET** — receives TON when users **pay to create** a guild (not in top N); cost `createGroupCostTonNano` (1–10 TON).
5. **BOOST_GROUP_WALLET** — receives TON when users **boost** a guild; cost `boostGroupCostTonNano` (1–10 TON).
6. **CREATED_BROKERS_WALLET** — receives TON when users **create a broker** (pay TON → broker auto-listed on marketplace); cost `createBrokerCostTonNano` (1–10 TON).
7. **BOOST_PROFILE_WALLET** — receives TON when users **boost their profile**; cost `boostProfileCostTonNano` (1–10 TON).
8. **GIFTS_WALLET** — receives TON when users **send a gift** to another user; cost `giftCostTonNano` (1–10 TON).
9. **STARS_STORE_WALLET** — receives TON when users **buy Stars with TON**; cost `starsStorePackPriceTonNano` (1–10 TON).
10. **CAR_RACING_WALLET** — receives TON when users **create a car with TON**; cost `createCarCostTonNano` (1–10 TON).
11. **MOTORCYCLE_RACING_WALLET** — receives TON when users **create a bike with TON**; cost `createBikeCostTonNano` (1–10 TON).

You can use one address for all, or separate addresses per feature. Copy-paste each address as-is into the corresponding env var.

### 4.9 On-chain claims (ARENA_VAULT_ADDRESS, AIBA_JETTON_MASTER, ORACLE_PRIVATE_KEY_HEX, TON_PROVIDER_URL, TON_API_KEY)

**When you need these:** Only if you want users to **withdraw AIBA** from the app to their TON wallet via the ArenaRewardVault contract.

**ARENA_VAULT_ADDRESS and AIBA_JETTON_MASTER**

- Deploy the contracts using the project’s Blueprint scripts (see README / deployment docs). Example:
  ```bash
  npx blueprint build
  npx blueprint run deployAibaArena
  ```
- The deploy script (or deploy logs) **prints** the deployed contract addresses. Copy:
  - **AibaToken** (jetton master) address → **AIBA_JETTON_MASTER**
  - **ArenaRewardVault** address → **ARENA_VAULT_ADDRESS**

**ORACLE_PRIVATE_KEY_HEX**

- This is a **32-byte (64 hex character)** secret key used to sign reward claims. The vault contract stores the **public key**; the backend uses this **private key** to sign.

**Generate it:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- Copy the 64-character hex string → **ORACLE_PRIVATE_KEY_HEX**.
- When you deploy the vault, the deploy script will ask for this key (or its public key). Use the **same** key: the backend signs with the private key; the vault must have the matching public key stored (the deploy script usually derives the public key from this private key and configures the contract).

**TON_PROVIDER_URL**

- **Mainnet:** `https://toncenter.com/api/v2/jsonRPC`
- **Testnet:** `https://testnet.toncenter.com/api/v2/jsonRPC`
- Or use another TON API provider; put their JSON-RPC URL here. For production with claims, the backend enforces a mainnet URL when vault/claims are configured.

**TON_API_KEY**

- Go to [toncenter.com](https://toncenter.com) (or your provider’s site) and sign up / create an API key. TonCenter: use the API to get a key to avoid rate limits. Paste that key into **TON_API_KEY**. If you leave it empty, requests may be rate-limited.

### 4.10 Summary: where each value comes from

| Variable(s) | Source |
|-------------|--------|
| NEXT_PUBLIC_BACKEND_URL | Your backend deployment URL (Vercel/Render/Railway) |
| APP_ENV | You choose: `prod` for production, `dev` for local/staging only |
| MONGO_URI | MongoDB Atlas connection string, or `mongodb://localhost:27017/aiba_arena` |
| TELEGRAM_BOT_TOKEN | @BotFather in Telegram |
| ADMIN_JWT_SECRET, BATTLE_SEED_SECRET | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` (run twice) |
| ADMIN_EMAIL | You choose |
| ADMIN_PASSWORD_HASH | bcrypt hash of your password (Node with bcryptjs or bcrypt generator) |
| CORS_ORIGIN | You compose from miniapp + admin URLs |
| TELEGRAM_INITDATA_MAX_AGE_SECONDS | You choose (e.g. 900) |
| BOOST_*_WALLET, LEADER_BOARD_WALLET, CREATED_BROKERS_WALLET, BOOST_PROFILE_WALLET, GIFTS_WALLET | TON wallet address(es) from your wallet app (Super Admin per-product wallets) |
| ARENA_VAULT_ADDRESS, AIBA_JETTON_MASTER | Contract deploy script output |
| ORACLE_PRIVATE_KEY_HEX | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| TON_PROVIDER_URL | toncenter.com or provider docs (mainnet/testnet URL) |
| TON_API_KEY | toncenter.com or provider sign-up |

---

## 5. Cross-Reference Summary

### URLs that must match (see also [Section 4](#4-how-to-get-each-environment-variable))

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
| MONGO_URI, APP_ENV, CORS_ORIGIN, TELEGRAM_*, ADMIN_*, BATTLE_SEED_SECRET, BOOST_*_WALLET, LEADER_BOARD_WALLET, CREATED_BROKERS_WALLET, BOOST_PROFILE_WALLET, GIFTS_WALLET, STARS_STORE_WALLET, CAR_RACING_WALLET, MOTORCYCLE_RACING_WALLET, ARENA_VAULT_*, AIBA_JETTON_MASTER, ORACLE_PRIVATE_KEY_HEX, TON_* | Backend only (Vercel backend project or Render/Railway/etc.) |

---

## 6. Step-by-Step (Copy-Paste Order)

**Tip:** Get the values first using [Section 4](#4-how-to-get-each-environment-variable), then paste them here.

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

## 7. If Backend Is Also on Vercel

If you create a **third** Vercel project for the backend (e.g. **aiba-arena2-backend**):

- **Root Directory:** `backend`
- **Build:** Vercel will use `backend/vercel.json` (serverless via `api/index.js`).
- Add **every** backend variable from **Section 3** in that project’s **Settings → Environment Variables**.
- **CORS_ORIGIN** must list your miniapp and admin-panel production (and preview if you use them) URLs, comma-separated.

No environment variables from Section 3 belong in the miniapp or admin-panel Vercel projects—only in the backend project or your external backend host.

---

This is the full set: nothing omitted. Use **Section 4** to obtain or generate each value, then the checklists and tables above to place them in the right project (Vercel or backend host).
