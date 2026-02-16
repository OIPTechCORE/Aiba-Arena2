# Brokers — Deep Explanation

A full technical and product explanation of **Brokers** in AIBA Arena: what they are, how they work, and how they tie into battles, economy, and the rest of the app.

---

## 1. What is a Broker?

A **Broker** is your in-game **AI agent**. It is the unit you use to compete in every battle. Think of it as a character with **stats**, **energy**, **progression**, and optional **on-chain representation** (NFT).

- **Ownership:** Each broker is tied to a Telegram user (`ownerTelegramId`). Only that user can use it in battles, train/repair/upgrade/combine it, list it, or rent it.
- **Identity:** Stored in the backend (MongoDB). Optionally backed by an on-chain NFT (Broker NFT collection) after minting.
- **Role in the loop:** You pick a broker → choose an arena and league → run a battle → the server runs a **deterministic simulation** using the broker’s stats and a seed → you get a **score** and rewards (NEUR, AIBA, Stars, Diamonds).

Brokers do **not** execute real trades. “Battle” is a **simulated** outcome based on stats and a server-controlled seed, not live market data.

---

## 2. Broker model (data)

Defined in `backend/models/Broker.js`.

### 2.1 Core traits (0–100)

| Field          | Default | Meaning |
|----------------|---------|--------|
| **risk**       | 50      | Affects **score variance**: higher risk → more swing (high/low scores). Still used in the base score via arena weights. |
| **intelligence** | 50   | Weighted in the score formula; **prediction** arena favors it most (0.7). |
| **speed**      | 50      | Weighted in the score formula; **simulation** and **guildWars** use it (0.3). |
| **specialty**  | 'crypto' | Display / future use; not used in the battle math today. |

### 2.2 Progression

| Field   | Default | Meaning |
|---------|---------|--------|
| **level** | 1    | Unlocks leagues; adds a **score multiplier** (+2% per level, cap +50%). |
| **xp**    | 0    | Earned from train, upgrade, combine; used for display and future systems. |

### 2.3 Battle resources and anti-spam

| Field             | Meaning |
|-------------------|--------|
| **energy**        | Consumed per battle (configurable, e.g. 1). Must be &gt; 0 to run a battle. |
| **energyUpdatedAt** | Timestamp used to compute **energy regeneration** (e.g. 1 energy per 60 seconds, up to a max). |
| **lastBattleAt**  | Last time this broker was used in any battle. |
| **cooldowns**     | Map: `arenaKey` or `modeKey` → last run time. Per-arena/mode cooldown so you can’t spam the same mode. |

### 2.4 Moderation and safety

| Field           | Meaning |
|-----------------|--------|
| **anomalyFlags** | Incremented when a battle score is out of range; can trigger auto-ban. |
| **banned**       | If true, broker cannot be used. |
| **banReason**    | Reason for moderation. |
| **lastRequestId**| Idempotency: prevents replay of the same battle request. |

### 2.5 On-chain (optional)

| Field                   | Meaning |
|-------------------------|--------|
| **nftCollectionAddress** | Broker NFT collection contract address. |
| **nftItemAddress**       | This broker’s NFT item address. |
| **nftItemIndex**         | Index in the collection. |
| **metadataUri**           | URL to metadata (e.g. `/api/metadata/brokers/:id`). |

### 2.6 Social and rental

| Field                 | Meaning |
|-----------------------|--------|
| **guildId**           | If set, broker is in a **guild pool** and can be used in **guild wars**. |
| **rentedByTelegramId** | If set, someone is **renting** this broker until **rentedUntil**. |
| **rentedUntil**       | End of rental period. |
| **createdWithTonTxHash** | When the broker was created by paying TON; one broker per tx (idempotency). |

**Using a rented broker:** During the rental period, the renter (`rentedByTelegramId`) may use the broker in battles, predict/bet, and other flows the same way as the owner. Ownership stays with the lender; when the rental ends, only the owner can use it again.

