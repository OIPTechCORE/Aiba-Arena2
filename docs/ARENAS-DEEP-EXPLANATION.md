# Arenas — Deep Explanation

A full technical and product explanation of **Arenas** (battle modes) in AIBA Arena: what they are, how they are configured, and how they drive battles, rewards, and leagues.

---

## 1. What is an Arena?

An **arena** is a **battle mode** in which your broker competes. It determines:

- **How the score is weighted** — Each arena favors different broker stats (intelligence, speed, risk).
- **Costs and limits** — Energy per battle, cooldown between runs, optional entry fees (NEUR/AIBA).
- **Rewards** — Multipliers on AIBA and NEUR; guild wars split NEUR with the guild.
- **Prerequisites** — Some arenas (e.g. **guild wars**) require guild membership; **leagues** (rookie, pro, elite) require minimum broker level.

Arenas do **not** change the core mechanic: every battle is a **deterministic simulation** (broker stats + seed → score). The arena only changes the **weights** in the formula and the **rules** (energy, cooldown, fees, guild).

---

## 2. GameMode model (data)

Arenas and leagues are represented as **GameMode** documents (`backend/models/GameMode.js`). Each mode has a unique `key` and belongs to an `arena` + `league` bucket.

### 2.1 Fields

| Field           | Type    | Default          | Description                                                                                 |
| --------------- | ------- | ---------------- | ------------------------------------------------------------------------------------------- |
| **key**         | String  | required, unique | e.g. `prediction`, `prediction-pro`, `guildWars-elite`. Used for idempotency and cooldowns. |
| **name**        | String  | required         | Display name, e.g. "Prediction (pro)".                                                      |
| **description** | String  | ''               | Optional description.                                                                       |
| **enabled**     | Boolean | true             | If false, the mode cannot be used for battle.                                               |
| **arena**       | String  | required         | Arena bucket: `prediction`, `simulation`, `strategyWars`, `guildWars`, `arbitrage`.         |
| **league**      | String  | 'rookie'         | League: `rookie`, `pro`, `elite`. Affects score multiplier and min broker level.            |

### 2.2 Per-battle costs and limits

| Field               | Default | Description                                                     |
| ------------------- | ------- | --------------------------------------------------------------- |
| **energyCost**      | 10      | Energy consumed per battle (broker must have ≥ this).           |
| **cooldownSeconds** | 30      | Minimum seconds before the same broker can run this mode again. |
| **entryNeurCost**   | 0       | Optional NEUR fee to enter (debited before battle).             |
| **entryAibaCost**   | 0       | Optional AIBA fee to enter (debited before battle).             |

### 2.3 Rewards

| Field                    | Default | Description                                                 |
| ------------------------ | ------- | ----------------------------------------------------------- |
| **rewardMultiplierAiba** | 1.0     | Multiply proposed AIBA by this (after base score × config). |
| **rewardMultiplierNeur** | 1.0     | Multiply proposed NEUR by this.                             |

### 2.4 Rules (object)

| Key                  | Description                                                             |
| -------------------- | ----------------------------------------------------------------------- |
| **requiresGuild**    | If true, user must be in a guild (e.g. guild wars).                     |
| **minBrokerLevel**   | Override default min level for this league (rookie 1, pro 5, elite 10). |
| **arenaWeights**     | Override default INT/SPD/RISK weights for the score formula.            |
| **leagueMultiplier** | Override default league multiplier (rookie 1.0, pro 1.1, elite 1.2).    |
| **varianceBase**     | Override default variance base (30) for score noise.                    |

---

## 3. Default arenas and leagues

On first DB connect, `ensureDefaultGameModes()` in `backend/db.js` upserts **15 modes**:

- **Arenas:** `prediction`, `simulation`, `strategyWars`, `guildWars`, `arbitrage`.
- **Leagues:** `rookie`, `pro`, `elite`.

For each arena × league:

- **key:** `arena` for rookie (e.g. `prediction`), `arena-league` for pro/elite (e.g. `prediction-pro`).
- **name:** e.g. "prediction (pro)".
- **energyCost:** rookie 10, pro 15, elite 20; guild wars +5.
- **cooldownSeconds:** rookie 30, pro 45, elite 60; guild wars +15.
- **rules:** `{ requiresGuild: true }` for `guildWars` only.

Admins can add or edit modes via **Admin → Game Modes** (key, name, arena, league, energy, cooldown, entry fees, multipliers, rules).

---

## 4. How a battle uses the arena

### 4.1 Resolving the mode

1. Client sends **arena** and **league** (or **modeKey**).
2. If **modeKey** is set: `GameMode.findOne({ key: modeKey })`.
3. Else: `GameMode.findOne({ enabled: true, arena, league })`.
4. If no mode or `enabled === false` → 400/403.

### 4.2 Checks before simulation

- **Guild:** If `rules.requiresGuild` or `arena === 'guildWars'`, user must be in a guild; opponent guild is chosen for matchmaking.
- **Broker:** Ownership (or rental), not banned, energy ≥ `mode.energyCost`, cooldown elapsed for this mode, broker level ≥ `rules.minBrokerLevel` (or league default: elite 10, pro 5, rookie 1).
- **Entry fees:** If `entryNeurCost` or `entryAibaCost` > 0, user balance is debited (idempotent with requestId).

### 4.3 Seed and score

