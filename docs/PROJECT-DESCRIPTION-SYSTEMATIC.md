# Aiba-Arena2 — Deepest Systematic Project Description

This document is a **complete, systematic description** of the Aiba-Arena2 project. Nothing material is omitted: identity, architecture, tech stack, contracts, backend, frontends, economy, game flow, security, deployment, and operations.

---

## 1. Project Identity and Purpose

**Name:** Aiba-Arena2 (AIBA Arena)

**What it is:** A **TON-based game and reward platform** delivered as a **Telegram Mini App**. Users own AI-powered “broker” agents, compete in arenas (prediction, simulation, strategy wars, arbitrage, guild wars), run server-authoritative battles, and earn two in-app currencies: **NEUR** (off-chain only) and **AIBA** (off-chain credits that can be **withdrawn on-chain** as real AIBA jettons via a signed-claim vault). Supporting systems include guilds (groups), referrals, marketplace, staking, DAO, charity, university (courses/badges), announcements, boosts, daily rewards, and admin tooling.

**Core loop:** Connect wallet (TonConnect) → create/select broker → choose arena and league → run battle → receive deterministic score → earn NEUR + AIBA credits → optionally create signed claim and withdraw AIBA to TON wallet in one transaction.

**Related docs:**  
- **Game mechanics:** [GAME-EXPLAINED.md](GAME-EXPLAINED.md)  
- **User flow:** [USER-GUIDE.md](USER-GUIDE.md)  
- **Vision vs implementation:** [VISION-VS-CODEBASE-CHECK.md](VISION-VS-CODEBASE-CHECK.md)  
- **Marketplace & payments (360° plan):** [MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md](MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md)  
- **NFT Multiverse (own, stake, earn):** [NFT-MULTIVERSE-MASTER-PLAN.md](NFT-MULTIVERSE-MASTER-PLAN.md)  
- **Autonomous Racing (Car & Motorcycle):** [AUTONOMOUS-RACING-MASTER-PLAN.md](AUTONOMOUS-RACING-MASTER-PLAN.md)  
- **Leaderboard & groups:** [LEADERBOARD-AND-GROUPS-CHECK.md](LEADERBOARD-AND-GROUPS-CHECK.md)  
- **Deployment:** [deployment.md](deployment.md)  
- **Mainnet readiness:** [mainnet-readiness.md](mainnet-readiness.md)  
- **Ops:** [runbook.md](runbook.md), [monitoring.md](monitoring.md)  
- **Assessment:** [PROJECT-ASSESSMENT.md](PROJECT-ASSESSMENT.md)

---

## 2. Repository and High-Level Architecture

### 2.1 Top-Level Layout

| Path | Purpose |
|------|--------|
| `contracts/` | Tact smart contracts (TON): AIBA token, reward vault, broker NFT, marketplace escrow, jetton wallet/messages. |
| `scripts/` | Blueprint runnable scripts: deploy token/vault/NFT/escrow, mint AIBA to vault, mint broker NFT, increment jetton. |
| `tests/` | Contract tests (Jest + TON sandbox): AibaJetton, ArenaRewardVault, BrokerMarketplaceEscrow (and purchase flow). |
| `backend/` | Express + MongoDB API: auth, battles, economy, brokers, guilds, referrals, vault claims, admin, cron. |
| `miniapp/` | Next.js Telegram Mini App: TonConnect, tabs (Home, Brokers, Arenas, Guilds, Market, Charity, University, Stars Store, Car Racing, Bike Racing, Updates, Wallet). |
| `admin-panel/` | Next.js admin UI: tasks, ads, game modes, economy config, moderation, stats, treasury, charity, university, announcements. |
| `docs/` | All project documentation (game, user guide, vision check, deployment, runbook, monitoring, plans). |
| `.github/workflows/ci.yml` | CI: lint, Blueprint build, contract tests, backend tests, miniapp + admin build. |
| `tact.config.json` | Tact compiler config: seven projects (AibaJetton, AibaJettonSupply, ArenaVault, AibaToken, ArenaRewardVault, BrokerNFT, BrokerMarketplaceEscrow). |
| `jest.config.ts`, `jest.setup.ts` | Jest config for contract tests. |
| `cronWorker.js` | Optional root-level cron entry (if used; main cron lives in `backend/server.js`). |

### 2.2 Data and Control Flow (Simplified)

- **User** opens Mini App in Telegram → frontend sends requests with Telegram `initData` (or dev `x-telegram-id`) to backend.
- **Backend** authenticates via Telegram, persists/updates User in MongoDB, runs battles (deterministic engine), updates Broker (energy, cooldowns), applies economy (NEUR/AIBA credits, ledger), and can return a **signed reward claim** for AIBA.
- **Miniapp** uses TonConnect to send a single transaction to **ArenaRewardVault** with the signed claim; vault verifies signature and per-recipient seqno, then transfers AIBA jettons from its jetton wallet to the user’s wallet.
- **Admin panel** authenticates with JWT (email + password/hash), calls admin-only routes to manage tasks, ads, game modes, economy, moderation, treasury, charity, university, stats, mint jobs.

