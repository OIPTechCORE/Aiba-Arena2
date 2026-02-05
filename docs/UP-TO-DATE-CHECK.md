# Deep up-to-date check

This document records a **cross-check of docs vs code** so the repo is clearly up to date.

**Check date:** February 4, 2025

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

## 4. Connect Wallet (TonConnect) on localhost

| Doc / code | Status |
|------------|--------|
| **RUN-LOCALHOST.md** §7 | Describes localhost limits (wallets often cannot load manifest from localhost); options: browser extension, `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL`, ngrok |
| **miniapp/providers.js** | SSR-safe: `manifestUrl` uses `window` only when defined; fallback origin / deployed manifest URL |
| **miniapp/page.js** | In dev, shows hint under TonConnect button: "Connect Wallet: works best on deployed HTTPS app. On localhost use a wallet extension or ngrok." |
| **miniapp/.env.local.example** | Optional `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` comment for local testing |
| **VERCEL-ENV-GUIDE.md**, **VERCEL-DEPLOYMENT-CHECKLIST.md** | TonConnect manifest URL and miniapp env documented |

**Status:** Aligned.

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

**Conclusion:** Docs and code are deeply up to date as of this check. An exhaustive pass updated PROJECT-DESCRIPTION-SYSTEMATIC, deployment.md, VISION-VS-CODEBASE-CHECK, USER-GUIDE, and GAME-EXPLAINED so all routes, env vars, tabs, and features (including car/bike racing, stars store, admin mod, charity) match the codebase. Connect Wallet on localhost is documented (RUN-LOCALHOST §7), with SSR-safe manifest URL in providers.js, dev hint in page.js, and optional manifest URL in miniapp/.env.local.example. Re-run this verification after large feature or doc changes.
