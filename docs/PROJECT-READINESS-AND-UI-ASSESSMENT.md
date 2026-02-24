# Project Readiness & Miniapp UI vs Codebase — Deep Assessment

**Date:** February 19, 2026  
**Scope:** Project readiness for production; miniapp UI alignment with backend/codebase; gaps and recommendations.

---

## Executive Summary

| Dimension                      | Verdict                 | Summary                                                                                                                          |
| ------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Launch readiness**           | ✅ **Ready**            | App is launchable once env (backend URL, CORS, Telegram) is correctly set. No code change required.                              |
| **Production readiness**       | ⚠️ **Config-dependent** | Testnet/MVP ready. Mainnet requires env, keys, monitoring, backups. Fail-fast checks at startup.                                 |
| **API alignment**              | ✅ **Aligned**          | All miniapp API calls map to existing backend routes. No missing endpoints.                                                      |
| **UI vs backend (MemeFi/LMS)** | ✅ **Mostly aligned**   | Feed filters, trending, saved, drafts, reactions, save, appeal, redemption for-me, idempotency, expiresAt implemented.           |
| **UI vs backend (general)**    | ✅ **Well aligned**     | Saved wallet and school selector already implemented. Optional: stars/diamond rewards, boost duration, per-mode energy/cooldown. |

---

## 1. Project Readiness

### 1.1 Launch Readiness (Day One)

**Verdict: You can launch today** if the checklist in [LAUNCH-TODAY-ASSESSMENT.md](LAUNCH-TODAY-ASSESSMENT.md) is completed.

| Requirement      | Status      | Notes                                                                                                   |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| Backend deployed | ✅          | Root: `backend`; Vercel-ready                                                                           |
| Backend env      | 🔴 Required | MONGO*URI, APP_ENV=prod, CORS_ORIGIN, TELEGRAM_BOT_TOKEN, ADMIN*\*, BATTLE_SEED_SECRET, PUBLIC_BASE_URL |
| Miniapp deployed | ✅          | Root: `miniapp`; Vercel-ready                                                                           |
| Miniapp env      | 🔴 Required | **NEXT_PUBLIC_BACKEND_URL** = backend URL (critical; wrong/missing → 404/508)                           |
| Telegram bot URL | 🔴 Required | Menu/Web App URL → miniapp                                                                              |
| Core flow        | ✅          | Create broker → Run battle → See rewards                                                                |

**Main risk:** Wrong or missing `NEXT_PUBLIC_BACKEND_URL` or `CORS_ORIGIN` → API 404/508. See [DEEP-ASSESSMENT-APP.md](DEEP-ASSESSMENT-APP.md).

### 1.2 Production Readiness (Mainnet / Long-Term)

**Verdict: Testnet/MVP ready.** Mainnet requires operational setup.

| Area                         | Status         | Action                                           |
| ---------------------------- | -------------- | ------------------------------------------------ |
| Testnet / MVP                | ✅ Ready       | Backend, miniapp, admin; fail-fast in prod       |
| Prod env + CORS              | 🔴 Required    | Set in backend so it starts                      |
| Keys & secrets               | 🔴 Required    | Separate keys; secret manager; rotate if exposed |
| Ops (monitor/backup/runbook) | 🔴 Required    | Monitoring, backups, runbook                     |
| Rate limit (multi-instance)  | 🟡 Recommended | Redis if multiple backend instances              |
| Signing isolation            | 🟡 Recommended | Dedicated signer/KMS for claims                  |

**Enforced at startup (`APP_ENV=prod`):**

- CORS_ORIGIN must be set
- TELEGRAM_BOT_TOKEN, TELEGRAM_INITDATA_MAX_AGE_SECONDS
- ADMIN_JWT_SECRET (≥32 chars), ADMIN_EMAIL, ADMIN_PASSWORD_HASH
- BATTLE_SEED_SECRET (≥32 chars)
- If vault/claims configured: ARENA_VAULT_ADDRESS, AIBA_JETTON_MASTER, ORACLE_PRIVATE_KEY_HEX or ORACLE_SIGNER_URL, TON_PROVIDER_URL (mainnet)
- ENABLE_LEGACY_PENDING_AIBA_DISPATCH must not be true

**Source:** [OPERATIONS.md](OPERATIONS.md), [backend/security/productionReadiness.js](../backend/security/productionReadiness.js)

### 1.3 Functional Readiness by Feature

