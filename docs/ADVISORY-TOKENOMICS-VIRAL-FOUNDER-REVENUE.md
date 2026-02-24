# Advisory: 1 Trillion AIBA, Viral Growth & Billions (Users, AIBA, Founders)

**Scope:** Tokenomics, viral mechanics, user/founder revenue, AIBA market cap.  
**Context:** AIBA Arena — Telegram Mini App, TON blockchain, AI Broker battle arena.  
**Method:** Deep global scan of backend, contracts, economy, referrals, racing, marketplace.

---

## Executive Summary

| Topic                   | Key Takeaway                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1T AIBA Mint**        | Feasible; requires vault sizing, emission caps, and decimal policy. Supply must align with sinks (burns, staking, treasury) to avoid hyperinflation.                            |
| **Viral Growth**        | Telegram distribution, referral loops (tiered 10th=2×, 100th=5× done), share via Telegram, leaderboard, guilds, gifts. K-factor target > 0.3.                                   |
| **Users → Billions**    | Multi-path: battles (2 AIBA/score), referrals (10–50 AIBA), racing, staking (15% APY), NFT staking (12%), missions, marketplace. At scale, top players can earn $10k–$100k+/yr. |
| **AIBA → Billions MC**  | 1T supply × $0.001 = $1B FDV. Path: adoption → circulating supply growth → burns → scarcity → price. Realistic: $100M–$1B with 1M–10M DAU.                                      |
| **Founders → Billions** | TON wallets (create broker, boost, guild, car/bike, university, stars) + treasury (25% of fee splits). Need 10M+ DAU or token appreciation.                                     |

---

## 0. Deep Scan — Codebase Summary

| Area               | Location                                                 | Key Findings                                                                                      |
| ------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Token contract** | `contracts/aiba_token.tact`                              | Mint message; owner-only; mintable; SafeTokenBurn                                                 |
| **Vault**          | `contracts/`, `scripts/deployAibaArena.ts`               | ArenaRewardVault; oracle-signed claims                                                            |
| **Economy caps**   | `backend/models/EconomyConfig.js`                        | dailyCapAiba 1M, dailyCapNeur 10M; per-arena maps                                                 |
| **Reward formula** | `backend/routes/battle.js`                               | score × baseRewardAibaPerScore (2) × mode.multiplier × boost                                      |
| **Referrals**      | `backend/routes/referrals.js`                            | Tiered: 10th=2×, 100th=5×; NEUR + AIBA to referrer/referee                                        |
| **Racing**         | `carRacing.js`, `bikeRacing.js`                          | Entry fee AIBA → pool; 3% fee; position bonus (1.5×→0.5×)                                         |
| **Marketplace**    | `marketplace.js`                                         | 3% fee → token splits (Burn 15%, Treasury 25%, Rewards 50%, Staking 10%)                          |
| **Asset fees**     | `assets.js`, `assetMarketplace.js`                       | Mint 100 AIBA, upgrade 50 AIBA → computeTokenSplits                                               |
| **TON streams**    | `.env.example`, routes                                   | 11 wallets: broker, boost, guild, gifts, stars, car, bike, university                             |
| **Staking**        | EconomyConfig                                            | stakingApyPercent 15; nftStakingApyPercent 12                                                     |
| **Share**          | `miniapp/src/lib/telegram.js`                            | shareViaTelegram() → t.me/share/url                                                               |
| **Trainers**       | `backend/routes/trainers.js`, `miniapp/src/app/trainer/` | Global network, dashboard, leaderboard; 5 AIBA/user, 20 AIBA/recruited trainer; viral recruitment |

---

## 1. Minting 1 Trillion AIBA Tokens

### 1.1 Current System

- **Contract:** `AibaToken` (Tact) — mintable by owner to any address (e.g. ArenaRewardVault)
- **Units:** MVP assumes 1 token = 1 smallest unit (no decimals). If you adopt 9 decimals (like many jettons), 1T display = `1e21` smallest units
- **Vault:** `ArenaRewardVault` receives minted AIBA; users claim via signed messages
- **Emission:** Off-chain `EconomyDay` caps (`dailyCapAiba`, `dailyCapAibaByArena`) limit how much AIBA is credited per day

### 1.2 Allocation Strategy (Example for 1T Supply)

| Bucket              | %   | Amount | Purpose                                      |
| ------------------- | --- | ------ | -------------------------------------------- |
| Vault (rewards)     | 40% | 400B   | Battle/racing/quest rewards; drip over years |
| Treasury            | 15% | 150B   | Ops, liquidity, buybacks                     |
| Staking rewards     | 20% | 200B   | APY pool; vested over time                   |
| Team/Advisors       | 10% | 100B   | Vesting (e.g. 4yr, 1yr cliff)                |
| Ecosystem/Liquidity | 10% | 100B   | CEX/DEX liquidity, partnerships              |
| Community/Airdrops  | 5%  | 50B    | Launch, referrals, campaigns                 |

