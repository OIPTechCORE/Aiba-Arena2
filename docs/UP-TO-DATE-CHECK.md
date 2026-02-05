# Deep up-to-date check

This document records a **cross-check of docs vs code** so the repo is clearly up to date.

**Check date:** February 2025

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
| **RUN-LOCALHOST.md** | APP_ENV=dev, x-telegram-id, CORS, backend first | Aligned |

---

## 4. Racing / University / Multiverse

| Doc | Code | Status |
|-----|------|--------|
| **AUTONOMOUS-RACING-MASTER-PLAN.md** | Car & Bike racing (backend routes, miniapp tabs) | Aligned |
| **VISION-VS-CODEBASE-CHECK.md** (university, multiverse APIs) | Implemented in backend + miniapp tabs | Aligned |

---

## 5. Summary

- **Ports and run instructions:** Consistent across README, RUN-LOCALHOST, and package.json.
- **Miniapp:** UI/UX audit and setup guide match current miniapp (tabs, 3D design, tutorial, env).
- **Deployment and env:** deployment.md and VERCEL-ENV-GUIDE match backend/miniapp/admin env usage.
- **Racing / University / Multiverse:** Plans and vision docs match implemented features.

**Conclusion:** Docs and code are deeply up to date as of this check. Re-run this verification after large feature or doc changes.
