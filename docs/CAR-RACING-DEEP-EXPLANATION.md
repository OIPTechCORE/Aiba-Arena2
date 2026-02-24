# Car Racing — Deep Explanation & Readiness Audit

A full technical and product explanation of **Car Racing** in AIBA Arena: create or buy a car, enter open races, earn AIBA by finish position. Inspired by Formula 1, Le Mans, Can-Am, IndyCar, Group B, GT1, Electric, Drag, Touring/DTM, Hillclimb, NASCAR, Historic, Hypercar, Extreme prototypes.

---

## 1. Spec vs implementation (practically ready?)

| Requirement                      | Status | Notes                                                                                                                 |
| -------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| **Create or buy a car**          | ✅     | Create with AIBA or TON; buy from system shop (4 cars) or player marketplace (list/buy).                              |
| **Enter open races**             | ✅     | Open races per track (seeded on startup); replenished when a race completes. Entry fee in AIBA.                       |
| **Earn AIBA by finish position** | ✅     | Race runs when ≥2 entries; deterministic simulation; reward pool (entry fees) distributed by position; AIBA credited. |
| **Inspired by (classes)**        | ✅     | 14 car classes with labels in model and config; system shop offers Touring, GT1, Formula 1, Le Mans.                  |

**Verdict: Practically ready.** All core flows are implemented. One critical bug was fixed during this audit: reward distribution now stays within the pool (see §5).

---

## 2. Models

### 2.1 RacingCar (`backend/models/RacingCar.js`)

| Field                                                                  | Type   | Default    | Meaning                                                                                                                                     |
| ---------------------------------------------------------------------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **ownerTelegramId**                                                    | String | required   | Owner’s Telegram user ID.                                                                                                                   |
| **carClass**                                                           | String | 'formula1' | One of 14 classes (formula1, lemans, canam, indycar, groupB, gt1, electric, drag, touring, hillclimb, nascar, historic, hypercar, extreme). |
| **topSpeed**, **acceleration**, **handling**, **durability**           | Number | 50         | Stats 0–100; used in race simulation.                                                                                                       |
| **level**                                                              | Number | 1          | Level bonus in simulation (+1% per level).                                                                                                  |
| **xp**, **energy**, **energyUpdatedAt**, **cooldowns**, **lastRaceAt** | —      | —          | Reserved for future use.                                                                                                                    |
| **nftItemAddress**, **createdWithTonTxHash**                           | String | ''         | Optional on-chain / TON creation.                                                                                                           |

### 2.2 CarTrack (`backend/models/CarTrack.js`)

| Field                                | Meaning                                                      |
| ------------------------------------ | ------------------------------------------------------------ | --- | ------ |
| **trackId**                          | Unique id (e.g. circuit-rookie, circuit-pro, circuit-elite). |
| **name**, **length**, **difficulty** | Used by race engine (trackLength, trackDifficulty).          |
| **league**                           | rookie                                                       | pro | elite. |
| **active**                           | If true, track appears in GET /tracks.                       |

Seeded in `backend/jobs/seedRacingTracks.js`: 3 default car tracks (rookie, pro, elite).

### 2.3 CarRace (`backend/models/CarRace.js`)

| Field                          | Default  | Meaning                                                |
| ------------------------------ | -------- | ------------------------------------------------------ |
| **trackId**                    | required | Which track.                                           |
| **league**                     | 'rookie' | rookie / pro / elite.                                  |
| **status**                     | 'open'   | open → running → completed.                            |
| **entryFeeAiba**               | 0        | Fee per entry (config: carEntryFeeAiba, e.g. 10).      |
| **rewardPool**                 | 0        | Sum of entry fees; distributed after race.             |
| **maxEntries**                 | 16       | Cap entries; race can still run with 2+ (see below).   |
| **seed**                       | ''       | Set when race runs; used for deterministic simulation. |
| **startedAt**, **completedAt** | Date     | Set when status changes.                               |

### 2.4 CarRaceEntry (`backend/models/CarRaceEntry.js`)

| Field                                                    | Meaning                                                               |
| -------------------------------------------------------- | --------------------------------------------------------------------- |
| **raceId**, **carId**                                    | References to CarRace and RacingCar.                                  |
| **telegramId**                                           | Entrant; used to credit AIBA and enforce one entry per user per race. |
| **position**, **finishTime**, **points**, **aibaReward** | Set when race completes.                                              |

Unique index: (telegramId, raceId) — one entry per user per race.

### 2.5 CarListing (`backend/models/CarListing.js`)

| Field                                          | Meaning                            |
| ---------------------------------------------- | ---------------------------------- |
| **carId**, **sellerTelegramId**, **priceAIBA** | Listing details.                   |
| **status**                                     | 'active' \| 'sold' \| 'cancelled'. |

---

## 3. API (backend routes)

Mounted at `/api/car-racing` in `backend/app.js`.

