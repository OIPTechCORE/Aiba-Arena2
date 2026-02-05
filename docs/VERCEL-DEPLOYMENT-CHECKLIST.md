# Vercel Deployment Checklist — AIBA Arena 2

Use this as a quick reference for **which variables** go **where**. Set values in each project’s **Settings → Environment Variables**; never commit real secrets.

**Security:** If you ever pasted tokens, MongoDB URIs, or API keys into chat or a doc, **rotate them** (new bot token, new DB password, new API keys) and update env vars.

---

## URL layout (example)

| Project | Vercel project name | Root directory | Live URL |
|--------|----------------------|----------------|----------|
| **Backend** | aiba-arena2-miniapp (or aiba-arena2-api) | `backend` | `https://aiba-arena2-miniapp.vercel.app` |
| **Miniapp** | aiba-arena2 | `miniapp` | `https://aiba-arena2.vercel.app` |
| **Admin panel** | aiba-arena2-admin-panel | `admin-panel` | `https://aiba-arena2-admin-panel.vercel.app` |

- **NEXT_PUBLIC_BACKEND_URL** (miniapp + admin) = your **backend** URL (e.g. `https://aiba-arena2-miniapp.vercel.app`), **no trailing slash**.
- **NEXT_PUBLIC_APP_URL** / **APP_URL** (miniapp only) = your **miniapp** URL (e.g. `https://aiba-arena2.vercel.app`).
- **NEXT_PUBLIC_TONCONNECT_MANIFEST_URL** = miniapp URL + `/api/tonconnect-manifest` (e.g. `https://aiba-arena2.vercel.app/api/tonconnect-manifest`).

---

## 1. Miniapp (root = `miniapp`)

| Key | Required | Value (example) |
|-----|----------|------------------|
| **NEXT_PUBLIC_BACKEND_URL** | Yes | `https://aiba-arena2-miniapp.vercel.app` |
| **NEXT_PUBLIC_TONCONNECT_MANIFEST_URL** | No | `https://aiba-arena2.vercel.app/api/tonconnect-manifest` |
| **NEXT_PUBLIC_APP_URL** | No | `https://aiba-arena2.vercel.app` |
| **APP_URL** | No | `https://aiba-arena2.vercel.app` |

- [ ] Root Directory = **miniapp**
- [ ] Redeploy after changing env vars

---

## 2. Admin panel (root = `admin-panel`)

| Key | Required | Value (example) |
|-----|----------|------------------|
| **NEXT_PUBLIC_BACKEND_URL** | Yes | `https://aiba-arena2-miniapp.vercel.app` (same as backend URL) |

- [ ] Root Directory = **admin-panel**
- [ ] Redeploy after changing env vars

---

## 3. Backend (root = `backend`)

Set these **where the backend runs** (Vercel backend project, or Render/Railway env).

### 3.1 Required (production)

