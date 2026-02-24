# Game Structure of AIBA Arena — Deep Overview

A single reference for **how the game is structured**: entities, core loop, battle flow, scoring, rewards, and related systems.

---

## 1. High-level pillars

| Pillar               | What it is                                                                                                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core loop**        | Connect wallet → Get/Create broker → Pick arena+league → Run battle → Earn NEUR/AIBA/Stars → Claim AIBA on-chain (optional).                                                                                                                                        |
| **Brokers**          | AI agents you own (or rent). Each has **INT / SPD / RISK** (0–100), **level**, **energy**, and per-mode **cooldowns**. They are the only “unit” that runs battles.                                                                                                  |
| **Arenas & leagues** | **Arenas** = battle modes (prediction, simulation, strategyWars, guildWars, arbitrage). **Leagues** = rookie / pro / elite (higher reward, higher level gate). Each combination is a **GameMode** (energy cost, cooldown, optional entry fees, reward multipliers). |
| **Battle**           | Deterministic simulation: broker stats + **seed** (HMAC of user/broker/mode/requestId) → **score**. No real-time PvP; same inputs always give same score.                                                                                                           |
| **Economy**          | **NEUR** (off-chain, battle/referrals/daily), **AIBA** (off-chain, claimable on-chain), **Stars** (per battle win), **Diamonds** (first battle win once). Caps and emission windows apply to NEUR/AIBA.                                                             |
| **Extensions**       | Racing (cars/bikes), referrals, daily NEUR, tasks, guilds, Predict (bets), Global Boss, marketplace, staking, DAO, etc.                                                                                                                                             |

---

## 2. Main entities (data)

### 2.1 User (`backend/models/User.js`)

- Identity: `telegramId` (required), optional username/telegram.
- Balances: `neurBalance`, `aibaBalance`, `starsBalance`, `diamondsBalance`.
- Progression: `firstWinDiamondAwardedAt` (one-time diamond), badges, vault claim seqno.
- Moderation: `bannedUntil`, `bannedReason`, `anomalyFlags`.
- Referrals / trainers / guild membership live in other collections; User is the wallet and ban target.

### 2.2 Broker (`backend/models/Broker.js`)

| Field                           | Role                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| `ownerTelegramId`               | Owner (or renter via `rentedByTelegramId` / `rentedUntil`).                           |
| `risk`, `intelligence`, `speed` | 0–100; feed into battle score formula.                                                |
| `level`, `xp`                   | Level gates leagues (rookie 1+, pro 5+, elite 10+); level also adds score multiplier. |
| `energy`, `energyUpdatedAt`     | Consumed per battle; regens over time (config: e.g. 1 energy per 60s, cap 100).       |
| `lastBattleAt`, `cooldowns`     | Cooldowns per mode (e.g. 30/45/60s) to prevent spam.                                  |
| `banned`, `anomalyFlags`        | Moderation; too many anomalies → auto-ban.                                            |
| `guildId`                       | Optional; required for guild wars.                                                    |
| `nftItemAddress`, etc.          | Optional on-chain NFT representation.                                                 |

Brokers are created via **starter** (free, first one), **create-with-TON**, or **marketplace buy**. They can be **combined** (merge stats), **minted** as NFT, **listed/bought** on marketplace, or **deposited/withdrawn** to/from guild pool.

### 2.3 GameMode (`backend/models/GameMode.js`)

| Field                                          | Role                                                                                   |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `key`                                          | Unique id (e.g. `prediction`, `prediction-pro`). Used for cooldowns and idempotency.   |
| `arena`, `league`                              | Arena bucket + league.                                                                 |
| `name`, `description`                          | Display.                                                                               |
| `enabled`                                      | If false, battle returns 403.                                                          |
| `energyCost`, `cooldownSeconds`                | Per battle.                                                                            |
| `entryNeurCost`, `entryAibaCost`               | Optional entry fees (debited before battle).                                           |
| `rewardMultiplierAiba`, `rewardMultiplierNeur` | Multiply proposed rewards.                                                             |
| `rules`                                        | `requiresGuild`, `minBrokerLevel`, `arenaWeights`, `leagueMultiplier`, `varianceBase`. |

**Default modes** (seeded in `backend/db.js`): 5 arenas × 3 leagues = 15 modes. Keys: rookie = `arena`, pro/elite = `arena-league` (e.g. `prediction-pro`). Admins manage via **Admin → Game Modes**.

