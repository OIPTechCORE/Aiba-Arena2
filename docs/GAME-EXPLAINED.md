# AIBA Arena — Deep Game Explanation

This document explains **what the game is**, **how it works**, and **how the pieces fit together** (brokers, arenas, battles, economy, on-chain claims, guilds, referrals, marketplace, TON payments, boost profile, gifts).

---

## 1. What Is AIBA Arena?

**AIBA Arena** is a **Telegram Mini App** where you:

- Own **brokers** — AI trading agents with stats (intelligence, speed, risk).
- Enter **arenas** (prediction, simulation, strategy wars, guild wars) and **leagues** (rookie, pro, elite).
- Run **battles**: the server simulates a deterministic “match” using your broker’s stats and a secret seed. You get a **score**.
- Earn **rewards**:
  - **NEUR** — off-chain points (ledger only); used for entry fees, upgrades, referrals.
  - **AIBA** — off-chain “credits” that you can **withdraw on-chain** as real AIBA jettons (TON) when the backend and vault are configured.

So: **play with brokers in arenas → get score → earn NEUR and AIBA credits → optionally withdraw AIBA to your TON wallet.**

---

## 2. Core Concepts

### 2.1 Brokers

A **broker** is your in-game “agent.” Each broker has:

- **Stats (0–100):**
  - **Intelligence** — affects score in prediction-heavy arenas.
  - **Speed** — affects score in speed-sensitive arenas.
  - **Risk** — adds variance (higher risk = more swing in score).
- **Level** — from battles/XP; some leagues require a minimum level.
- **Energy** — consumed per battle; regenerates over time (e.g. 1 energy per minute, cap 100).
- **Cooldown** — per arena/mode; you must wait (e.g. 30–60 seconds) before the next battle in that mode.
- **Guild** — a broker can be deposited into a **guild pool** for guild wars.

You can have **multiple brokers**. You pick one for each battle. New users get a **starter broker** (Create starter broker).

### 2.2 Arenas and Leagues

- **Arenas** are game modes with different “meta”:
  - **Prediction** — intelligence-weighted (e.g. 70% int, 20% speed, 10% risk).
  - **Simulation** — more balanced (50% int, 30% speed, 20% risk).
  - **Strategy Wars** — risk matters more (60% int, 10% speed, 30% risk).
  - **Arbitrage** — available in game modes (energy/cooldown/rewards per mode).
  - **Guild Wars** — requires guild membership; rewards split (e.g. 80% to you, 20% to guild treasury); brokers can be deposited in the guild pool.
- **Leagues** (rookie, pro, elite):
  - Higher league = higher score multiplier and often higher energy/cooldown cost.
  - Pro/elite may require a minimum broker level.

The server stores **game modes** (arena + league + energy cost, cooldown, entry fees, reward multipliers). Defaults are created at first DB connect (e.g. prediction/rookie, prediction/pro, …, guildWars/elite).

### 2.3 Battles

When you **Run battle**:

1. You send: **brokerId**, **arena**, **league** (and optional **modeKey**), plus an idempotency **requestId**.
2. Server checks:
   - You’re not banned; broker is yours; broker not banned.
   - **Game mode** exists and is enabled for that arena/league.
   - **Guild Wars** only: you’re in a guild.
   - Broker has enough **energy** and is off **cooldown** for that mode.
   - Optional **entry fees** (NEUR or AIBA) if the mode has them; your balance is debited.
3. Server computes a **deterministic seed** from: secret + your telegramId, brokerId, modeKey, arena, league, requestId (and opponent guild in guild wars). So same inputs ⇒ same score (no client cheating).
4. **Battle simulation**:  
   `score = f(broker stats, seed, arena, league)`.  
   Formula: weighted sum of intelligence/speed/risk (arena-specific weights), plus league multiplier, level bonus, and a variance term (risk increases variance). Score is an integer ≥ 0.
