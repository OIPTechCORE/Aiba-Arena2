# Aiba-Arena Project — Deep Assessment

**Assessment date:** February 2025  
**Scope:** Repo-wide status of contracts, backend, miniapp, admin-panel, docs, CI, and deployment.

---

## 1. Executive Summary

Aiba-Arena2 is a **TON-based game/reward platform** with:

- **Smart contracts** (Tact): AIBA jetton, arena reward vault, broker NFT, marketplace escrow.
- **Backend** (Express + MongoDB): wallet linking, battles, economy (NEUR/AIBA), reward claims, admin APIs.
- **Miniapp** (Next.js): Telegram Mini App with TonConnect, battles, brokers, ads, economy, on-chain claim flow.
- **Admin panel** (Next.js): operator UI (referenced in CI and README; present in repo).

The codebase is **feature-complete for a testnet/MVP**: contracts build and have tests, backend has production-readiness checks and Vercel serverless support, miniapp implements the full user flow. **Mainnet readiness** is documented in `docs/mainnet-readiness.md` and requires env hardening, key isolation, and operational setup (monitoring, backups, runbooks).

---

## 2. Repository Structure & Ownership

| Component        | Path           | Stack / Tech                          | Status in repo   |
|-----------------|----------------|----------------------------------------|------------------|
| Contracts       | `contracts/`   | Tact, Blueprint, @ton/*                | ✅ Present, builds |
| Scripts         | `scripts/`     | Blueprint run (deploy, mint, etc.)    | ✅ Present        |
| Tests (contracts)| `tests/`     | Jest, @ton/sandbox                     | ✅ Present        |
| Backend         | `backend/`     | Express, Mongoose, node-cron          | ✅ Present        |
| Backend tests   | `backend/tests/` | Node `--test` (TAP)                 | ✅ Present, passing |
| Miniapp         | `miniapp/`     | Next.js 14, TonConnect, axios         | ✅ Present        |
| Admin panel     | `admin-panel/` | Next.js, backend API                  | ✅ Present        |
| Docs            | `docs/`        | deployment, runbook, monitoring, mainnet | ✅ Present      |
| CI              | `.github/workflows/ci.yml` | build, test, lint, miniapp & admin build | ✅ Present |

**Gaps / notes:**

- Root `package.json` **build:contracts** lists `AibaJettonSupply` (from `AibaJetton.tact`); `tact.config.json` correctly maps both `AibaJetton` and `AibaJettonSupply` to their `.tact` files. Build succeeds.
- **docs/deployment.md** still says “Backend: Express (`backend/server.js`)”. Correct: **local/Render** use `server.js`; **Vercel** uses `backend/api/index.js` (serverless). Consider adding one line that Vercel uses `api/index.js`.

---

## 3. Smart Contracts (Tact / Blueprint)

### 3.1 Contracts list (from tact.config.json)

- **AibaJetton** — `contracts/aiba_jetton.tact`
- **AibaJettonSupply** — `contracts/AibaJetton.tact`
- **ArenaVault** — `contracts/ArenaVault.tact`
- **AibaToken** — `contracts/aiba_token.tact` (jetton master + default wallet)
- **ArenaRewardVault** — `contracts/arena_reward_vault.tact` (oracle-signed claims)
- **BrokerNFT** — `contracts/broker_nft.tact` (collection + item)
- **BrokerMarketplaceEscrow** — `contracts/broker_marketplace_escrow.tact`

### 3.2 Build & test status

- **Build:** `npm run build` (Blueprint compile all 7 projects) — **succeeds** (verified).
- **Contract tests:** `npm test` runs `build:contracts` then Jest. Tests exist for:
  - `AibaJetton.spec.ts`
  - `ArenaRewardVault.spec.ts`
  - `BrokerMarketplaceEscrow.spec.ts` / `BrokerMarketplaceEscrowPurchase.spec.ts`
- **Note:** Full `npm test` is heavy (rebuilds all contracts then Jest). CI runs it; locally it may be slow/timeout in constrained environments.

### 3.3 Deploy scripts

- **deployAibaArena.ts** — Deploys AibaToken, prompts for `ORACLE_PRIVATE_KEY_HEX`, deploys ArenaRewardVault, mints to vault, prints backend env snippet. Uses `{ $$type: 'Deploy', queryId: 0n }` for token and `null` for vault (Tact often accepts `null` for Deploy; confirm contract API).
- **deployAibaToken.ts**, **deployArenaRewardVault.ts**, **mintAibaToVault.ts** — Used for split deploy/mint flows.
- **deployBrokerNft.ts**, **deployBrokerMarketplaceEscrow.ts**, **deployBrokerMarketplaceEscrow.ts**, **mintBrokerNft.ts**, **incrementAibaJetton.ts** — Broker/NFT/marketplace and jetton helpers.

Previous fixes (from conversation history) addressed passing a proper `Deploy` message to AibaToken where required; vault deploy may use contract’s default deploy payload.

### 3.4 Risk summary (contracts)

- **Test coverage:** Good for vault claims and marketplace escrow; consider adding tests for AibaToken mint/burn and broker NFT flows if not covered.
- **Mainnet:** Follow `docs/mainnet-readiness.md` (key isolation, vault claim invariants, escrow refund paths, NFT bounce handling).

---

## 4. Backend (Express + MongoDB)

### 4.1 Entry points

- **Local / Render / Railway:** `backend/server.js` — `createApp()` from `app.js`, `initDb()`, cron (legacy pending AIBA dispatch when enabled), `app.listen(PORT)`.
- **Vercel:** `backend/api/index.js` — serverless handler: `createApp()` (once), `initDb()` per request (cached via `db.js`), `app(req, res)`.

### 4.2 App structure (app.js)

- **Middleware:** requestId, metrics, CORS, JSON, global rate limit.
- **Security:** `enforceProductionReadiness(process.env)` — **fail-fast in production**; with `APP_ENV=dev` (or `test`) prod checks are **skipped** (allows Vercel with incomplete prod env).
- **Routes:**  
  `wallet`, `game`, `tasks`, `ads`, `economy`, `gameModes`, `guilds`, `referrals`, `metadata`,  
  `admin/auth`, `admin`, `admin/brokers`, `admin/ads`, `admin/game-modes`, `admin/economy`, `admin/mod`,  
  `battle`, `brokers` (incl. **create-with-ton**), `vault`, `leaderboard`, `marketplace`, `boosts` (incl. **buy-profile-with-ton**), `gifts`, `staking`, `dao`, `daily`, `oracle`, `treasury`, `charity`, `announcements`, `university`; admin sub-routes for charity, announcements, university.  
- **Endpoints:** `/health`, `/metrics` (Prometheus).

### 4.3 Backend tests

- **Runner:** `node --test` (Node built-in test runner, TAP).
- **Files:** e.g. `adminEconomySanitize.test.js`, `battleCooldown.test.js`, `battleEnergy.test.js`, `battleEngine.test.js`, `battleSeed.test.js`, `deterministicRandom.test.js`, `economyWindow.test.js`, `idempotencyKey.test.js`, `productionReadiness.test.js`, `signRewardClaim.test.js`, `telegramPolicy.test.js`.
- **Status:** Tests observed **passing** (TAP ok 1..17+); coverage spans battle engine, economy sanitization, production readiness, telegram policy.

### 4.4 Configuration & env

- **backend/.env.example** documents: `MONGO_URI`, `APP_ENV`, `CORS_ORIGIN`, TON provider, Telegram, admin auth, `BATTLE_SEED_SECRET`, economy caps, vault/claim (`ARENA_VAULT_ADDRESS`, `AIBA_JETTON_MASTER`, `ORACLE_PRIVATE_KEY_HEX`), legacy dispatch flag; **Super Admin TON wallets:** `CREATED_BROKERS_WALLET`, `BOOST_PROFILE_WALLET`, `GIFTS_WALLET`, `LEADER_BOARD_WALLET`, `BOOST_GROUP_WALLET`, `BOOST_TON_WALLET` (see [MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md](MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md)).
- **Production readiness** (see `backend/security/productionReadiness.js`): when `APP_ENV=prod` or `NODE_ENV=production`, requires CORS, Telegram token, initData max age, strong admin JWT/password hash, battle seed, and “all-or-nothing” vault env + non-testnet TON URL if claims enabled.

### 4.5 Risk summary (backend)

- **Vercel:** Works with `APP_ENV=dev` to avoid prod checks; for production on Vercel, set all vars per mainnet-readiness and use `APP_ENV=prod`.
- **Cron:** Legacy pending-AIBA cron runs only in `server.js` (not in Vercel serverless). Intentional; claims flow is signature-based.
- **DB:** `db.js` uses global cache for serverless; `GameMode` model is required by `ensureDefaultGameModes()` — present in `backend/models/GameMode.js`.
- **Rate limiting:** In-memory; mainnet-readiness suggests Redis for multi-instance.

---

## 5. Miniapp (Next.js + TonConnect)

### 5.1 Stack

- Next.js 14, React 18, `@tonconnect/ui-react`, axios.
- **Env:** `NEXT_PUBLIC_BACKEND_URL` (default `http://localhost:5000`); optional `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL`.

### 5.2 Features (from page.js / lib)

- TonConnect wallet connect; Telegram initData or dev fallback (`x-telegram-id`) via `api.js` interceptor.
- **Brokers:** list “mine”, select broker, arena (e.g. prediction); **create broker with TON** (Market tab: pay TON → paste tx hash → broker auto-listed).
- **Battle:** run battle, optional auto-claim on battle.
- **Economy:** `GET /api/economy/me` (includes economy config and profileBoostedUntil).
- **Marketplace:** list/buy brokers (AIBA); create broker (TON) card when configured.
- **Wallet:** **boost your profile** (pay TON, tx hash); **gifts** (send to Telegram ID/username with TON; view received/sent).
- **Ads:** weighted pick from `GET /api/ads?placement=between_battles`.
- **Reward claim:** `buildRewardClaimPayload` (tonRewardClaim.js), send to vault with backend-signed claim.
- **Vault info:** display vault balance/inventory when available.

### 5.3 Status

- **Build:** CI runs `npm ci` + `npm run build` in miniapp — **expected to pass** (README and CI reference it).
- **Local:** `npm run dev` (port 3000); backend URL via `.env.local` from `miniapp/.env.local.example`.

---

## 6. Admin Panel (Next.js)

### 6.1 Presence

- **Repo:** `admin-panel/` exists with `package.json`, `next.config.js`, `src/app/layout.js`, `page.js`, `globals.css`, `.env.local.example`.
- **CI:** `.github/workflows/ci.yml` installs deps and runs `npm run build` in `admin-panel`.

### 6.2 Role

- Operator UI for admin tasks; consumes backend with `NEXT_PUBLIC_BACKEND_URL`.
- Admin auth: backend `ADMIN_JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (or `ADMIN_PASSWORD` for dev).

---

## 7. Documentation & Ops

- **README.md** — Structure, build/test/deploy, backend env, Vercel backend, battle+claim flow, frontends, deployment/ops links, autocommit scripts; **marketplace & payments** link (MARKETPLACE-AND-PAYMENTS-MASTER-PLAN). **Accurate.**
- **docs/deployment.md** — Testnet baseline; components; backend (Render/Railway/Vercel) env; **CREATED_BROKERS_WALLET**, **BOOST_PROFILE_WALLET**, **GIFTS_WALLET**; miniapp + admin on Vercel. **Up to date.**
- **docs/mainnet-readiness.md** — Key separation, validations, idempotency, rate limiting, required env (incl. optional TON wallets for create broker, boost profile, gifts), checklist enforcement, security review steps. **Strong.**
- **docs/runbook.md** — Incident response, production safety checks, key rotation (including oracle), **Super Admin TON wallets** (create broker, boost profile, gifts, leaderboard, boost group, boost TON); security playbooks, data migrations. **Useful.**
- **docs/monitoring.md** — Logs, uptime, Prometheus, suggested alerts and metric names. **Good baseline.**
- **docs/MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md** — 360° plan: TON + AIBA only, Super Admin wallets per product, create broker, boost profile, gifts, implementation reference. **Exhaustive.**
- **docs/USER-GUIDE.md** — Step-by-step play; **marketplace** (create broker TON, list/buy AIBA), **boost profile**, **gifts**; troubleshooting. **Up to date.**
- **docs/GAME-EXPLAINED.md** — What the game is; **marketplace & TON payments** (create broker, boost, gifts); economy, guilds, referrals, flow. **Up to date.**
- **docs/VISION-VS-CODEBASE-CHECK.md** — Vision vs codebase; **create-with-ton**, **boost profile**, **gifts**; routes, models, miniapp. **Up to date.**
- **docs/LEADERBOARD-AND-GROUPS-CHECK.md** — Leaderboard and groups (global, pay-to-create/boost). **Up to date.**
- **docs/VERCEL-ENV-GUIDE.md** — How to get each env var; **CREATED_BROKERS_WALLET**, **BOOST_PROFILE_WALLET**, **GIFTS_WALLET** in TON wallets section. **Up to date.**

---

## 8. CI/CD

- **Trigger:** push / pull_request.
- **Jobs:** Node 20; `npm ci` root; lint (prettier); Blueprint build; contract tests (`npm test`); backend `npm ci` + `npm test`; miniapp install + build; admin-panel install + build.
- **Status:** All steps defined; contract tests can be slow (build + Jest). Backend and frontend build/test are appropriate for a single-pipeline setup.

---

## 9. Security & Production Readiness (recap)

- **Backend:** Production readiness enforced when `APP_ENV=prod` or `NODE_ENV=production`; `APP_ENV=dev` bypasses for flexible deployment (e.g. Vercel staging).
- **Secrets:** Documented in .env.example and mainnet-readiness; no secrets in repo.
- **Telegram:** initData verification and max age; dev escape with `x-telegram-id` when `APP_ENV=dev`.
- **Claims:** Oracle key in backend; mainnet-readiness recommends moving signing to a dedicated service/KMS and allow-lists.

---

## 10. What’s Done vs What’s Next

### Done (current state)

- Tact contracts for token, vault, broker NFT, marketplace escrow; Blueprint build and Jest tests.
- Deploy scripts for token, vault, mint, broker NFT, escrow.
- Backend: full API surface, production-readiness checks, Vercel serverless, MongoDB + GameMode defaults, battle/economy/vault routes, backend unit tests.
- Miniapp: TonConnect, Telegram auth, battles, brokers, economy, ads, reward claim flow.
- Admin panel: present and in CI.
- Docs: deployment, runbook, monitoring, mainnet-readiness.
- CI: build, contract tests, backend tests, miniapp and admin build.

### Completed (recorded in repo)

- **Extend backend tests for new behavior and ensure CI passes (including fixing backend/package.json JSON validity).** — Done: added productionReadiness tests (CORS, ENABLE_LEGACY_PENDING_AIBA_DISPATCH, isProduction); fixed APP_ENV=dev test; verified backend/package.json JSON validity; all 46 backend tests pass.
- **Finalize mainnet readiness checklist enforcement and runbooks (security + key mgmt + validation defaults).** — Done: mainnet-readiness.md has "Validation defaults" and updated "Checklist enforcement" (incl. legacy dispatch); runbook.md has Key management summary, validation-defaults ref, production safety details, and Security checklist (pre-mainnet).

### Recommended next steps (concise)

1. **Mainnet:** Set `APP_ENV=prod` and all required env; complete mainnet-readiness checklist (keys, CORS, Telegram, vault, TON provider).
2. **Deployment doc:** One-line clarification that Vercel uses `backend/api/index.js`.
3. **Rate limiting:** Plan Redis (or shared store) for production multi-instance.
4. **Contract tests:** Run full `npm test` in CI; if flaky/slow, consider splitting “build only” vs “build + test” or caching build artifacts.
5. **Operational:** Configure monitoring/alerting per docs/monitoring.md; test backups and runbook procedures.

---

## 11. Overall Grade & One-Line Summary

- **Completeness:** **High** — All four pillars (contracts, backend, miniapp, admin) are implemented and wired; docs and CI are in place.
- **Production hardening:** **Documented** — mainnet-readiness and runbook give a clear path; implementation already has fail-fast checks and security hooks.
- **Deployment flexibility:** **Good** — Backend runs as long-lived (server.js) or serverless (Vercel); frontends build for Vercel.

**One-line summary:** Aiba-Arena2 is a **testnet-ready TON game/reward stack** with contracts, Express backend (local + Vercel), Telegram miniapp, and admin panel; mainnet readiness is documented and largely enforced by existing production checks, with a short list of follow-ups (env, docs tweak, rate-limit store, ops).