### 1.3 Emission Schedule vs Caps

- **Daily cap today:** `dailyCapAiba` default 1M. At 1M/day → 400B takes ~1,100 days (~3 years)
- **For 1T:** Increase caps gradually or use time-based unlock (e.g. 400B vault = 2M/day for ~550 days)
- **Anti-inflation:** Burns (marketplace fees, asset fees) and staking locks reduce circulating supply

### 1.4 Technical Steps

1. **Deploy/migrate** AibaToken with 1T or phased mints
2. **Mint to Vault:** `scripts/mintAibaToVault.ts` — amount in smallest units (1T = `1e12` if 1:1)
3. **Adjust EconomyConfig:**
    - `dailyCapAiba` — tune for target emission curve
    - `baseRewardAibaPerScore` — keep low early; increase as adoption grows
4. **Decimal policy:** Decide 1:1 vs 9 decimals early; affects all UI and contract calls

### 1.5 Risks

| Risk           | Mitigation                                                                               |
| -------------- | ---------------------------------------------------------------------------------------- |
| Hyperinflation | Strict daily caps; aggressive burns; long vesting                                        |
| Vault drain    | Monitor claim rate; top up periodically from treasury mint                               |
| Regulatory     | Structure team/treasury vesting; avoid "security" classification in target jurisdictions |

---

## 2. How to Make the Game Go Viral

### 2.1 Current Viral Mechanics (In Codebase)

| Mechanic            | Status | Location                                            |
| ------------------- | ------ | --------------------------------------------------- |
| Referrals           | ✅     | `referrals.js`; NEUR/AIBA; tiered 10th=2×, 100th=5× |
| Share after battle  | ✅     | `shareViaTelegram()`; t.me/share/url                |
| Share referral link | ✅     | Share via Telegram button on Referrals tab          |
| Leaderboard         | ✅     | Global + per-arena; badges for top players          |
| Guilds              | ✅     | Guild wars; 20% NEUR to guild vault                 |
| Gifts               | ✅     | Pay TON to send gift; recipient notified            |
| Top referrers       | ✅     | `/api/referrals/top`; milestone hints in UI         |

### 2.2 Amplification Strategies

#### A. Referral Loop (Partially Implemented)

- **Done:** Tiered rewards (10th=2×, 100th=5×); Share via Telegram; milestone display
- **Next:**
    - Referral leaderboard with exclusive badges/NFTs
    - "Invite 3 to unlock X" — gated content (e.g. premium arena)
    - Influencer codes; UTM tracking on ref links

#### B. Telegram-Native Virality

- **Mini App discovery:** Telegram’s bot menu, trending, channels
- **Built-in sharing:** `WebApp.share()` — "I just won 50 AIBA!"
- **Bot commands:** `/start ref=CODE` — deep links from ads/channels
- **Notifications:** Battle win push; "Your friend just joined" — both drive re-engagement

#### C. Social Proof & FOMO

- **Live leaderboard:** Real-time rank changes
- **"X players online"** — activity indicator
- **Limited-time arenas/events** — seasonal modes, double rewards
- **Exclusive items:** First 1000 mint, time-limited badges

#### D. Gamification Loops

- **Streaks:** Daily login, battle streaks; multipliers
- **Achievements:** "10 battles in 1 day" → badge + AIBA
- **Seasonal leagues:** Reset + rewards; fresh competition
- **Guild wars events:** Weekend tournaments; winner takes pool

#### E. Content & Community

- **Tutorial/share flow:** "Watch 30s ad or invite 1 friend to skip"
- **Influencer codes:** Custom referral codes for partners
- **Meme/telegram stickers:** Brand assets for organic sharing

### 2.3 Viral K-Factor Estimation

- **K = i × c** where i = invites per user, c = conversion rate
- **Target:** K > 0.3 for sustainable virality
- **Example:** 1 user invites 3 (i=3); 15% convert (c=0.15) → K = 0.45
- **Measurement:** Track `referrals/use` per user; cohort conversion; time-to-first-invite

---

## 3. A. Users → Billions: How Players Earn

### 3A.1 User Earning Paths (From Codebase)

