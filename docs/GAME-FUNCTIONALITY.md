# AIBA Arena — Game Functionality (Expanded)

**Last updated:** 2025  
**Scope:** Core loop, brokers, battles, economy, racing, security, API mapping, config, data flows.

---

## Table of Contents

1. [Core Loop](#1-core-loop)
2. [Brokers](#2-brokers)
3. [Battle System](#3-battle-system)
4. [Technical Specs — Battle Engine](#4-technical-specs--battle-engine)
5. [Rewards & Economy](#5-rewards--economy)
6. [EconomyConfig Fields](#6-economyconfig-fields)
7. [Arenas & Game Modes](#7-arenas--game-modes)
8. [Autonomous Racing](#8-autonomous-racing)
9. [Security & Fairness](#9-security--fairness)
10. [Data Flows](#10-data-flows)
11. [Edge Cases](#11-edge-cases)
12. [API Mapping](#12-api-mapping)

---

## 1. Core Loop

**Connect → Broker → Arena → Battle → Earn → Claim**

| Step | Action | Result |
|------|--------|--------|
| 1 | Connect wallet (TonConnect) | Backend saves TON address for claims |
| 2 | Create broker (starter or buy/create with TON) | First broker free; additional via AIBA or TON |
| 3 | Choose arena + league | prediction, simulation, strategyWars, arbitrage, guildWars |
| 4 | Run battle | Deterministic simulation → score |
| 5 | Earn NEUR & AIBA | Off-chain credits; Stars on win; Diamonds on first win |
| 6 | Claim AIBA on-chain | Wallet → Vault → signed claim → TonConnect tx |

---

## 2. Brokers

### 2.1 Model (`backend/models/Broker.js`)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ownerTelegramId` | String | required | Telegram user ID |
| `risk` | Number | 50 | 0–100; affects score variance |
| `intelligence` | Number | 50 | 0–100; weighted in prediction |
| `speed` | Number | 50 | 0–100; weighted in simulation |
| `specialty` | String | 'crypto' | Display / future use |
| `level` | Number | 1 | Unlocks leagues; score bonus |
| `xp` | Number | 0 | Progression |
| `energy` | Number | 10 | Per-battle cost; regens over time |
| `energyUpdatedAt` | Date | now | Last energy regen tick |
| `lastBattleAt` | Date | null | Last battle timestamp |
| `cooldowns` | Map&lt;String, Date&gt; | {} | modeKey/arena → last run |
| `anomalyFlags` | Number | 0 | Auto-ban threshold |
| `banned` | Boolean | false | Broker banned |
| `banReason` | String | '' | Moderation reason |
| `lastRequestId` | String | '' | Idempotency |
| `nftCollectionAddress` | String | '' | On-chain NFT |
| `nftItemAddress` | String | '' | On-chain NFT |
| `guildId` | ObjectId | null | Guild pool (guild wars) |
| `createdWithTonTxHash` | String | '' | One broker per TON tx |

### 2.2 Actions

| Action | API | Cost | Notes |
|--------|-----|------|-------|
| Create starter | `POST /api/brokers/starter` | Free | First broker; 50/50/50 stats, 10 energy |
| Create with TON | `POST /api/brokers/create-with-ton` | 1 TON (config) | Verify tx → CREATED_BROKERS_WALLET; auto-list |
| Combine | `POST /api/brokers/combine` | 50 NEUR | Base absorbs sacrifice; blended stats; +20 XP |
| Mint NFT | `POST /api/brokers/mint-nft` | 100 AIBA | BrokerMintJob queued |
| List / Buy | `POST /api/marketplace/list`, `/buy` | AIBA | Withdraw from guild first |

### 2.3 Combine Formula

- `blend(a, b) = clamp(0, 100, round((a + b) / 2))`
- Base: `risk`, `intelligence`, `speed` = blend(base, sacrifice)
- Base: `xp += sacrifice.xp + 20`
- Sacrifice: deleted

---

## 3. Battle System

### 3.1 Flow Overview

1. **Auth** — Telegram initData or `x-telegram-id` (dev)
2. **Ban check** — User and broker not banned
3. **Idempotency** — `requestId`; return existing battle if seen
4. **Lock** — `BattleRunKey` prevents concurrent double-charge
5. **Mode resolution** — `GameMode` by `arena`+`league` or `modeKey`
6. **Guild** — Guild wars requires guild membership
7. **Broker** — Ownership, energy, cooldown, level
8. **Entry fees** — Optional NEUR/AIBA debit
9. **Seed** — `HMAC-SHA256(secret, message)`
10. **Simulation** — `simulateBattle({ broker, seed, arena, league, rules })`
11. **Rewards** — tryEmitNeur, tryEmitAiba; caps/windows applied
12. **Broker update** — Energy, cooldown, lastBattleAt
13. **Battle save** — `Battle` document
14. **Auto-claim** — If requested and vault configured: signed claim in response

---

## 4. Technical Specs — Battle Engine

### 4.1 Seed Message (`backend/engine/battleSeed.js`)

```
message = `${telegramId}:${brokerId}:${modeKey}:${arena}:${league}:${requestId}:${opponentId}`;
```

- Same inputs ⇒ same seed ⇒ same score (deterministic)
- `opponentId` = opponent guild ID in guild wars (or '')

### 4.2 RNG (`backend/engine/deterministicRandom.js`)

- `hmacSha256Hex(secret, message)` → 64-char hex
- `seedFromHex(hex)` → first 8 hex chars as 32-bit uint
- `mulberry32(seed)` → PRNG returning [0, 1)

### 4.3 Score Formula (`backend/engine/battleEngine.js`)

```
int   = clamp01(broker.intelligence / 100)
spd   = clamp01(broker.speed / 100)
risk  = clamp01(broker.risk / 100)
level = clampInt(broker.level, 1, 10000)

arenaWeights = per-arena (defaults below)
leagueMul    = elite 1.2 | pro 1.1 | rookie 1.0  (or rules.leagueMultiplier)
levelMul     = 1 + min(0.5, (level-1) * 0.02)   // +2% per level, cap +50%

base = 100 * leagueMul * levelMul *
       (arenaWeights.intelligence * int + arenaWeights.speed * spd + arenaWeights.risk * risk)

varianceBase = rules.varianceBase ?? 30
variance     = varianceBase * leagueMul * (0.2 + risk)
noise        = (rand() - 0.5) * 2 * variance

score = max(0, round(base + noise))
```

### 4.4 Arena Weights (defaults)

| Arena | INT | SPD | RISK |
|-------|-----|-----|------|
| prediction | 0.7 | 0.2 | 0.1 |
| simulation | 0.5 | 0.3 | 0.2 |
| strategyWars | 0.6 | 0.1 | 0.3 |
| guildWars | 0.4 | 0.3 | 0.3 |
| arbitrage (default) | 0.5 | 0.3 | 0.2 |

Override via `mode.rules.arenaWeights`.

### 4.5 Guild Wars Adjustment

- Matchmaking: user guild vs another active guild
- Bonus: `max(-15, min(15, (myPoolCount - oppPoolCount) * 3))`
- `score = max(0, round(score + bonus))`

---

## 5. Rewards & Economy

### 5.1 Reward Calculation

```
proposedAiba = score * baseRewardAibaPerScore * mode.rewardMultiplierAiba
proposedNeur = score * baseRewardNeurPerScore * mode.rewardMultiplierNeur

If active Boost: multiply both by boost.multiplier (e.g. 1.2x)
```

- `tryEmitAiba`, `tryEmitNeur` apply daily caps and emission windows
- Guild wars: 80% to user, 20% to guild vault (NEUR only)

### 5.2 Currencies

| Currency | Earned | Spent | On-chain |
|----------|--------|-------|----------|
| NEUR | Battle, referrals, daily | Entry fees, combine | No |
| AIBA | Battle, referrals | Mint, staking, marketplace | Yes (claim) |
| Stars | Battle win | Stars Store | No |
| Diamonds | First battle win | — | No |

---

## 6. EconomyConfig Fields

**Model:** `backend/models/EconomyConfig.js`

### 6.1 Emission & Caps

| Field | Default | Description |
|-------|---------|-------------|
| `dailyCapAiba` | 1_000_000 | Global daily AIBA cap |
| `dailyCapNeur` | 10_000_000 | Global daily NEUR cap |
| `dailyCapAibaByArena` | Map | Per-arena AIBA cap |
| `dailyCapNeurByArena` | Map | Per-arena NEUR cap |
| `emissionStartHourUtc` | 0 | Start hour (0–23) |
| `emissionEndHourUtc` | 24 | End hour (1–24) |
| `emissionWindowsUtc` | Object | Override per arena or `arena:league` |

### 6.2 Reward Knobs

| Field | Default | Description |
|-------|---------|-------------|
| `baseRewardAibaPerScore` | 2 | AIBA per score point |
| `baseRewardNeurPerScore` | 0 | NEUR per score point |

### 6.3 Broker Sinks

| Field | Default |
|-------|---------|
| `combineNeurCost` | 50 |
| `upgradeAibaCost` | 50 |
| `trainNeurCost` | 25 |
| `repairNeurCost` | 15 |
| `mintAibaCost` | 100 |

### 6.4 Battle Hardening

| Field | Default | Description |
|-------|---------|-------------|
| `battleMaxEnergy` | 100 | Energy cap |
| `battleEnergyRegenSecondsPerEnergy` | 60 | 1 energy / minute |
| `battleAnomalyScoreMax` | 220 | Score > this flags anomaly |
| `battleAutoBanBrokerAnomalyFlags` | 5 | Broker auto-ban |
| `battleAutoBanUserAnomalyFlags` | 25 | User auto-ban |
| `battleAutoBanUserMinutes` | 1440 | 24h ban duration |

### 6.5 TON Payments (Super Admin)

| Field | Default | Env Wallet |
|-------|---------|------------|
| `createBrokerCostTonNano` | 1e9 | CREATED_BROKERS_WALLET |
| `boostProfileCostTonNano` | 1e9 | BOOST_PROFILE_WALLET |
| `boostProfileDurationDays` | 7 | — |
| `giftCostTonNano` | 1e9 | GIFTS_WALLET |
| `createGroupCostTonNano` | 1e9 | LEADER_BOARD_WALLET |
| `boostGroupCostTonNano` | 1e9 | BOOST_GROUP_WALLET |
| `leaderboardTopFreeCreate` | 50 | Top N create guild free |

### 6.6a Staking & DAO

| Field | Default | Description |
|-------|---------|-------------|
| `stakingMinAiba` | 100 | Min AIBA to stake (flexible + locked). Ecosystem-aligned: broker mint cost, 1T AIBA supply. |
| `stakingApyPercent` | 15 | APY for flexible staking |
| `stakingPeriods` | [{ days: 30, apyPercent: 10 }, ...] | Period-based locks: 30/90/180/365 days with tiered APY |
| `stakingCancelEarlyFeeBps` | 500 | 5% fee when cancelling lock early → Treasury (CANCELLED_STAKES_WALLET) |
| `daoProposalMinStakedAiba` | 10_000 | Min AIBA staked to create proposals |
| `daoProposalMinStakeDays` | 30 | Min days staked (flexible or lock) to create proposals |

Wallet tab: Overview | Staking flow; period selection, preview, countdown; cancel-early with fee. Yield Vault tab: hero shows min (ecosystem-aligned); locked + flexible staking both show min and enforce it. Wallet tab staking flow: same min displayed and enforced. `stakingMinAiba` configurable via Admin → Economy (PATCH).

### 6.6 Stars, Diamonds, Referrals

| Field | Default |
|-------|---------|
| `starRewardPerBattle` | 1 |
| `diamondRewardFirstWin` | 1 |
| `referralRewardNeurReferrer` | 250 |
| `referralRewardNeurReferee` | 150 |
| `referralRewardAibaReferrer` | 10 |
| `referralRewardAibaReferee` | 5 |
| `referralUnlock3BonusBps` | 100 (1% battle bonus when 3+ referrals) |

### 6.7 Trainers & Automation

| Field | Default | Description |
|-------|---------|--------------|
| `trainerRewardAibaPerUser` | 5 | AIBA per referred user with 3+ battles |
| `trainerRewardAibaPerRecruitedTrainer` | 20 | AIBA per trainer recruited (when approved) |
| `automationEnabled` | false | Dynamic dailyCapAiba via economy-automation |
| `automationTargetEmissionPercentPerYear` | 10 | Target % of supply/year |
| `automationMinCapAiba` / `automationMaxCapAiba` | 500k / 5M | Bounds for automation |

---

## 7. Arenas & Game Modes

### 7.1 GameMode Model (`backend/models/GameMode.js`)

| Field | Type | Description |
|-------|------|-------------|
| `key` | String | Unique, e.g. `prediction_rookie` |
| `arena` | String | prediction, simulation, etc. |
| `league` | String | rookie, pro, elite |
| `enabled` | Boolean | If false, 403 |
| `energyCost` | Number | Per battle |
| `cooldownSeconds` | Number | Between battles |
| `entryNeurCost` | Number | Optional |
| `entryAibaCost` | Number | Optional |
| `rewardMultiplierAiba` | Number | 1.0 |
| `rewardMultiplierNeur` | Number | 1.0 |
| `rules` | Object | requiresGuild, minBrokerLevel, arenaWeights, etc. |

### 7.2 Cooldown Key (`backend/engine/battleCooldown.js`)

- `getBattleCooldownKey({ modeKey, arena })` → `modeKey || arena`
- Cooldown stored in `broker.cooldowns[modeKey]` or `broker.cooldowns[arena]` (legacy)

---

## 8. Autonomous Racing

### 8.1 Race Simulation (`backend/engine/raceEngine.js`)

```
simulateRace({ vehicles, trackLength, trackDifficulty, seed })
```

- Each vehicle: `topSpeed`, `acceleration`, `handling`, `durability`, `level`
- Weights: speed 35%, accel 35%, handling 15%+difficulty*20%, durability 15%
- Level bonus: `1 + (level-1)*0.01`
- Finish order by `rawPerformance`; variance from durability
- Points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] by position

### 8.2 Config (EconomyConfig)

- Car: `createCarCostAiba` 100, `createCarCostTonNano` 1e9, `carEntryFeeAiba` 10
- Bike: same pattern

---

## 9. Security & Fairness

### 9.1 Idempotency

- **Battle:** `BattleRunKey` with `requestId` + `ownerTelegramId`; TTL 15 min
- **Combine:** `ActionRunKey` scope `broker_combine`
- **Claim:** `ActionRunKey` scope `aiba_claim_mutex`; 1-min lock

### 9.2 Rate Limits

- **Battle:** 25 req/min per `telegramId` (`rateLimit({ windowMs: 60_000, max: 25, keyFn })`)
- **Global:** 600 req/min per IP (configurable via `RATE_LIMIT_PER_MINUTE`)
- Redis: shared store when `REDIS_URL` set; else in-memory

### 9.3 Anomaly Detection

- Score > `battleAnomalyScoreMax` or < 0 or non-finite ⇒ anomaly
- Broker: `anomalyFlags++`; at `battleAutoBanBrokerAnomalyFlags` → broker banned
- User: `anomalyFlags++`; at `battleAutoBanUserAnomalyFlags` → user banned for `battleAutoBanUserMinutes`

### 9.4 Auth

- Telegram: `x-telegram-init-data` (prod) or `x-telegram-id` (dev when `APP_ENV=dev`)

---

## 10. Data Flows

### 10.1 Battle Flow

```
User → POST /api/battle/run { requestId, brokerId, arena, league, autoClaim? }
  → requireTelegram, rateLimit(25/min)
  → Idempotency check (Battle by requestId)
  → BattleRunKey lock
  → Resolve GameMode
  → Guild check (guildWars)
  → Broker: energy, cooldown, level
  → Entry fees (NEUR/AIBA) debit
  → Build seed message → HMAC → simulateBattle
  → tryEmitNeur, tryEmitAiba (caps, windows)
  → Stars/Diamonds (first win)
  → Guild share (guild wars)
  → Update broker (energy, cooldown)
  → Create Battle
  → Auto-claim? createSignedClaim → debit AIBA → return claim
  → notifyBattleWin (Telegram)
  → res.json(battle)
```

### 10.2 Claim Flow

```
Credits (off-chain) → User requests claim (Wallet tab or autoClaim)
  → acquireClaimMutex
  → getVaultLastSeqno (on-chain)
  → lastIssued vs lastOnchain → nextSeqno
  → createSignedClaim({ vaultAddress, jettonMaster, to, amount, seqno, validUntil })
  → debitAibaFromUserNoBurn
  → Return { payloadBocBase64, signatureBase64, ... }
  → User sends TonConnect tx to ArenaRewardVault
  → Vault verifies signature, transfers AIBA jettons
```

### 10.3 Racing Flow

```
Create car/bike (AIBA or TON) → Enter race (AIBA entry fee)
  → Race fills or timer → simulateRace
  → Rank by position → AIBA rewards by points
```

---

## 11. Edge Cases

| Case | Handling |
|------|----------|
| **Cooldown** | `now - lastBattleAt < cooldownSeconds` → 429 retryAfterMs |
| **Energy** | Regen: `deltaSec / regenSecondsPerEnergy`; cap at maxEnergy |
| **Guild Wars no guild** | 403 guild required |
| **Guild Wars no opponent** | Match vs another guild (or fallback) |
| **Vault claim gap** | If `lastIssued > lastOnchain`, skip claim (outstanding unconfirmed) |
| **Duplicate requestId** | Return existing Battle; 409 if used by different user |
| **Concurrent battle** | BattleRunKey → 409 in_progress |

---

## 12. API Mapping

### 12.1 Game Core

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/battle/run` | POST | Run battle |
| `/api/brokers/starter` | POST | Create starter broker |
| `/api/brokers/mine` | GET | List user brokers |
| `/api/brokers/combine` | POST | Combine two brokers |
| `/api/brokers/mint-nft` | POST | Mint broker as NFT |
| `/api/brokers/create-with-ton` | POST | Pay TON, create broker |
| `/api/economy/me` | GET | Balances (NEUR, AIBA, Stars, Diamonds) |
| `/api/economy/claim-aiba` | POST | Create claim (manual) |
| `/api/vault/inventory` | GET | Vault TON + jetton balance |
| `/api/vault/claim-status` | GET | Check claim confirmation |
| `/api/wallet/connect` | POST | Save TON address |

### 12.2 Leaderboard & Guilds

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/leaderboard` | GET | Global ranks (by: score, aiba, neur, battles) |
| `/api/leaderboard/my-rank` | GET | User rank |
| `/api/guilds/list` | GET | All guilds |
| `/api/guilds/mine` | GET | User guilds |
| `/api/guilds/create` | POST | Create guild |
| `/api/guilds/join` | POST | Join guild |
| `/api/guilds/:guildId/boost` | POST | Boost guild (TON) |
| `/api/guilds/deposit-broker` | POST | Deposit broker |
| `/api/guilds/withdraw-broker` | POST | Withdraw broker |

### 12.3 Marketplace & Racing

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/marketplace/listings` | GET | Broker listings |
| `/api/marketplace/system-brokers` | GET | System catalog |
| `/api/marketplace/list` | POST | List broker |
| `/api/marketplace/buy` | POST | Buy listing |
| `/api/marketplace/buy-system-broker` | POST | Buy from system |
| `/api/car-racing/*` | Mixed | Config, tracks, races, cars, enter, buy |
| `/api/bike-racing/*` | Mixed | Same for bikes |

### 12.4 Extensions

| Endpoint | Purpose |
|----------|---------|
| `/api/referrals/me`, `/create`, `/use`, `/top` | Referrals |
| `/api/tasks` | Personalized tasks |
| `/api/daily/status`, `/claim` | Daily NEUR |
| `/api/charity/*` | Campaigns, donate, leaderboard |
| `/api/university/*` | Courses, progress, mint badges |
| `/api/realms`, `/api/missions`, `/api/mentors` | Realms |
| `/api/assets/` (and subtree), `/api/asset-marketplace/` (and subtree) | AI assets |
| `/api/governance/*` | Proposals, vote |
| `/api/multiverse/*` | NFT universes, stake, claim |
| `/api/staking/*` | Stake AIBA, claim |
| `/api/dao/*` | Proposals, vote |
| `/api/boosts/*` | Buy boost (NEUR/TON) |
| `/api/gifts/*` | Send/receive gifts |

---

## See Also

- [This document §1](GAME-FUNCTIONALITY.md#1-core-loop) — Core loop & high-level game explanation
- [API-CONTRACT.md](API-CONTRACT.md) — Full API specification
- [DEPLOYMENT-AND-ENV.md](DEPLOYMENT-AND-ENV.md) — Environment configuration