---

## 3. How battles use brokers

Flow: **Auth → ban check → idempotency → lock (BattleRunKey) → resolve game mode → check broker (ownership, energy, cooldown, level) → optional entry fees → seed → simulate → rewards → update broker (energy, cooldowns, lastBattleAt) → save Battle.**

### 3.1 Seed (determinism)

From `backend/engine/battleSeed.js`:

```text
message = `${telegramId}:${brokerId}:${modeKey}:${arena}:${league}:${requestId}:${opponentId}`;
```

Same inputs ⇒ same seed ⇒ same score. No client-controlled randomness.

### 3.2 Score formula (`backend/engine/battleEngine.js`)

- **int, spd, risk:** broker stats normalized to 0–1 (clamped).
- **level:** 1–10000; **levelMul** = 1 + min(0.5, (level−1)×0.02) → up to +50% to score.
- **leagueMul:** rookie 1.0, pro 1.1, elite 1.2 (or from game mode rules).
- **Arena weights** (defaults):

  | Arena        | Intelligence | Speed | Risk |
  |-------------|--------------|-------|------|
  | prediction  | 0.7          | 0.2   | 0.1  |
  | simulation  | 0.5          | 0.3   | 0.2  |
  | strategyWars | 0.6         | 0.1   | 0.3  |
  | guildWars   | 0.4          | 0.3   | 0.3  |
  | arbitrage (default) | 0.5 | 0.3   | 0.2  |

- **Base score:**
  - `base = 100 × leagueMul × levelMul × (INT_weight×int + SPD_weight×spd + RISK_weight×risk)`.
- **Variance (risk increases swing):**
  - `variance = varianceBase × leagueMul × (0.2 + risk)`
  - `noise = (rand() - 0.5) × 2 × variance`
  - `score = max(0, round(base + noise))`

So: **intelligence/speed/risk** define your “power” and which arena suits the broker; **risk** adds variance; **level** adds a stable bonus.

### 3.3 Energy and cooldowns

- **Energy:** Each battle consumes a fixed amount (e.g. 1). Regeneration: e.g. 1 energy per 60 seconds, cap 100 (from `EconomyConfig`: `battleMaxEnergy`, `battleEnergyRegenSecondsPerEnergy`). Implemented in `backend/engine/battleEnergy.js`.
- **Cooldowns:** Per **mode/arena** (e.g. `prediction:rookie`). After a battle, that key is set to “now”; the next battle in the same mode is allowed only after the cooldown period. Prevents spamming one mode.

---

## 4. How you get brokers

| Method | API / flow | Cost |
|--------|------------|------|
| **Starter** | `POST /api/brokers/starter` | **Free** (first broker). Stats 50/50/50, 10 energy. |
| **Create with TON** | `POST /api/brokers/create-with-ton` with `txHash` | **TON** (e.g. 1 TON, configurable). Payment verified → CREATED_BROKERS_WALLET. One broker per tx. Can auto-list on marketplace. |
| **System shop** | Buy from catalog (Scout, Pro, Elite, Champion) | **AIBA** (50–500). New broker created and assigned to you. |
| **Marketplace** | Buy from another player’s listing | **AIBA** (seller-defined). Ownership transfers. |
| **Rental** | Rent from `BrokerRental` listings | **AIBA per hour**. You get use of the broker until return; owner keeps ownership. |

System shop brokers (`backend/config/systemShop.js`): Scout (55/55/45, 50 AIBA), Pro (65/65/55, 120 AIBA), Elite (75/75/65, 250 AIBA), Champion (85/85/75, 500 AIBA).

---

## 5. What you can do with a broker (actions)

