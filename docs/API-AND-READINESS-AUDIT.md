# API & User Readiness Audit

**Date:** 2025-02 (updated)  
**Scope:** All miniapp API calls vs backend endpoints; Trainers, Premium, Economy Automation, Referrals metrics; production readiness.

---

## 1. API & Endpoint Audit

### 1.1 Summary

| Category          | Frontend Calls | Backend Routes | Status       |
| ----------------- | -------------- | -------------- | ------------ |
| Brokers           | 6              | 6              | ✅ All match |
| Battle            | 1              | 1              | ✅           |
| Economy           | 2              | 2              | ✅           |
| Wallet            | 1              | 1              | ✅           |
| Daily             | 2              | 2              | ✅           |
| Leaderboard       | 2              | 2              | ✅           |
| Guilds            | 7              | 7              | ✅           |
| Charity           | 5              | 5              | ✅           |
| Announcements     | 1              | 1              | ✅           |
| Comms             | 1              | 1              | ✅           |
| University        | 6              | 6              | ✅           |
| Realms            | 1              | 1              | ✅           |
| Missions          | 2              | 2              | ✅           |
| Mentors           | 5              | 5              | ✅           |
| Assets            | 3              | 3              | ✅           |
| Asset Marketplace | 6              | 6              | ✅           |
| Governance        | 2              | 2              | ✅           |
| DAO               | 3              | 3              | ✅           |
| Referrals         | 3              | 3              | ✅           |
| Vault             | 2              | 2              | ✅           |
| Ads               | 1              | 1              | ✅           |
| Tasks             | 1              | 1              | ✅           |
| Marketplace       | 5              | 5              | ✅           |
| Stars Store       | 3              | 3              | ✅           |
| Boosts            | 3              | 3              | ✅           |
| Staking           | 4              | 4              | ✅           |
| Multiverse        | 6              | 6              | ✅           |
| Car Racing        | 10             | 10             | ✅           |
| Bike Racing       | 10             | 10             | ✅           |
| Gifts             | 3              | 3              | ✅           |
| Trainers          | 8              | 8              | ✅           |
| Premium           | 2              | 2              | ✅           |

**Result: All frontend API calls have corresponding backend routes. No missing endpoints.**

**Trainers:** `me`, `apply`, `network`, `leaderboard`, `profile` (PATCH), `claim-rewards`, `register-use`, `recruit-link`.  
**Economy Automation (admin):** `POST /run`, `GET /allocation`.

---

### 1.2 Proxy & CORS

| Endpoint               | Method | Uses Proxy? | Notes                                                     |
| ---------------------- | ------ | ----------- | --------------------------------------------------------- |
| `/api/brokers/starter` | POST   | **Yes**     | Same-origin proxy to avoid CORS/405 on Vercel+Telegram    |
| All other broker calls | Mixed  | No          | Direct to backend; GET requests typically avoid preflight |

**Recommendation:** If other broker POST endpoints (combine, mint-nft, create-with-ton) fail with 405/CORS in production, extend the Next.js proxy at `miniapp/src/app/api/brokers/[[...path]]/route.js` to handle them.

---

### 1.3 Verified Path Mappings