| Path                    | Source                    | Formula / Amount                                       | Config                           |
| ----------------------- | ------------------------- | ------------------------------------------------------ | -------------------------------- |
| **Battles**             | Battle win                | score × 2 (baseRewardAibaPerScore) × mode.mult × boost | EconomyConfig                    |
| **Referrals**           | Per referee               | Referrer: 10 AIBA base; 2× at 10 refs; 5× at 100       | referralRewardAibaReferrer       |
| **Referrals (referee)** | Apply code                | 5 AIBA base; 1.5× at 10; 2× at 100                     | referralRewardAibaReferee        |
| **NEUR**                | Battles, referrals, daily | score × baseRewardNeurPerScore; 250/150 ref; 50 daily  | —                                |
| **Racing**              | Car/Bike race             | Pool × positionBonus / N; 3% fee; entry 10 AIBA        | carEntryFeeAiba, carRacingFeeBps |
| **Staking**             | Lock AIBA                 | 15% APY (stakingApyPercent)                            | EconomyConfig                    |
| **NFT staking**         | Stake Broker NFT          | 12% APY; 5 AIBA/day (nftStakingRewardPerDayAiba)       | EconomyConfig                    |
| **Missions**            | Complete mission          | rewardAiba, rewardNeur (admin-set)                     | Mission model                    |
| **Tasks**               | Complete task             | rewardAiba, rewardNeur (admin-set)                     | Task model                       |
| **Marketplace**         | Sell broker/car/bike      | price − 3% fee; seller receives 97%                    | marketplaceFeeBps                |

### 3A.2 User Earning Scenarios (Illustrative)

Assume AIBA = $0.001 for conservative; $0.01 for bullish.

| User Type                 | Monthly Activity          | AIBA Earned/mo       | @ $0.001 | @ $0.01 |
| ------------------------- | ------------------------- | -------------------- | -------- | ------- |
| Casual (3 battles/day)    | ~90 battles, avg score 80 | ~14,400 AIBA         | $14      | $144    |
| Active (10 battles/day)   | ~300 battles              | ~48,000 AIBA         | $48      | $480    |
| Referrer (5 refs/mo)      | 5 × 10 AIBA               | 50 AIBA              | $0.05    | $0.50   |
| Power referrer (50 refs)  | 50 × 20 (tiered avg)      | ~1,000 AIBA          | $1       | $10     |
| Top referrer (500 refs)   | 500 × 25 (5× tier)        | ~12,500 AIBA         | $12.50   | $125    |
| Staker (100k AIBA)        | 15% APY                   | ~1,250 AIBA/mo       | $1.25    | $12.50  |
| Racer (10 races, 50% win) | Entry 10 AIBA; win share  | Net positive if wins | varies   | varies  |
| Marketplace seller        | 5 brokers @ 1k AIBA       | 4,850 (after 3% fee) | $4.85    | $48.50  |

### 3A.3 Path to "Billions for Users" (Collectively)

- **Total user earnings** = sum of all AIBA/NEUR distributed (battles, referrals, racing, staking, missions, tasks).
- At **1M DAU**, 5 battles/user/day, avg 80 score → 1M × 30 × 5 × 80 × 2 = **24B AIBA/month** from battles alone (if cap allows).
- ** dailyCapAiba = 1M** → max 30M AIBA/month from battles (cap-limited).
- To reach **$1B total user earnings/year**:
    - Need ~1B AIBA distributed/year at $0.001 → **83M AIBA/month** → raise dailyCapAiba to ~2.7M+.
    - Or AIBA at $0.01 → **83M AIBA/month** at $0.01 = $830M/year; add referrals, racing, staking → **$1B+**.
- **Individual whales:** Top leaderboard players (10 battles/day, 100 score, 365 days) → 730k AIBA/year. At $0.01 = **$7,300/year**. With referrals (500) + staking + marketplace → **$10k–$50k+/year** for top 0.1%.

---

## 4. B. AIBA Token → Billions Market Cap

### 4B.1 Supply & FDV

- **Supply:** 1 trillion (1e12) AIBA
- **FDV** = Supply × Price

| AIBA Price | FDV   |
| ---------- | ----- |
| $0.0001    | $100M |
| $0.001     | $1B   |
| $0.01      | $10B  |
| $0.10      | $100B |

### 4B.2 Circulating Supply & Burns

- **Burns:** 15% of fee splits (marketplace, asset mint/upgrade) → reduces supply over time
- **Locked:** Staking (15% APY pool), team vesting, treasury → reduces effective circulating supply
- **Emission:** Vault drips → increases circulating supply until caps or allocation exhausted

**Net effect:** Early = inflation (emission > burns). Mature = deflation (burns + locks > emission) → upward price pressure.

### 4B.3 Path to $1B Market Cap

