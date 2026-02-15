# API & Docs Audit — Gaps Fixed

**Date:** Feb 2025  
**Scope:** Global scan of docs, APIs, endpoints for gaps, issues, and errors.

---

## Fixes Applied

### 1. API-CONTRACT.md
- **Car Racing**: Added full API section — `config`, `tracks`, `races`, `cars`, `leaderboard`, `race/:id`, `create`, `create-with-ton`, `enter` (previously only marketplace: listings, list, buy-car, buy-system-car).
- **Bike Racing**: Same expansion — full racing API documented.
- **Referrals use**: Clarified `wallet_required` 403 when referee has no wallet connected.

### 2. SUPER-ADMIN-WALLETS.md
- **Boost group**: Aligned path `guilds/:id/boost` → `guilds/:guildId/boost` (matches backend).
- **Cancelled stakes**: Clarified AIBA fee → Treasury model; env reserved for future TON-based fee.

### 3. GAME-FUNCTIONALITY.md
- **Boost guild**: Path aligned to `guilds/:guildId/boost`.

### 4. API-AND-READINESS-AUDIT.md
- **Guilds boost**: Path aligned to `guilds/:guildId/boost`.

---

## Verified (No Changes Needed)

| Area | Status |
|------|--------|
| Announcements | `{ items, unreadCount }` — frontend handles via api unwrap |
| Guilds /list, /mine, /top | Implemented; route order correct |
| Broker rental /list | Present |
| Staking min/max, periods | Backend + frontend aligned |
| Response envelope | Miniapp api.js unwraps `{ ok, data }` |
| Referrals wallet check | Backend enforces; `wallet_required` returned |
| Car/Bike racing endpoints | All used by miniapp exist in backend |

---

## Related

- **API-CONTRACT.md** — Authoritative API reference  
- **SUPER-ADMIN-WALLETS.md** — Env vars, config keys, APIs  
- **UNIFIED-COMMS-ECOSYSTEM.md** — Phases 3–4, collapsible FAQ