---

## 3. Technology Stack

### 3.1 Root (Contracts & Scripts)

- **Node.js** (CI uses 20).
- **Blueprint** (`@ton/blueprint`): build and run Tact contracts and TypeScript scripts.
- **Tact** (`@tact-lang/compiler`): compile `.tact` to FunC; `tact.config.json` defines all projects.
- **@ton/core**, **@ton/ton**, **@ton/sandbox**, **@ton/test-utils**, **@ton/crypto**, **@ton/tolk-js**, **@ton-community/func-js**: TON SDK and testing.
- **Jest**, **ts-jest**: contract tests.
- **Prettier**: lint/format (root and backend).

### 3.2 Backend

- **Runtime:** Node.js; **framework:** Express.
- **Database:** MongoDB via **Mongoose**.
- **Auth:** Telegram initData verification (`security/telegram.js`, `telegramPolicy.js`); admin JWT (`jsonwebtoken`), bcrypt for password hash.
- **TON:** `@ton/core`, **tweetnacl** (ed25519 for claim signing), **tonweb** / **tonweb-mnemonic** (optional legacy send).
- **Cron:** **node-cron** (in `server.js`: legacy pending-AIBA dispatch when enabled; top-leader badge sync every 6 hours).
- **Metrics:** **prom-client** (Prometheus); `/metrics` and `/health`.
- **Deployment:** Standalone (`server.js`) or Vercel serverless (`api/index.js`).

### 3.3 Miniapp

- **Next.js** (14), **React** (18).
- **TonConnect:** `@tonconnect/ui-react` (wallet connect, send claim tx).
- **HTTP:** axios; API base URL from `NEXT_PUBLIC_BACKEND_URL`.
- **Telegram:** WebApp initData and user from `lib/telegram.js`; optional TonConnect manifest at `/api/tonconnect-manifest`.

### 3.4 Admin Panel

- **Next.js**, **React**.
- **axios** to backend with `Authorization: Bearer <token>`; token from login (`/api/admin/auth/login`) stored in localStorage.

---

## 4. Smart Contracts (Tact / TON)

All built via Blueprint/Tact; config in `tact.config.json`. Output under `build/` per project.

### 4.1 Contract List and Roles

| Contract | File | Role |
|----------|------|------|
| **AibaJetton** | `contracts/aiba_jetton.tact` | Jetton (alternate/legacy naming). |
| **AibaJettonSupply** | `contracts/AibaJetton.tact` | Jetton supply / master. |
| **ArenaVault** | `contracts/ArenaVault.tact` | Vault variant (may align with reward flow). |
| **AibaToken** | `contracts/aiba_token.tact` | **Jetton master + default wallet**: mint, burn; used as AIBA reward token. |
| **ArenaRewardVault** | `contracts/arena_reward_vault.tact` | **Reward vault**: receives signed `RewardClaim` (to, amount, seqno, validUntil, signature); verifies ed25519 oracle signature and per-recipient seqno; transfers AIBA from vault jetton wallet to `to`. |
| **BrokerNFT** | `contracts/broker_nft.tact` | **Broker NFT collection + items**: owner mints `MintBroker(to, metadata)`; TEP-62 style. |
| **BrokerMarketplaceEscrow** | `contracts/broker_marketplace_escrow.tact` | **Marketplace**: seller sends broker NFT with price in forward payload → listing; buyer pays AIBA to escrow jetton wallet with listingId → FinalizePurchase; fee/treasury/burn configurable. |

Supporting: `jetton_messages.tact`, `jetton_default_wallet.tact`, `broker_nft_messages.tact` (messages and wallet used by token/vault/NFT/escrow).

### 4.2 ArenaRewardVault (Claims)

- **Ownable**; holds **oracle public key** (uint256) and **jetton master** address.
- **lastSeqno: map&lt;Address, uint64&gt;** for replay protection per recipient.
- **RewardClaim** message: `to`, `amount`, `seqno`, `validUntil`, `signature` (64 bytes).
- Checks: `now() <= validUntil`, `amount > 0`, `sender() == to` (claim must be sent by recipient), `seqno == lastSeqno[to] + 1`, and signature over canonical payload (vault, jetton master, to, amount, seqno, validUntil).
- On success: increments `lastSeqno[to]`, sends jetton transfer from vault’s jetton wallet to `to`.
- Admin: `SetOracle`, `SetJettonMaster` (owner-only).

### 4.3 AibaToken (Jetton)

- **Deployable**, **Ownable**; mintable flag; totalSupply.
- **Mint(to, amount)** (owner-only); **SafeTokenBurn** (owner burn).
- Uses shared jetton wallet init and token transfer messages.

### 4.4 BrokerMarketplaceEscrow

