# Deep assessment & UI reflection

**Purpose:** (1) Deep assessment of the app. (2) Check whether all needed information from backend/docs is reflected in the UI.

---

## 1. Deep assessment of the app

### 1.1 Architecture

| Layer          | Stack                                                 | Notes                                                                                     |
| -------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Frontend**   | Next.js 13 (miniapp), Telegram WebApp SDK, TonConnect | Single-page tabbed UI (HomeContent.js); balance strip, nav, many tabs.                    |
| **Backend**    | Node/Express, MongoDB                                 | 60+ route modules; Telegram auth, economy engine, battle engine, MemeFi, redemption, etc. |
| **Blockchain** | TON (TonConnect, vault, jettons)                      | Claim AIBA on-chain; optional staking/DAO contracts.                                      |
| **Deploy**     | Vercel (miniapp, backend, admin)                      | Env: NEXT_PUBLIC_BACKEND_URL, CORS_ORIGIN, MONGO_URI, etc.                                |

**Risks:** (1) Miniapp must have correct `NEXT_PUBLIC_BACKEND_URL` or API 404/508. (2) Extension/network noise in console (not app bugs). (3) Production: set all env per LAUNCH-TODAY-ASSESSMENT.md.

### 1.2 Feature scope (what exists)

- **Core:** Brokers (create, combine, mint, train, repair, upgrade), arenas/game modes, battle (deterministic score), NEUR/AIBA/Stars/Diamonds economy, vault claim.
- **Social:** Referrals, guilds, leaderboard, MemeFi (memes, like/comment/share/boost), Earn tab, redemption (LMS/school fees).
- **Extensions:** Marketplace, broker rental, car/bike racing, tournaments, global boss, predict, trainers, university, charity, multiverse (NFT/stake), staking, DAO, governance, daily NEUR, premium, gifts (TON + AIBA), P2P AIBA, donate, announcements, support.

### 1.3 Data flow (key APIs → UI)

- **GET /api/economy/me** → `economyMe` state → balance strip (NEUR, AIBA, Stars, Diamonds, verified), Wallet/Profile pills, costs in Brokers/Guilds/Market/Wallet (combine, mint, train, repair, upgrade, TON costs, gift cost, boost profile, etc.).
- **GET /api/game-modes** → arena dropdown (Brokers, Arenas).
- **GET /api/brokers/mine** → broker list, run battle, combine, mint.
- **GET /api/memefi/feed**, **/leaderboard**, **/earn-summary** → Memes tab, Earn tab, Leaderboard meme subsection.
- **GET /api/redemption/products**, **/redemption/me** → Earn tab redemption cards.
- **GET /api/tasks**, **/api/referrals/me**, **/api/daily/status**, etc. → respective tabs.

### 1.4 Gaps and recommendations (non-UI)

- **Cron:** MemeFi daily rewards need `POST /api/memefi/cron/daily-rewards` called daily (e.g. Vercel cron + `x-cron-secret`).
- **Admin:** Use Admin panel to set MemeFi config (GET/PATCH `/api/admin/memefi/config`) and redemption products (POST/PATCH `/api/admin/redemption/products`); optionally `POST /api/admin/redemption/seed` for default LMS products.
- **Launch:** Follow LAUNCH-TODAY-ASSESSMENT.md (backend URL, CORS, Telegram bot URL).

---

## 2. Does all needed information reflect in the UI?

### 2.1 GET /api/economy/me — what is returned vs what is shown

| Field                                                  | Returned | Shown in UI      | Where                                                                                                                                     |
| ------------------------------------------------------ | -------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| neurBalance                                            | ✅       | ✅               | Balance strip, Wallet, Brokers (combine/train/repair), Earn, Donate, Staking, Profile pills.                                              |
| aibaBalance                                            | ✅       | ✅               | Balance strip, Wallet, Brokers (mint/upgrade), Earn, Donate, Staking, Claim, Profile pills.                                               |
| starsBalance                                           | ✅       | ✅               | Balance strip, Wallet (Stars & Diamonds card), Profile pills, Stars Store.                                                                |
| diamondsBalance                                        | ✅       | ✅               | Balance strip, Wallet (Stars & Diamonds card), Profile pills.                                                                             |
| badges                                                 | ✅       | ✅               | Balance strip (verified ✓), Profile card (badge pills), Wallet profile section.                                                           |
| profileBoostedUntil                                    | ✅       | ✅               | Profile card, Wallet overview (boosted until date).                                                                                       |
| wallet                                                 | ✅       | ⚠️ **Not shown** | Saved TON address (for claim recipient). User sees TonConnect “Connect Wallet” but not the last-saved backend `wallet` in Profile/Wallet. |
| economy.combineNeurCost                                | ✅       | ✅               | Brokers tab combine hint.                                                                                                                 |
| economy.mintAibaCost                                   | ✅       | ✅               | Brokers tab mint hint.                                                                                                                    |
| economy.trainNeurCost                                  | ✅       | ✅               | Brokers tab Train button title.                                                                                                           |
| economy.repairNeurCost                                 | ✅       | ✅               | Brokers tab Repair button title.                                                                                                          |
| economy.upgradeAibaCost                                | ✅       | ✅               | Brokers tab Upgrade button title.                                                                                                         |
| economy.createGroupCostTonNano                         | ✅       | ✅               | Guilds (create cost when not top N).                                                                                                      |
| economy.boostGroupCostTonNano                          | ✅       | ✅               | Guilds boost placeholder.                                                                                                                 |
| economy.leaderboardTopFreeCreate                       | ✅       | ✅               | Guilds (top N free create).                                                                                                               |
| economy.createBrokerCostTonNano                        | ✅       | ✅               | Market create broker TON cost.                                                                                                            |
| economy.boostProfileCostTonNano                        | ✅       | ✅               | Wallet/Profile boost cost.                                                                                                                |
| economy.giftCostTonNano                                | ✅       | ✅               | Wallet Gifts cost.                                                                                                                        |
| economy.starRewardPerBattle                            | ✅       | ⚠️ **Not shown** | Config: stars per battle win. Not displayed in Arenas or Wallet.                                                                          |
| economy.diamondRewardFirstWin                          | ✅       | ⚠️ **Not shown** | Config: diamonds on first win. Not displayed in Arenas or Wallet.                                                                         |
| economy.baseRewardAibaPerScore                         | ✅       | ❌ **Not shown** | Reward formula. Optional to show in Arenas/Wallet as “AIBA per score point”.                                                              |
| economy.baseRewardNeurPerScore                         | ✅       | ❌ **Not shown** | Reward formula. Optional to show.                                                                                                         |
| economy.marketplaceDefaultNewBrokerPriceAIBA           | ✅       | ❌ **Not shown** | Default list price. Could show in Market when listing.                                                                                    |
| economy.courseCompletionBadgeMintCostTonNano           | ✅       | ⚠️ **Partial**   | University badge mint uses `universityMintInfo.costTon` (from university API), not this. May be same source.                              |
| economy.fullCourseCompletionCertificateMintCostTonNano | ✅       | ⚠️ **Partial**   | Certificate mint uses `universityMintCertificateInfo.costTon`.                                                                            |
| economy.boostProfileDurationDays                       | ✅       | ❌ **Not shown** | Duration of profile boost (e.g. 7 days). Could show next to boost cost.                                                                   |