| Feature            | Readiness           | Gaps                                                                               |
| ------------------ | ------------------- | ---------------------------------------------------------------------------------- |
| Auth               | ✅                  | Telegram initData; x-telegram-id fallback for dev                                  |
| Brokers            | ✅                  | Proxy fixes 405; create, combine, mint, train, repair, upgrade                     |
| Battle             | ✅                  | Run battle, claim, economy refresh                                                 |
| Economy            | ✅                  | NEUR, AIBA, Stars, Diamonds; config-driven costs                                   |
| Marketplace        | ✅                  | List, buy, system brokers                                                          |
| Guilds             | ✅                  | Create, join, deposit/withdraw, boost                                              |
| MemeFi             | ✅                  | Feed, create, like/comment/share/boost, trending, saved, drafts, reactions, appeal |
| Redemption         | ✅                  | Products, redeem, for-me, idempotency, expiresAt                                   |
| Staking/Multiverse | ✅                  | Stake, unstake, claim                                                              |
| Car/Bike racing    | ✅                  | Config, create, buy, enter                                                         |
| University         | ✅                  | Courses, progress, mint badges                                                     |
| Charity            | ✅                  | Campaigns, donate, leaderboard                                                     |
| Trainers           | ✅                  | Portal, network, leaderboard, claim-rewards                                        |
| Vault/Claims       | ⚠️ Config-dependent | Needs vault + oracle + TON provider for on-chain                                   |
| TON payments       | ⚠️ Config-dependent | Various TON wallets for buy-with-TON flows                                         |

---

## 2. Miniapp UI vs Codebase

### 2.1 API Alignment

**All miniapp API calls have corresponding backend routes.** No missing endpoints.

| Category                          | Frontend Calls | Backend Routes | Status |
| --------------------------------- | -------------- | -------------- | ------ |
| Brokers                           | 6              | 6              | ✅     |
| Battle                            | 1              | 1              | ✅     |
| Economy                           | 2              | 2              | ✅     |
| MemeFi                            | 15+            | 15+            | ✅     |
| Redemption                        | 3              | 3              | ✅     |
| Guilds, Staking, University, etc. | 60+            | 60+            | ✅     |

**Source:** [API-AND-READINESS-AUDIT.md](API-AND-READINESS-AUDIT.md)

### 2.2 MemeFi / LMS — UI vs Backend

**Status: ✅ Fully aligned.** All MemeFi/LMS features implemented in UI. Post–UI alignment work completed.

| Backend capability                                           | Miniapp UI                             | Status                      |
| ------------------------------------------------------------ | -------------------------------------- | --------------------------- |
| Feed: sort, tag, window, category, educationCategory         | ✅ Filters + Load more                 | Aligned                     |
| Create: tags, status (draft/published), templateId, schoolId | ✅ Tags, draft, template, school       | Aligned                     |
| Detail: reactions, save                                      | ✅ Reaction picker, Save button        | Aligned                     |
| Trending                                                     | ✅ Trending view (6h/24h/7d)           | Aligned                     |
| My saved                                                     | ✅ Saved list                          | Aligned                     |
| My drafts + Publish                                          | ✅ Drafts list, Publish button         | Aligned                     |
| Appeal (hidden meme)                                         | ✅ Appeal when owner + hidden          | Aligned                     |
| Leaderboard: schoolId                                        | ✅ School ID input                     | Aligned                     |
| Redemption: for-me                                           | ✅ Uses /products/for-me with fallback | Aligned                     |
| Redemption: idempotencyKey                                   | ✅ Sends on redeem                     | Aligned                     |
| Redemption: expiresAt                                        | ✅ Shown in success + My redemptions   | Aligned                     |
| School in profile                                            | ✅ School selector with save           | **Aligned**                 |
| Partner dashboard                                            | By design                              | Partners use external tools |

**Remaining optional work:**

- Template picker prominence (optional; backend + UI support exist)

**Source:** [MINIAPP-UI-VS-BACKEND-ASSESSMENT.md](MINIAPP-UI-VS-BACKEND-ASSESSMENT.md), verified against `HomeContent.js`

### 2.3 Economy / Wallet — UI vs Backend