| Key | Description |
|-----|-------------|
| **MONGO_URI** | MongoDB connection string (e.g. `mongodb+srv://user:pass@cluster.../aiba_arena?retryWrites=true&w=majority`). Use database name `aiba_arena` (or your choice). |
| **APP_ENV** | `prod` |
| **CORS_ORIGIN** | Comma-separated, no spaces: `https://aiba-arena2.vercel.app,https://aiba-arena2-admin-panel.vercel.app` |
| **TELEGRAM_BOT_TOKEN** | From BotFather |
| **TELEGRAM_INITDATA_MAX_AGE_SECONDS** | `300`–`900` (e.g. `900`) |
| **ADMIN_JWT_SECRET** | 32+ char random (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| **BATTLE_SEED_SECRET** | 32+ char random (generate a second value) |
| **ADMIN_EMAIL** | Admin login email |
| **ADMIN_PASSWORD_HASH** | bcrypt hash of admin password (use `bcryptjs` in backend folder; never plaintext in prod) |

### 3.2 Optional (features)

| Key | Description |
|-----|-------------|
| **PORT** | `5000` (host may override) |
| **RATE_LIMIT_PER_MINUTE** | `600` |
| **BOOST_TON_WALLET** | TON address for battle boost payments |
| **LEADER_BOARD_WALLET** | TON address for paid guild create |
| **BOOST_GROUP_WALLET** | TON address for guild boost |
| **CREATED_BROKERS_WALLET** | TON address for “create broker with TON” |
| **BOOST_PROFILE_WALLET** | TON address for “boost your profile” |
| **GIFTS_WALLET** | TON address for gifts |
| **STARS_STORE_WALLET** | TON address for Stars Store (buy Stars with TON) |
| **CAR_RACING_WALLET** | TON address for car creation with TON |
| **MOTORCYCLE_RACING_WALLET** | TON address for bike creation with TON |

### 3.3 On-chain claims (AIBA withdrawal)

Set **all** of these if you want users to withdraw AIBA to TON via the vault:

| Key | Description |
|-----|-------------|
| **ARENA_VAULT_ADDRESS** | ArenaRewardVault contract address (from `npx blueprint run deployAibaArena` / deploy script) |
| **AIBA_JETTON_MASTER** | AIBA jetton master contract address (from same deploy) |
| **ORACLE_PRIVATE_KEY_HEX** | 32-byte hex (64 chars); generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`; use same key when deploying vault |
| **TON_PROVIDER_URL** | Testnet: `https://testnet.toncenter.com/api/v2/jsonRPC`; Mainnet: `https://toncenter.com/api/v2/jsonRPC` |
| **TON_API_KEY** | From toncenter.com (or your TON API provider) to avoid rate limits |

### 3.4 Optional / legacy

| Key | Description |
|-----|-------------|
| **ADMIN_PASSWORD** | Plaintext admin password — **dev only**; use ADMIN_PASSWORD_HASH in prod |
| **ADMIN_SIGNER_TYPE** | `stub` (default) |
| **ADMIN_WALLET** | Legacy |
| **ADMIN_MNEMONIC** | Legacy |
| **ADMIN_JETTON_WALLET** | Legacy |
| **ENABLE_LEGACY_PENDING_AIBA_DISPATCH** | `false` (must stay false in prod) |
| **dailyCapNeurByArena** | JSON, e.g. `{"prediction":5000000}` |

---

## 4. Generate commands (run locally)

**ADMIN_JWT_SECRET / BATTLE_SEED_SECRET (run twice, use one per var):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**ORACLE_PRIVATE_KEY_HEX (for vault claims):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Use this same value when the deploy script asks for the oracle key.

**ADMIN_PASSWORD_HASH (from project root):**
```bash
cd backend
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('YOUR_PASSWORD', 10).then(h=>console.log(h))"
```
Replace `YOUR_PASSWORD` with your admin password; put the printed hash in **ADMIN_PASSWORD_HASH**.

---

## 5. Full variable list (backend) — keys only

For copy-paste into your host’s env editor (fill values yourself):

- MONGO_URI  
- APP_ENV  
- CORS_ORIGIN  
- TELEGRAM_BOT_TOKEN  
- TELEGRAM_INITDATA_MAX_AGE_SECONDS  
- ADMIN_JWT_SECRET  
- BATTLE_SEED_SECRET  
- ADMIN_EMAIL  
- ADMIN_PASSWORD_HASH  
- PORT  
- RATE_LIMIT_PER_MINUTE  
- BOOST_TON_WALLET  
- LEADER_BOARD_WALLET  
- BOOST_GROUP_WALLET  
- CREATED_BROKERS_WALLET  
- BOOST_PROFILE_WALLET  
- GIFTS_WALLET  
- STARS_STORE_WALLET  
- CAR_RACING_WALLET  
- MOTORCYCLE_RACING_WALLET  
- ARENA_VAULT_ADDRESS  
- AIBA_JETTON_MASTER  
- ORACLE_PRIVATE_KEY_HEX  
- TON_PROVIDER_URL  
- TON_API_KEY  

**Note:** The backend uses **AIBA_JETTON_MASTER** (not AIBA_TOKEN_ADDRESS). For full descriptions see [VERCEL-ENV-GUIDE.md](VERCEL-ENV-GUIDE.md).