### 2.2 Other data → UI

| Data / API                                                                   | Shown in UI                | Note                                                                                   |
| ---------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------- |
| Game modes (arena, league, energy, cooldown)                                 | Arena dropdown labels only | Mode name shown; energy cost / cooldown not in dropdown (could add in hint or detail). |
| Battle result (score, rewardAiba, rewardNeur, starsGranted, firstWinDiamond) | ✅                         | Victory card after battle.                                                             |
| MemeFi (feed, leaderboard, earn-summary)                                     | ✅                         | Memes tab, Earn tab, Leaderboard meme subsection.                                      |
| Redemption products                                                          | ✅                         | Earn tab “Redeem (LMS / school fees)”.                                                 |
| Staking min/periods/APY                                                      | ✅                         | From staking API in Wallet & Staking tabs.                                             |
| Daily status / claim                                                         | ✅                         | Wallet tab.                                                                            |
| Referrals (me, top)                                                          | ✅                         | Home, Referrals.                                                                       |
| Tasks                                                                        | ✅                         | Tasks tab.                                                                             |
| Leaderboard (score, aiba, neur, battles)                                     | ✅                         | Leaderboard tab + meme top 5.                                                          |

### 2.3 Summary: what’s missing or optional in UI

| Item                                                                                          | Priority | Recommendation                                                                                                     |
| --------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| **Saved wallet address** (economyMe.wallet)                                                   | Medium   | Show in Wallet or Profile: “Connected address: 0x…abc” (truncated) so user knows which address is used for claims. |
| **Stars per battle / Diamond first win** (economy.starRewardPerBattle, diamondRewardFirstWin) | Low      | Optionally show in Arenas tab or Wallet: “+X Stars per win”, “+1 Diamond on first win”.                            |
| **Boost duration** (economy.boostProfileDurationDays)                                         | Low      | Show next to boost cost: “Boost for X days”.                                                                       |
| **Base reward per score** (baseRewardAibaPerScore, baseRewardNeurPerScore)                    | Optional | Only if you want to expose formula; e.g. “~Y AIBA per 100 score” in Arenas.                                        |
| **Market default list price** (marketplaceDefaultNewBrokerPriceAIBA)                          | Optional | Show as placeholder or hint when listing a broker.                                                                 |
| **Per-mode energy/cooldown**                                                                  | Optional | Show in Arenas (or on mode select) so user knows cost before running battle.                                       |

### 2.4 Conclusion

- **Most needed information is reflected in the UI:** balances, costs (combine, mint, train, repair, upgrade, TON costs for guilds/market/boost/gifts), badges, profile boost, MemeFi, Earn, redemption, staking, daily, referrals, tasks, leaderboard.
- **Improvements that would align UI with “all needed info”:**
    1. **Show saved wallet** (truncated) in Wallet or Profile when `economyMe.wallet` is set.
    2. Optionally show **Stars per battle** and **Diamond first win** in Arenas or Wallet.
    3. Optionally show **boost duration (days)** next to profile boost cost.
    4. Optionally show **energy cost / cooldown** for the selected arena mode (from game-modes API).

Implementing (1) is the only change that clearly “fills a gap”; (2)–(4) are nice-to-have for transparency.

---

## 3. References

- [DEEP-ASSESSMENT-APP.md](DEEP-ASSESSMENT-APP.md) — API 404/508, backend URL, route audit.
- [LAUNCH-TODAY-ASSESSMENT.md](LAUNCH-TODAY-ASSESSMENT.md) — Launch checklist.
- [GAME-STRUCTURE.md](GAME-STRUCTURE.md) — Game flow and entities.
- [STARS-BADGES-DIAMONDS.md](STARS-BADGES-DIAMONDS.md) — Stars, badges, diamonds (single doc).
- [USER-GUIDE.md](USER-GUIDE.md) — How to play and tab layout.
