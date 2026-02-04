# Autonomous Racing — Master Plan (Car & Motorcycle)

This document is the **master plan** for **Autonomous Motor Car Racing** and **Autonomous Motorcycle Racing** inside the AIBA ecosystem. Each vertical is designed so **Users**, **AIBA Token** (AIWEC/ecosystem token), and **Super Admin** can each reach **billions of dollars** in value and revenue.

---

## 1. Vision

- **Two racing verticals:** (A) **Autonomous Motor Car Racing** and (B) **Autonomous Motorcycle Racing**. Both use **AI-driven vehicles** (no human driver): users own, upgrade, and race them; results are **deterministic** (server-authoritative) and reward **AIBA**.
- **Same economy principles:** TON for entry/creation/premium; **AIBA** for all in-race rewards, entry fees, marketplace, mints, and staking. Super Admin gets dedicated TON wallets per product and % of AIBA flow (fees, burns, treasury).
- **Path to billions:** Users earn from racing, ownership, trading, and staking; AIBA gains from every race, mint, and trade; Super Admin earns from TON and fee revenue.

---

## 2. Core Design: What Is “Autonomous Racing”?

| Concept | Description |
|--------|-------------|
| **Vehicle** | A **Racing Car** or **Racing Motorcycle** (separate from “Broker”). Has stats: **Top Speed**, **Acceleration**, **Handling**, **Durability** (and optionally **AI Driver** link to a Broker). |
| **Autonomous** | Races are **simulated** by the server: the vehicle’s stats + a **deterministic seed** (like battles) produce a **finish position** and **race time**. No real-world racing; no client-side input during race. |
| **Race** | A **race instance**: N vehicles (e.g. 8–16) compete on a **track** (configurable). Server runs one deterministic simulation → ranking, lap times, points. |
| **Entry** | User **enters** a vehicle into a race by paying **AIBA** (and/or TON for premium events). Rewards paid in **AIBA** by finish position. |

- **Car Racing:** Cars have car-specific stats and car-specific tracks (circuits). Leagues: Rookie, Pro, Elite. Championships and seasons (weekly/monthly) with leaderboards.
- **Motorcycle Racing:** Bikes have bike-specific stats (e.g. higher weight on handling/speed ratio). Separate tracks and leagues. Same reward and economy structure.

Both can share the same **economy backend** (AIBA, ledger, caps) and **Super Admin wallet** strategy (dedicated env per product).

---

## 3. A. Autonomous Motor Car Racing — Specification

### 3.1 Assets and Data

| Entity | Description |
|--------|-------------|
| **RacingCar** | ownerTelegramId, topSpeed, acceleration, handling, durability, level, xp, energy, cooldowns, nftItemAddress (optional), createdWithTonTxHash (optional). |
| **CarTrack** | trackId, name, length (virtual), difficulty, carLeague (rookie/pro/elite). |
| **CarRace** | raceId, trackId, league, status (open/running/completed), entryFeeAiba, rewardPool (from entries + treasury boost), startedAt, completedAt, seed. |
| **CarRaceEntry** | raceId, carId, telegramId, position, finishTime, points, aibaReward. |

### 3.2 Flow

1. **Create car:** User pays **TON** (e.g. 1–10 TON → `CAR_RACING_WALLET`) or **AIBA** to create a new Racing Car. Car appears in “My Cars” and can be listed on marketplace.
2. **Enter race:** User selects car and race (track + league). Pays **entry fee** in **AIBA** (or TON for premium cups → `CAR_RACING_WALLET`). Entry closes when slot count is full or timer ends.
3. **Race runs:** Server runs deterministic simulation: vehicle stats + track + seed → finish order and times. **Rewards** in **AIBA** (position-based share of pool). Fee % of pool to treasury/burn.
4. **Leaderboards:** Global and per-league leaderboards (points, wins, AIBA earned). Top users get badges and optional **free entry** or **NFT** rewards.
5. **Marketplace:** Users list **cars** for **AIBA**; buyers pay AIBA; fee % to treasury/burn (same as broker marketplace).
6. **NFT & Staking:** Cars can be minted as **NFTs** (pay AIBA); staking car NFT earns **AIBA** daily (like Broker NFT in Multiverse).

### 3.3 Economy Levers (Car)