| Frontend Path                              | Backend Route                    | Method   | Status         |
| ------------------------------------------ | -------------------------------- | -------- | -------------- |
| `/api/leaderboard`                         | leaderboard `/`                  | GET      | ✅             |
| `/api/leaderboard/my-rank`                 | leaderboard `/my-rank`           | GET      | ✅             |
| `/api/tasks`                               | tasks `/`                        | GET      | ✅             |
| `/api/marketplace/listings`                | marketplace `/listings`          | GET      | ✅             |
| `/api/marketplace/system-brokers`          | marketplace `/system-brokers`    | GET      | ✅             |
| `/api/marketplace/buy-system-broker`       | marketplace `/buy-system-broker` | POST     | ✅             |
| `/api/marketplace/list`                    | marketplace `/list`              | POST     | ✅             |
| `/api/marketplace/buy`                     | marketplace `/buy`               | POST     | ✅             |
| `/api/stars-store/config`                  | starsStore `/config`             | GET      | ✅             |
| `/api/stars-store/buy-with-aiba`           | starsStore `/buy-with-aiba`      | POST     | ✅             |
| `/api/stars-store/buy-with-ton`            | starsStore `/buy-with-ton`       | POST     | ✅             |
| `/api/brokers/create-with-ton`             | brokers `/create-with-ton`       | POST     | ✅             |
| `/api/brokers/mine`                        | brokers `/mine`                  | GET      | ✅             |
| `/api/brokers/starter`                     | brokers `/starter`               | POST     | ✅ (via proxy) |
| `/api/brokers/combine`                     | brokers `/combine`               | POST     | ✅             |
| `/api/brokers/mint-nft`                    | brokers `/mint-nft`              | POST     | ✅             |
| `/api/boosts/buy-profile-with-ton`         | boosts `/buy-profile-with-ton`   | POST     | ✅             |
| `/api/boosts/mine`                         | boosts `/mine`                   | GET      | ✅             |
| `/api/boosts/buy`                          | boosts `/buy`                    | POST     | ✅             |
| `/api/gifts/received`                      | gifts `/received`                | GET      | ✅             |
| `/api/gifts/sent`                          | gifts `/sent`                    | GET      | ✅             |
| `/api/gifts/send`                          | gifts `/send`                    | POST     | ✅             |
| `/api/multiverse/*`                        | multiverse                       | Mixed    | ✅             |
| `/api/car-racing/*`                        | carRacing                        | Mixed    | ✅             |
| `/api/bike-racing/*`                       | bikeRacing                       | Mixed    | ✅             |
| `/api/staking/*`                           | staking                          | Mixed    | ✅             |
| `/api/dao/proposals`                       | dao `/proposals`                 | GET/POST | ✅             |
| `/api/dao/vote`                            | dao `/vote`                      | POST     | ✅             |
| `/api/ads`                                 | ads `/`                          | GET      | ✅             |
| `/api/economy/me`                          | economy `/me`                    | GET      | ✅             |
| `/api/economy/claim-aiba`                  | economy `/claim-aiba`            | POST     | ✅             |
| `/api/daily/status`                        | daily `/status`                  | GET      | ✅             |
| `/api/daily/claim`                         | daily `/claim`                   | POST     | ✅             |
| `/api/wallet/connect`                      | wallet `/connect`                | POST     | ✅             |
| `/api/battle/run`                          | battle `/run`                    | POST     | ✅             |
| `/api/guilds/list`                         | guilds `/list`                   | GET      | ✅             |
| `/api/guilds/mine`                         | guilds `/mine`                   | GET      | ✅             |
| `/api/guilds/create`                       | guilds `/create`                 | POST     | ✅             |
| `/api/guilds/:guildId/boost`               | guilds `/:guildId/boost`         | POST     | ✅             |
| `/api/guilds/join`                         | guilds `/join`                   | POST     | ✅             |
| `/api/guilds/deposit-broker`               | guilds `/deposit-broker`         | POST     | ✅             |
| `/api/guilds/withdraw-broker`              | guilds `/withdraw-broker`        | POST     | ✅             |
| `/api/charity/*`                           | charity                          | Mixed    | ✅             |
| `/api/announcements`                       | announcements `/`                | GET      | ✅             |
| `/api/comms/status`                        | app direct                       | GET      | ✅             |
| `/api/university/*`                        | university                       | Mixed    | ✅             |
| `/api/realms`                              | realms `/`                       | GET      | ✅             |
| `/api/missions`                            | missions `/`                     | GET      | ✅             |
| `/api/mentors/*`                           | mentors                          | Mixed    | ✅             |
| `/api/assets/*`                            | assets                           | Mixed    | ✅             |
| `/api/asset-marketplace/*`                 | assetMarketplace                 | Mixed    | ✅             |
| `/api/governance/*`                        | governance                       | Mixed    | ✅             |
| `/api/referrals/*`                         | referrals                        | Mixed    | ✅             |
| `/api/vault/*`                             | vault                            | Mixed    | ✅             |
| `/api/trainers/me`                         | trainers `/me`                   | GET      | ✅             |
| `/api/trainers/apply`                      | trainers `/apply`                | POST     | ✅             |
| `/api/trainers/network`                    | trainers `/network`              | GET      | ✅             |
| `/api/trainers/leaderboard`                | trainers `/leaderboard`          | GET      | ✅             |
| `/api/trainers/profile`                    | trainers `/profile`              | PATCH    | ✅             |
| `/api/trainers/claim-rewards`              | trainers `/claim-rewards`        | POST     | ✅             |
| `/api/trainers/register-use`               | trainers `/register-use`         | POST     | ✅             |
| `/api/trainers/recruit-link`               | trainers `/recruit-link`         | GET      | ✅             |
| `/api/premium/status`                      | premium `/status`                | GET      | ✅             |
| `/api/premium/buy`                         | premium `/buy`                   | POST     | ✅             |
| `/api/admin/economy-automation/run`        | economyAutomation `/run`         | POST     | ✅             |
| `/api/admin/economy-automation/allocation` | economyAutomation `/allocation`  | GET      | ✅             |
| `/api/admin/referrals/metrics`             | adminReferrals `/metrics`        | GET      | ✅             |

---

## 2. User Readiness Audit

### 2.1 Production Checklist

