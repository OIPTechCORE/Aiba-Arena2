# Deep up-to-date check

This document records a **cross-check of docs vs code** so the repo is clearly up to date.

**Check date:** February 6, 2025

**Universal update (Feb 2025):** Full repo sync: backend (engine, jobs, models, routes, util, package.json/package-lock.json), docs (AUTONOMOUS-RACING-MASTER-PLAN, LEADERBOARD-AND-GROUPS-CHECK, MARKETPLACE-AND-PAYMENTS-MASTER-PLAN, NFT-MULTIVERSE-MASTER-PLAN, VERCEL-DEPLOYMENT-CHECKLIST, monitoring), and root/miniapp lockfiles committed and pushed. Codebase and docs aligned.

**Deep update (Feb 2025):** Backend: MONGO_URI uses database name `aiba_arena` and Atlas-friendly options (`retryWrites=true&w=majority`). `.env.example` sanitized (Atlas placeholder, safe ADMIN_EMAIL/ADMIN_PASSWORD placeholders). Docs: README, RUN-LOCALHOST, deployment.md, VERCEL-DEPLOYMENT-CHECKLIST aligned for MongoDB (local + Atlas) and env setup. **University vision upgraded**: AI Learning Multiverse architecture added to `AIBA-ARENA-UNIVERSITY-PLAN.md`, with full economic design spec in `AI-LEARNING-MULTIVERSE-ECONOMICS.md`.

**Connect Wallet (Feb 2025):** Clicking "Connect Wallet" opens the TonConnect modal with the full list of TON-supported wallets (Tonkeeper, TonHub, etc.). Custom button in header calls `openModal()` when not connected; when connected, TonConnectButton is shown. Modal is **seamlessly responsive:** `#tc-widget-root` uses `100dvh`, safe-area insets, smooth scroll; `layout.js` exports `viewport` with `viewportFit: 'cover'` for notched devices; at ≤440px modal is full-width; at ≤360px header shows wallet icon only. See miniapp `page.js`, `providers.js`, `globals.css`, `layout.js`.

**Exhaustive doc update (same period):** PROJECT-DESCRIPTION-SYSTEMATIC (routes: car-racing, bike-racing, marketplace delist, charity endpoints, admin/mod detail), deployment.md (STARS_STORE_WALLET, CAR_RACING_WALLET, MOTORCYCLE_RACING_WALLET), VISION-VS-CODEBASE-CHECK (12 tabs, car/bike racing routes and models, multiverse/stars-store, miniapp structure), USER-GUIDE (12 tabs list and table with Car Racing, Bike Racing), GAME-EXPLAINED (section 4 Autonomous Racing, TON wallets for Stars/Car/Bike, section renumbering 5–11).

**Later (Connect Wallet on localhost):** RUN-LOCALHOST §7 (TonConnect: many wallets cannot load manifest from localhost; options: browser extension, `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` to deployed URL, or ngrok), miniapp `providers.js` (SSR-safe manifest URL with `window` guard and fallback), `page.js` (dev-only hint under TonConnect button), `miniapp/.env.local.example` (optional TonConnect manifest URL comment), VERCEL-DEPLOYMENT-CHECKLIST and VERCEL-ENV-GUIDE (TonConnect manifest env).

---

## 1. Run / ports / env

| Source | Backend | Miniapp | Admin |
|--------|---------|---------|--------|
| **README.md** | localhost:5000 | localhost:3000 | localhost:3001 |
| **docs/RUN-LOCALHOST.md** | 5000 | 3000 | 3001 |
| **package.json** (root `dev`) | backend | miniapp | admin-panel |
| **miniapp/package.json** | — | `next dev -p 3000` | — |
| **admin-panel/package.json** | — | — | `next dev -p 3001` |

**Status:** All aligned. Backend 5000, miniapp 3000, admin 3001.

---

## 2. Miniapp UI/UX and features

| Doc | Code | Status |
|-----|------|--------|
| **TELEGRAM-MINI-APP-UI-UX-AUDIT.md** | globals.css + page.js (3D, buttons, cards, tutorial, cinematic, guide-tip) | Aligned |
| **TELEGRAM-MINI-APP-SETUP-GUIDE.md** | miniapp uses `lib/telegram.js`, `lib/api.js`, `NEXT_PUBLIC_BACKEND_URL`, TonConnect | Aligned |
| Tabs: Home, Brokers, Market, Car Racing, Bike Racing, Multiverse, Arenas, Guilds, Charity, University, Updates, Wallet | TAB_LIST in page.js | Aligned |