- **Seed message:** `telegramId:brokerId:modeKey:arena:league:requestId:opponentId` (see `backend/engine/battleSeed.js`). Same inputs ⇒ same score.
- **Score:** `simulateBattle({ broker, seed, arena, league, rules })` in `backend/engine/battleEngine.js`:
    - **Arena weights** (defaults): prediction (INT 0.7, SPD 0.2, RISK 0.1), simulation (0.5, 0.3, 0.2), strategyWars (0.6, 0.1, 0.3), guildWars (0.4, 0.3, 0.3), arbitrage (0.5, 0.3, 0.2). Overridable via `rules.arenaWeights`.
    - **League multiplier:** rookie 1.0, pro 1.1, elite 1.2 (or `rules.leagueMultiplier`).
    - **Level multiplier:** +2% per broker level, cap +50%.
    - **Base score** = 100 × leagueMul × levelMul × (weighted sum of INT/SPD/RISK).
    - **Variance** = varianceBase × leagueMul × (0.2 + risk); **noise** from deterministic RNG.
    - **score** = max(0, round(base + noise)).

### 4.4 Guild wars adjustment

If guild wars and both guilds exist: **bonus** = clamp(-15, 15, (myPoolCount − oppPoolCount) × 3). Score becomes max(0, round(score + bonus)).

### 4.5 After the battle

- Broker: energy −= energyCost; cooldowns[modeKey] = now (and legacy arena key); lastBattleAt = now.
- Rewards: proposedAiba/Neur from score × config × mode multipliers; then innovations (streak, premium, boost). **Guild wars NEUR:** 20% to guild (1% to creator, 19% to vault), 80% to player. AIBA stays 100% to player.
- Battle document saved with arena, league, modeKey, score, rewards.

---

## 5. Arena weights (score formula)

Default weights by arena (INT, SPD, RISK):

| Arena               | Intelligence | Speed | Risk |
| ------------------- | ------------ | ----- | ---- |
| prediction          | 0.7          | 0.2   | 0.1  |
| simulation          | 0.5          | 0.3   | 0.2  |
| strategyWars        | 0.6          | 0.1   | 0.3  |
| guildWars           | 0.4          | 0.3   | 0.3  |
| arbitrage (default) | 0.5          | 0.3   | 0.2  |

Override per mode via `mode.rules.arenaWeights` (e.g. `{ intelligence: 0.8, speed: 0.1, risk: 0.1 }`).

---

## 6. Leagues

| League | Min broker level (default) | Score multiplier |
| ------ | -------------------------- | ---------------- |
| rookie | 1                          | 1.0              |
| pro    | 5                          | 1.1              |
| elite  | 10                         | 1.2              |

Higher league = higher rewards and stricter level gate. Override min level per mode with `rules.minBrokerLevel`.

---

## 7. API

### 7.1 List modes (miniapp)

- **GET /api/game-modes** — Returns enabled GameModes. Optional query: `arena`, `league` to filter. Used to build the arena/mode dropdown. **Public** (no auth required) so the miniapp can load the arena list before login.

### 7.2 Run battle

- **POST /api/battle/run** — Body: `requestId`, `brokerId`, `arena`, `league` (or `modeKey`), optional `autoClaim`. Server resolves mode, runs checks, simulates, applies rewards, updates broker, returns battle + optional claim payload.

### 7.3 Admin

- **GET /api/admin/game-modes** — List all modes.
- **POST /api/admin/game-modes** — Create mode (key, name, arena, league, energyCost, cooldownSeconds, entryNeurCost, entryAibaCost, rewardMultiplierAiba/Neur, rules).
- **PATCH /api/admin/game-modes/:id** — Update mode.
- **DELETE /api/admin/game-modes/:id** — Delete mode.

---

## 8. Miniapp behavior

- **Brokers tab / Arenas tab:** Dropdown is built from `GET /api/game-modes`. Each option value is `arena:league` (e.g. `prediction:rookie`). When the user runs a battle, the app splits value to `arena` and `league` and sends them to `POST /api/battle/run`.
- **Fallback:** If the game-modes API fails, a static list of arena-only options is used (e.g. Prediction, Simulation, …); battle then uses league `rookie` for those.
- **Guild wars:** UI hints that a guild is required; server returns 403 if the user is not in a guild.
- **Mode info:** Optionally show for the selected mode: energy cost, cooldown, entry fees, reward multipliers (so the player knows what they’re entering).

---

## 9. Summary

| Concept                              | Short answer                                                                                               |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **What is an arena?**                | A battle mode: arena + league, with weights, energy, cooldown, optional fees and guild requirement.        |
| **How is the mode chosen?**          | By `arena` + `league` or by `modeKey`. Stored as GameMode; defaults created on DB init.                    |
| **How does the arena affect score?** | Via arena weights (INT/SPD/RISK), league multiplier, and optional rules overrides. Same seed ⇒ same score. |
| **What are leagues?**                | rookie (1.0×, level 1+), pro (1.1×, level 5+), elite (1.2×, level 10+).                                    |
| **Guild wars?**                      | Requires guild; NEUR split 80% player / 20% guild; small pool-size bonus/penalty to score.                 |

For broker stats and the full score formula, see **BROKERS-DEEP-EXPLANATION.md** and **GAME-FUNCTIONALITY.md**.