| Phase               | Circulating (est.) | Price Target | FDV   |
| ------------------- | ------------------ | ------------ | ----- |
| Launch              | 10B (1%)           | $0.0001      | $1M   |
| Traction (100k DAU) | 50B (5%)           | $0.0002      | $10M  |
| Growth (500k DAU)   | 100B (10%)         | $0.002       | $200M |
| Scale (2M DAU)      | 200B (20%)         | $0.005       | $1B   |
| Breakout (10M DAU)  | 400B (40%)         | $0.01        | $4B   |

**Drivers:** DAU growth, dailyCapAiba tune, burns from marketplace/asset fees, CEX/DEX listings, treasury buybacks.

### 4B.4 Risk Factors

- **Hyperinflation:** Too high dailyCapAiba → supply growth >> demand → price collapse
- **No product-market fit:** Low retention → no sustained demand
- **Regulatory:** Token classification may restrict liquidity/listing

---

## 5. C. Founders → Billions

### 5.1 Revenue Streams (From Codebase)

| Stream              | Type | Dest                        | Config                                                                    |
| ------------------- | ---- | --------------------------- | ------------------------------------------------------------------------- |
| Create broker (TON) | TON  | CREATED_BROKERS_WALLET      | createBrokerCostTonNano (1 TON default)                                   |
| Boost profile (TON) | TON  | BOOST_PROFILE_WALLET        | boostProfileCostTonNano                                                   |
| Gifts (TON)         | TON  | GIFTS_WALLET                | giftCostTonNano                                                           |
| Create guild (TON)  | TON  | LEADER_BOARD_WALLET         | createGroupCostTonNano                                                    |
| Boost guild (TON)   | TON  | BOOST_GROUP_WALLET          | boostGroupCostTonNano                                                     |
| Battle boost (TON)  | TON  | BOOST_TON_WALLET            | boostCostTonNano                                                          |
| Stars Store (TON)   | TON  | STARS_STORE_WALLET          | starsStorePackPriceTonNano                                                |
| Car create (TON)    | TON  | CAR_RACING_WALLET           | createCarCostTonNano                                                      |
| Bike create (TON)   | TON  | MOTORCYCLE_RACING_WALLET    | createBikeCostTonNano                                                     |
| Marketplace fee     | AIBA | Burn/Treasury/splits        | marketplaceFeeBps (3%)                                                    |
| Asset mint/upgrade  | AIBA | TreasuryOp (splits)         | tokenSplitTreasuryBps (25%)                                               |
| University badges   | TON  | UNIVERSITY_BADGE_TON_WALLET | 10 TON, 15 TON                                                            |
| Trainers (AIBA)     | AIBA | Ecosystem (claim-rewards)   | 5 AIBA per qualified referee, 20 AIBA per recruited trainer (on approval) |

**Token splits (EconomyConfig):** Burn 15%, Treasury 25%, Rewards 50%, Staking 10%. Treasury = founder-controlled if keys are held by team.

### 5.2 TON Revenue Model (Conservative)

Assume TON ≈ $5 (illustrative).

| Action           | Cost (TON) | Users Doing It | Monthly Revenue (USD) |
| ---------------- | ---------- | -------------- | --------------------- |
| Create broker    | 1          | 5% of DAU      | 0.05 × DAU × 1 × $5   |
| Boost profile    | 1          | 2%             | 0.02 × DAU × 1 × $5   |
| Gift             | 1          | 1%             | 0.01 × DAU × 1 × $5   |
| Create guild     | 1          | 0.5%           | 0.005 × DAU × 1 × $5  |
| Boost guild      | 1          | 1%             | 0.01 × DAU × 1 × $5   |
| Car/Bike create  | 1          | 3%             | 0.03 × DAU × 1 × $5   |
| University badge | 10–15      | 0.1%           | 0.001 × DAU × 12 × $5 |

**Blended:** ~0.1 TON/user/month from paying users → **0.1 × DAU × $5 = $0.5 × DAU** per month from TON.

### 5.3 AIBA Revenue Model (Treasury Share)

- Marketplace 3% fee → split via `tokenSplitTreasuryBps` (25% of fee to treasury)
- **Effective:** 3% × 25% = 0.75% of GMV to treasury
- If GMV = 100M AIBA/month and AIBA = $0.001 → $100k GMV → $750 to treasury
- At scale: 1B AIBA GMV, AIBA $0.01 → $10M GMV → $75k treasury/month

### 5.4 "Billions for Founders" Scenarios

**Scenario A: 1M DAU, $5 TON**

- TON: 0.1 × 1M × $5 = **$500k/month**
- Annual TON: **~$6M**
- To reach $1B from TON: need ~167× more → **~167M DAU** (or much higher ARPU)