| Data (from GET /api/economy/me)                            | Shown in UI  | Where                                                   |
| ---------------------------------------------------------- | ------------ | ------------------------------------------------------- |
| neurBalance, aibaBalance, starsBalance, diamondsBalance    | ✅           | Balance strip, Wallet, Brokers, Earn, etc.              |
| badges, profileBoostedUntil                                | ✅           | Profile, Wallet                                         |
| economy.combineNeurCost, mintAibaCost, trainNeurCost, etc. | ✅           | Brokers tab                                             |
| economy.createGroupCostTonNano, boostGroupCostTonNano      | ✅           | Guilds                                                  |
| economy.giftCostTonNano, boostProfileCostTonNano           | ✅           | Wallet                                                  |
| **wallet** (saved TON address)                             | ⚠️ Not shown | Gap — user doesn't see which address is used for claims |
| economy.starRewardPerBattle                                | ⚠️ Not shown | Optional                                                |
| economy.diamondRewardFirstWin                              | ⚠️ Not shown | Optional                                                |
| economy.baseRewardAibaPerScore, baseRewardNeurPerScore     | ❌ Not shown | Optional                                                |
| economy.boostProfileDurationDays                           | ❌ Not shown | Optional                                                |
| Per-mode energy/cooldown                                   | ❌ Not shown | Optional (Arenas)                                       |

**Recommendation (medium priority):** Show saved wallet address (truncated) in Wallet or Profile when `economyMe.wallet` is set.

**Source:** [APP-DEEP-ASSESSMENT-AND-UI-REFLECTION.md](APP-DEEP-ASSESSMENT-AND-UI-REFLECTION.md)

### 2.4 Error and Empty States

| Area           | Status     | Notes                                                                                                               |
| -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| Generic errors | ✅         | getErrorMessage, status messages, try/catch                                                                         |
| Loading states | ✅         | `busy` flag disables buttons                                                                                        |
| Empty states   | ⚠️ Partial | Some flows may show generic/blank content; UX pass recommended for "no brokers", "no listings", "race failed", etc. |

---

## 3. Critical Paths and Risks

### 3.1 API 404 / 508 Root Cause

| Symptom                                                     | Cause                                      | Fix                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 404 on /api/economy/me, daily, referrals, game-modes, tasks | Requests not reaching backend (wrong host) | Set **NEXT_PUBLIC_BACKEND_URL** in Vercel miniapp to backend URL. Redeploy.                |
| 508 on /api/brokers/mine, /api/brokers/starter              | Redirect/proxy loop                        | Ensure NEXT_PUBLIC_BACKEND_URL = backend URL only (not miniapp). Check Vercel proxy rules. |
| Backend won't start                                         | Missing env; prod checks fail              | Check logs for PROD_READINESS_FAILED. Set all required env per DEPLOYMENT-AND-ENV.md.      |

**getBackendUrl() logic** (`miniapp/src/lib/api.js`):

- If `NEXT_PUBLIC_BACKEND_URL` set at build → use it
- Else if origin = `https://aiba-arena2-miniapp.vercel.app` → fallback to `https://aiba-arena2-backend.vercel.app`
- Else → `localhost:5000` (causes 404 in production if env not set)

### 3.2 Broker Proxy

- **POST /api/brokers/starter** uses same-origin proxy (`api/brokers/[[...path]]/route.js`) to avoid CORS/405.
- Other broker POSTs (combine, mint-nft, create-with-ton) go direct to backend. If 405/CORS in production, extend proxy.

### 3.3 Cron and Admin

| Item                  | Status                  | Action                                                                         |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| MemeFi daily rewards  | 🔴 Required for rewards | Call `POST /api/memefi/cron/daily-rewards` daily (Vercel cron + x-cron-secret) |
| MemeFi weekly rewards | Optional                | Same pattern for weekly pool                                                   |
| Redemption products   | 🔴 Recommended          | Call `POST /api/admin/redemption/seed` for default LMS products                |
| MemeFi config         | Optional                | Admin panel: GET/PATCH `/api/admin/memefi/config`                              |

---

## 4. Gaps Summary

### 4.1 High Priority (Blocking or High Impact)

| Gap                             | Impact               | Recommendation                           |
| ------------------------------- | -------------------- | ---------------------------------------- |
| NEXT_PUBLIC_BACKEND_URL not set | 404 on all API calls | Set in Vercel miniapp, redeploy          |
| CORS_ORIGIN not set             | CORS errors          | Set in backend to include miniapp origin |
| MemeFi cron not scheduled       | No daily rewards     | Set up Vercel cron or external scheduler |

