# Holistic Errors Investigation — AIBA Arena

**Date:** 2026-02-15  
**Scope:** Builds, lint, tests, backend (Mongoose, env), error boundaries, docs, and known issues.

---

## Executive summary

- **Builds:** Miniapp (Next 15) and admin-panel (Next 14) **build successfully**.
- **Lint:** Root `npm run lint` runs Prettier `--check`; **many files are not formatted** (warnings). **3 files** in `docs/print/` have **HTML syntax errors** (invalid nesting of `<em>`/`<code>`); source Markdown was fixed so regeneration yields valid HTML.
- **Backend tests:** `npm run test:api` **passes** (12/12). No MongoDB required for these tests; broker list may timeout if DB is unavailable (expected).
- **Mongoose:** **Duplicate schema index** warnings were reduced by removing redundant `index: true` where `Schema.index()` or `unique: true` already defines the same index. A few warnings may remain (telegramId, requestId); run `node --trace-warnings` in backend to pinpoint models.
- **Error boundaries:** Admin has `AdminErrorBoundary.jsx` in root layout; **miniapp has no root error boundary** (optional improvement).
- **Env:** Backend has `.env.example`; miniapp and admin-panel have no `.env.example` (optional: add for `NEXT_PUBLIC_*` and required vars).

---

## 1. Builds

| App     | Command                           | Result                            |
| ------- | --------------------------------- | --------------------------------- |
| Miniapp | `cd miniapp && npm run build`     | ✅ Compiles; static generation OK |
| Admin   | `cd admin-panel && npm run build` | ✅ Compiles; static generation OK |

**Versions:** Miniapp uses Next 15 + React 19; admin-panel uses Next 14 + React 18.

---

## 2. Lint (Prettier)

- **Command:** `npm run lint` (root) → `prettier --check .`
- **Result:** Many `[warn]` (files not formatted). No Prettier config change was made; formatting can be normalized with `npx prettier --write .` when desired.
- **Errors (3 files):** Prettier reported **HTML syntax errors** in generated files:
    - `docs/print/DOCS-STRUCTURE.html`: Nested `</em>` inside `<code>` (from `**\`docs/\*.md\`\*\*` — asterisk interpreted as italic).
    - `docs/print/GAME-FUNCTIONALITY.html`: Same pattern for `/api/assets/*`, `/api/asset-marketplace/*`.
    - `docs/print/REPORTS-MONITORING.html`: Same for `*2`, `*1.5` in table cell.

**Source fixes applied:** In `docs/DOCS-STRUCTURE.md`, `docs/GAME-FUNCTIONALITY.md`, and `docs/REPORTS-MONITORING.md`, asterisks used in paths or math were escaped or moved into code so the print-docs build no longer produces invalid nesting. **Regenerate** with `npm run build:print-docs` after pulling.

---

## 3. Backend tests

- **Command:** `cd backend && npm run test:api`
- **Result:** ✅ **12 tests pass.** No MongoDB required; some tests expect 401/400 or tolerate 500 when DB is missing.
- **Note:** "Error listing brokers: MongooseError: Operation \`brokers.find()\` buffering timed out" is expected when MongoDB is not running; tests are written to pass regardless.

---

## 4. Mongoose duplicate index warnings

**Symptom:** At runtime, Mongoose logs:  
`Duplicate schema index on {"telegramId":1} found. This is often due to declaring an index using both "index: true" and "schema.index()".`

**Cause:** A field had both `index: true` (or `unique: true`, which implies an index) and a `Schema.index()` on the same key(s).

**Fixes applied (backend/models):**

- **BattleRunKey:** Removed `index: true` from `expiresAt`, `requestId`, `status` (TTL and compound/unique cover usage).
- **ActionRunKey:** Removed `index: true` from `scope`, `requestId`, `ownerTelegramId`, `status`, `expiresAt`.
- **Trainer:** Removed `index: true` from `telegramId`, `code`; removed `TrainerSchema.index({ code: 1 })` (unique on field already creates index).
- **Staking, UniversityProgress, FullCertificateMint, CourseBadgeMint:** Removed `index: true` from `telegramId` (and from `txHash` where unique); kept `Schema.index({ telegramId: 1 })`.
- **Mentor, Realm:** Removed redundant `Schema.index({ key: 1 }, { unique: true })` (field already has `unique: true`).
- **Battle:** Removed `index: true` from `requestId`, `brokerId`.
- **NftStake:** Removed `index: true` from `brokerId`, `telegramId`.
- **BikeRaceEntry, CarRaceEntry:** Removed `index: true` from `raceId`, `telegramId`.
- **BrokerRental:** Removed `index: true` from `brokerId`, `ownerTelegramId`, `status`.
- **Referral:** Removed `index: true` from `code`, `ownerTelegramId`.
- **PredictBet:** Removed `index: true` from `eventId`, `telegramId`.

**If warnings remain:** Run from backend:  
`node --trace-warnings node_modules/.bin/node --test tests/api/health.test.js`  
and inspect the stack to see which model still declares a duplicate index for `telegramId` or `requestId`.

---

## 5. Error boundaries

- **Admin:** Root layout wraps children with `AdminErrorBoundary.jsx`; uncaught errors show a fallback UI.
- **Miniapp:** No root-level error boundary. Consider adding a client component that wraps the main tree and catches render errors (same pattern as admin).

---

## 6. Environment variables

- **Backend:** `backend/.env.example` exists; documents server-side vars.
- **Miniapp / admin-panel:** No `.env.example` or `.env.local.example`. Optional: add a small example listing `NEXT_PUBLIC_*` and any required API URLs so new contributors know what to set.

---

## 7. Other notes

- **ESLint:** Some files use `eslint-disable-next-line react-hooks/exhaustive-deps` or `no-await-in-loop`; acceptable where intentional.
- **TonConnect / miniapp:** Wallet modal and z-index handling are in place so app buttons remain clickable; see `docs/MINIAPP-HOME-GRID-BUTTONS-INVESTIGATION.md` and related docs.
- **Metallic design:** Both miniapp and admin-panel `globals.css` include the metallic design system variables and utility classes.

---

## 8. Checklist (post-investigation)

| Item                               | Status                                    |
| ---------------------------------- | ----------------------------------------- |
| Miniapp build                      | ✅                                        |
| Admin build                        | ✅                                        |
| Backend API tests                  | ✅ 12/12                                  |
| Mongoose duplicate indexes         | ✅ Reduced; trace if needed for remaining |
| Prettier HTML errors in docs/print | ✅ Source .md fixed; regenerate HTML      |
| Root error boundary in miniapp     | Optional                                  |
| .env.example for miniapp/admin     | Optional                                  |

Regenerate print docs after doc changes:  
`npm run build:print-docs`