- **Owner**, **brokerCollection**, **jettonMaster**, **treasury**, **feeBps**, **burnBps**.
- **Pending listings** by NFT item (seller, price); **listings** by id (nftItem, seller, price, active).
- **payments**: buyer → (listingId → amount paid).
- Seller: transfer NFT to escrow with price in forward payload → pending then listing.
- Buyer: send AIBA to escrow jetton wallet with listingId in forward payload; then **FinalizePurchase(listingId)** to receive NFT; jettons to seller minus fee; optional **RefundPayment** if finalization failed.

### 4.5 Deploy and Helper Scripts (`scripts/`)

- **deployAibaArena.ts** — Full flow: deploy AibaToken, prompt for oracle key, deploy ArenaRewardVault, mint to vault; prints backend env snippet.
- **deployAibaToken.ts**, **deployArenaRewardVault.ts**, **mintAibaToVault.ts** — Split deploy/mint.
- **deployBrokerNft.ts**, **deployBrokerMarketplaceEscrow.ts**, **mintBrokerNft.ts**, **incrementAibaJetton.ts** — NFT and jetton ops.
- **autocommit.ps1**, **autocommit.sh** — Optional git auto-commit helpers.

---

## 5. Backend — Deep Structure

### 5.1 Entry Points

- **Local / Render / Railway:** `backend/server.js` — `require('dotenv').config()`, `createApp()` from `app.js`, `initDb()`, optional cron (legacy pending AIBA; top-leader badge sync), `app.listen(PORT)`.
- **Vercel:** `backend/api/index.js` — serverless handler: same `createApp()`, `initDb()` (cached in `db.js` global), `app(req, res)`.

### 5.2 Application Bootstrap (`app.js`)

- **Security:** `enforceProductionReadiness(process.env)` at startup (fail-fast in prod if CORS, Telegram, admin, battle seed, vault env are missing/weak; skipped when `APP_ENV=dev` or `test`).
- **Middleware (order):** `requestId`, `metricsMiddleware`, CORS (from `CORS_ORIGIN`), `express.json()`, global **rateLimit** (e.g. 600/min from `RATE_LIMIT_PER_MINUTE`).
- **Routes:** See section 5.4.
- **Endpoints:** `GET /health`, `GET /metrics` (Prometheus), `GET /api/comms/status`.
- **Error handler:** Last-resort 500 JSON with `requestId`.

### 5.3 Database (`db.js`)

- **Mongoose** connection to `MONGO_URI`; global cache for serverless (single connection reuse).
- **ensureDefaultGameModes():** Idempotent upsert of default game modes: arenas `prediction`, `simulation`, `strategyWars`, `guildWars`, `arbitrage` × leagues `rookie`, `pro`, `elite` (key e.g. `prediction`, `prediction-pro`, `prediction-elite`), with energyCost, cooldownSeconds, reward multipliers, and `guildWars` rules `{ requiresGuild: true }`.

### 5.4 Routes (Complete)

**Public / game (Telegram-authenticated where noted):**

- `/api/wallet` — connect wallet (store TON address for user).
- `/api/game` — game config.
- `/api/tasks` — list tasks.
- `/api/ads` — ads by placement.
- `/api/economy` — me, claim-aiba (create claim).
- `/api/game-modes` — list game modes.
- `/api/guilds` — create (optional TON txHash for paid create), join, leave, list, top, deposit/withdraw broker, `:guildId/boost` (TON txHash).
- `/api/referrals` — create code, use (apply referral).
- `/api/metadata` — metadata for app.
- `/api/battle` — **POST /run** (requestId, brokerId, arena, league, modeKey; optional auto-claim).
- `/api/brokers` — mine, create starter, **create-with-ton** (pay TON → new broker + auto-list), train, repair, upgrade, combine, mint-nft.
- `/api/vault` — inventory, claim-status, last-seqno.
- `/api/leaderboard` — global list (by score/aiba/neur/battles), my-rank.
- `/api/marketplace` — listings, list, buy.
- `/api/stars-store` — **config** (pack Stars, price AIBA, price TON, wallet), **buy-with-aiba** (one pack), **buy-with-ton** (txHash → TON to STARS_STORE_WALLET).
- `/api/boosts` — mine, buy (NEUR), buy-with-ton, **buy-profile-with-ton** (pay TON → profile boost visibility).
- `/api/staking` — summary, stake, unstake, claim.
- `/api/dao` — proposals (list, create), vote, close, execute.
- `/api/daily` — status, claim (daily NEUR).
- `/api/oracle` — price (oracle display).
- `/api/treasury` — summary.
- `/api/charity` — campaigns, donate, impact.
- `/api/announcements` — list (active).
- `/api/gifts` — **send** (pay TON → gift to user by telegramId/username), **received**, **sent**.
- `/api/multiverse` — **universes** (list NFT universes), **me** (my NFTs), **stake** (stake broker NFT), **unstake**, **staking/rewards**, **staking/claim** (claim AIBA from NFT staking).
- `/api/university` — courses, progress (GET/POST), mint-course-badge-info, mint-course-badge, mint-full-certificate-info, mint-full-certificate.

