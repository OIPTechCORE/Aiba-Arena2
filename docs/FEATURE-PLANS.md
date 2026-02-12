# Feature plans — University, racing, charity, marketplace, multiverse, comms, economy

Single reference for major feature plans. Each section summarizes vision and key design; full detail lives in the original plan docs or in code.

---

## 1. AIBA Arena University

**Vision:** One learning hub in the miniapp: courses, modules, best practices, optional certifications. Glass-and-glow UX.

**Structure:** University tab → Courses (e.g. Getting Started, Arenas & Modes, Economy, Guilds & Social, Pro Tips) → Modules (expandable lessons). Backend: `GET /api/university/courses`; progress and optional “Graduate” badge.

**Content outline:** Getting Started (what is Arena, brokers, first battle, wallet); Arenas (prediction, simulation, leagues, Guild Wars); Economy (NEUR, AIBA, Stars & Diamonds, staking); Guilds (create/join, rewards, leaderboard); Pro Tips (energy, stake/mint, Wall of Fame).

---

## 2. Autonomous racing (car & motorcycle)

**Vision:** Two verticals — Autonomous Car Racing and Motorcycle Racing. AI-driven vehicles; server-authoritative deterministic races; rewards in AIBA. TON for creation/entry/premium; AIBA for rewards, fees, marketplace.

**Core:** Vehicles (RacingCar / RacingMotorcycle) with stats (top speed, acceleration, handling, durability). Races: N vehicles on a track; server simulates → finish order and times. Entry: pay AIBA (and/or TON). Leagues: Rookie, Pro, Elite. System shop: buy cars/bikes for AIBA. Backend: `carRacing`, `bikeRacing` routes; system catalogs and buy endpoints.

---

## 3. Charity ecosystem

**Vision:** Unified charity layer: one Charity tab and admin surface. Donate NEUR or AIBA to campaigns; optional TON. Transparency: donation ledger, campaign totals, donor count. Integrates with Treasury, DAO (e.g. charity_payout proposals), guilds (guild charity pool), marketplace (optional % to campaign).

**Campaign lifecycle:** Draft → Active → Ended → Funded → Disbursed. UI: glass cards, progress, cause tags. Backend: `charity` routes; campaigns, donations, leaderboard.

---

## 4. Marketplace & payments

**Vision:** TON + AIBA only. TON = on-ramp (create broker, boost profile, gifts, groups, Stars Store, car/bike creation). AIBA = in-app value (marketplace, rewards, staking, governance). Super Admin: one env wallet per product (CREATED_BROKERS_WALLET, BOOST_PROFILE_WALLET, GIFTS_WALLET, etc.); costs in Economy config (1–10 TON clamped).

**Marketplace:** Global listings (brokers, system shop); sell/buy for AIBA; optional “donate % to charity” at list. Backend: `marketplace`, `starsStore`; system brokers/cars/bikes catalogs.

---

## 5. NFT Multiverse

**Vision:** Multiple universes (Broker, Arena Legend, Course Badge, Full Certificate, future Land/Art). Broker: mint with AIBA; on-chain NFT. Arena Legend: unlock (e.g. 100 wins), mint AIBA, stakable. Course/Full Certificate: TON mints. Benefits: users (ownership, staking, trading); AIBA (burns, fees); Super Admin (TON + fees). Backend: `multiverse`, mint jobs, staking.

---

## 6. Unified comms (announcements, status, FAQ)

**Vision:** One comms layer: in-app feed (announcements), Telegram push (battle win, optional broadcast), system status, in-app FAQ/support. Updates tab: announcements (`GET /api/announcements`), status (`GET /api/comms/status`), FAQ block. Backend: `announcements`, `comms/status`; optional support link.

---

## 7. AI learning multiverse / economy (token flow)

**Vision:** AIBA flows: users acquire (rewards, missions, asset sales) → spend (realms, mentors, assets) → split to burn, treasury, reward pools, staking. Micro loops: asset economy (mint → list → buy → fee → upgrade); arena (entry fee → prize pool → winners). Balancing: caps, fee %, burn %. Aligns with governance, mentors, leagues. See backend economy engine and ledger.
