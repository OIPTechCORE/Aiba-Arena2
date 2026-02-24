# Gap Audit — Docs vs Code

**Purpose:** Deep investigation to identify gaps between documentation and implementation, and missing or incomplete features.

**Last updated:** Feb 2025

---

## 1. Summary

| Area                                 | Status         | Gaps / Notes                                                                                                                     |
| ------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Privacy/Terms first-open popup       | ✅ Implemented | Miniapp: LegalConsent on first open; footer links                                                                                |
| Privacy & Terms links                | ✅ Implemented | In-app at `/privacy`, `/terms`; Settings; app footer                                                                             |
| Ads section                          | ✅ Present     | Backend: `GET /api/ads`, admin: Ads tab; miniapp: between-battles placement                                                      |
| Brokers / Cars / Bikes (user buy)    | ✅ Present     | Brokers: create, marketplace list/buy, system shop. Cars/Bikes: car-racing, bike-racing routes; list, buy from players or system |
| “What is AIBA Arena” deep doc        | ✅ Added       | `WHAT-IS-AIBA-ARENA.md` — high-level explainer                                                                                   |
| Platform extensibility (other games) | ✅ Implemented | `EXTERNAL_APPS` in `miniapp/src/config/navigation.js`; “More games” tab                                                          |
| Docs vs code alignment               | See below      | API contract, feature plans, and runbooks largely match; a few doc-only or code-only items                                       |

---

## 2. Ads Section

- **Backend:** `routes/ads.js` — `GET /api/ads?placement=...` (e.g. `between_battles`).
- **Admin:** `routes/adminAds.js` — CRUD ads; admin panel has “Ads” tab (create, toggle active, refresh).
- **Miniapp:** `page.js` calls `/api/ads` with `placement: 'between_battles'`; ad state used in battle flow.
- **Gap:** None. Ads are implemented end-to-end. Ensure placement keys in docs match code if you document placements.

---

## 3. Brokers, Cars, Bikes — User Ownership & Marketplace

- **Brokers:** Users create (starter or TON), combine, list on marketplace, buy from players or system. Backend: `brokers.js`, `marketplace.js`, `adminBrokers.js`; models: `Broker.js`, `Listing.js`. System shop: `GET/POST` system-brokers.
- **Cars:** Users create (AIBA or TON), list, buy from players or system. Backend: `carRacing.js`; models: `RacingCar.js`, `CarListing.js`. System: `system-cars`, `buy-system-car`.
- **Bikes:** Same pattern. Backend: `bikeRacing.js`; models: `RacingMotorcycle.js`, `BikeListing.js`.
- **Gap:** None for core “own and buy” flow. Docs (FEATURE-PLANS, API-CONTRACT) already describe marketplace and system shop; ensure USER-GUIDE mentions Brokers / Car Racing / Bike Racing market flows.

---

## 4. Documentation vs Code — Detailed

### 4.1 API contract (API-CONTRACT.md)

- Core (economy, vault, wallet, battle), Realms, Missions, Mentors, Guilds, Assets, DAO, Staking, Treasury, Trainers, Predict, Announcements, Support, Comms, Ads — routes exist and match.
- **Gaps:** Minor: some optional query/body params may not be listed; new endpoints (e.g. trainer share-event, analytics) should be added to API-CONTRACT when stable.

### 4.2 Feature plans (FEATURE-PLANS.md)

- University, racing, charity, marketplace, multiverse, comms — implemented and aligned.
- **Gap:** “Platform extensibility” (other games hub) was not in FEATURE-PLANS; now implemented and documented in this audit and in navigation config comments.

### 4.3 Game functionality (GAME-FUNCTIONALITY.md)

- Core loop, brokers, battle, economy, arenas, racing, security, API mapping — accurate.
- **Gap:** Seasonal leaderboard (trainer weekly/monthly) and viral share tracking are in code but could be added as a short subsection under Trainers / Leaderboard.

### 4.4 Operations / runbooks

- OPERATIONS.md, runbook.md, BACKUP-RUNBOOK.md — procedural; no code dependency. Keep env and wallet references in sync with SUPER-ADMIN-WALLETS and backend `.env.example`.

### 4.5 User-facing legal

- PRIVACY-POLICY.md and TERMS-OF-SERVICE.md match in-app `/privacy` and `/terms` content intent. Miniapp now shows consent popup on first open and footer links on every page.

---

## 5. Recommended Next Steps

1. **API-CONTRACT:** Add Trainer `POST /share-event`, `GET /analytics`, and leaderboard `period` query when final.
2. **USER-GUIDE:** Add “Brokers / Cars / Bikes — buying and selling” and “More games” hub.
3. **FEATURE-PLANS:** Add one short subsection “Platform extensibility (other games)” referencing EXTERNAL_APPS and the “More games” tab.
4. **GAME-FUNCTIONALITY:** Add “Seasonal leaderboard (weekly/monthly)” and “Trainer viral share tracking” under relevant sections.
5. **Print/HTML:** Regenerate `docs/print/` from updated `.md` if you use the print pipeline.

---

## 6. Quick Reference — Key Files

| Topic              | Docs                                            | Code (key files)                                                   |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------------ |
| What is AIBA Arena | WHAT-IS-AIBA-ARENA.md                           | —                                                                  |
| Privacy/Terms      | PRIVACY-POLICY, TERMS-OF-SERVICE                | miniapp: LegalConsent.js, AppFooter.js, layout.js                  |
| Ads                | This audit, API if added                        | backend: ads.js, adminAds.js; miniapp: page.js (ads state)         |
| Brokers/Cars/Bikes | FEATURE-PLANS, API-CONTRACT, GAME-FUNCTIONALITY | brokers.js, carRacing.js, bikeRacing.js, marketplace.js            |
| Other games hub    | This audit, navigation.js comment               | miniapp: config/navigation.js (EXTERNAL_APPS), page.js (games tab) |