**Admin (JWT required):**

- `/api/admin/auth` — login (email, password) → JWT.
- `/api/admin` — base admin.
- `/api/admin/brokers` — mint-jobs (list, complete).
- `/api/admin/ads` — CRUD ads.
- `/api/admin/game-modes` — CRUD game modes.
- `/api/admin/economy` — get/update config, simulate.
- `/api/admin/mod` — moderation (ban/unban by telegramId).
- `/api/admin/treasury` — fund Treasury, StabilityReserve, BuybackPool.
- `/api/admin/stats` — DAU, total users/battles, emitted today.
- `/api/admin/charity` — manage charity campaigns.
- `/api/admin/announcements` — manage announcements.
- `/api/admin/multiverse` — **universes** (list), **universes/:slug** (PATCH), **stakes** (list NFT stakes).
- `/api/admin/university` — stats, courses, graduates.

### 5.5 Backend Models (MongoDB / Mongoose)

| Model | Purpose |
|-------|--------|
| **User** | telegramId (unique), username, telegram (…), lastSeenAt, lastDailyClaimAt, wallet, aibaBalance, pendingAIBA, neurBalance, starsBalance, diamondsBalance, firstWinDiamondAwardedAt, badges[], **profileBoostedUntil**, bannedUntil, bannedReason, anomalyFlags, vaultClaimSeqno. |
| **Broker** | ownerTelegramId, **createdWithTonTxHash** (optional; idempotency for create-with-ton), risk, intelligence, speed, specialty, level, xp, energy, energyUpdatedAt, lastBattleAt, cooldowns (Map), anomalyFlags, banned, banReason, lastRequestId, nftCollectionAddress, nftItemAddress, nftItemIndex, metadataUri, guildId. |
| **Battle** | requestId (unique), ownerTelegramId, brokerId, arena, league, modeKey, seedHex, score, rewardAiba, rewardNeur, guildId, opponentGuildId, guildShareNeur, anomaly, anomalyReason, claim (vaultAddress, toAddress, amount, seqno, validUntil, signatureBase64, payloadBocBase64). |
| **BattleRunKey** | Idempotency lock for battle run (requestId, ownerTelegramId, status, expiresAt, battleId). TTL index for expiry. |
| **ActionRunKey** | Generic action lock (scope, requestId, ownerTelegramId, status, expiresAt). Used e.g. for claim mutex. |
| **GameMode** | key (unique), name, description, enabled, arena, league, energyCost, cooldownSeconds, entryNeurCost, entryAibaCost, rewardMultiplierAiba/Neur, rules. |
| **EconomyConfig** | Single-doc config: dailyCapAiba/Neur, baseReward*, trainNeurCost, repairNeurCost, combineNeurCost, marketplaceFeeBps/BurnBps, referral rewards, dailyRewardNeur, mintAibaCost, boostCostTonNano, createGroupCostTonNano, boostGroupCostTonNano, leaderboardTopFreeCreate, **createBrokerCostTonNano**, **boostProfileCostTonNano**, **boostProfileDurationDays**, **giftCostTonNano**, **marketplaceDefaultNewBrokerPriceAIBA**, boostCostNeur/DurationHours/Multiplier, stakingApyPercent, battle* (maxEnergy, regen, anomaly thresholds), charityImpactAibaMultiplier, starRewardPerBattle, diamondRewardFirstWin, topLeaderBadgeTopN, courseCompletionBadgeMintCostTonNano, fullCourseCompletionCertificateMintCostTonNano. |
| **EconomyDay** | Per-day aggregates (UTC day key) for emission caps and tracking. |
| **LedgerEntry** | telegramId, currency (NEUR|AIBA|STARS|DIAMONDS), direction (credit|debit), amount, reason, arena, league, sourceType, sourceId, requestId, battleId, applied, meta. Unique index on (sourceType, sourceId, telegramId, currency, direction, reason) for idempotency. |
| **Guild** | name (unique), ownerTelegramId, members[], bio, active, pooledBrokers[], vaultNeur, vaultAiba, paidCreateTxHash, boostCount, boostedUntil, boostTxHashes[]. |
| **Referral** | One per user: code, ownerTelegramId. |
| **ReferralUse** | Referral use event (referrerTelegramId, refereeTelegramId, etc.). |
| **Listing** | brokerId, sellerTelegramId, price, status, etc. (off-chain marketplace). |
| **Boost** | telegramId, type, multiplier, expiresAt (NEUR or TON boost). |
| **Gift** | fromTelegramId, toTelegramId, amountNano, txHash, message; timestamps. |
| **UsedTonTxHash** | txHash (unique), purpose (e.g. gift, profile_boost), ownerTelegramId; idempotency for TON-paid actions. |
| **Staking** | telegramId, amount, lockedAt, etc. (off-chain staking). |
| **Proposal** | DAO proposal (title, description, status, treasuryAmount, etc.). |
| **Vote** | proposalId, telegramId, choice (unique per proposal per user). |
| **Treasury**, **StabilityReserve**, **BuybackPool** | Admin-funded pools (amounts). |
| **BrokerMintJob** | brokerId, status, nftItemAddress, etc. (NFT mint queue; admin can complete). |
| **Task** | title, description, enabled. |
| **Ad** | imageUrl, linkUrl, placement, weight, active, startsAt, endsAt. |
| **CharityCampaign** | cause, title, description, status, featured, order, etc. |
| **CharityDonation** | campaignId, telegramId, amount, donatedAt. |
| **Announcement** | title, body, type, active, publishedAt. |
| **UniversityProgress** | telegramId, completedKeys[], graduatedAt. |
| **CourseBadgeMint**, **FullCertificateMint** | One-time mint records (telegramId) for course badge and full certificate. |
| **NftUniverse** | slug, name, type, mintCostAiba, mintCostTonNano, feeBps, burnBps, stakingEnabled, active, order (NFT Multiverse config). |
| **NftStake** | telegramId, universeSlug, brokerId, stakedAt, lastRewardAt (stake Broker NFT to earn AIBA daily). |
| **RacingCar**, **RacingMotorcycle** | ownerTelegramId, topSpeed, acceleration, handling, durability, level, xp, energy, createdWithTonTxHash (autonomous racing vehicles). |
| **CarTrack**, **BikeTrack** | trackId, name, length, difficulty, league, active. |
| **CarRace**, **BikeRace** | trackId, league, status (open/running/completed), entryFeeAiba, rewardPool, maxEntries, seed, startedAt, completedAt. |
| **CarRaceEntry**, **BikeRaceEntry** | raceId, carId/bikeId, telegramId, position, finishTime, points, aibaReward. |
| **CarListing**, **BikeListing** | carId/bikeId, sellerTelegramId, priceAIBA, status (marketplace for vehicles). |