**Scenario B: 10M DAU, $10 TON, 0.2 TON ARPU**

- TON: 0.2 × 10M × $10 = **$20M/month** = **$240M/year**
- Plus AIBA treasury (e.g. $50M/year from fees) → **~$290M/year**
- To reach $1B: ~3.5 years at that run rate, or 35M DAU

**Scenario C: 50M DAU, $15 TON, 0.3 TON ARPU**

- TON: 0.3 × 50M × $15 = **$225M/month** = **$2.7B/year**
- This scale implies viral success + strong retention + premium features

**Scenario D: Token Appreciation**

- If founders hold 10% of 1T AIBA (100B) and AIBA reaches $0.01 → **$1B** paper value
- At $0.001 → $100M. At $0.0001 → $10M
- Requires adoption, liquidity, and sustained demand

### 5.5 Levers to Maximize Founder Revenue

| Lever                | Action                                                            |
| -------------------- | ----------------------------------------------------------------- |
| **DAU**              | Referral + viral mechanics; Telegram ads; influencer partnerships |
| **ARPU**             | Premium arenas, battle boost, guild creation, car/bike creation   |
| **Retention**        | Streaks, seasons, guild loyalty, achievement hooks                |
| **TON price**        | Hedging; treasury diversification                                 |
| **Token allocation** | Team/treasury %; vesting schedule                                 |
| **New revenue**      | Ads (Telegram Ads, in-game), subscriptions, NFT royalties         |

### 5.6 Realistic Ranges

| Milestone      | DAU  | TON Revenue (est.) | AIBA Treasury (est.) | Timeframe |
| -------------- | ---- | ------------------ | -------------------- | --------- |
| Early traction | 10k  | $5k/mo             | $1k/mo               | 6–12 mo   |
| Growth         | 100k | $50k/mo            | $10k/mo              | 12–24 mo  |
| Scale          | 1M   | $500k/mo           | $100k/mo             | 24–36 mo  |
| Breakout       | 10M  | $5M/mo             | $1M/mo               | 36+ mo    |
| Billions       | 50M+ | $200M+/mo          | $50M+/mo             | 5+ years  |

**"Billions"** is achievable only at **tens of millions of DAU** and/or **large token appreciation** (founders holding a meaningful % of supply). The game has strong mechanics; execution on distribution and retention is the bottleneck.

---

## 6. Action Items

### For 1T Mint

1. [ ] Define allocation buckets and vesting
2. [ ] Set decimal policy (1:1 vs 9 decimals)
3. [ ] Size vault for 3–5 year emission; adjust `dailyCapAiba`
4. [ ] Deploy and mint; document in runbook

### For Viral Growth

1. [x] Implement tiered referral rewards (10th=2×, 100th=5×)
2. [x] Add referral leaderboard + exclusive badges (`/api/referrals/top`; top 3 styled in Referrals tab)
3. [x] Integrate `WebApp.share()` / shareViaTelegram post-battle + referral
4. [ ] Launch seasonal events / limited-time modes
5. [x] Track K-factor and cohort conversion (`GET /api/admin/referrals/metrics` — K estimate, avg refs, conversion hint)
6. [x] Invite 3 to unlock — 1% battle reward bonus when user has 3+ referrals; config `referralUnlock3BonusBps` (EconomyConfig)

### For Founder Revenue

1. [ ] Ensure all Super Admin wallets route to secure, founder-controlled addresses
2. [ ] Model ARPU by cohort; A/B test premium features
3. [ ] Plan token vesting (team, advisors) for legal/regulatory clarity
4. [ ] Consider treasury diversification (TON → stablecoins, etc.)

---

## 7. Related

- [INNOVATIONS-100X-ADVISORY.md](./INNOVATIONS-100X-ADVISORY.md) — Innovations for 100× (tournaments, streaks, creator economy, predict, subscription, rental, raid, breeding)
- [GAME-FUNCTIONALITY.md](./GAME-FUNCTIONALITY.md) — Battle engine, economy, API
- [TRAINERS-MANUAL.md](./TRAINERS-MANUAL.md) — Global trainers/coaches network, dashboard, leaderboard, viral recruitment, rewards
- [REPORTS-MONITORING.md](./REPORTS-MONITORING.md) — Cross-validation of all advisory and audit reports vs codebase

---

## 8. Disclaimer

This document is advisory. Revenue projections are illustrative and depend on market conditions, execution, competition, and regulation. Token economics and legal structure should be reviewed by qualified advisors. Past performance of similar projects does not guarantee future results.
