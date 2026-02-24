# Automated Testing — AIBA Arena

This document describes how to run **deep automated tests** so every part of the app is verified before release. No user should find a broken button or non-functioning feature.

---

## 1. Backend tests

All backend tests use Node’s built-in test runner (`node --test`).

### 1.1 Unit tests (no database)

Engine, utilities, and security logic:

```bash
cd backend
npm run test:unit
```

This runs everything under `backend/tests/` (battle engine, economy window, idempotency, rate limit, telegram policy, etc.).

### 1.2 API tests (no database)

Health, catalogs, university, auth, and validation. **No MongoDB required.**

```bash
cd backend
npm run test:api
```

Covers:

- **Health:** `GET /health`, `GET /api/comms/status`, `GET /metrics`
- **Catalogs:** `GET /api/marketplace/system-brokers`, `GET /api/car-racing/system-cars`, `GET /api/bike-racing/system-bikes`
- **University:** `GET /api/university/courses`
- **Auth:** `GET/POST /api/brokers/*` without auth → 401
- **Validation:** invalid body for buy-system-broker, referrals/use → 400/422

### 1.3 API integration tests (with in-memory MongoDB)

Full flows: create broker, economy/me, referrals, daily, leaderboard, marketplace listings, car/bike racing, university progress, announcements.

**Requires:** `mongodb-memory-server` (install with `npm install -D mongodb-memory-server` in `backend`).

```bash
cd backend
npm install -D mongodb-memory-server
npm run test:api:integration
```

If `mongodb-memory-server` is not installed, integration tests are skipped without failing.

### 1.4 Run all backend tests

```bash
cd backend
npm test
```

This runs the default `node --test` (all `*.test.js` under `backend/tests/`).

---

## 2. Miniapp (frontend)

### 2.1 Build test

Ensures the miniapp compiles and has no build-time errors:

```bash
cd miniapp
npm run build
```

Add this to CI so broken imports or syntax are caught.

### 2.2 Manual / E2E (optional)

For full “click every button” coverage, run the app locally and use:

- **Miniapp:** `http://localhost:3000` (after `npm run dev` in `miniapp`)
- **Backend:** `http://localhost:5000` (after `npm start` in `backend`)

Set `NEXT_PUBLIC_BACKEND_URL=http://localhost:5000` and `APP_ENV=dev` for local backend.

---

## 3. Contracts (Blueprint / Jest)

From repo root:

```bash
npm test
```

This builds contracts and runs Jest tests in `tests/*.spec.ts`.

---

## 4. Recommended CI pipeline

1. **Backend**
    - `cd backend && npm run test:unit`
    - `cd backend && npm run test:api`
    - (Optional) `cd backend && npm run test:api:integration` (with `mongodb-memory-server` installed)
2. **Miniapp**
    - `cd miniapp && npm run build`
3. **Contracts**
    - `npm run build:contracts && jest --verbose` (from root)

---

## 5. What each test file covers

| File                                    | Purpose                                                                                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `backend/tests/api/health.test.js`      | Health, comms status, metrics                                                                                                |
| `backend/tests/api/catalog.test.js`     | System shop catalogs (brokers, cars, bikes)                                                                                  |
| `backend/tests/api/university.test.js`  | University courses endpoint                                                                                                  |
| `backend/tests/api/auth.test.js`        | 401 when auth missing on protected routes                                                                                    |
| `backend/tests/api/validation.test.js`  | 400/422 for invalid request bodies                                                                                           |
| `backend/tests/api/integration.test.js` | Full API with DB: brokers, economy, referrals, daily, leaderboard, marketplace, car/bike, university progress, announcements |
| `backend/tests/battleEngine.test.js`    | Battle simulation logic                                                                                                      |
| `backend/tests/economyWindow.test.js`   | Economy window logic                                                                                                         |
| … (other engine/unit tests)             | Idempotency, rate limit, telegram policy, etc.                                                                               |

---

## 6. Adding new tests

- **New API route:** Add a case in `backend/tests/api/` (no-DB in health/catalog/university/auth/validation, or in integration.test.js if it needs DB).
- **New engine/utility:** Add `backend/tests/<name>.test.js` and use `node:test` + `node:assert/strict`.
- **New miniapp page/flow:** Ensure `miniapp` build still passes; add E2E later if needed.

Running these tests before every release keeps the game reliable for the community.

---

## 7. Extended test plan (Realms, Assets, Governance, etc.)

**Scope:** Realms, Missions, Mentors, Assets, Asset Marketplace, Governance, Treasury Ops.

### Backend API checks

- `GET /api/realms` — list (seeded or empty)
- `GET /api/missions?realmKey=...` — missions
- `POST /api/missions/complete` — rewards AIBA/NEUR
- `GET /api/mentors`, `POST /api/mentors/assign`
- `POST /api/assets/mint`, `POST /api/assets/upgrade`, `GET /api/assets/mine`
- `POST /api/asset-marketplace/list`, `buy`, `rent`
- `GET /api/governance/proposals`, `POST /api/governance/propose`, `POST /api/governance/vote`
- `GET /api/treasury/ops` — burn/treasury/rewards/staking ledger

### Miniapp UX checks

- Tabs: Realms, Assets, Governance present
- Realms: realm select, mission list, complete mission updates balances
- Mentors: assign mentor, status message updates
- Assets: mint, upgrade, list, buy, rent flows
- Governance: propose and vote flows

### Admin checks

- Realms tab: create/update realm, list view
- Marketplace tab: metrics load
- Treasury Ops tab: metrics load

### Contracts

- Build: `npm run build`; tests: `npm test` (AiAssetRegistry, AiAssetMarketplaceEscrow, etc.)