### 5.6 Backend Engine and Core Logic

- **engine/battleEngine.js** — `simulateBattle({ broker, seed, arena, league, rules })`: deterministic score from broker stats (intelligence, speed, risk), arena weights (e.g. prediction 0.7/0.2/0.1), league multiplier (rookie 1.0, pro 1.1, elite 1.2), level bonus, variance (risk). Uses **engine/deterministicRandom.js** (mulberry32) for reproducible randomness.
- **engine/battleSeed.js** — Builds canonical seed message from BATTLE_SEED_SECRET + telegramId, brokerId, modeKey, arena, league, requestId (and opponent guild in guild wars); **engine/deterministicRandom.js** exposes hmacSha256Hex, seedFromHex.
- **engine/battleEnergy.js** — Energy regen (battleEnergyRegenSecondsPerEnergy, battleMaxEnergy), clamp, applyEnergyRegen.
- **engine/battleCooldown.js** — getBattleCooldownKey(modeKey, arena, league), cooldown checks.
- **engine/economy.js** — getConfig (EconomyConfig singleton), emission windows (getEmissionWindow, isEmissionOpenAt), tryEmitAiba/tryEmitNeur (caps, windows, ledger, balance updates), creditAibaNoCap/creditNeurNoCap, debitNeurFromUser/debitAibaFromUser/debitAibaFromUserNoBurn, safeCreateLedgerEntry; ledger identity query for idempotency; EconomyDay updates.
- **engine/adminEconomySanitize.js** — Sanitization of economy config (prod PATCH validation).
- **engine/charity.js** — Charity impact / campaign logic.
- **engine/idempotencyKey.js** — Helpers for idempotent actions.

### 5.7 TON and Vault Integration (Backend)

- **ton/signRewardClaim.js** — Parses ORACLE_PRIVATE_KEY_HEX (32-byte hex), builds canonical claim payload cell (vault, jettonMaster, to, amount, seqno, validUntil), signs with nacl (ed25519), returns payloadBocBase64 and signatureBase64. Used when creating a claim for user.
- **ton/vaultRead.js** — Reads vault state (e.g. last seqno for recipient) via TON provider.
- **ton/sendAiba.js** — Legacy: send AIBA from admin wallet (used only if ENABLE_LEGACY_PENDING_AIBA_DISPATCH=true).
- **util/tonVerify.js** — `verifyTonPayment(txHash, walletAddress, amountNano)`: verifies on-chain that a TON transfer of at least amountNano was received by walletAddress; used by create-with-ton, buy-profile-with-ton, gifts, guild boost/create.

### 5.8 Security and Middleware