| Item                         | Status    | Notes                                                                                                                                                                                 |
| ---------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend env (production)** | ⚠️ Verify | `MONGO_URI`, `APP_ENV=prod`, `CORS_ORIGIN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_INITDATA_MAX_AGE_SECONDS`, `ADMIN_JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `BATTLE_SEED_SECRET` |
| **Miniapp env**              | ⚠️ Verify | `NEXT_PUBLIC_BACKEND_URL` = backend URL (required for broker proxy)                                                                                                                   |
| **CORS**                     | ⚠️ Verify | Backend `CORS_ORIGIN` must include miniapp origin (e.g. `https://aiba-arena2.vercel.app`)                                                                                             |
| **Telegram bot**             | ⚠️ Verify | Menu/link opens miniapp; token in backend                                                                                                                                             |
| **Production readiness**     | ✅        | `enforceProductionReadiness()` runs at startup; fails if critical vars missing                                                                                                        |

---

### 2.2 Functional Readiness

| Feature                | Readiness           | Gaps                                                                                                  |
| ---------------------- | ------------------- | ----------------------------------------------------------------------------------------------------- |
| **Auth**               | ✅                  | Telegram initData; x-telegram-id fallback for dev                                                     |
| **Error handling**     | ✅                  | getErrorMessage, status messages, try/catch                                                           |
| **Loading states**     | ✅                  | `busy` flag disables buttons during requests                                                          |
| **Broker creation**    | ✅                  | Proxy fixes 405; requireTelegram on backend                                                           |
| **Battle flow**        | ✅                  | Run battle, claim, economy refresh                                                                    |
| **Marketplace**        | ✅                  | List, buy, system brokers                                                                             |
| **Guilds**             | ✅                  | Create, join, deposit/withdraw brokers, boost                                                         |
| **Staking/Multiverse** | ✅                  | Stake, unstake, claim                                                                                 |
| **Car/Bike racing**    | ✅                  | Config, create, buy, enter                                                                            |
| **University**         | ✅                  | Courses, progress, mint badges                                                                        |
| **Charity**            | ✅                  | Campaigns, donate, leaderboard                                                                        |
| **Vault/Claims**       | ⚠️ Config-dependent | Needs `ARENA_VAULT_ADDRESS`, `AIBA_JETTON_MASTER`, `ORACLE_*`, `TON_PROVIDER_URL` for on-chain claims |
| **TON payments**       | ⚠️ Config-dependent | Various TON wallets (GIFTS_WALLET, BOOST_GROUP_WALLET, etc.) for buy-with-TON flows                   |
| **Trainers**           | ✅                  | Portal `/trainer`; network, leaderboard, dashboard; viral recruitment; profile editor                 |
| **Invite-3 unlock**    | ✅                  | 1% battle bonus when user has 3+ referrals; config `referralUnlock3BonusBps`                          |
| **K-factor metrics**   | ✅                  | `GET /api/admin/referrals/metrics` — K estimate, avg refs, conversion hint                            |

---

### 2.3 Known Gaps / Recommendations

1. **Broker proxy scope**  
   Only `/api/brokers/starter` uses the proxy. If `create-with-ton`, `combine`, or `mint-nft` return 405/CORS in production, add them to the proxy or extend the proxy to forward all broker POST requests.

2. **Vault/claims**  
   On-chain AIBA claims require vault + oracle config. If not set, users can still earn off-chain credits; claims will fail with a clear message.

3. **Asset marketplace model**  
   Assets use `User` model and `ownerId`; economy uses `telegramId`. Ensure User documents exist for Telegram users before asset flows.

4. **Missions response shape**  
   Frontend expects `res.data?.missions`; backend returns `{ missions: [...] }` → ✅ matches.

5. **Mentors response shape**  
   Frontend expects `res.data?.mentors`; backend returns `{ mentors }` → ✅ matches.

---

### 2.4 Deployment Verification

Before going live:

1. **Backend**
    - `GET /health` → `{ ok: true }`
    - `GET /api/comms/status` → `{ status: 'operational' }`
    - Test one auth-required call (e.g. `POST /api/brokers/starter`) from Telegram WebApp

2. **Miniapp**
    - Opens in Telegram
    - Balance strip loads (economy/me)
    - New broker button works (proxy)
    - Run battle completes

3. **Env**
    - Backend: All required vars per `docs/DEPLOYMENT-AND-ENV.md`
    - Miniapp: `NEXT_PUBLIC_BACKEND_URL` points to deployed backend

---

## 3. Conclusion

**APIs:** All miniapp API calls map to existing backend endpoints. No missing or incorrect routes.

**Readiness:** The app is functionally ready for users provided:

- Backend and miniapp env are correctly set (see DEPLOYMENT-AND-ENV.md)
- CORS includes the miniapp origin
- New broker flow works via the proxy
- Optional features (vault, TON payments) require their respective env vars