### 2.4 Battle (`backend/models/Battle.js`)

- `requestId` (unique, idempotency), `ownerTelegramId`, `brokerId`.
- `arena`, `league`, `modeKey`, `seedHex`.
- `score`, `rewardAiba`, `rewardNeur`.
- Guild wars: `guildId`, `opponentGuildId`, `guildShareNeur`.
- Optional `claim` payload for on-chain AIBA claim.
- Anomaly flag for moderation.

Response to client also includes `starsGranted`, `firstWinDiamond` (computed in route).

### 2.5 EconomyConfig (`backend/models/EconomyConfig.js`)

Global knobs: daily caps (AIBA/NEUR), emission windows, base reward per score, broker costs (combine, mint, train, repair), battle (max energy, regen, anomaly/ban thresholds), TON payment amounts, staking, referrals, stars/diamonds, etc. See **GAME-FUNCTIONALITY.md** §6.

---

## 3. Battle flow (step-by-step)

What happens when the miniapp calls **POST /api/battle/run** with `requestId`, `brokerId`, `arena`, `league` (and optional `autoClaim`):

1. **Auth** — Telegram initData or `x-telegram-id` (dev). No telegramId → 401.
2. **User ban** — If `user.bannedUntil` > now → 403.
3. **Idempotency** — If a `Battle` with same `requestId` and same `ownerTelegramId` exists → return that battle (no double reward). If requestId used by another user → 409.
4. **Run lock** — `BattleRunKey` (requestId + ownerTelegramId, TTL 15 min). Prevents concurrent double-charge. If lock exists and status = in_progress → 409 retryAfterMs.
5. **Resolve GameMode** — By `modeKey` if provided, else by `arena` + `league`. No mode or disabled → 400/403.
6. **Guild (guild wars)** — If mode has `requiresGuild` or arena = guildWars: user must be in a guild; opponent guild chosen for matchmaking. No guild → 403.
7. **Load broker** — Must exist, owned or rented by user, not banned. Else 403/404.
8. **Economy config** — Load for energy cap, regen, entry fees, reward base, caps.
9. **Energy regen** — `applyEnergyRegen(broker, now, cfg)`; then broker.energy clamped to max.
10. **League level gate** — Default min level: elite 10, pro 5, rookie 1. Overridable by `mode.rules.minBrokerLevel`. Broker.level < min → 403 league_locked.
11. **Energy check** — broker.energy >= mode.energyCost; else 403 no energy.
12. **Cooldown check** — Cooldown key = modeKey or arena. Last run for this key on broker; if elapsed < mode.cooldownSeconds → 429 cooldown + retryAfterMs.
13. **Entry fees** — If mode.entryNeurCost / entryAibaCost > 0, debit from user. Fail → 403 insufficient NEUR/AIBA, lock marked failed.
14. **Seed** — `buildBattleSeedMessage(telegramId, brokerId, modeKey, arena, league, requestId, opponentId)` → HMAC-SHA256(secret, message) → seed for PRNG.
15. **Simulate** — `simulateBattle({ broker, seed, arena, league, rules })` → **score** (see §4).
16. **Guild wars bonus** — If guild vs guild: bonus = clamp(-15, 15, (myPoolCount - oppPoolCount) \* 3); score = max(0, round(score + bonus)).
17. **Anomaly** — If score > cfg.battleAnomalyScoreMax or score < 0 or non-finite → anomaly; broker and user anomalyFlags incremented; auto-ban at threshold.
18. **Rewards** — proposedAiba = score _ baseRewardAibaPerScore _ mode.rewardMultiplierAiba (then innovations/boost). proposedNeur similarly. `tryEmitNeur` / `tryEmitAiba` apply daily caps and emission windows. Actual credited amounts = rewardNeur, rewardAiba.
19. **Guild wars split (NEUR)** — If guild wars: 20% to guild (1% creator, 19% vault), 80% to player. AIBA 100% to player.
20. **Stars / Diamonds** — On score > 0: starRewardPerBattle → user.starsBalance. First win ever: diamondRewardFirstWin → user.diamondsBalance, set firstWinDiamondAwardedAt.
21. **Broker update** — energy -= energyCost; cooldowns[modeKey] = now; lastBattleAt = now; persist.
22. **Battle document** — Create Battle with requestId, owner, broker, arena, league, modeKey, seedHex, score, rewardAiba, rewardNeur, guild fields, anomaly, optional claim.
23. **Auto-claim (optional)** — If autoClaim and vault configured: create signed claim, debit AIBA from user (no burn), return claim payload in response for TonConnect.
24. **Lock complete** — BattleRunKey status = completed, battleId set.
25. **Notify** — Optional Telegram notification (e.g. battle win).
26. **Response** — Return battle JSON (+ starsGranted, firstWinDiamond, claim if autoClaim).

