# Ship-Ready Gap Closure — Implementation Summary

**Scope:** Backend (predict, adminPredict, staking, models), admin panel, miniapp, ops scripts.  
**Execution order:** Phase 1 → Phase 2 → Phase 3 (incremental, no broad refactors).

---

## Phase 1 (P0): Ship Blockers and Data Integrity

### Backend transaction safety

- **Predict bet (`backend/routes/predict.js`):**
  - Idempotency: `requestId` stored on `PredictBet`; at start of handler, if a bet with same `requestId` exists, return `201` with same payload.
  - Debit duplicate: if `debitAibaFromUser` returns `duplicate: true`, return `201` with same payload.
  - Bet create + pool update remain in a single Mongo transaction; `requestId` included in created bet.

- **Predict resolve (`backend/routes/adminPredict.js`):**
  - Atomic order: **transaction first** (event status → resolved + `TreasuryOp` create), **then** payouts (idempotent by `sourceId`). Payout failures are logged and rethrown (no silent swallow).
  - Fixed payout loop: `credited` is now assigned from `creditAibaNoCap` and checked; payout failure is logged with `eventId`, `betId`, `share`, `telegramId`.

- **Staking (`backend/routes/staking.js`):**
  - **Stake:** If `debitAibaFromUser` returns `duplicate: true`, return existing summary (no double-increment).
  - **Stake-locked:** Same; on duplicate return `201` with existing lock if found.
  - **Claim:** Capture `credited` from `creditAibaNoCap`; if `!credited?.ok` return 500; if `credited.duplicate` return 200 without updating `lastClaimedAt`.
  - **Claim-lock:** If `credited.duplicate` return success payload without further side effects.

### Backend validation and idempotency

- **adminPredict:** Create event uses `validateBody`; resolve uses `validateParams({ id: objectId })`. Router uses `adminAudit()` for audit logging.
- **predict:** Bet route already uses `validateBody` (brokerId, amountAiba, requestId) and `validateParams` for event id; idempotency via `requestId` and duplicate debit handling.

### Observability and runtime correctness

- **`/metrics`:** Already registered in `backend/app.js` via `app.get('/metrics', metricsHandler)`.
- **Health/monitoring scripts:** `scripts/health-check.js` and `scripts/monitoring-check.js` use `BACKEND_URL || NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'`. Comment added: default is `http://localhost:5000`; set env for production.

### Models

- **PredictBet (`backend/models/PredictBet.js`):**
  - Added `requestId` (string, sparse).
  - Index for resolve path: `{ eventId: 1, brokerId: 1 }` (already present).
  - Idempotency index: `{ requestId: 1 }` unique, sparse.

---

## Phase 2 (P1): Frontend Stability and Auth/Error Recovery

### Admin panel

- **401/403:** Response interceptor already clears token and sets `authError`; now also clears `globalError` so only the re-auth message is shown.
- **Error state:** Global error banner has a "Dismiss" button; `handleApiError` used across fetch paths.
- **Loading:** `tabLoading` set in the tab `useEffect` for all high-impact tabs.
- **Error boundary:** `AdminErrorBoundary` in `admin-panel/src/app/layout.js` wraps children; renders a simple "Something went wrong" UI on render error.

### Miniapp

- **Tab-triggered async:** Explicit error handling for tab refreshes in `HomeContent.js`: brokers, leaderboard, tasks, charity, university now set `setStatus` or `setTasksMsg` with `getErrorMessage(e, ...)` instead of silent `.catch(() => {})` where appropriate.
- **Trainer page:** Hook dependencies already correct (`api`, `tab`, `leaderboardBy`, `leaderboardPeriod`, `trainer?.isTrainer`, `trainer?.status`).
- **Providers:** Comment added that production should set `NEXT_PUBLIC_APP_URL` and optionally `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL`; logic remains env-driven.
- **Brokers proxy:** `miniapp/src/app/api/brokers/[[...path]]/route.js` already implements GET and POST proxy to backend.

---

## Phase 3 (P2): Hardening and Guardrails

- **Predict rate limiting:** `GET /api/predict/events` now has a per-IP rate limit (60/min). `POST .../bet` already had per-user rate limit (10/min).
- **Admin audit:** `adminPredict` router uses `adminAudit()` middleware for all admin predict routes.
- **Treasury op failures:** In resolve, `TreasuryOp.create` is wrapped in try/catch; on failure, error is logged with `eventId`, `vigAiba`, and rethrown so the transaction aborts and the client receives 500.
- **PredictBet index:** Supporting index for resolve path `{ eventId: 1, brokerId: 1 }` is present; added `{ requestId: 1 }` unique sparse for idempotency.

---

## Verification (recommended)

- **Backend:** Smoke test predict create → bet → resolve; staking stake/claim with same `requestId` (expect 200/201 idempotent); `GET /health` and `GET /metrics` via `scripts/health-check.js` and `scripts/monitoring-check.js`.
- **Admin:** Expired/invalid token → 401/403 → token cleared and re-auth message; trigger an API error and confirm global error banner and Dismiss.
- **Miniapp:** Switch to Brokers, Leaderboard, Tasks, Charity, University and force a backend error to confirm status/task message shows.
- **Regression:** Run existing lint/tests for backend and frontends.
