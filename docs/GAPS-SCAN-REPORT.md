# Gaps Scan Report — App & Docs

**Date:** 2026-02-15  
**Scope:** One full pass over app (miniapp + backend) and docs to record gaps; prioritised with recommended actions.

---

## 1. Summary

| Category               | Count | Priority focus                                                          |
| ---------------------- | ----- | ----------------------------------------------------------------------- |
| **Docs gaps**          | 15+   | Missing deep docs, GAME-FUNCTIONALITY §12 incomplete, README index      |
| **App–docs alignment** | 6     | API-CONTRACT vs GAME-FUNCTIONALITY, deployment doc duplication          |
| **App behaviour**      | 4     | Error/empty states, config-driven copy (already improved in SHIP-READY) |

Existing gap material: **GAP-AUDIT.md** (docs vs code), **SHIP-READY-GAP-CLOSURE.md** (implemented fixes). This report consolidates and extends that with a single scan artifact.

---

## 2. App Gaps

### 2.1 API coverage (backend vs frontend)

- **Verified:** All major tabs in `HomeContent.js` call APIs that exist in `backend/app.js` (battle, brokers, marketplace, car-racing, bike-racing, broker-rental, boosts, staking, dao, university, realms, missions, mentors, assets, asset-marketplace, governance, treasury, predict, trainers, referrals, vault, economy, guilds, charity, donate, daily, gifts, announcements, leaderboard, tasks, game-modes, ads).
- **Gap:** No automated test that asserts every `api.get`/`api.post` path used by the miniapp has a matching mounted route. Recommendation: add a small contract test (miniapp list of used paths vs backend router list).

### 2.2 Error and empty states

- **Addressed in SHIP-READY-GAP-CLOSURE:** Predict, staking, admin, miniapp idempotency and error handling.
- **Remaining:** Some flows may still show generic errors or blank content; worth a UX pass for "no brokers", "no listings", "race failed", "staking unavailable" etc. (P2).

### 2.3 Config-driven copy

- **Addressed:** MARKETPLACE_TAGLINE and other constants applied in miniapp; "Back to Home" on tabs and key pages.
- **Remaining:** Any feature that shows hardcoded "coming soon" or outdated text should eventually be driven by config or feature flags (P2).

---

## 3. Docs Gaps

### 3.1 Missing “deep” explanation docs

The following have **no** dedicated deep doc (cf. BROKERS, ARENAS, CAR-RACING, MARKETPLACE):

| Feature                        | In API-CONTRACT        | In GAME-FUNCTIONALITY | Deep doc    |
| ------------------------------ | ---------------------- | --------------------- | ----------- |
| Bike Racing                    | ✓ (car-racing sibling) | §12.3 (one line)      | **Missing** |
| AI Assets + Asset Marketplace  | ✓                      | §12.4 (one line)      | **Missing** |
| University                     | ✓                      | §12.4 (one line)      | **Missing** |
| Staking / Yield Vault          | ✓                      | §12.4 (one line)      | **Missing** |
| DAO / Governance               | ✓                      | §12.4 (one line)      | **Missing** |
| Realms / Missions / Mentors    | ✓                      | §12.4 (one line)      | **Missing** |
| Predict                        | ✓                      | Not in §12 table      | **Missing** |
| Trainers                       | ✓                      | Mentioned elsewhere   | **Missing** |
| Tournaments                    | ✓                      | Not in §12 table      | **Missing** |
| Global Boss                    | ✓                      | Not in §12 table      | **Missing** |
| Referrals                      | ✓                      | §12.4 (one line)      | **Missing** |
| Gifts / P2P AIBA               | ✓                      | §12.4 (one line)      | **Missing** |
| Donate (broker/car/bike/gifts) | ✓                      | Not in §12 table      | **Missing** |
| Multiverse / NFT               | ✓                      | §12.4 (one line)      | **Missing** |
| Premium                        | ✓                      | Not in §12 table      | **Missing** |
| Daily / Combo                  | ✓                      | §12.4 (one line)      | **Missing** |
| Ads                            | ✓ (or comms)           | Tasks/ads             | **Missing** |
| Broker Rental                  | ✓                      | Not in §12 table      | **Missing** |
| Breeding                       | ✓                      | Not in §12 table      | **Missing** |

**Recommendation (P1):** Add at least **Bike Racing** and **Broker Rental** deep docs (parity with Car Racing and Marketplace). Optionally add **Staking**, **DAO**, **Predict**, **Trainers** next.

### 3.2 GAME-FUNCTIONALITY.md §12 API mapping incomplete

- **§12.3** lists `/api/car-racing/*` and `/api/bike-racing/*` as "Mixed" with no per-endpoint list.
- **§12.4** does not explicitly list: `/api/broker-rental`, `/api/predict`, `/api/trainers`, `/api/tournaments`, `/api/global-boss`, `/api/donate`, `/api/premium`, `/api/p2p-aiba`, `/api/breeding`, `/api/game-modes`, `/api/treasury`, `/api/oracle`.