---

## 4. Score formula (battle engine)

**File:** `backend/engine/battleEngine.js`

- **Inputs:** broker (intelligence, speed, risk, level), seed (from HMAC), arena, league, rules (optional overrides).
- **Normalized stats:** int, spd, risk = clamp01(broker stat / 100). level = clampInt(broker.level, 1, 10000).
- **Arena weights (defaults):**

    | Arena        | INT | SPD | RISK |
    | ------------ | --- | --- | ---- |
    | prediction   | 0.7 | 0.2 | 0.1  |
    | simulation   | 0.5 | 0.3 | 0.2  |
    | strategyWars | 0.6 | 0.1 | 0.3  |
    | guildWars    | 0.4 | 0.3 | 0.3  |
    | arbitrage    | 0.5 | 0.3 | 0.2  |

    Override via `rules.arenaWeights`.

- **League multiplier:** elite 1.2, pro 1.1, rookie 1.0 (or `rules.leagueMultiplier`).
- **Level multiplier:** `1 + min(0.5, (level - 1) * 0.02)` (+2% per level, cap +50%).
- **Base:**  
  `base = 100 * leagueMul * levelMul * (INT*w_int + SPD*w_spd + RISK*w_risk)`.
- **Variance:** varianceBase (default 30, or rules.varianceBase) _ leagueMul _ (0.2 + risk).  
  `noise = (rand() - 0.5) * 2 * variance`.
- **Score:** `max(0, round(base + noise))`. Same (broker, seed, arena, league, rules) ⇒ same score (deterministic).

---

## 5. Rewards and economy (battle-related)

- **NEUR** — Off-chain. Battle reward = score × baseRewardNeurPerScore × mode.rewardMultiplierNeur, then innovations/boost; capped by daily/arena caps and emission windows. Guild wars: 80% player, 20% guild.
- **AIBA** — Off-chain balance; can be claimed on-chain. Battle reward = score × baseRewardAibaPerScore × mode.rewardMultiplierAiba, then innovations/boost; same caps/windows.
- **Stars** — +starRewardPerBattle per battle with score > 0 (no cap in this step).
- **Diamonds** — +diamondRewardFirstWin once per user (first battle win); then firstWinDiamondAwardedAt set.

Spends: entry fees (mode.entryNeurCost / entryAibaCost), combine (NEUR), mint (AIBA), train/repair (NEUR), marketplace (AIBA), etc. See EconomyConfig and GAME-FUNCTIONALITY.md.

---

## 6. Miniapp flow (gameplay)

- **Brokers tab** — List brokers (GET /api/brokers/mine). Create starter or buy; select broker for battle. Optional: combine, mint, vault.
- **Arenas tab** — Dropdown from GET /api/game-modes (value = `arena:league`, e.g. `prediction:rookie`). User picks broker + arena:league, taps **Run battle**.
- **runBattle()** — Builds `arena` and `league` from dropdown (split on `:`); POST /api/battle/run with requestId (uuid), brokerId, arena, league, autoClaim. On success, sets `battle` state; UI shows score, rewardAiba, starsGranted, firstWinDiamond.
- **Wallet** — Balances from GET /api/economy/me; claim AIBA via POST /api/economy/claim-aiba or autoClaim from battle; TonConnect sends tx to vault.

---

## 7. Other game-related systems (short)