### 4.2 Medium Priority (UX / Completeness)

| Gap                           | Impact                                            | Recommendation        |
| ----------------------------- | ------------------------------------------------- | --------------------- |
| ✅ Saved wallet address       | ✅ **FIXED** — Already shown in Wallet tab        | —                     |
| ✅ School selector in profile | ✅ **FIXED** — Already implemented in Profile tab | —                     |
| Error/empty states            | Generic or blank content                          | UX pass for key flows |

### 4.3 Low Priority (Nice-to-Have)

| Gap                                 | Impact               | Recommendation             |
| ----------------------------------- | -------------------- | -------------------------- |
| Stars per battle, Diamond first win | Transparency         | Show in Arenas or Wallet   |
| Boost duration (days)               | Transparency         | Show next to boost cost    |
| Per-mode energy/cooldown            | Pre-battle clarity   | Show in Arenas mode select |
| Base reward per score               | Formula transparency | Optional in Arenas         |

---

## 5. Launch Checklist (Copy-Paste)

```
Backend
[ ] Backend project deployed (Root: backend)
[ ] MONGO_URI, APP_ENV=prod, CORS_ORIGIN, TELEGRAM_BOT_TOKEN set
[ ] ADMIN_JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH, BATTLE_SEED_SECRET, PUBLIC_BASE_URL set
[ ] GET /health returns 200

Miniapp
[ ] Miniapp project deployed (Root: miniapp)
[ ] NEXT_PUBLIC_BACKEND_URL = backend URL (not miniapp URL)
[ ] Redeployed after env change
[ ] Miniapp loads; Network tab shows API calls to backend (no 404/508)

Telegram
[ ] Bot menu / Web App URL points to miniapp URL
[ ] (Optional) Open app from bot and run one battle

Verify
[ ] Create broker (starter or proxy)
[ ] Run battle → score and rewards shown
[ ] No 404 on economy/me, game-modes, tasks; no 508 on brokers

Post-launch
[ ] MemeFi cron: POST /api/memefi/cron/daily-rewards daily
[ ] Redemption seed: POST /api/admin/redemption/seed (if no products)
[ ] Monitoring: scripts/health-check.js or scripts/monitoring-check.js
```

---

## 6. References

| Doc                                                                                  | Purpose                                 |
| ------------------------------------------------------------------------------------ | --------------------------------------- |
| [LAUNCH-TODAY-ASSESSMENT.md](LAUNCH-TODAY-ASSESSMENT.md)                             | Launch checklist, troubleshooting       |
| [DEEP-ASSESSMENT-APP.md](DEEP-ASSESSMENT-APP.md)                                     | API 404/508 root cause, backend URL fix |
| [MINIAPP-UI-VS-BACKEND-ASSESSMENT.md](MINIAPP-UI-VS-BACKEND-ASSESSMENT.md)           | MemeFi/LMS UI vs backend                |
| [APP-DEEP-ASSESSMENT-AND-UI-REFLECTION.md](APP-DEEP-ASSESSMENT-AND-UI-REFLECTION.md) | Economy data → UI mapping               |
| [API-AND-READINESS-AUDIT.md](API-AND-READINESS-AUDIT.md)                             | API mapping, production checklist       |
| [OPERATIONS.md](OPERATIONS.md)                                                       | Production readiness, monitoring, keys  |
| [DEPLOYMENT-AND-ENV.md](DEPLOYMENT-AND-ENV.md)                                       | Env vars, CORS, mainnet                 |
| [GAPS-SCAN-REPORT.md](GAPS-SCAN-REPORT.md)                                           | App & docs gaps                         |

---

## 7. Conclusion

**Project readiness:** The app is **launchable today** with correct env. Production/mainnet requires keys, monitoring, backups, and operational discipline.

**Miniapp UI vs codebase:** **Well aligned.** MemeFi/LMS UI has been brought in line with backend (feed filters, trending, saved, drafts, reactions, save, appeal, redemption for-me, idempotency, expiresAt). ✅ Saved wallet address and school selector in profile are already implemented. Remaining gaps are optional transparency fields: stars/diamond rewards, boost duration, per-mode energy/cooldown.

**Next steps:**

1. Complete launch checklist (env, Telegram URL)
2. Set up MemeFi cron and redemption seed
3. Add saved wallet display in Wallet/Profile (medium priority)
4. Configure monitoring and backups for production
