# Aiba-Arena2

- **Game explanation:** [docs/GAME-EXPLAINED.md](docs/GAME-EXPLAINED.md) — what the game is, brokers, arenas, battles, economy, claims, guilds, referrals, marketplace, TON payments, boost profile, gifts.
- **User guide:** [docs/USER-GUIDE.md](docs/USER-GUIDE.md) — how to play: connect wallet, create broker, run battles, earn NEUR/AIBA, withdraw AIBA on-chain, guilds, marketplace (create broker with TON, list/buy with AIBA), boost profile, gifts, referrals, troubleshooting.
- **Marketplace & payments (360° plan):** [docs/MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md](docs/MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md) — TON + AIBA only, Super Admin wallets per product, create broker, boost profile, gifts.
- **Vision vs codebase:** [docs/VISION-VS-CODEBASE-CHECK.md](docs/VISION-VS-CODEBASE-CHECK.md) — deep check of the AI Broker Battle Arena vision/spec against the repo (implemented, partial, not implemented, misalignments).
- **Printable docs:** Run `npm run build:print-docs`, then open **docs/print/index.html** in a browser to print or save as PDF — [docs/PRINT.md](docs/PRINT.md).

## Project structure

- `contracts` - Tact smart contracts (TON).
- `scripts` - deployment / interaction scripts for contracts (Blueprint).
- `tests` - contract tests (TON sandbox + Jest).
- `backend` - Express + MongoDB API server (wallet connect, game score rewards, admin tasks).
- `miniapp` - React miniapp (TonConnect + Telegram WebApp integration).
- `admin-panel` - React admin panel (tasks UI).

## Run on localhost

To run the full stack (backend + miniapp + admin panel) on your machine:

1. **Prerequisites:** Node.js 18+, MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas); use connection string with database name `aiba_arena`).
2. **Backend:** Copy `backend/.env.example` to `backend/.env`, set `MONGO_URI` (local or Atlas) and `APP_ENV=dev`, then run:
   ```bash
   cd backend && npm install && npm start
   ```
   Backend runs at **http://localhost:5000**.
3. **Miniapp:** `cd miniapp && npm install && npm run dev` → **http://localhost:3000**
4. **Admin panel:** `cd admin-panel && npm install && npm run dev` → **http://localhost:3001** (log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `backend/.env`).

Optional: from repo root, run **`npm run dev`** to start all three at once (see [docs/RUN-LOCALHOST.md](docs/RUN-LOCALHOST.md)).

Full step-by-step, troubleshooting, and env details: **[docs/RUN-LOCALHOST.md](docs/RUN-LOCALHOST.md)**.

---

## How to use

## Smart contracts (Blueprint)

### Build

`npx blueprint build` or `yarn blueprint build`

### Test

`npx blueprint test` or `yarn blueprint test`

### Deploy or run another script

`npx blueprint run` or `yarn blueprint run`

### Deploy AIBA token + reward vault (testnet)

After building, you can deploy:

```bash
npx blueprint build
npx blueprint run deployAibaArena
npx blueprint run deployAibaToken
npx blueprint run deployArenaRewardVault <AIBA_TOKEN_ADDRESS>
npx blueprint run mintAibaToVault <AIBA_TOKEN_ADDRESS> <VAULT_ADDRESS> <AMOUNT>
```

Notes:

- `deployAibaArena` does the full flow (token + vault + mint) and prints the env snippet you need.
- `deployArenaRewardVault` will prompt for `ORACLE_PRIVATE_KEY_HEX` and prints the public key (you’ll need the private key in backend for signing).
- For claims to work, the **miniapp user must have connected a wallet** so backend knows the `toAddress`.

### Add a new contract

`npx blueprint create ContractName` or `yarn blueprint create ContractName`

## Backend (API)

Create an env file:

- Copy `backend/.env.example` to `backend/.env`
- Set `MONGO_URI`
- For local dev, ensure `APP_ENV=dev` (skips Telegram signature verification)

Run:

```bash
cd backend
npm install
npm start
```

Health check: `GET /health` on `http://localhost:5000/health`

Metrics: `GET /metrics` on `http://localhost:5000/metrics` (Prometheus)

### Deploy backend on Vercel

This backend can run on Vercel as a serverless Express API.

- Create a **new Vercel project** for the backend
- Set **Root Directory** to `backend`
- Vercel will deploy the API using `backend/vercel.json`

After deploy, your backend domain will look like:

- `https://<your-backend-project>.vercel.app`

Example endpoints:

- `GET https://<your-backend-project>.vercel.app/health`
- `GET https://<your-backend-project>.vercel.app/metrics`
- `POST https://<your-backend-project>.vercel.app/api/admin/auth/login`

Required Vercel env vars (set in the backend project):

- `MONGO_URI`
- `CORS_ORIGIN=https://aiba-arena2-miniapp.vercel.app,https://aiba-arena2-admin-panel.vercel.app`
- `ADMIN_JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (or `ADMIN_PASSWORD` for dev only)

### Battle + on-chain claim (optional)

The end-to-end flow is:

- Miniapp calls `POST /api/battle/run` → backend returns a `claim` (if configured)
- Miniapp uses TonConnect to send an internal message to `ArenaRewardVault` with the `RewardClaim` body (includes signature)

To enable claims you must configure in `backend/.env`:

- `ARENA_VAULT_ADDRESS`
- `AIBA_JETTON_MASTER`
- `ORACLE_PRIVATE_KEY_HEX` (32-byte seed, hex)
- `TON_PROVIDER_URL` (TonCenter testnet endpoint is fine)
- `TON_API_KEY` (recommended to avoid rate limits)

Optional (recommended for debugging):

- `GET /api/vault/inventory` shows vault TON balance + Jetton wallet balance

## Frontends

Both apps use `NEXT_PUBLIC_BACKEND_URL` (default `http://localhost:5000`).

To override locally:

- Copy `miniapp/.env.local.example` to `miniapp/.env.local`
- Copy `admin-panel/.env.local.example` to `admin-panel/.env.local`

### Admin auth (required for admin panel)

Set these in `backend/.env`:

- `ADMIN_JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH` (bcrypt) or `ADMIN_PASSWORD` (dev only)

## Deployment / Ops

- **Printable docs:** `npm run build:print-docs` → open `docs/print/index.html` ([docs/PRINT.md](docs/PRINT.md)).
- Deployment guide: `docs/deployment.md`
- Ops runbook: `docs/runbook.md`
- Monitoring notes: `docs/monitoring.md`
- Mainnet readiness checklist: `docs/mainnet-readiness.md`

## Git auto-commit (optional)

This repo may be used without git. If you want quick local commits:

- PowerShell: `scripts/autocommit.ps1 "message"`
- Bash: `scripts/autocommit.sh "message"`

### Miniapp

```bash
cd miniapp
# optional: copy env template if you want to override the backend URL
# cp .env.local.example .env.local
npm install
npm run dev
```

### Admin panel

```bash
cd admin-panel
# optional: copy env template if you want to override the backend URL
# cp .env.local.example .env.local
npm install
npm run dev
```