| Action | API | Cost | Effect |
|--------|-----|------|--------|
| **Train** | `POST /api/brokers/train` (brokerId, stat) | **NEUR** (config: `trainNeurCost`) | +1 to one stat (intelligence/speed/risk), +5 XP. Stat capped 0–100. |
| **Repair** | `POST /api/brokers/repair` (brokerId) | **NEUR** (config: `repairNeurCost`) | Energy → 100, cooldowns cleared. |
| **Upgrade** | `POST /api/brokers/upgrade` (brokerId, stat) | **AIBA** (config: `upgradeAibaCost`) | +2 to one stat, +1 level, +10 XP. Permanent. |
| **Combine** | `POST /api/brokers/combine` (baseBrokerId, sacrificeBrokerId) | **50 NEUR** (config: `combineNeurCost`) | Base gets **blended** stats with sacrifice (average of each stat), base.xp += sacrifice.xp + 20. Sacrifice broker is **deleted**. |
| **Mint NFT** | `POST /api/brokers/mint-nft` (brokerId) | **AIBA** (e.g. 100, from NftUniverse `mintAibaCost` for slug `broker`) | Queues BrokerMintJob; when minted, broker gets `nftItemAddress` etc. |
| **List** | Marketplace list | — | Broker listed for sale (AIBA) or for rent (AIBA/hour). If in a guild, must withdraw from guild first. |
| **Guild pool** | Guild flows | — | Assign broker to a guild for **guild wars**; it counts in guild power and can be used in that mode. |

Combine formula: for each stat, `newStat = clamp(0, 100, round((base + sacrifice) / 2))`; base keeps its identity and gains XP; sacrifice is removed.

---

## 6. Brokers elsewhere in the app

- **Predict / Bet:** You bet on an event (e.g. which side wins). You choose a **broker** as “your side” (`brokerId`); it’s the face of your bet, not used in a classic battle simulation.
- **Guild wars:** Brokers in the guild pool are used; guild vs guild outcome can factor in pooled broker count (e.g. small bonus/penalty).
- **Global Boss:** You run a battle with a broker; damage dealt to the boss is derived from that battle (e.g. score).
- **Tournaments:** You register a broker for a tournament; battles in that tournament use that broker.
- **Racing:** Cars and bikes are separate entities; brokers are not used in car/bike race simulation.
- **Multiverse / NFT:** The “broker” universe lets you mint a broker as an on-chain NFT, stake it, and earn AIBA from staking.

---

## 7. Economy and config

Broker-related costs and limits are in **EconomyConfig** (and env):

- **trainNeurCost**, **repairNeurCost**, **combineNeurCost** — NEUR costs for train, repair, combine.
- **upgradeAibaCost** — AIBA per upgrade.
- **createBrokerCostTonNano** — TON (in nanoton) to create a broker with TON.
- **battleEnergyCost** — default energy consumed per battle when the game mode does not set `energyCost` (e.g. 1).
- **battleMaxEnergy**, **battleEnergyRegenSecondsPerEnergy** — energy cap and regen rate.
- **battleAnomalyScoreMax** — score above this (or invalid) can set anomaly and eventually ban.

Wallets: TON for “create broker” goes to **CREATED_BROKERS_WALLET**. AIBA/NEUR flows are ledger-based (credits/debits in the backend).

---

## 8. Summary

| Concept | Short answer |
|--------|---------------|
| **What is a broker?** | Your AI agent: stats (risk, intelligence, speed), energy, level, optional NFT. Used in every battle. |
| **How is score decided?** | Deterministic simulation: seed from (user, broker, mode, requestId, …); formula uses broker stats + arena weights + level + league; risk adds variance. |
| **How do you get one?** | Free starter, pay TON, buy with AIBA (system shop or marketplace), or rent. |
| **How do you improve one?** | Train (NEUR, +1 stat), Upgrade (AIBA, +2 stat, +1 level), Combine (NEUR, merge two into one). Repair (NEUR) restores energy and cooldowns. |
| **Can you trade?** | Yes: list/buy with AIBA on the marketplace; or rent; or mint as NFT and trade on-chain. |

For exact API contracts and request/response shapes, see **API-CONTRACT.md** and **GAME-FUNCTIONALITY.md**.