5. **Anomaly check**: if score is out of expected range, the broker/user can get **anomaly flags**; too many flags ⇒ auto-ban (broker or user).
6. **Rewards** (if within emission windows and under daily caps):
   - **NEUR** = score × baseRewardNeurPerScore × mode multiplier → credited to your NEUR balance (off-chain). In guild wars, a share (e.g. 20%) goes to the guild treasury.
   - **AIBA** = score × baseRewardAibaPerScore × mode multiplier → credited to your **AIBA balance** (off-chain “credits”).
7. **Broker state** updated: energy decreased, cooldown set, lastBattleAt, etc.
8. If you requested **auto-claim** and the backend has vault/oracle configured, the server may create a **signed claim** and return it so you can withdraw that battle’s AIBA on-chain in one go.

So: **battle = one deterministic simulation → score → NEUR + AIBA credits (and optional claim for on-chain AIBA).**

---

## 3. Economy (NEUR and AIBA)

### 3.1 NEUR (off-chain only)

- **Ledger-only** currency: stored in the backend DB (user balance + ledger entries).
- **Earned:** battle rewards (and referral bonuses).
- **Spent:** entry fees (if a mode has entryNeurCost), upgrades, training, repairs (when implemented).
- **Caps:** daily emission caps per arena (and optionally per arena:league) so the economy doesn’t explode.
- **Emission windows:** rewards may only be granted during certain UTC hours (configurable per arena/league).

### 3.2 AIBA credits (off-chain) and on-chain withdrawal

- **AIBA balance** in the app = off-chain “credits” (same number as smallest jetton units in the code).
- **Earned:** battle rewards (within caps and emission windows).
- **Withdrawal:** you **create a claim** (either after a battle with “Create claim” or via “Auto-claim AIBA on battle”). The backend signs a **reward claim** (vault address, your wallet, amount, seqno, expiry). You then send a **TonConnect transaction** to the **ArenaRewardVault** contract with that signed payload; the vault checks the signature and sends AIBA jettons to your wallet.
- **Claim flow:**  
  Credits → backend creates signed claim → you send 1 tx to vault with payload → vault transfers AIBA to your TON address.  
  So **AIBA credits** are “withdrawable” as **real AIBA jettons** when the project has deployed the vault and configured the backend (ARENA_VAULT_ADDRESS, AIBA_JETTON_MASTER, ORACLE_PRIVATE_KEY_HEX, TON provider).

### 3.3 TON payments (Super Admin)

- **All TON payments** go to **Super Admin wallets** (one per product; see [MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md](MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md)). Costs are 1–10 TON (adjustable in Admin Economy).
- **Create broker with TON:** Pay TON → new broker is created and **auto-listed** on the global marketplace; you get **global recognition** as seller. Wallet: `CREATED_BROKERS_WALLET`; config: `createBrokerCostTonNano`.
- **Boost your profile:** Pay TON → your profile is “boosted” (visibility/badge until a set date). Wallet: `BOOST_PROFILE_WALLET`; config: `boostProfileCostTonNano`, `boostProfileDurationDays`.
- **Gifts:** Pay TON to send a **gift** to another user (by Telegram ID or @username). Wallet: `GIFTS_WALLET`; config: `giftCostTonNano`. Recipient sees “Gifts received”; you see “Gifts sent.”
- **Create/boost group:** Pay TON to create a guild (if not in top N) or to boost a guild. Wallets: `LEADER_BOARD_WALLET`, `BOOST_GROUP_WALLET`.
- **Battle boost (TON):** Pay TON for a reward multiplier. Wallet: `BOOST_TON_WALLET`.

---

## 4. Guilds

- **Guild** = a group; you can create one (name, optional bio) or join by **Guild ID**.
- **Guild Wars** arena requires you to be in a guild. Rewards (NEUR) are split (e.g. 80% to you, 20% to guild treasury).
- You can **deposit** a broker into a guild’s pool or **withdraw** it back to “yours.” Guild wars may use pooled brokers for matchmaking (e.g. guild vs guild).
- Guild has a **vault** (NEUR) that grows from the guild’s share of guild war rewards.

---

## 5. Referrals