- **security/telegram.js** — verifyTelegramInitData(initData, botToken); validates Telegram WebApp initData HMAC.
- **security/telegramPolicy.js** — getTelegramInitDataMaxAgeSeconds(env); default 900, configurable.
- **security/productionReadiness.js** — isProduction(env) (APP_ENV prod vs dev/test, else NODE_ENV); enforceProductionReadiness(env): in prod requires CORS_ORIGIN, TELEGRAM_BOT_TOKEN, TELEGRAM_INITDATA_MAX_AGE_SECONDS, strong ADMIN_JWT_SECRET, ADMIN_PASSWORD_HASH (no plaintext), BATTLE_SEED_SECRET, and if vault env is set then all of ARENA_VAULT_ADDRESS, AIBA_JETTON_MASTER, ORACLE_PRIVATE_KEY_HEX + non-testnet TON_PROVIDER_URL; forbids ENABLE_LEGACY_PENDING_AIBA_DISPATCH in prod.
- **middleware/requireTelegram.js** — In dev/test: accept x-telegram-id (and optional x-telegram-username), upsert User. In prod: verify initData, optional max-age check, upsert User. Sets req.telegramUser, req.telegramId, req.user.
- **middleware/requireAdmin.js** — Verifies JWT and attaches admin identity.
- **middleware/rateLimit.js** — In-memory rate limit (windowMs, max, optional keyFn).
- **middleware/requestId.js** — Attaches requestId to req and res.
- **middleware/validate.js** — Validation helpers.

### 5.9 Jobs and Cron (server.js)

- **Legacy pending AIBA:** If `ENABLE_LEGACY_PENDING_AIBA_DISPATCH=true`, cron every hour: for each user with pendingAIBA > 0 and wallet set, call sendAiba and zero pendingAIBA (with retries). **Default: disabled.**
- **Top-leader badge sync:** `jobs/syncTopLeaderBadges.js` — run on startup and every 6 hours (cron); assigns top_leader badge to top N users by total score (EconomyConfig.topLeaderBadgeTopN).

### 5.10 Metrics (Prometheus)

- **metrics.js** — Registers default Node/process metrics (aiba_*), HTTP request duration histogram (aiba_http_request_duration_seconds), battle counters (aiba_battle_runs_total, aiba_battle_anomalies_total, aiba_auto_bans_total), economy counters (aiba_economy_emissions_total, aiba_economy_sinks_total, aiba_economy_withdrawals_total). Served at GET /metrics.

### 5.11 Backend Tests

- **Runner:** `node --test` (Node built-in test runner).
- **Location:** `backend/tests/`. Files: adminEconomySanitize.test.js, battleCooldown.test.js, battleEnergy.test.js, battleEngine.test.js, battleSeed.test.js, deterministicRandom.test.js, economyWindow.test.js, idempotencyKey.test.js, productionReadiness.test.js, signRewardClaim.test.js, telegramPolicy.test.js.

---

## 6. Battle Flow (End-to-End)

1. Client **POST /api/battle/run** with requestId, brokerId, arena, league, optional modeKey, optional autoClaim.
2. **requireTelegram** → resolve User; reject if banned.
3. **Idempotency:** If Battle with same requestId for this user exists, return it. If requestId used by another user → 409.
4. **BattleRunKey** lock (TTL) to prevent concurrent double charge for same requestId.
5. Load Broker; validate ownership, not banned, guild requirement for guildWars (Guild membership).
6. Resolve **GameMode** (modeKey or arena+league); validate enabled, energy and cooldown (battleEnergy, battleCooldown).
7. Optional **entry fees** (entryNeurCost/entryAibaCost): debit from User via economy engine.
8. **Seed:** buildBattleSeedMessage(secret, telegramId, brokerId, modeKey, arena, league, requestId, opponentGuildId); seedHex from HMAC.
9. **simulateBattle(broker, seed, arena, league, rules)** → score.
10. **Anomaly check:** if score out of expected range, set anomaly, increment broker/user anomalyFlags; auto-ban if over threshold (battleAutoBanBrokerAnomalyFlags / battleAutoBanUserAnomalyFlags).
11. **Rewards (if emission open and under caps):** tryEmitNeur, tryEmitNeur (guild share to guild vault if guildWars), tryEmitAiba; also starRewardPerBattle (STARS), optional diamondRewardFirstWin (DIAMONDS) once per user.
12. **Broker update:** energy decrease, cooldown set, lastBattleAt, xp/level if applicable.
13. **Battle document** saved (requestId, score, rewardAiba, rewardNeur, seedHex, claim if autoClaim and vault configured).
14. If **autoClaim** and vault configured: get user wallet, vaultClaimSeqno, createSignedClaim, return claim (payloadBocBase64, signatureBase64, vault, to, amount, seqno, validUntil); increment user vaultClaimSeqno.
15. **BattleRunKey** updated to completed with battleId.
16. Optional: **telegramNotify.notifyBattleWin** (if TELEGRAM_BOT_TOKEN) for push “Your AI just won”.
17. Response: full Battle document (including claim if present).

---

## 7. Economy Summary

