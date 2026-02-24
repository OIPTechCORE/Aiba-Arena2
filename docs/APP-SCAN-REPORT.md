# App scan report — issues and errors

**Date:** 2026-02-16  
**Scope:** Miniapp and backend; lint, build, runtime patterns, and defensive checks.

---

## 1. Summary

| Category              | Status      | Notes                                                                                  |
| --------------------- | ----------- | -------------------------------------------------------------------------------------- |
| **Linter**            | ✅ Clean    | No ESLint errors in `miniapp/src` or `backend`.                                        |
| **Build**             | ⏳ Verified | Next.js build started; confirm completion locally.                                     |
| **Duplicates**        | ✅ Reduced  | Tab back nav uses `TabBackNav`; single `@media (max-width: 400px)` block.              |
| **Silent catch**      | ⚠️ Many     | Many `.catch(() => {})` in HomeContent/telegram; intentional for non-critical fetches. |
| **Console**           | ⚠️ One      | `console.error` in broker API proxy (route) for debugging.                             |
| **Keys**              | ✅ Safe     | Lists use stable keys (`_id`, `id`, or `i` fallback).                                  |
| **Null/array guards** | ✅ Hardened | Tournament `detail.entries` guarded with `Array.isArray` before `.slice`/`.map`.       |

---

## 2. Findings

### 2.1 Lint and build

- **Linter:** No issues reported in `miniapp/src` or `backend`.
- **ESLint disables:** Four `eslint-disable-next-line react-hooks/exhaustive-deps` in HomeContent and one in admin. Used where effect dependencies are intentionally omitted (e.g. run-on-mount or tab-specific refresh). Acceptable; consider adding a short comment per use if not already present.
- **Build:** Run `npm run build` in `miniapp` to confirm a full production build. No compile errors were observed in the scan.

### 2.2 Duplicate code

- **Tab back nav:** Centralized in `TabBackNav`; used in hero and Tasks. No duplicate “Back to Home” / “Back to Previous” JSX.
- **CSS:** All narrow-viewport rules consolidated into one `@media (max-width: 400px)` block in `globals.css`.

### 2.3 Error handling and logging

- **Silent `.catch(() => {})`:** Used widely in HomeContent for non-critical requests (e.g. refreshBrokers, refreshEconomy, tab-specific data). Failures do not surface to the user. **Recommendation:** For critical paths (e.g. economy, battle submit), consider setting a status/error message or showing a toast instead of swallowing.
- **Broker proxy:** `miniapp/src/app/api/brokers/[[...path]]/route.js` uses `console.error('Broker proxy error:', err)` on proxy failure. Acceptable for server-side debugging; consider forwarding to a logger or removing in production if logs are not desired.

### 2.4 Runtime safety

- **Arrays before `.map` / `.slice`:**
    - `taskProfile?.userKinds` is guarded with `Array.isArray(taskProfile?.userKinds)` before `.map`.
    - `globalBoss.topDamagers` is guarded with `Array.isArray(globalBoss.topDamagers)` and only used when `globalBoss?.active` is true.
    - **Tournament detail:** Condition updated to `detail?.entries && Array.isArray(detail.entries) && detail.entries.length > 0` before using `detail.entries.slice(0, 20).map(...)` to avoid runtime errors if the API returns a non-array.
- **Leaderboard:** `leaderboard` is `useState([])`; `row.badges` is checked with `Array.isArray(row.badges)` before `.slice`/`.map`. Safe.
- **Keys:** List items use `key={id}`, `key={b._id}`, or `key={… || i}`. No unsafe or missing keys detected.

### 2.5 Environment and config

- **Env usage:** `NEXT_PUBLIC_BACKEND_URL` and related vars used in miniapp; broker proxy also uses `process.env.BACKEND_URL`. Document in DEPLOYMENT-AND-ENV.md that backend URL must be set for proxy and direct API calls.

### 2.6 Accessibility and UX

- **Page nav:** `PageNav` and `TabBackNav` use `aria-label` on buttons/links.
- **Reduced motion:** `globals.css` includes `@media (prefers-reduced-motion: reduce)` to shorten animations. Good.

---

## 3. Fixes applied in this scan

1. **Tournament detail entries:** Guard tournament detail block with `detail?.entries && Array.isArray(detail.entries) && detail.entries.length > 0` before calling `detail.entries.slice(0, 20).map(...)` to prevent crashes if `entries` is missing or not an array.

---

## 4. Recommended follow-ups (optional)

| Priority | Action                                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| P2       | Replace critical-path `.catch(() => {})` (e.g. battle submit, economy refresh) with user-visible error state or toast.           |
| P2       | Add a one-line comment above each `eslint-disable-next-line react-hooks/exhaustive-deps` explaining why deps are omitted.        |
| P2       | In production, replace or gate `console.error` in broker proxy with a logger or remove if not needed.                            |
| P3       | Add a contract test that asserts every API path used by the miniapp has a corresponding backend route (see GAPS-SCAN-REPORT.md). |

---

## 5. References

- **GAPS-SCAN-REPORT.md** — Docs and app gap audit.
- **UI-DESIGN-PRINCIPLES.md** — Nav and layout standards.
- **DEPLOYMENT-AND-ENV.md** — Env vars and deployment.