| Action | Currency | Recipient | Config / note |
|--------|----------|-----------|----------------|
| Create car (TON) | TON | Super Admin (CAR_RACING_WALLET) | createCarCostTonNano (1–10 TON) |
| Create car (AIBA) | AIBA | Burn or treasury | createCarCostAiba |
| Enter race | AIBA (or TON for premium) | Pool + fee % to treasury | entryFeeAiba, carRacingFeeBps |
| Race reward | AIBA | User (position share) | From pool; remainder can go to treasury |
| List/buy car | AIBA | Seller (minus fee); fee → burn/treasury | marketplaceFeeBps, marketplaceBurnBps |
| Mint car NFT | AIBA | Burn/treasury | carMintNftCostAiba |
| Stake car NFT | — | User earns AIBA daily | nftStakingRewardPerDayAiba (or car-specific) |

---

## 4. B. Autonomous Motorcycle Racing — Specification

### 4.1 Assets and Data

| Entity | Description |
|--------|-------------|
| **RacingMotorcycle** | ownerTelegramId, topSpeed, acceleration, handling, durability, level, xp, energy, cooldowns, nftItemAddress (optional), createdWithTonTxHash (optional). |
| **BikeTrack** | trackId, name, length, difficulty, bikeLeague. |
| **BikeRace** | raceId, trackId, league, status, entryFeeAiba, rewardPool, startedAt, completedAt, seed. |
| **BikeRaceEntry** | raceId, bikeId, telegramId, position, finishTime, points, aibaReward. |

### 4.2 Flow

- Mirrors **Car Racing**: create bike (TON → `MOTORCYCLE_RACING_WALLET` or AIBA), enter races (AIBA or TON), deterministic simulation, **AIBA** rewards, leaderboards, marketplace (buy/sell bikes for AIBA), NFT mint and staking.
- **Different feel:** Bike stats can be tuned so that handling/risk matter more (e.g. higher variance), and tracks can be bike-specific (shorter, more turns) to differentiate from car racing.

### 4.3 Economy Levers (Motorcycle)

| Action | Currency | Recipient | Config / note |
|--------|----------|-----------|----------------|
| Create motorcycle (TON) | TON | Super Admin (MOTORCYCLE_RACING_WALLET) | createBikeCostTonNano (1–10 TON) |
| Create motorcycle (AIBA) | AIBA | Burn or treasury | createBikeCostAiba |
| Enter race | AIBA (or TON for premium) | Pool + fee % | entryFeeAiba, bikeRacingFeeBps |
| Race reward | AIBA | User | Position share from pool |
| List/buy bike | AIBA | Seller (minus fee); fee → burn/treasury | Same marketplace fee/burn |
| Mint bike NFT | AIBA | Burn/treasury | bikeMintNftCostAiba |
| Stake bike NFT | — | User earns AIBA daily | Same or bike-specific staking reward |

---

## 5. Benefits — A. USER (Billions Potential)

| Benefit | Description | Revenue / value potential |
|---------|-------------|---------------------------|
| **Ownership** | Own cars and motorcycles (and their NFTs). Tradeable, provable on-chain. | Asset appreciation; resale at higher prices as ecosystem grows. |
| **Racing rewards** | Compete in races; finish position pays **AIBA**. Regular and championship events. | Steady and tournament AIBA income; top leaderboards = visibility and sponsorships. |
| **Trading** | Sell vehicles on marketplace for **AIBA**; buy better stats or rare models. | Arbitrage, flipping, collecting → billions in secondary market. |
| **Staking** | Stake car/bike NFTs to earn **AIBA** daily (like Broker NFT). | Passive income; long-term hold = compound rewards. |
| **Play-to-earn** | Earn AIBA from races → upgrade vehicles or mint NFTs → sell or stake. | Full loop: play → own → earn → reinvest. |
| **Exclusive access** | Premium races (TON entry), seasonal championships, NFT-gated events. | High-roller revenue; influencer and brand deals. |
| **Status** | Leaderboards, badges (e.g. “Car Champion”, “Bike Elite”), profile display. | Recognition, clout, partnerships. |

**Scale:** Millions of users × (race rewards + trading + staking + championships) = **billions** in user-captured value over time.

---

## 6. Benefits — B. AIBA TOKEN (Billions Market Cap)