- **NEUR:** Ledger-only. Credits from battle, daily claim, referrals; debits for entry, train, repair, combine, boosts. Capped by dailyCapNeur and per-arena caps; emission windows (UTC hours) can restrict when rewards are granted.
- **AIBA:** Off-chain balance; same units as jetton smallest unit. Credits from battle (and referrals); debits for upgrade, marketplace fee; can be withdrawn on-chain via signed claim. Capped by dailyCapAiba and per-arena; emission windows apply. **Marketplace:** List/buy brokers in AIBA; create broker with TON → new broker auto-listed at default AIBA price.
- **TON (payments to Super Admin):** All TON flows use dedicated env wallets (see [MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md](MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md)): create broker → CREATED_BROKERS_WALLET; boost profile → BOOST_PROFILE_WALLET; gifts → GIFTS_WALLET; create/boost group → LEADER_BOARD_WALLET, BOOST_GROUP_WALLET; battle boost (TON) → BOOST_TON_WALLET. Costs 1–10 TON are configurable in Admin Economy and clamped in backend.
- **STARS / DIAMONDS:** In-app recognition (Stars: per battle; Diamonds: first win one-time); ledger entries and user balances; optional badges (verified, early_adopter, top_donor, guild_leader, top_leader, champion, diamond_holder, university_graduate, course_completion, full_course_completion_certificate).
- **Ledger:** Every credit/debit is a LedgerEntry (sourceType/sourceId/reason for idempotency); balance updates applied after ledger row created to avoid double-credit on retry.

---

## 8. Miniapp (Telegram Mini App)

- **Tabs:** home, brokers, arenas, guilds, market, charity, university, updates, wallet.
- **Home:** New broker, Refresh, Run battle, Vault; arena & battle card; battle result and victory card; referrals; leaderboard.
- **Brokers:** My brokers (combine, mint NFT, select).
- **Arenas:** Arena select; Run battle; result.
- **Guilds:** My rank, Discover all; create (with optional TON + txHash), join; list with Join/Boost (txHash).
- **Market:** **Create your broker (pay TON)** — cost from config, txHash → new broker auto-listed globally; listings, list broker (AIBA), buy (AIBA); Boosts (NEUR or TON).
- **Charity:** Campaigns, donate, impact.
- **University:** Progress (X/Y modules), courses/modules, graduate badge; mint course badge / full certificate (TON).
- **Updates:** Announcements feed.
- **Wallet:** Profile with badges and **profileBoostedUntil**; **Boost your profile** (pay TON, txHash); **Gifts** (send to Telegram ID/username with TON, view received/sent); Daily claim, Vault, Staking, DAO, on-chain claim (create claim + Claim on-chain via TonConnect); Stars and Diamonds cards.
- **UI:** Futuristic theme (globals.css): glass, glow, Orbitron/Exo 2, balance strip (NEUR, AIBA, Stars, Diamonds + verified badge), guide tips, icons. TonConnectButton; API via createApi(BACKEND_URL) with x-telegram-init-data or x-telegram-id (dev). Claim payload built via `lib/tonRewardClaim.js` (buildRewardClaimPayload) and sent with TonConnect.

---

## 9. Admin Panel

- **Login:** Email + password → POST /api/admin/auth/login → JWT stored (localStorage); all admin requests use Bearer token.
- **Tabs:** tasks, ads, modes, economy, mod, stats, treasury, charity, announcements, university, comms.
- **Tasks:** List, create, toggle enabled.
- **Ads:** List, create (imageUrl, linkUrl, placement, weight).
- **Game modes:** List, create, toggle; arena (including arbitrage) and league dropdowns.
- **Economy:** Load/save full EconomyConfig JSON; emission dashboard (today UTC); simulator (e.g. 30 days).
- **Moderation:** Ban/unban by telegramId.
- **Stats:** DAU, total users, battles, emitted today.
- **Treasury:** Fund Treasury, Stability Reserve, Buyback Pool; treasury summary.
- **Charity / Announcements / University:** CRUD and stats as per admin routes.
- **Comms:** Status (e.g. GET /api/comms/status).

---

## 10. Configuration and Environment

### 10.1 Backend (.env.example)

- **PORT**, **MONGO_URI**, **APP_ENV** (dev/prod/test), **CORS_ORIGIN**
- **ADMIN_SIGNER_TYPE** (stub vs real), **TON_PROVIDER_URL**, **TON_API_KEY**
- **ADMIN_WALLET**, **ADMIN_MNEMONIC**, **ADMIN_JETTON_WALLET** (legacy send)
- **TELEGRAM_BOT_TOKEN**, **TELEGRAM_INITDATA_MAX_AGE_SECONDS**
- **BOOST_TON_WALLET**, **LEADER_BOARD_WALLET**, **BOOST_GROUP_WALLET**, **CREATED_BROKERS_WALLET**, **BOOST_PROFILE_WALLET**, **GIFTS_WALLET** (Super Admin wallets for create broker, profile boost, gifts; see MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md)
- **ADMIN_JWT_SECRET**, **ADMIN_EMAIL**, **ADMIN_PASSWORD_HASH**, **ADMIN_PASSWORD** (dev only)
- **BATTLE_SEED_SECRET**
- **ARENA_VAULT_ADDRESS**, **AIBA_JETTON_MASTER**, **ORACLE_PRIVATE_KEY_HEX**
- **ENABLE_LEGACY_PENDING_AIBA_DISPATCH** (default false)
- Optional: **dailyCapNeurByArena** (JSON), **RATE_LIMIT_PER_MINUTE**