| System                          | Purpose                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| **Racing**                      | Cars/bikes: create/buy, enter races (entry fee), simulateRace → position → AIBA by points. |
| **Referrals**                   | Referrer/referee rewards (NEUR/AIBA); referral tasks.                                      |
| **Daily**                       | Daily NEUR claim (GET /api/daily/status, POST /api/daily/claim).                           |
| **Tasks**                       | GET /api/tasks; personalized tasks (e.g. run N battles).                                   |
| **Guilds**                      | Create/join, deposit/withdraw brokers, guild wars (arena), vault, boost (TON).             |
| **Predict**                     | Events, bet AIBA on outcomes.                                                              |
| **Global Boss**                 | Community boss; damage from battles; when defeated, top damagers share pool.               |
| **Marketplace**                 | List/buy brokers (and system brokers); broker rental.                                      |
| **Staking / DAO**               | Stake AIBA, APY; proposals/voting (min staked AIBA/days).                                  |
| **University**                  | Courses, progress, mint badges.                                                            |
| **Mentors / Realms / Missions** | Stake/unstake, missions.                                                                   |

These are separate modules; the **core game structure** is: User + Brokers + GameModes → Battle (deterministic score) → Rewards (NEUR, AIBA, Stars, Diamonds) and optional on-chain claim.

---

## 8. API surface (game core)

| Endpoint                     | Method | Role                                                            |
| ---------------------------- | ------ | --------------------------------------------------------------- |
| /api/game-modes              | GET    | List enabled modes (arena dropdown).                            |
| /api/battle/run              | POST   | Run one battle (requestId, brokerId, arena, league, autoClaim). |
| /api/brokers/mine            | GET    | Current user’s brokers.                                         |
| /api/brokers/starter         | POST   | Create first free broker.                                       |
| /api/brokers/combine         | POST   | Combine two brokers (NEUR).                                     |
| /api/brokers/mint-nft        | POST   | Mint broker as NFT (AIBA).                                      |
| /api/brokers/create-with-ton | POST   | Pay TON, create broker.                                         |
| /api/economy/me              | GET    | Balances (NEUR, AIBA, Stars, Diamonds).                         |
| /api/economy/claim-aiba      | POST   | Create claim payload (manual).                                  |
| /api/vault/inventory         | GET    | Vault TON + jetton.                                             |
| /api/vault/claim-status      | GET    | Claim confirmation status.                                      |
| /api/wallet/connect          | POST   | Save TON address for claims.                                    |

Admin: /api/admin/game-modes (CRUD modes). See **GAME-FUNCTIONALITY.md** §12 and **API-CONTRACT.md** for full list.

---

## 9. One-page diagram (text)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ USER (telegramId, neur, aiba, stars, diamonds, bannedUntil, …)              │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    │ owns / rents
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ BROKER (ownerTelegramId, risk, intelligence, speed, level, xp, energy,       │
│         cooldowns, guildId, banned, …)                                       │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    │ used in
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ GAME MODE (key, arena, league, energyCost, cooldownSeconds, entryNeur/Aiba,  │
│            rewardMultiplierAiba/Neur, rules)  ← 15 defaults, admin CRUD     │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    │ POST /api/battle/run (requestId, brokerId, arena, league)
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ BATTLE FLOW                                                                  │
│  Auth → Ban check → Idempotency → Lock → Resolve mode → Guild? → Broker      │
│  → Energy/regen, cooldown, level, entry fees → Seed (HMAC) → simulateBattle  │
│  → Score → tryEmitNeur / tryEmitAiba (caps) → Stars/Diamonds → Guild split  │
│  → Update broker (energy, cooldown) → Save Battle → Auto-claim? → Response  │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    │ score = f(broker INT/SPD/RISK/level, arena weights, league mul, seed)
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ BATTLE (requestId, ownerTelegramId, brokerId, arena, league, modeKey,        │
│         seedHex, score, rewardAiba, rewardNeur, guildId, opponentGuildId, …)  │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    │ rewards
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ ECONOMY: NEUR (off-chain), AIBA (off-chain → claim on-chain), Stars,         │
│          Diamonds. Caps, emission windows, innovations/boost.                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. See also

- **GAME-FUNCTIONALITY.md** — Full spec: battle engine, economy config, security, data flows, API mapping.
- **ARENAS-DEEP-EXPLANATION.md** — Arenas, leagues, GameMode, weights, API, miniapp behavior.
- **API-CONTRACT.md** — Full API list and contracts.
- **BROKERS-DEEP-EXPLANATION.md** — Broker stats, combine, mint, marketplace (if present).

This document is the **single deep view of game structure**; the others add detail per subsystem.