---

## 3. Backend / API

| Doc | Code | Status |
|-----|------|--------|
| **deployment.md** | Backend env (MONGO_URI, TELEGRAM_BOT_TOKEN, wallets, vault/claim, etc.) | Aligned |
| **VERCEL-ENV-GUIDE.md** | NEXT_PUBLIC_BACKEND_URL, NEXT_PUBLIC_TONCONNECT_MANIFEST_URL, NEXT_PUBLIC_APP_URL | Aligned |
| **RUN-LOCALHOST.md** | APP_ENV=dev, x-telegram-id, CORS, backend first; §7 TonConnect (Connect Wallet) localhost limits and options | Aligned |

---

## 4. Connect Wallet (TonConnect)

| Doc / code | Status |
|------------|--------|
| **RUN-LOCALHOST.md** §7 | Localhost limits (manifest from localhost); options: browser extension, `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL`, ngrok. Connect Wallet opens modal with TON wallet list; modal is responsive (safe-area, 100dvh). |
| **miniapp/providers.js** | SSR-safe `manifestUrl`; `uiPreferences: { theme: 'DARK' }` for modal. |
| **miniapp/page.js** | When not connected: custom "Connect Wallet" button calls `tonConnectUI.openModal()` to show wallet list; when connected: TonConnectButton. Dev hint for localhost. |
| **miniapp/globals.css** | `#tc-widget-root`: fixed full viewport, 100dvh, safe-area padding, smooth scroll. `[data-tc-modal="true"]`: full-width on ≤440px. Header: icon-only Connect at ≤360px. |
| **miniapp/layout.js** | `viewport`: viewportFit `cover`, device-width, initialScale 1 for safe-area support. |
| **miniapp/.env.local.example** | Optional `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` for local testing. |
| **VERCEL-DEPLOYMENT-CHECKLIST.md**, **VERCEL-ENV-GUIDE.md** | TonConnect manifest URL and miniapp env documented. |

**Status:** Aligned. Connect Wallet displays TON wallet list; modal is seamlessly responsive.

---

## 5. Racing / University / Multiverse

| Doc | Code | Status |
|-----|------|--------|
| **AUTONOMOUS-RACING-MASTER-PLAN.md** | Car & Bike racing (backend routes, miniapp tabs) | Aligned |
| **VISION-VS-CODEBASE-CHECK.md** (university, multiverse APIs) | Implemented in backend + miniapp tabs | Aligned |

---

## 6. Summary

- **Ports and run instructions:** Consistent across README, RUN-LOCALHOST, and package.json.
- **Miniapp:** UI/UX audit and setup guide match current miniapp (tabs, 3D design, tutorial, env).
- **Deployment and env:** deployment.md and VERCEL-ENV-GUIDE match backend/miniapp/admin env usage.
- **Racing / University / Multiverse:** Plans and vision docs match implemented features.
- **Connect Wallet on localhost:** RUN-LOCALHOST §7, providers.js (SSR-safe manifest), page.js (dev hint), .env.local.example (optional manifest URL), and Vercel env docs are aligned.

**Conclusion:** Docs and code are deeply up to date as of this check. Backend (MongoDB Atlas, .env.example), deployment docs, miniapp (12 tabs, 3D UI, tutorial), and Connect Wallet flow are aligned: Connect Wallet opens the TonConnect modal with TON wallet list; the modal is seamlessly responsive (100dvh, safe-area, viewportFit cover, full-width on small screens). Re-run this verification after large feature or doc changes.

**If you have local changes in backend (engine, jobs, models, routes, util) or plan docs** that were left uncommitted, run from repo root: `.\scripts\commit-backend-docs-sync.ps1` to stage, commit, and push them in one "Backend and docs sync" commit.

**Deep inspection:** For a full project-wide review (structure, backend, frontends, contracts, docs, security), see [DEEP-INSPECTION-REPORT.md](DEEP-INSPECTION-REPORT.md).