### 10.2 Frontends

- **miniapp:** `NEXT_PUBLIC_BACKEND_URL`, optional `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL`
- **admin-panel:** `NEXT_PUBLIC_BACKEND_URL`

---

## 11. CI/CD and Quality

- **.github/workflows/ci.yml:** On push/PR: checkout, Node 20, npm ci (root), lint (prettier), Blueprint build, npm test (contracts), backend npm ci + npm test, miniapp npm ci + npm run build, admin-panel npm ci + npm run build.
- **Lint:** Prettier (root and backend); config in .prettierrc, .prettierignore.

---

## 12. Deployment (Summary)

- **Contracts:** Build with `npx blueprint build`; deploy with `npx blueprint run <script>` (e.g. deployAibaArena, deployAibaToken, deployArenaRewardVault, mintAibaToVault). Backend needs ARENA_VAULT_ADDRESS, AIBA_JETTON_MASTER, ORACLE_PRIVATE_KEY_HEX and TON provider for claims.
- **Backend:** Local/Render/Railway: `backend/server.js`; Vercel: root directory `backend`, serverless via `api/index.js`. Env from .env.example; production readiness enforced when APP_ENV=prod or NODE_ENV=production.
- **Miniapp / Admin:** Next.js build; deploy to Vercel or similar; set NEXT_PUBLIC_BACKEND_URL to backend URL.

---

## 13. Documentation Index

- **GAME-EXPLAINED.md** — What the game is (brokers, arenas, battles, NEUR/AIBA, claims, guilds, referrals, marketplace, TON payments, boost profile, gifts).
- **USER-GUIDE.md** — How to play (connect wallet, broker, battle, balances, guilds, claim, marketplace create broker/list/buy, boost profile, gifts, referrals, troubleshooting).
- **VISION-VS-CODEBASE-CHECK.md** — Vision vs implementation (implemented/partial/not implemented).
- **deployment.md** — Components, backend env, miniapp/admin env.
- **mainnet-readiness.md** — Key management, validation defaults, checklist enforcement, required env.
- **runbook.md** — Key summary, incident response, production checks, key rotation, security playbooks.
- **monitoring.md** — Logs, uptime, Prometheus /metrics, suggested alerts and metrics.
- **PROJECT-ASSESSMENT.md** — Repo-wide assessment (contracts, backend, miniapp, admin, risks).
- **TELEGRAM-MINI-APP-SETUP-GUIDE.md** — Telegram Mini App setup.
- **MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md** — Unified marketplace and payments (TON + AIBA only, Super Admin wallets, create broker, boost profile, gifts).
- **LEADERBOARD-AND-GROUPS-CHECK.md** — Leaderboard and groups (global, pay-to-create/boost, wallets).
- **RUN-LOCALHOST.md** — Step-by-step: backend, miniapp, admin on localhost; optional TON wallets for create broker/boost/gifts.
- **PRINT.md** — How to generate and use printable HTML from docs (npm run build:print-docs; docs/print/index.html).
- **VERCEL-ENV-GUIDE.md** — How to get each env var (miniapp, admin, backend; TON wallets, vault, Telegram, etc.).
- **CHARITY-ECOSYSTEM-PLAN.md**, **AIBA-ARENA-UNIVERSITY-PLAN.md**, **STARS-BADGES-DIAMONDS-*.md**, **UNIFIED-COMMS-ECOSYSTEM.md**, **ECOSYSTEMS-AUDIT.md** — Feature and ecosystem plans.

---

## 14. Summary Table

| Layer | Stack | Purpose |
|-------|--------|--------|
| Contracts | Tact, Blueprint, @ton/* | AIBA token, reward vault, broker NFT, marketplace escrow |
| Backend | Express, Mongoose, node-cron, prom-client | API, battles, economy, claims signing, admin, cron |
| Miniapp | Next.js, TonConnect, axios | Telegram Mini App: full player flow |
| Admin | Next.js, axios | Operator UI: tasks, ads, modes, economy, mod, stats, treasury, charity, university |
| DB | MongoDB | Users, brokers, battles, ledger, guilds, config, all feature models |
| Auth | Telegram initData, JWT (admin) | Player identity; admin login |
| Claims | Ed25519 (oracle), ArenaRewardVault | Withdraw AIBA credits to TON wallet |

This document is the **single systematic reference** for the entire Aiba-Arena2 project structure and behavior.