**Recommendation (P1):** Extend §12.3 with a short table of car-racing and bike-racing endpoints (from API-CONTRACT or routes). Extend §12.4 with a row per area: broker-rental, predict, trainers, tournaments, global-boss, donate, premium, p2p-aiba, breeding, game-modes, treasury, oracle.

### 3.3 USER-GUIDE.md

- **Covered:** Tabs, wallet, brokers, battles, marketplace, guilds, referrals, car/bike racing, university, charity, multiverse, staking, DAO, trainers, troubleshooting.
- **Gap:** Section 9 (Marketplace) could explicitly mention **Broker Rental** (list/rent/unlist) and **Donate** (broker/car/bike/gifts) flows; §16 Charity already covers in-app donate NEUR/AIBA.

**Recommendation (P2):** Add one short subsection or bullet for "Rent a broker" and "Donate broker/car/bike/gifts" in Marketplace or a dedicated "Donate (broker/car/bike)" subsection.

### 3.4 API-CONTRACT.md

- **Strong:** Core, Realms, Missions, Mentors, Guilds, Breeding, Assets, Marketplace, Staking, DAO, Treasury, Trainers, Oracle, P2P AIBA, Gifts, Donate, Announcements, Support, Predict, Broker Rental, Premium, Tournaments, Global Boss, Charity.
- **Gap (from GAP-AUDIT):** Trainer share-event, analytics, leaderboard period; optional extensions when productised.

**Recommendation (P2):** When adding trainer viral share or seasonal leaderboard, add the corresponding API to API-CONTRACT.

### 3.5 FEATURE-PLANS.md

- **GAP-AUDIT:** Platform extensibility (e.g. pluggable game modes) could be documented.
- **Recommendation (P2):** Short subsection on extensibility when prioritised.

### 3.6 README.md (docs index)

- **Gap:** The main doc table does not list the four deep docs: **BROKERS-DEEP-EXPLANATION.md**, **ARENAS-DEEP-EXPLANATION.md**, **CAR-RACING-DEEP-EXPLANATION.md**, **MARKETPLACE-DEEP-EXPLANATION.md**. They are discoverable only by filename search.

**Recommendation (P1):** Add a row or subsection "Deep feature docs" with links to these four (and future ones).

### 3.7 Deployment and env docs

- **DEPLOYMENT-AND-ENV.md:** Now the main deployment + env checklist (localhost, Vercel, Telegram, backend/miniapp/admin, security, mainnet).
- **Other files:** `deployment.md`, `VERCEL-ENV-GUIDE.md`, `VERCEL-DEPLOY-SETUP.md` may overlap and cause confusion.

**Recommendation (P2):** Prefer **DEPLOYMENT-AND-ENV.md** as canonical; add a line at the top of the others: "See DEPLOYMENT-AND-ENV.md for the full checklist," or merge and redirect.

### 3.8 Dates and freshness

- Several docs show "Feb 2025" or "2025"; one (HOLISTIC-ERRORS-INVESTIGATION) is 2026-02-15. No critical inconsistency; optional pass to add "Last updated" where missing (P2).

---

## 4. Prioritised action list

| Prio   | Action                                                                                                                                                                                             |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0** | None (no blocking gaps identified).                                                                                                                                                                |
| **P1** | Extend GAME-FUNCTIONALITY §12 with broker-rental, predict, trainers, tournaments, global-boss, donate, premium, p2p-aiba, breeding, game-modes, treasury, oracle; add car/bike per-endpoint lines. |
| **P1** | Add "Deep feature docs" to README.md linking BROKERS, ARENAS, CAR-RACING, MARKETPLACE (and future deep docs).                                                                                      |
| **P1** | Add BIKE-RACING-DEEP-EXPLANATION.md (and optionally BROKER-RENTAL-DEEP-EXPLANATION.md) for parity.                                                                                                 |
| **P2** | USER-GUIDE: explicit Broker Rental and Donate (broker/car/bike/gifts) in Marketplace or dedicated subsection.                                                                                      |
| **P2** | Canonical deployment doc: DEPLOYMENT-AND-ENV.md; point other deployment/vercel docs to it.                                                                                                         |
| **P2** | Optional: contract test miniapp API paths vs backend routes.                                                                                                                                       |
| **P2** | Optional: UX pass for error/empty states in key flows.                                                                                                                                             |

---

## 5. References

- **GAP-AUDIT.md** — Docs vs code audit (privacy, terms, ads, brokers/cars/bikes, API, feature plans, runbooks).
- **SHIP-READY-GAP-CLOSURE.md** — Implemented fixes (predict, staking, admin, miniapp).
- **API-CONTRACT.md** — Full API specification (source of truth for endpoints).
- **GAME-FUNCTIONALITY.md** — Battle engine, economy, API mapping §12.
- **DOCS-STRUCTURE.md** — Markdown as source of truth; `print/` build.
