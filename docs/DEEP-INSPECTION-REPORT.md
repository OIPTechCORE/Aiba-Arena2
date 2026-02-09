# Deep Inspection Report — Aiba-Arena2

**Inspection date:** February 6, 2025

This document is a **systematic inspection** of the whole project: structure, backend, frontends, contracts, docs, config, security, and consistency. It is intended to be updated after major changes or before releases.

---

## 1. Project structure (high level)

| Path | Purpose | Status |
|------|---------|--------|
| **contracts/** | Tact smart contracts (TON): AIBA token, vault, broker NFT, escrow, AI asset registry/escrow | ✅ 12 `.tact` files; `tact.config.json` defines 9 projects |
| **scripts/** | Blueprint scripts: deploy, mint, increment; plus `build-print-docs.js`, `autocommit.*`, `commit-backend-docs-sync.ps1` | ✅ Present |
| **tests/** | Jest + TON sandbox: AibaJetton, ArenaRewardVault, BrokerMarketplaceEscrow, AiAssetRegistry, AiAssetMarketplaceEscrow | ✅ 6 spec files |
| **backend/** | Express + MongoDB API, server.js + api/index.js (Vercel) | ✅ app.js mounts all routes; db.js, engine, jobs, models, routes, security, ton, util |
| **miniapp/** | Next.js 14, React 18, TonConnect, single page with tabs | ✅ app (page, layout, providers, api/tonconnect-manifest), lib (api, telegram, tonRewardClaim) |
| **admin-panel/** | Next.js admin UI | ✅ app (page, layout), .env.local.example |
| **docs/** | 27+ markdown docs + print/ HTML | ✅ Plans, guides, deployment, runbook, monitoring, UP-TO-DATE-CHECK |
| **.github/workflows/ci.yml** | CI: lint, Blueprint build, contract tests, backend tests, miniapp + admin build | ✅ Node 20; all four areas covered |
| **cronWorker.js** (root) | Stub cron (runs every minute, logs only) | ⚠️ Not wired to backend; main cron lives in `backend/server.js`. Consider removing or documenting as optional/legacy |

---

## 2. Backend

### 2.1 Entry points

- **Standalone:** `backend/server.js` — loads dotenv, creates app, initDb, seedRacingTracks + syncTopLeaderBadges, cron for legacy pendingAIBA (if enabled) and 6-hour badge sync, listens on `PORT` (default 5000).
- **Vercel:** `backend/api/index.js` — exports handler that createApp + initDb per request; `vercel.json` routes `/(.*)` to `api/index.js`.

### 2.2 App and routes

- **app.js:** CORS (from `CORS_ORIGIN`), JSON, rate limit (default 600/min), production readiness enforced in `security/productionReadiness.js`. All API routes mounted under `/api/*` and `/api/admin/*`; `/health`, `/metrics` exposed.
- **Routes (summary):** wallet, game, tasks, ads, economy, game-modes, guilds, referrals, metadata; admin (auth, brokers, ads, game-modes, economy, mod, treasury, stats, charity, announcements, university, multiverse, realms, marketplace, treasury-ops); battle, brokers, vault, leaderboard, marketplace, boosts, staking, dao, daily, gifts, oracle, treasury (summary + ops), charity, announcements, university, multiverse, **realms**, **missions**, **mentors**, **assets**, **asset-marketplace**, **governance**, stars-store, **car-racing**, **bike-racing**; comms status.

### 2.3 Database and models

- **db.js:** Mongoose; `MONGO_URI` required; cache for serverless; `ensureDefaultGameModes()` on first connect.
- **Models (sample):** User, Broker, Battle, GameMode, Guild, Listing, LedgerEntry, EconomyConfig, BikeTrack, CarTrack, BikeRace, CarRace, RacingMotorcycle, RacingCar, Gift, NftStake, NftUniverse, UsedTonTxHash, CharityCampaign, CharityDonation, UniversityProgress, **Realm**, **Mission**, **Mentor**, **Asset**, **AssetListing**, **Rental**, **TreasuryOp**, **GovernanceProposal** — all present and aligned with routes.

### 2.4 Security and auth

- **Production readiness:** `APP_ENV`/`NODE_ENV`; requires CORS_ORIGIN, TELEGRAM_BOT_TOKEN, TELEGRAM_INITDATA_MAX_AGE_SECONDS, ADMIN_JWT_SECRET, BATTLE_SEED_SECRET, ADMIN_EMAIL + ADMIN_PASSWORD_HASH in prod.
- **Telegram:** `requireTelegram` middleware; dev accepts `x-telegram-id` when `APP_ENV=dev`.
- **Admin:** JWT via `requireAdmin`; bcrypt for password hash.

### 2.5 Config and env

- **.env.example:** Complete; MONGO_URI (local + Atlas note), APP_ENV, CORS, TON, Telegram, admin, vault, all TON wallets (boost, leaderboard, brokers, profile, gifts, stars-store, car-racing, motorcycle-racing), TELEGRAM_INITDATA_MAX_AGE_SECONDS, BATTLE_SEED_SECRET, legacy dispatch flag. No real secrets.
- **.gitignore:** `.env` and `.env.*` ignored (except `.env.example` and `*.example`). ✅

---

## 3. Miniapp

### 3.1 Structure

- **app:** `page.js` (single page, 15 tabs), `layout.js` (viewport with viewportFit cover), `providers.js` (TonConnectUIProvider, manifestUrl, uiPreferences DARK), `globals.css` (3D theme, TonConnect modal responsive, #tc-widget-root).
- **app/api/tonconnect-manifest/route.js:** Returns manifest with dynamic `baseUrl` (x-forwarded-host/proto or NEXT_PUBLIC_APP_URL).
- **lib:** api.js (createApi, x-telegram-init-data / x-telegram-id), telegram.js, tonRewardClaim.js.

### 3.2 Tabs (TAB_LIST in page.js)

Home, Brokers, Market, Car Racing, Bike Racing, Multiverse, Arenas, Guilds, Charity, University, Realms, Assets, Governance, Updates, Wallet. ✅ Matches docs (USER-GUIDE, TELEGRAM-MINI-APP-UI-UX-AUDIT, UP-TO-DATE-CHECK).

### 3.3 Connect Wallet

- When not connected: custom "Connect Wallet" button calls `tonConnectUI.openModal()` → TonConnect modal with TON wallet list.
- When connected: TonConnectButton.
- Modal: responsive (100dvh, safe-area, full-width ≤440px; header icon-only ≤360px); viewport `viewportFit: 'cover'` in layout.

### 3.4 Config

- **package.json:** Next 14, React 18, @tonconnect/ui-react ^2.0.0, axios, @ton/core; caniuse-lite override.
- **public/tonconnect-manifest.json:** Static fallback; **fixed in this inspection** to use `https://aiba-arena2.vercel.app` (was incorrectly `aiba-arena2-miniapp.vercel.app`). Live manifest is served by `/api/tonconnect-manifest` with correct baseUrl.

---

## 4. Admin panel

- Next.js, React; single app (page, layout); axios to backend; auth via `/api/admin/auth/login`, token in localStorage. Port 3001 in dev. ✅

---

## 5. Contracts and CI

- **tact.config.json:** Nine projects (AibaJetton, AibaJettonSupply, ArenaVault, AibaToken, ArenaRewardVault, BrokerNFT, BrokerMarketplaceEscrow, AiAssetRegistry, AiAssetMarketplaceEscrow).
- **Root package.json:** build = Blueprint build; test = build + jest; dev = concurrently backend + miniapp + admin; lint = prettier.
- **CI:** npm ci (root), lint, Blueprint build, contract tests; backend npm ci + test; miniapp npm ci + build; admin npm ci + build. ✅

---

## 6. Documentation alignment

| Doc | Alignment |
|-----|-----------|
| README | Ports 5000/3000/3001, MongoDB Atlas note, backend env, Connect Wallet sentence, frontends env, deploy backend on Vercel. ✅ |
| RUN-LOCALHOST | Steps, MONGO_URI (local + Atlas), §7 TonConnect + responsive modal. ✅ |
| deployment.md | MONGO_URI, wallets, vault, TELEGRAM_INITDATA_MAX_AGE_SECONDS; Vercel as separate project (root `backend/`); CORS_ORIGIN (production); vault/claim set all together. ✅ |
| VERCEL-DEPLOYMENT-CHECKLIST | Backend = aiba-arena2-miniapp (or -api), Miniapp = aiba-arena2, Admin = aiba-arena2-admin-panel; env table. ✅ |
| VERCEL-ENV-GUIDE | Miniapp/admin env, NEXT_PUBLIC_BACKEND_URL, TonConnect manifest. ✅ |
| PROJECT-DESCRIPTION-SYSTEMATIC | Layout, stack, contracts, backend routes, miniapp tabs, cronWorker note. ✅ |
| UP-TO-DATE-CHECK | Ports, Connect Wallet (modal + responsive), phase 1–5 features, backend/docs sync script. ✅ |
| TELEGRAM-MINI-APP-UI-UX-AUDIT | Connect Wallet responsive modal, layout viewport, 15 tabs. ✅ |
| UNIVERSAL-SPEC | Architecture, domain glossary, phase matrix. ✅ |
| API-CONTRACT | Realms/mentors/assets/marketplace/governance endpoints. ✅ |
| GAME-EXPLAINED, USER-GUIDE, VISION-VS-CODEBASE | Car/Bike racing, 12 tabs, marketplace, multiverse. ✅ |

---

## 7. Security and secrets

- No `.env` or real secrets in repo; `.env.example` has placeholders only.
- Production readiness enforces CORS, Telegram token, initData max age, admin JWT + hash, battle seed.
- TON wallets and keys documented as env vars, not hardcoded.

---

## 8. Dependency consistency

- **@ton/core:** Root ^0.63.0; backend ^0.63.0; miniapp ^0.63.0. ✅
- **Node:** CI uses 20. README says 18+. ✅
- Backend: express, mongoose, mongodb, dotenv, cors, bcryptjs, jsonwebtoken, node-cron, prom-client, tonweb, tweetnacl, axios. Miniapp: next 14, react 18, @tonconnect/ui-react, axios. Admin: next 14, react 18, axios. ✅

---

## 9. Findings and fixes applied

| Item | Severity | Action |
|------|----------|--------|
| **miniapp/public/tonconnect-manifest.json** | Low | URL was `aiba-arena2-miniapp.vercel.app` (backend project name). Updated to `aiba-arena2.vercel.app` (miniapp URL). Live manifest is from API route anyway. |
| **cronWorker.js (root)** | Info | Stub only; main cron in backend/server.js. Document as optional/legacy or remove to avoid confusion. |

---

## 10. Summary

- **Structure:** Monorepo with contracts, backend, miniapp, admin-panel, docs, scripts, tests; CI covers all.
- **Backend:** Express + MongoDB; all routes and models present; production readiness and Telegram/admin auth in place; Vercel serverless entry exists.
- **Miniapp:** 12 tabs, Connect Wallet opens TON wallet list modal (responsive); viewport and TonConnect manifest correct.
- **Admin:** Minimal Next.js app; auth and backend URL config.
- **Docs:** Aligned with code (ports, env, Connect Wallet, racing, multiverse).
- **Secrets:** Not committed; env example sanitized.
- **Fix applied:** Static TonConnect manifest URL corrected to miniapp domain.

Re-run this inspection after large feature work or before releases. Update this report when structure or behavior changes.
