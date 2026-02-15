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

**Core:** Vehicles (RacingCar / RacingMotorcycle) with stats (top speed, acceleration, handling, durability). Races: N vehicles on a track; server simulates → finish order and times. Entry: pay AIBA (and/or TON). Leagues: Rookie, Pro, Elite. **Cars for sale / Bikes for sale:** Car Racing tab → Market flow (list your car, buy from players or system). Bike Racing tab → Market flow (list your bike, buy from players or system). System shop: buy cars/bikes for AIBA. Backend: `carRacing`, `bikeRacing` routes; `listings`, `list`, `buy-car`/`buy-bike`, `system-cars`/`system-bikes`, `buy-system-car`/`buy-system-bike`.

---

## 3. Charity ecosystem

**Vision:** Unified charity layer: one Charity tab and admin surface. Donate NEUR or AIBA to campaigns; optional TON. Transparency: donation ledger, campaign totals, donor count. Integrates with Treasury, DAO (e.g. charity_payout proposals), guilds (guild charity pool), marketplace (optional % to campaign).

**Campaign lifecycle:** Draft → Active → Ended → Funded → Disbursed. UI: glass cards, progress, cause tags. Backend: `charity` routes; campaigns, donations, leaderboard.

**User customization (donation form):** Max NEUR / Max AIBA buttons; balance line (Balance: X NEUR · Y AIBA); presets (+10, +50, +100, +500, +1000); optional message (max 500 chars); anonymous toggle.

---

## 4. Super Futuristic Unified Marketplace & payments

**Vision:** The **Super Futuristic Unified Marketplace** is one place for all trading: brokers, assets, rentals, system shop, and boosts. TON + AIBA only. TON = on-ramp (create broker, boost profile, gifts, groups, Stars Store, car/bike creation). AIBA = in-app value (marketplace, rewards, staking, governance). Super Admin: one env wallet per product (CREATED_BROKERS_WALLET, BOOST_PROFILE_WALLET, GIFTS_WALLET, etc.); costs in Economy config (1–10 TON clamped).

**Marketplace:** Global listings (brokers, system shop); sell/buy for AIBA; optional “donate % to charity” at list. Backend: `marketplace`, `starsStore`, `asset-marketplace`; system brokers/cars/bikes catalogs.

**Implemented — three core categories for sale:**

| Category | Where | List (sell) | Buy from players | Buy from system | Backend |
|----------|-------|-------------|------------------|-----------------|---------|
| **1. Brokers for sale** | Market tab → Trade | `POST /api/marketplace/list` | `POST /api/marketplace/buy` | `POST /api/marketplace/buy-system-broker` | `marketplace` + `systemShop` |
| **2. Cars for sale** | Car Racing tab → Market flow | `POST /api/car-racing/list` | `POST /api/car-racing/buy-car` | `POST /api/car-racing/buy-system-car` | `carRacing` + `systemShop` |
| **3. Bikes for sale** | Bike Racing tab → Market flow | `POST /api/bike-racing/list` | `POST /api/bike-racing/buy-bike` | `POST /api/bike-racing/buy-system-bike` | `bikeRacing` + `systemShop` |

System catalogs: `GET /api/marketplace/system-brokers`, `GET /api/car-racing/system-cars`, `GET /api/bike-racing/system-bikes`. Listings: `GET /api/marketplace/listings`, `GET /api/car-racing/listings`, `GET /api/bike-racing/listings`.

---

## 5. NFT Multiverse

**Vision:** Multiple universes (Broker, Arena Legend, Course Badge, Full Certificate, future Land/Art). Broker: mint with AIBA; on-chain NFT. Arena Legend: unlock (e.g. 100 wins), mint AIBA, stakable. Course/Full Certificate: TON mints. Benefits: users (ownership, staking, trading); AIBA (burns, fees); Super Admin (TON + fees). Backend: `multiverse`, mint jobs, staking.

---

## 6. Unified comms (announcements, status, FAQ) — Phases 1–4 done

**Vision:** One comms layer: in-app feed (announcements), Telegram push (battle win, optional broadcast), system status, in-app FAQ/support.

**Implemented:** Updates tab: announcements (`GET /api/announcements`, `POST /api/announcements/seen` for read/unread), status (`GET /api/comms/status`, `GET /api/comms/config`), FAQ block. **Phase 3:** read/unread via `lastSeenAnnouncementId`. **Phase 4:** in-app support form (`POST /api/support/request`); `supportLink`, `supportTelegramGroup` config. See [UNIFIED-COMMS-ECOSYSTEM.md](UNIFIED-COMMS-ECOSYSTEM.md).

---

## 7. AI learning multiverse / economy (token flow)

**Vision:** AIBA flows: users acquire (rewards, missions, asset sales) → spend (realms, mentors, assets) → split to burn, treasury, reward pools, staking. Micro loops: asset economy (mint → list → buy → fee → upgrade); arena (entry fee → prize pool → winners). Balancing: caps, fee %, burn %. Aligns with governance, mentors, leagues. See backend economy engine and ledger.