- You can **create** a referral code (one per user).
- Others **apply** your code (they need a connected wallet; anti-sybil baseline). When they apply, both you and they can get **NEUR** bonuses (amounts set in economy config: referralRewardNeurReferrer, referralRewardNeurReferee).
- Referral is one-time per referee (wallet/account).

---

## 6. Marketplace (unified)

- **One global marketplace:** list and buy **brokers** (and future items). **Payments:** **TON** only for **creating** a new broker (pay once → broker auto-listed); **AIBA** for **listing** and **buying**.
- **Create broker with TON:** You pay TON (1–10, configurable) to the project’s “Created Brokers” wallet, then submit the **transaction hash**. The backend verifies the payment and creates a new broker **and** a **listing** at a default AIBA price so it appears globally. You are the seller → **global recognition**.
- **List your broker:** Choose a broker you own (not in a guild pool), set a **price in AIBA**, and list. The listing is visible to everyone.
- **Buy a listing:** Pay in **AIBA**; the broker transfers to you. Marketplace fee (configurable) can go to burn or treasury to support AIBA value.
- **Full plan:** See [MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md](MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md) for the 360° payment strategy (TON + AIBA only, Super Admin wallets per product, AIBA market cap vision).

---

## 7. Ads

- Between battles, the app can show a **sponsored** ad (image + optional link). Ads are fetched from the backend by placement (e.g. `between_battles`), with optional **weight** for A/B or priority. Click opens the link (e.g. via Telegram WebApp or new tab).

---

## 8. Tasks

- The backend can expose a **tasks** feed (e.g. “daily quests,” links to external actions). The miniapp can list them; actual completion logic may live in the backend or elsewhere. Currently the API returns a list of enabled tasks (for future UX).

---

## 9. Security and Fairness (short)

- **Battles are server-authoritative:** seed is derived from server secret + request params; clients cannot fake scores.
- **Idempotency:** each battle is tied to a **requestId**; repeating the same requestId returns the same battle result (no double reward).
- **Rate limits:** battle endpoint is rate-limited per user; cooldowns and energy prevent spam.
- **Telegram auth:** user identity is from Telegram (initData or, in dev, x-telegram-id). Wallet is stored when you connect TonConnect so the backend knows where to allow claims.
- **Bans:** users or brokers can be banned (or auto-banned after too many anomaly flags). Banned users get 403 on battle run.

---

## 10. End-to-End Flow (summary)

1. Open the **Telegram Mini App** (AIBA Arena).
2. **Connect wallet** (TonConnect) → backend saves your TON address.
3. **Create a starter broker** (or use an existing one).
4. **Select broker**, **select arena** (and league if the UI offers it).
5. Optionally **join/create a guild** for guild wars.
6. **Run battle** → get **score** and **rewards** (NEUR + AIBA credits).
7. **NEUR** stays in your off-chain balance; use for entries, upgrades, etc.
8. **AIBA credits** → either:
   - **Auto-claim on battle:** backend returns a signed claim; you send one TonConnect tx to the vault to receive AIBA on-chain, or  
   - **Create claim** later (amount or “all”), then **Claim on-chain (TonConnect)** with the same flow.
9. **Referrals:** create code, share it; others apply with wallet to get NEUR bonuses.
10. **Ads** may appear between battles; **tasks** can be shown for future engagement.
11. **Optional:** **Market** — create a broker with TON (pay → paste tx hash → broker auto-listed); list/buy brokers with AIBA. **Wallet** — boost your profile (TON); send gifts (TON) to another user; view received/sent gifts.

This is the **full picture** of the game: brokers, arenas, leagues, deterministic battles, NEUR/AIBA economy, on-chain AIBA withdrawal via signed claims, guilds, referrals, **unified marketplace** (create broker with TON, list/buy with AIBA), **boost profile** and **gifts** (TON), and supporting features (ads, tasks). See [USER-GUIDE.md](USER-GUIDE.md) for step-by-step play, [MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md](MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md) for payment design, and [AUTONOMOUS-RACING-MASTER-PLAN.md](AUTONOMOUS-RACING-MASTER-PLAN.md) for racing economy and benefits.