| Lever | Description | Effect on market cap |
|-------|-------------|----------------------|
| **Entry fees** | Every race entry (and premium TON-converted entry) drives **AIBA** demand. | Constant spend; recurring use case. |
| **Rewards** | All race payouts in **AIBA**. | Attracts and retains players; demand to hold and earn. |
| **Create vehicle (AIBA)** | Optional: pay AIBA to create car/bike. | Direct sink; supply reduction or treasury lock. |
| **Marketplace** | Buy/sell cars and bikes in **AIBA**; fee % (and burn). | Every trade = demand; deflationary fee burn. |
| **Mint NFT** | Mint car/bike as NFT costs **AIBA**. | Sink; aligns with Multiverse. |
| **Staking** | Stake vehicle NFTs → rewards in **AIBA**; optional AIBA lock. | Reduces circulating supply; rewards = long-term holding. |
| **Single in-app token** | No other token for value: racing, marketplace, staking all **AIBA**. | Clear store of value → path to **billions market cap**. |

**Result:** Racing verticals add **two major use cases** (car + bike) on top of existing brokers, marketplace, and multiverse → more demand, more sinks, more scarcity → **AIBA toward billions**.

---

## 7. Benefits — C. SUPER ADMIN (Billions Revenue)

| Revenue stream | Description | Scale |
|----------------|-------------|--------|
| **TON: Create car** | User pays TON to create car → **CAR_RACING_WALLET**. | Millions of users × 1–10 TON = massive TON inflow. |
| **TON: Create motorcycle** | User pays TON to create bike → **MOTORCYCLE_RACING_WALLET**. | Same; separate accounting. |
| **TON: Premium races** | Optional premium entry in TON (e.g. championship qualifiers) → dedicated wallet. | High-value events; recurring. |
| **AIBA fee %** | % of race entry pool and % of marketplace sales (cars/bikes) to treasury. | Grows with volume; sustainable. |
| **Fee burn** | Part of fee burned (like broker marketplace) → supports AIBA value → indirect treasury value. | Deflationary; benefits whole ecosystem. |
| **Dedicated wallets** | CAR_RACING_WALLET, MOTORCYCLE_RACING_WALLET (and optional PREMIUM_CAR_RACING_WALLET, etc.). | Clear accounting; audit; treasury splits. |

**Result:** Super Admin captures **TON** (creation + premium) and **AIBA fee revenue** from two new high-engagement verticals → **billions** as racing scales globally.

---

## 8. Implementation Outline (High Level)

| Layer | Car Racing | Motorcycle Racing |
|-------|------------|-------------------|
| **Models** | RacingCar, CarTrack, CarRace, CarRaceEntry | RacingMotorcycle, BikeTrack, BikeRace, BikeRaceEntry |
| **Engine** | Deterministic race simulator (stats + track + seed → order + times) | Same pattern; bike-specific weights/tracks |
| **Routes** | /api/car-racing (create, list, enter, result, leaderboard, marketplace) | /api/bike-racing (same) |
| **Economy config** | createCarCostTonNano, createCarCostAiba, entryFeeAiba, carRacingFeeBps, carMintNftCostAiba | createBikeCostTonNano, createBikeCostAiba, entryFeeAiba, bikeRacingFeeBps, bikeMintNftCostAiba |
| **Env** | CAR_RACING_WALLET | MOTORCYCLE_RACING_WALLET |
| **Miniapp** | New tab or section: Car Racing (My Cars, Races, Enter, Leaderboard, Market) | New tab or section: Bike Racing (same) |
| **NFT** | Car NFT collection (or extend Multiverse “car” universe); staking | Bike NFT collection; staking |
| **Admin** | Tracks, races (create/close), economy knobs, moderation | Same |

---

## 9. Summary Table: Who Gets What

| Party | Car Racing | Motorcycle Racing | Billions path |
|-------|------------|-------------------|----------------|
| **User** | Race rewards (AIBA), own/trade/sell cars, stake car NFTs, leaderboards, championships | Same for bikes | Volume × (rewards + trading + staking) |
| **AIBA** | Entry fees, rewards, create/mint/marketplace/staking all in AIBA; fee burn | Same | Demand + sinks + scarcity → market cap |
| **Super Admin** | TON (create car, premium); fee % from races and marketplace | TON (create bike, premium); fee % | TON + fee revenue; dedicated wallets |

---

This is the **master plan** for **Autonomous Motor Car Racing** and **Autonomous Motorcycle Racing**: two verticals with clear benefits for **Users**, **AIBA (AIWEC)**, and **Super Admin**, each capable of reaching **billions of dollars** as the ecosystem scales.
