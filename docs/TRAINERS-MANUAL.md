# AIBA Arena — Trainers Manual

## Deepest, Holistic, Exhaustive & Systematic Guide for Trainers & Influencers

**Version:** 1.0  
**Scope:** Train new users, ambassadors, community managers, and influencers. Nothing omitted.

---

## Table of Contents

1. [Introduction & Philosophy](#1-introduction--philosophy)
2. [Product Deep Dive](#2-product-deep-dive)
3. [User Journeys (Step-by-Step)](#3-user-journeys-step-by-step)
4. [Features Checklist (Everything)](#4-features-checklist-everything)
5. [Economy & Rewards (Complete)](#5-economy--rewards-complete)
6. [Referral & Viral Mechanics](#6-referral--viral-mechanics)
7. [Common Questions & Answers](#7-common-questions--answers)
8. [Objection Handling](#8-objection-handling)
9. [Influencer Categories & Tailoring](#9-influencer-categories--tailoring)
10. [Do's and Don'ts](#10-dos-and-donts)
11. [Scripts & Talking Points](#11-scripts--talking-points)
12. [Quick Reference Card](#12-quick-reference-card)

---

## 1. Introduction & Philosophy

### 1.0 Trainer Portal (Digital Access)

- **URL:** https://aiba-arena2-miniapp.vercel.app/trainer
- **Global Trainers Network** — Browse all approved trainers worldwide (public, no login required). Sort by impact, referred, recruited, rewards. Connect via "Apply with CODE" links.
- **Global Trainers Leaderboard** — Rank trainers by impact, referred, recruited, or rewards (public). Top trainers highlighted.
- **Trainer Dashboard** — Approved trainers only: profile editor (displayName, bio, specialty, region), impact stats, claim rewards, viral recruitment link.
- Apply to become a trainer (Telegram auth). Viral recruitment: share your link — others apply with `?ref=YOUR_CODE`; you earn when they get approved.
- Rewards: 5 AIBA per referred user (3+ battles); 20 AIBA per trainer you recruit (on approval). Config: `trainerRewardAibaPerUser`, `trainerRewardAibaPerRecruitedTrainer`. Claim from portal.
- Super Admin approves trainers at /admin. API: `GET /api/trainers/me`, `network`, `leaderboard`; `PATCH /profile`; `POST /apply`, `claim-rewards`, `register-use`.

### 1.1 What is AIBA Arena?

AIBA Arena is a **Telegram Mini App** where users:

- Own **AI brokers** (trading agents with stats: INT, SPD, RISK)
- Compete in **arenas** (prediction, simulation, strategy wars, arbitrage, guild wars)
- Earn **NEUR** (in-game fuel) and **AIBA** (rewards token, withdrawable on TON)
- Join **guilds**, race cars/bikes, stake NFTs, participate in tournaments & global boss raids

### 1.2 Core Value Propositions

- **Play-to-earn** — Battles, referrals, staking, racing, marketplace
- **Telegram-native** — No app store; instant access
- **TON ecosystem** — AIBA on-chain, TON for premium actions
- **Social & viral** — Referrals, guilds, leaderboards, share after battle

### 1.3 Trainer Mindset

- **Simplify first** — "Pick broker → run battle → earn" before diving into economy
- **Show, don't tell** — Demo in-app if possible
- **Match audience** — Crypto natives vs casual gamers need different angles

---

## 2. Product Deep Dive

### 2.1 Brokers

| Concept     | Explanation                                                       |
| ----------- | ----------------------------------------------------------------- |
| **What**    | AI agents with INT, SPD, RISK (0–100 each)                        |
| **Create**  | Starter (free), or TON/AIBA for more                              |
| **Actions** | Combine (merge stats), mint NFT, list on market, deposit to guild |
| **Energy**  | 10 per broker; spent per battle; regenerates over time            |

### 2.2 Arenas

| Arena             | Focus          | Best For                        |
| ----------------- | -------------- | ------------------------------- |
| **Prediction**    | INT-weighted   | High-INT brokers                |
| **Simulation**    | SPD-weighted   | High-SPD brokers                |
| **Strategy Wars** | INT + SPD      | Balanced                        |
| **Arbitrage**     | Mixed          | Risk-takers                     |
| **Guild Wars**    | Guild vs guild | Guild members; rewards to guild |

### 2.3 Leagues

Rookie → Pro → Elite. Higher leagues = better rewards and stricter entry.

### 2.4 Rewards

- **NEUR** — Off-chain; used for train, combine, repairs
- **AIBA** — Off-chain credits → claim on-chain to TON wallet
- **Stars** — Telegram-style in-app; earned per battle
- **Diamonds** — Rare; first win bonus

---

## 3. User Journeys (Step-by-Step)

### 3.1 First-Time User (0–5 min)

1. Open Telegram → tap bot / link
2. See cinematic intro (skip OK)
3. **Home** tab: see balances (0), grid of features
4. **Brokers** → "New broker" (free starter)
5. **Arenas** or **Brokers** → Pick arena → **Run battle**
6. See victory card: Score, AIBA, Stars
7. Repeat battles; watch balances grow

### 3.2 Power User (Day 1–7)

1. Claim **daily reward** (NEUR)
2. Use **referrals** → share link, earn when friends join
3. **Combine** brokers to improve stats
4. **Market** → list/buy brokers
5. **Guilds** → create or join; Guild Wars
6. **Wallet** → connect TON, claim AIBA on-chain

### 3.3 Advanced (Week 2+)

1. **Tournaments** — pay AIBA to enter; top 4 share pool
2. **Global Boss** — run battles to deal damage; share reward when defeated
3. **Broker Rental** — list or rent brokers
4. **Breeding** — combine 2 brokers → 1 (cost 200 AIBA)
5. **Premium** — pay TON for 2× battle rewards
6. **Streaks & Daily Combo** — login/battle streaks; spend AIBA for combo bonus

---

## 4. Features Checklist (Everything)

| Feature     | Tab         | One-Line                                                                           |
| ----------- | ----------- | ---------------------------------------------------------------------------------- |
| Brokers     | Brokers     | Create, combine, mint NFT                                                          |
| Arenas      | Arenas      | 5 modes; run battle                                                                |
| Market      | Market      | List/buy brokers, Stars Store, rental                                              |
| Referrals   | Referrals   | Share link; tiered rewards (10=2×, 100=5×)                                         |
| Guilds      | Guilds      | Create, join, Guild Wars                                                           |
| Tournaments | Tournaments | Enter with broker; prize pool                                                      |
| Global Boss | Global Boss | Community raid; damage = score                                                     |
| Car Racing  | Car Racing  | Create/buy car; enter races                                                        |
| Bike Racing | Bike Racing | Create/buy bike; enter races                                                       |
| Tasks       | Tasks       | Personalized missions; rewards                                                     |
| Leaderboard | Leaderboard | By score, AIBA, NEUR, battles                                                      |
| University  | University  | Guide courses; badges                                                              |
| Charity     | Charity     | Donate NEUR/AIBA                                                                   |
| Wallet      | Wallet      | NEUR, AIBA, Stars, Diamonds, daily, staking, DAO, vault                            |
| Updates     | Updates     | News, FAQs                                                                         |
| Trainers    | /trainer    | Network, leaderboard, dashboard; viral recruitment; 5 AIBA/user, 20 AIBA/recruited |

---

## 5. Economy & Rewards (Complete)

### 5.1 Earning Paths

| Path                | Typical Amount                                     |
| ------------------- | -------------------------------------------------- |
| Battle win          | score × 2 AIBA (base) × mode mult × streak/premium |
| Daily claim         | NEUR (config)                                      |
| Referral (referrer) | 10 AIBA base; 2× at 10 refs; 5× at 100             |
| Referral (referee)  | 5 AIBA base                                        |
| Staking             | 15% APY on AIBA                                    |
| NFT staking         | 12% APY; 5 AIBA/day                                |
| Marketplace sell    | 97% of sale (3% fee)                               |
| Tournament top 4    | Share of pool                                      |
| Global Boss         | Proportional to damage when boss falls             |

### 5.2 Spending

| Action              | Cost                        |
| ------------------- | --------------------------- |
| Combine brokers     | 50 NEUR                     |
| Mint broker NFT     | 100 AIBA                    |
| Create broker (TON) | 1 TON (config)              |
| Premium             | ~5 TON (config) for 30 days |
| Breed               | 200 AIBA                    |
| Create guild        | TON if not top leaderboard  |
| Car/Bike create     | TON or AIBA                 |

---

## 6. Referral & Viral Mechanics

### 6.1 Referral Loop

- Share link → friend opens → applies code (or auto on signup)
- Both get bonuses (NEUR + AIBA)
- **Tiered:** 10 refs = 2× bonus; 100 refs = 5×
- **Invite 3 to unlock** — premium arena perks

### 6.2 Share Triggers

- After battle win — "Share my score"
- Referrals tab — "Share via Telegram"
- Copy link / copy message

### 6.3 K-Factor

- K = invites × conversion rate
- Target K > 0.3 for viral growth
- Example: 3 invites × 15% convert = 0.45

---

## 7. Common Questions & Answers

**Q: Is AIBA a real token?**  
A: Yes. AIBA is a TON Jetton. You earn credits in-app and claim them on-chain to your wallet.

**Q: Do I need a wallet to play?**  
A: No for playing. Yes for withdrawing AIBA on-chain.

**Q: What are NEUR and AIBA?**  
A: NEUR = in-game fuel (train, combine). AIBA = rewards token (withdrawable).

**Q: How do I get my first broker?**  
A: Brokers tab → "New broker" (free starter).

**Q: What’s the best arena?**  
A: Depends on broker stats. High INT → prediction; high SPD → simulation.

**Q: How do I earn more?**  
A: Battles, referrals, daily claim, staking, tournaments, Global Boss, marketplace.

**Q: Are there 3D arenas?**  
A: Arena modes exist. 3D visualization is planned; currently battles show score/rewards.

---

## 8. Objection Handling

| Objection                   | Response                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------- |
| "Seems complicated"         | "Core loop is simple: create broker → run battle → earn. Everything else is optional." |
| "I don't understand crypto" | "You can play without a wallet. Connect when you want to withdraw."                    |
| "Is it a scam?"             | "Open-source, on TON. You earn in-app and withdraw to your own wallet."                |
| "I have no time"            | "One battle = 10 seconds. Daily claim + a few battles = 2 min/day."                    |
| "What if I lose?"           | "You still earn NEUR/AIBA on wins. Losses don't cost; energy regenerates."             |

---

## 9. Influencer Categories & Tailoring

| Category              | Angle                               | Key Message                                                          |
| --------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| **Crypto / DeFi**     | Play-to-earn, TON, on-chain rewards | "Earn AIBA, withdraw to TON. Real token, real rewards."              |
| **Gaming**            | Battles, progression, guilds        | "AI brokers in battle arenas. Guild wars, tournaments, global boss." |
| **Trading / Finance** | Simulated trading, arbitrage arena  | "Train AI brokers. Prediction, arbitrage, strategy wars."            |
| **Casual / Viral**    | Simple fun, referrals, share        | "Play in Telegram. Share, invite friends, earn together."            |
| **NFT / Collectors**  | Mint brokers, stake NFTs            | "Own broker NFTs. Stake to earn AIBA daily."                         |
| **Community / DAO**   | Guilds, governance, charity         | "Create guilds, vote on proposals, donate to causes."                |

---

## 10. Do's and Don'ts

### Do

- Start with "pick broker → run battle → earn"
- Emphasize Telegram convenience (no app store)
- Show referral link and tiered bonuses
- Mention TON and on-chain withdrawal
- Tailor message to audience (gamer vs crypto)

### Don't

- Over-promise returns
- Call it "investment" (it's a game with rewards)
- Skip the free starter broker step
- Ignore guilds / tournaments / global boss for engaged users

---

## 11. Scripts & Talking Points

### 30-Second Pitch

> "AIBA Arena is a Telegram game where you own AI brokers that compete in battles. Run a battle, earn NEUR and AIBA. AIBA is a real token on TON — withdraw to your wallet. Refer friends for bonuses. It's play-to-earn, simple, and all inside Telegram."

### 60-Second Pitch

> "AIBA Arena runs inside Telegram — no app store. You create or buy AI brokers with stats like intelligence, speed, risk. They compete in arenas: prediction, simulation, arbitrage, guild wars. Each battle earns you NEUR and AIBA. NEUR is in-game fuel; AIBA is the rewards token you can withdraw on-chain to your TON wallet. There are guilds, car and bike racing, tournaments, a global boss raid, and referrals — invite friends, get 2× at 10 refs and 5× at 100. Daily rewards, staking, and a marketplace round it out. Everything in one Telegram Mini App."

### One-Liner Options

- "Own AI brokers. Battle. Earn on TON."
- "Play-to-earn in Telegram. AI brokers, real rewards."
- "Battle arenas. Guild wars. AIBA on TON."

---

## 12. Quick Reference Card

| Item             | Value                               |
| ---------------- | ----------------------------------- |
| Platform         | Telegram Mini App                   |
| Chain            | TON                                 |
| Tokens           | NEUR (fuel), AIBA (rewards)         |
| First broker     | Free (Brokers → New broker)         |
| Core loop        | Broker → Arena → Battle → Earn      |
| Withdraw         | Wallet → Vault → Claim (TonConnect) |
| Referral bonus   | 10 refs = 2×, 100 refs = 5×         |
| Invite to unlock | 3 refs = premium arena perks        |

---

---

## Related

- [ADVISORY-TOKENOMICS-VIRAL-FOUNDER-REVENUE.md](./ADVISORY-TOKENOMICS-VIRAL-FOUNDER-REVENUE.md) — Tokenomics, viral mechanics, founder revenue
- [REPORTS-MONITORING.md](./REPORTS-MONITORING.md) — Cross-validation of reports vs codebase
- [USER-GUIDE.md](./USER-GUIDE.md) — User flow, tabs, troubleshooting
- [API-AND-READINESS-AUDIT.md](./API-AND-READINESS-AUDIT.md) — API mapping (including trainers routes)
