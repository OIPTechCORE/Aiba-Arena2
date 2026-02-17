# MemeFi + LMS Implementation Summary

**Phases 1–4 and LMS/school-fees** are implemented. This doc lists what exists and where.

---

## Phase 1 — MemeFi engine

| Component | Location | Notes |
|-----------|----------|--------|
| **Meme model** | `backend/models/Meme.js` | ownerTelegramId, imageUrl, caption, templateId, category, educationCategory, engagementScore, like/comment/share/boost counts, reportCount, hidden. |
| **MemeLike, MemeComment, MemeShare, MemeBoost, MemeReport** | `backend/models/` | Engagement and moderation. |
| **MemeFiConfig** | `backend/models/MemeFiConfig.js` | Scoring weights, daily pool %, boost lock, educationCategories. |
| **Scoring + time decay** | `backend/engine/memefiScoring.js` | Formula: (like×W1 + comment×W2 + internalShare×W3 + externalShare×W4 + boost×mul) × timeDecay. |
| **Upload** | `POST /api/memefi/upload` | imageUrl, caption, templateId, category, educationCategory (client uploads image elsewhere, sends URL). |
| **Like** | `POST /api/memefi/memes/:id/like` | Toggle. |
| **Comment** | `POST /api/memefi/memes/:id/comment` | text. |
| **Share** | `POST /api/memefi/memes/:id/share` | kind: internal \| external. |
| **Boost** | `POST /api/memefi/memes/:id/boost` | amountAiba, amountNeur (off-chain lock; debits user). |
| **Report** | `POST /api/memefi/memes/:id/report` | reason (anti-spam). |
| **Feed** | `GET /api/memefi/feed` | limit, offset, category, educationCategory, sort: recent \| score. |
| **Meme detail** | `GET /api/memefi/memes/:id`, `GET /api/memefi/memes/:id/comments` | Single meme + comments. |
| **Memes tab** | `miniapp/src/app/HomeContent.js` | Feed, create (image URL, caption, category incl. study_humor, exam_tips, school_events, general_edu), detail with Like, Share (in-app + Telegram), Boost (AIBA/NEUR), Comment, Report. |

---

## Phase 2 — Token (daily pool, boost)

| Component | Location | Notes |
|-----------|----------|--------|
| **Daily reward job** | `backend/jobs/memefiDailyRewards.js` | Top N → 40%, Boosters → 20%, Lottery → 10%, Mining → 30%. Credits via creditAibaNoCap/creditNeurNoCap (reasons: memefi_top_meme, memefi_booster, memefi_lottery, memefi_mining). |
| **Trigger cron** | `POST /api/memefi/cron/daily-rewards` | Header `x-cron-secret` or body dayKey. |
| **Boost** | Off-chain lock (MemeBoost model, debit user AIBA/NEUR). | Config: boostLockHours, boostMinAiba in MemeFiConfig. |
| **Earn summary** | `GET /api/memefi/earn-summary` | User’s meme earnings (earnedAiba, earnedNeur, myMemesCount, myBoostsCount). |

---

## Phase 3 — Tabs + leaderboard

| Component | Location | Notes |
|-----------|----------|--------|
| **Memes tab** | `miniapp` tab `memes` | In `TAB_IDS` and `HOME_GRID_IDS` (`miniapp/src/config/navigation.js`). Full UI in HomeContent (feed, create, detail, leaderboard). |
| **Earn tab** | `miniapp` tab `earn` | Earn-from card (battles, referrals, daily, tasks, memes), MemeFi earnings, wallet balance, redemption products, my redemptions. Refreshes economy on tab switch. |
| **Meme leaderboard** | `GET /api/memefi/leaderboard?by=score|creators&limit=&category=&educationCategory=` | Top memes or top creators. |
| **Leaderboard tab** | Global leaderboard + **Meme leaderboard** subsection (top 5 memes, “View all in Memes tab”). | Fetches memefi leaderboard when tab is leaderboard. |

---

## Phase 4 — LMS / school-fees (redemption)

| Component | Location | Notes |
|-----------|----------|--------|
| **RedemptionProduct** | `backend/models/RedemptionProduct.js` | key, name, description, type: school_fee_discount \| lms_premium \| exam_prep \| merch \| custom, costAiba/costNeur/costStars, partnerWebhookUrl, issueCodePrefix, maxRedemptionsPerUser/Total. |
| **Redemption** | `backend/models/Redemption.js` | telegramId, productKey, cost*, code, status (issued/consumed/expired/failed), partnerResponse. |
| **List products** | `GET /api/redemption/products` | Enabled products (public). |
| **Redeem** | `POST /api/redemption/redeem` | productKey. Debits balance; calls partner webhook if set, else issues code. |
| **My redemptions** | `GET /api/redemption/me` | User’s redemption history. |
| **Earn tab** | “Redeem (LMS / school fees)” card | Lists products, Redeem button, shows code/message; “My redemptions” list. |
| **Education categories** | Meme create + feed | study_humor, exam_tips, school_events, general_edu in MemeFiConfig.educationCategories and create dropdown. |

---

## Admin

| Endpoint | Purpose |
|----------|---------|
| **GET /api/admin/memefi/config** | Get MemeFi config (weights, pool %, boost, educationCategories). |
| **PATCH /api/admin/memefi/config** | Update config. |
| **GET /api/admin/redemption/products** | List all redemption products (including disabled). |
| **POST /api/admin/redemption/products** | Create product (key, name, type, cost*, partnerWebhookUrl, etc.). |
| **PATCH /api/admin/redemption/products/:id** | Update product. |
| **POST /api/admin/redemption/seed** | Create default products (school_fee_discount_10, lms_premium_1m, exam_prep_unlock, merch_tee) if none exist. |

---

## Cron (production)

- Call **POST /api/memefi/cron/daily-rewards** once per day (e.g. Vercel cron or external scheduler) with header `x-cron-secret` = your `CRON_SECRET` or `ADMIN_JWT_SECRET`.
- Optional: ensure MemeFiConfig has `dailyPoolAiba` and `dailyPoolNeur` > 0 (via Admin or seed).

---

## Files touched (this pass)

- **Miniapp:** `HomeContent.js` — state (memefiDetailComments, memefiCommentText, memefiBoostAiba/Neur, memefiTop5ForLeaderboard); meme detail (comment, share internal/external, boost, report); feed Share records external; create category general_edu; Earn tab (Earn-from card, refreshEconomy); Leaderboard tab (Meme leaderboard top 5).
- **Backend:** `routes/memefi.js` (ensureUser fix); `routes/adminMemefi.js` (new); `routes/adminRedemption.js` (new); `app.js` (mount admin memefi + redemption).

See also: [MEMEFI-MASTER-STRATEGY-FEASIBILITY.md](MEMEFI-MASTER-STRATEGY-FEASIBILITY.md).