| Method | Path             | Auth     | Purpose                                                                                                |
| ------ | ---------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| GET    | /config          | —        | createCarCostAiba, createCarCostTonNano, entryFeeAiba, walletForTon, carClasses.                       |
| GET    | /tracks          | —        | Active tracks (optional ?league=).                                                                     |
| GET    | /races           | —        | Open races with entryCount.                                                                            |
| GET    | /cars            | Telegram | Current user’s cars.                                                                                   |
| GET    | /system-cars     | —        | System shop catalog (SYSTEM_CARS) with class labels.                                                   |
| GET    | /listings        | Telegram | Active car listings (for market buy).                                                                  |
| GET    | /leaderboard     | —        | Top by total points, wins, aibaEarned.                                                                 |
| GET    | /race/:id        | —        | Single race + entries (for result view).                                                               |
| GET    | /classes         | —        | Car class id + label list.                                                                             |
| POST   | /create          | Telegram | Create car with AIBA (idempotent via requestId).                                                       |
| POST   | /create-with-ton | Telegram | Create car with TON (txHash verified, one-time).                                                       |
| POST   | /buy-system-car  | Telegram | Buy from system shop (debit AIBA, create RacingCar).                                                   |
| POST   | /list            | Telegram | List own car for sale (priceAIBA).                                                                     |
| POST   | /buy-car         | Telegram | Buy from listing (debit buyer, credit seller minus fee, transfer car).                                 |
| POST   | /enter           | Telegram | Enter race (raceId, carId); debit entry fee; add to rewardPool; create entry; if ≥2 entries, run race. |

---

## 4. Race flow (run when 2+ entries)

1. **Enter:** User calls POST /enter with raceId, carId. Backend debits entry fee, adds fee to race.rewardPool, creates CarRaceEntry. If entry count ≥ 2, it calls `runCarRaceIfFull(raceId)`.
2. **Run:** Load race (must be open), entries (with carId populated). Build vehicles from car stats + level. Call `simulateRace({ vehicles, trackLength, trackDifficulty, seed })` from `backend/engine/raceEngine.js`. Results are ordered by position (1, 2, 3, …).
3. **Rewards:** Pool = race.rewardPool; fee = pool × carRacingFeeBps/10000; toDistribute = pool − fee. Position weights (positionBonus) = [1.5, 1.2, 1.0, 0.9, …]. **Normalized:** each position gets `floor((toDistribute * bonus_i) / sumBonuses)` so total payout ≤ toDistribute.
4. **Credit:** For each entry, set position, finishTime, points, aibaReward; credit AIBA to entry.telegramId (and optional creator referrer).
5. **Complete:** Race status → completed; new open race created for same track (replenish).

---

## 5. Reward distribution (bug fix in audit)

**Before:** `positionShare = toDistribute / totalPositions`, then `aibaReward = floor(positionShare * bonus)`. Sum of (positionShare \* bonus) could exceed toDistribute (e.g. 2 players: 1.5 + 1.2 = 2.7× share), so the game could credit more AIBA than the pool.

**After:** `sumBonuses = sum of positionBonus[i] for i in 0..n-1`; then `aibaReward = floor((toDistribute * bonus) / sumBonuses)`. Payouts sum to ≤ toDistribute (with possible dust from flooring).

---

## 6. System shop cars

In `backend/config/systemShop.js`, **SYSTEM_CARS**:

| id       | name             | carClass | priceAiba | Stats (SPD/ACC/HND/DUR) |
| -------- | ---------------- | -------- | --------- | ----------------------- |
| touring  | Touring Pro      | touring  | 80        | 55/52/58/55             |
| gt1      | GT1 Racer        | gt1      | 150       | 62/58/60/55             |
| formula1 | Formula 1        | formula1 | 300       | 70/68/72/50             |
| lemans   | Le Mans Hypercar | lemans   | 400       | 72/70/70/58             |

Create-with-AIBA gives a **random** car class; buy-from-system gives a chosen catalog car with fixed class and stats.

---

## 7. Miniapp (Car Racing tab)

- **Hero:** Title, copy (“Create or buy a car, enter open races, earn AIBA by finish position”), inspired-by line, Refresh, status message.
- **Flow switches:** Garage | System | Market | Race | Leaderboard.
- **Garage:** Create car (AIBA or TON tx hash), list “My cars” with class label and stats.
- **System:** Buy from SYSTEM_CARS (name, class, stats, price, Buy).
- **Market:** List your car (select + price) → List; buy from listings (Buy) → refresh + refreshEconomy.
- **Race:** Select open race (trackId, league, entry count, fee), select car, “Enter race” → entry fee debit, enter, then race runs if ≥2; refreshCarRacing + refreshEconomy.
- **Leaderboard:** Top by totalPoints, wins, aibaEarned.

Config drives: create costs (AIBA/TON), entry fee, carClasses for labels. UI copy updated to: “When 2+ have entered, the race runs and rewards are paid by finish position.”

---

## 8. Seed and replenish

- **Startup:** `seedRacingTracks()` in `backend/server.js` runs on boot. If no car tracks → insert 3; if no open car races → create one open race per track (entryFeeAiba 10, maxEntries 16).
- **Replenish:** When a car race completes, `runCarRaceIfFull` creates a new open race for the same track (same league, entryFeeAiba, maxEntries, rewardPool 0). So open races stay available without a cron.

---

## 9. Optional improvements (not blocking)

- **Race result view:** GET /race/:id exists; miniapp could show “My race history” or “Last race: you finished 2nd, +X AIBA.”
- **Track names in race dropdown:** Currently shows trackId (e.g. circuit-rookie); could resolve to track name from /tracks for friendlier labels.

---

**Conclusion:** Car Racing is **in place and practically ready**. Create/buy car, enter open races, and earn AIBA by finish position are implemented end-to-end; reward math is corrected; UI copy matches behavior (2+ entries); open races are replenished; all 14 “inspired by” classes are present in the model and config.
