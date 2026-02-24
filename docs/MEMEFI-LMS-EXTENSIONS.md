# MemeFi & LMS — Ways to Extend (Deepest)

Deep, concrete extension paths for MemeFi and LMS/redemption, aligned with your current models, routes, and config. Each section lists **what you have**, **extension ideas**, and **where to touch the code**. The second half adds **dependencies & build order**, **deep implementation notes** (schema, API, steps, edge cases), **alternatives & tradeoffs**, **security & abuse**, **edge cases & failure handling**, and **performance & scale**.

---

## Implementation status of extensions (backend & frontend)

**Backend: P0–P5 are implemented.** The following exist in the repo:

| Phase  | What's implemented                                                                                                                      | Where                                                                                                                                                                         |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0** | MemeFiDailyRun, idempotent daily job; Redemption expiresAt + Product codeValidityDays; idempotency key; webhook retry + signing         | `models/MemeFiDailyRun.js`, `jobs/memefiDailyRewards.js`, `models/Redemption.js`, `models/RedemptionProduct.js`, `routes/redemption.js`                                       |
| **P1** | Meme tags, status, publishedAt; MemeReaction, MemeSave; educationWeights, reactionWeights, autoHideReportThreshold; auto-hide on report | `models/Meme.js`, `models/MemeReaction.js`, `models/MemeSave.js`, `models/MemeFiConfig.js`, `engine/memefiScoring.js`, `routes/memefi.js`                                     |
| **P2** | School/Course models; Meme/User schoolId/courseId; admin School & Course CRUD                                                           | `models/School.js`, `models/Course.js`, `routes/adminSchools.js` (GET/POST/PATCH/DELETE schools, courses)                                                                     |
| **P3** | Per-category pools, weekly pool (MemeFiWeeklyRun), cap per user per day, trending API                                                   | `jobs/memefiDailyRewards.js`, `jobs/memefiWeeklyRewards.js`, `models/MemeFiWeeklyRun.js`, `models/MemeFiConfig.js`, `routes/memefi.js` (feed?window=, /trending, leaderboard) |
| **P4** | Eligibility (min Aiba/Neur, course, school); batch codes (RedemptionCodeBatch); partner dashboard                                       | `routes/redemption.js`, `models/RedemptionCodeBatch.js`, `routes/partnerRedemption.js` (GET /api/partner/redemptions, auth by partnerApiKey)                                  |
| **P5** | Appeal (MemeAppeal, POST appeal, admin resolve); trusted creator (User.memefiTrusted); leaderboard schoolId; education badge job        | `models/MemeAppeal.js`, `routes/memefi.js`, `models/User.js`, `jobs/memefiEducationBadge.js`, MemeFiConfig educationCreatorBadgeMin\*                                         |

**Frontend:** Miniapp may not yet expose all of the above (e.g. school selector, appeal button, partner dashboard UI). Base MemeFi + LMS UI is in [MEMEFI-LMS-IMPLEMENTATION.md](MEMEFI-LMS-IMPLEMENTATION.md).

To extend further, use Part B (schema, steps, edge cases) and the dependency order in section 0.

---

## How to use this doc

- **Sections 1–10:** Browse by area; use the tables for "what to add" and "where."
- **Dependencies & build order:** Plan sprints; build prerequisites first.
- **Deep implementation notes:** Copy-paste-ready schema, API contracts, and step-by-step for selected extensions.
- **Alternatives / Security / Edge cases / Performance:** Use when designing or hardening a specific extension.

---

## 0. Dependencies & build order

Implement in this order so later work doesn’t block or require rework.

| Phase                         | Extensions                                                                                                | Why this order                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **P0 (foundation)**           | Idempotent daily job; Redemption `expiresAt` + code expiry; Webhook retry + idempotency (redemption)      | Prevents double-credit and redemption bugs; unblocks partner/school work. |
| **P1 (content & engagement)** | Hashtags/tags; Draft/publish; Reactions or Save; Category-specific weights; Auto-hide by report threshold | Improves content and scoring without new entities.                        |
| **P2 (entities)**             | School/course models; Meme.`schoolId`/`courseId`; User.`schoolId`                                         | Required for school leaderboard, school-scoped products, education badge. |
| **P3 (rewards & discovery)**  | Per-educationCategory pools; Weekly pool; Cap per user per day; Trending window; Redis leaderboard cache  | Builds on existing daily job and feed.                                    |
| **P4 (redemption depth)**     | Eligibility rules; Batch codes; Partner signing; Partner dashboard                                        | Depends on stable redeem flow (P0).                                       |
| **P5 (education & trust)**    | Leaderboard per school; School-specific products; Educational creator badge; Appeal flow; Trusted creator | Depends on School entity (P2).                                            |
| **P6 (optional)**             | For-you feed; Video/GIF; Templates library; MemeFi staking; Viral meme NFT                                | Can run in parallel after P3.                                             |

**Cross-deps:** School/course → leaderboard per school, school-scoped products, education badge. Idempotent cron → safe to add weekly and per-category pools. Partner retry + idempotency → then signing and partner dashboard.

---

## 1. MemeFi content & creation

### What you have

- **Meme model:** `ownerTelegramId`, `imageUrl`, `caption`, `templateId`, `category`, `educationCategory`, `watermarkApplied`, engagement counts, `hidden`/`hiddenReason`.
- **Upload:** `POST /api/memefi/upload` — image URL + caption + category + educationCategory (client uploads image elsewhere).
- **MemeFiConfig:** `educationCategories` array (study_humor, exam_tips, school_events, general_edu).

### Extensions

| Extension                     | What to add                                                            | Where                                                                                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Templates library**         | Predefined overlays/frames; user picks `templateId` and uploads image. | Meme model already has `templateId`. Add `GET /api/memefi/templates` (list), admin CRUD for templates (image URL, name, category). Miniapp: template picker in create flow. |
| **Video / GIF memes**         | Support `videoUrl` or `mediaType: image \| video \| gif`.              | Meme schema: add `videoUrl`, `mediaType`; feed/detail render video player; scoring unchanged (same engagement). Optional: separate `weightVideoView` in config.             |
| **AI-generated caption**      | Suggest or generate caption from image.                                | Optional server route `POST /api/memefi/suggest-caption` (call your or external vision API); or client-only placeholder. No schema change.                                  |
| **Server-side watermark**     | Apply watermark before storing URL.                                    | After upload: fetch image, apply watermark (sharp/jimp), upload to Blob/S3, save new URL; set `watermarkApplied: true`. Job or inline in upload route.                      |
| **More education categories** | Add categories per school/region.                                      | MemeFiConfig.`educationCategories` is already an array; admin PATCH to add (e.g. `physics_memes`, `math_exam`). Meme create dropdown and feed filter already key off this.  |
| **Hashtags / tags**           | Search and filter by hashtag.                                          | Meme schema: `tags: [String]` (indexed). Parse caption for `#tag` or separate tag input. Feed: `GET /api/memefi/feed?tag=exam`; leaderboard by tag.                         |
| **Draft / schedule**          | Save meme as draft; publish later or at time.                          | Meme schema: `status: draft \| published`, `publishedAt`. Feed only `status: published`. Cron or manual "Publish" sets `publishedAt` and status.                            |

---

## 2. MemeFi engagement & scoring

### What you have

- **Engagement:** Like (toggle), Comment, Share (internal/external), Boost (AIBA/NEUR lock), Report.
- **Scoring:** `memefiScoring.js` — `(like×W1 + comment×W2 + internalShare×W3 + externalShare×W4 + boost×mul) × timeDecay`; config weights + `timeDecayHalfLifeHours`.
- **MemeFiConfig:** `weightLike`, `weightComment`, `weightInternalShare`, `weightExternalShare`, `boostMultiplierPerUnit`, `timeDecayHalfLifeHours`.

### Extensions

| Extension                                   | What to add                                                      | Where                                                                                                                                                                                                                                                |
| ------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Reactions beyond like**                   | Emoji reactions (e.g. funny, educational, fire).                 | New model `MemeReaction` (memeId, telegramId, reactionType); one reaction per user per meme (replace on change). Score: sum reaction counts × optional per-type weight in config. `recomputeMemeScore` and feed/leaderboard include reaction counts. |
| **Save / bookmark**                         | Users save memes to "My saved".                                  | New model `MemeSave` (memeId, telegramId). `POST/GET /api/memefi/memes/:id/save` (toggle), `GET /api/memefi/me/saved`. Optional: small score bonus for "saved" count in config.                                                                      |
| **Remix / duet**                            | "Create meme inspired by this one" (link to original).           | Meme schema: `parentMemeId` (ref). Upload accepts `parentMemeId`; feed can show "Remixes" on detail. Optional: extra score or badge for remixes of top memes.                                                                                        |
| **Category- or education-specific weights** | Different scoring weights per `educationCategory`.               | MemeFiConfig: `educationWeights: { study_humor: { weightLike: 1.2 }, ... }` (optional overrides). In `computeEngagementScore`, if meme.educationCategory and config has overrides, use those weights.                                                |
| **Quality / moderation in score**           | Penalize reported memes; bonus for "verified" or high retention. | In scoring: apply multiplier from `reportCount` (e.g. `max(0, 1 - reportCount * 0.1)`) or from `hidden` (score = 0). Optional: `qualityBonus` from admin or from "educational" badge.                                                                |
| **Trending window**                         | Leaderboard for "last 6h" or "this week".                        | Feed/leaderboard: add `window=6h                                                                                                                                                                                                                     | 24h | 7d`; filter memes by `createdAt` in window; sort by engagementScore. Same daily pool can stay UTC-day; "trending" is display-only. |
| **View count**                              | Count unique views (optional for score).                         | Meme schema: `viewCount`; `POST /api/memefi/memes/:id/view` (idempotent per user). Optional: add `weightView` in config and include in formula.                                                                                                      |

---

## 3. MemeFi rewards & distribution

### What you have

- **Daily pool:** One run per UTC day; 40% top N, 20% boosters, 10% lottery (engagers), 30% mining (creators who posted that day). `memefiDailyRewards.js` uses `creditAibaNoCap`/`creditNeurNoCap` with reasons.
- **MemeFiConfig:** `dailyPoolAiba`, `dailyPoolNeur`, `poolPct*`, `topN`, `lotteryWinnersCount`.

### Extensions

| Extension                           | What to add                                                                | Where                                                                                                                                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Weekly / monthly pools**          | Extra distribution for "best of week/month".                               | New job `memefiWeeklyRewards.js`: aggregate memes in week by engagementScore, pay top N from a separate pool (config: `weeklyPoolAiba`, `weeklyTopN`). Cron weekly. Same economy helpers.                              |
| **Per-educationCategory pools**     | Separate daily pool per `educationCategory`.                               | Config: `categoryPools: { study_humor: { dailyPoolAiba: 500 }, ... }`. In daily job, for each category with pool, run same top/booster/lottery/mining logic scoped to that category.                                   |
| **Creator tiers**                   | Higher % for "gold" creators (e.g. by total historical earnings or score). | User or new `MemeCreatorStats`: totalEarnedAiba, totalEarnedNeur, memeCount. In daily job, when crediting top/mining, multiply by tier multiplier (e.g. 1.2 for gold). Config: `tierThresholds` and `tierMultipliers`. |
| **Lottery from commenters/sharers** | Include comment and share activity in lottery pool, not only likes.        | In `memefiDailyRewards.js`, aggregate MemeComment and MemeShare by telegramId for the day, merge with MemeLike, then `$sample`. Or separate lottery buckets (e.g. 5% likes, 5% comments).                              |
| **Cap per user per day**            | Limit how much one user can earn from MemeFi in one day.                   | Before each `creditAibaNoCap`/`creditNeurNoCap`, sum LedgerEntry for that user that day with reason memefi\_\*; if over cap, skip or reduce. Config: `maxAibaPerUserPerDay`, `maxNeurPerUserPerDay`.                   |
| **On-chain boost**                  | Lock boost on-chain (e.g. TON contract) instead of off-chain only.         | New flow: user approves lock in wallet; backend records lock proof (tx hash or contract state); daily job treats on-chain boost same as MemeBoost for booster share. Larger change; off-chain first is done.           |

---

## 4. MemeFi discovery, feed & leaderboard

### What you have

- **Feed:** `GET /api/memefi/feed` — limit, offset, category, educationCategory, sort: recent | score.
- **Leaderboard:** `GET /api/memefi/leaderboard?by=score|creators&limit=&category=&educationCategory=`; Leaderboard tab shows top 5 memes + link to Memes tab.

### Extensions

| Extension                        | What to add                                            | Where                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **"For you" / personalized**     | Rank by engagement + affinity (what user liked/saved). | Feed: optional `forYou=true`; backend aggregates user's past likes/saves, boost similar categories or creators; merge with score sort. Simple: boost memes from creators user liked. |
| **Trending tab**                 | Dedicated trending (e.g. last 6h/24h by score).        | Reuse feed with `sort=score` and `createdAt` filter; or new endpoint `GET /api/memefi/trending?window=6h`. Miniapp: "Trending" filter or sub-tab.                                    |
| **Search**                       | Search caption or tags.                                | `GET /api/memefi/feed?q=...` — text search on caption (and tags if added). MongoDB text index on Meme (caption, tags).                                                               |
| **Leaderboard by school/course** | If you add school/course IDs.                          | Meme or User: `schoolId` / `courseId`. Leaderboard: `?schoolId=...` filter. Config or admin for list of schools.                                                                     |
| **Redis cache for leaderboard**  | Hot path: top 100 memes by score.                      | Cache result of leaderboard query in Redis with TTL (e.g. 60s); invalidate on new engagement or recompute. Reduces DB load.                                                          |

---

## 5. MemeFi moderation & trust

### What you have

- **Report:** `POST /api/memefi/memes/:id/report` (reason); Meme has `reportCount`, `hidden`, `hiddenReason`.
- **Hidden:** Admin or logic can set `hidden: true` so meme is excluded from feed and daily pool.

### Extensions

| Extension                         | What to add                                        | Where                                                                                                                                                                          |
| --------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Auto-hide by report threshold** | Auto-set `hidden: true` when `reportCount >= N`.   | Config: `autoHideReportThreshold`. After each report, update reportCount; if >= threshold, set hidden and hiddenReason.                                                        |
| **Appeal flow**                   | Creator can appeal hidden meme.                    | Redemption or new collection: `MemeAppeal` (memeId, telegramId, reason, status: pending \| approved \| rejected). Admin route to resolve; if approved, set hidden=false.       |
| **Trusted creator badge**         | Certain users bypass auto-hide or get score bonus. | User or new field: `memefiTrusted: Boolean` (set by admin). In auto-hide logic, skip if trusted; optional in scoring.                                                          |
| **Report reason taxonomy**        | Structured reasons for analytics and auto-action.  | Report already has reason; enum or config list (spam, inappropriate, copyright, other). Admin dashboard: report counts by reason; optional auto-hide only for certain reasons. |

---

## 6. LMS & redemption — products & eligibility

### What you have

- **RedemptionProduct:** key, name, description, type (school_fee_discount, lms_premium, exam_prep, merch, custom), costAiba/costNeur/costStars, partnerWebhookUrl, issueCodePrefix, maxRedemptionsPerUser/Total, metadata.
- **Redemption:** telegramId, productKey, cost\*, code, status (issued, consumed, expired, failed), partnerResponse.
- **Flow:** Debit balance → call partner webhook or generate code → create Redemption.

### Extensions

| Extension                              | What to add                                                         | Where                                                                                                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **New product types**                  | e.g. certificate, event_ticket, book, subscription.                 | Add to RedemptionProduct.type enum: `certificate`, `event_ticket`, `book`, `subscription`. No logic change; partner webhook or issueCodePrefix can differ per type.                              |
| **Eligibility rules**                  | Require min AIBA/NEUR, or completed University course.              | RedemptionProduct: `eligibilityMinAiba`, `eligibilityMinNeur`, `eligibilityCourseId` (optional). In redeem route, before debit, check user balance and (if you have progress) course completion. |
| **School- or partner-scoped products** | Products visible only to certain schools or after partner auth.     | RedemptionProduct: `schoolId` or `partnerId` (optional). List products: filter by user's school (if User.schoolId) or by partner. Admin creates per-school products.                             |
| **Code expiry**                        | Codes valid only for N days.                                        | Redemption: `expiresAt`. When issuing, set expiresAt = now + product.codeValidityDays. Partner or user checks expiry; optional status transition to 'expired' via cron or on use.                |
| **Batch codes (school)**               | Admin uploads a batch of codes for one product; redeem assigns one. | New model `RedemptionCodeBatch` (productKey, codes[], assignedAt). Redeem: take first unassigned code, assign to Redemption. When batch empty, reject or fall back to generate.                  |
| **Multi-use codes**                    | One code many users can use (e.g. event link).                      | RedemptionProduct: `multiUse: true`, `multiUseMax: number`. Redemption stores code; don't mark code as consumed; count redemptions per code; stop when multiUseMax reached.                      |

---

## 7. LMS & redemption — partner integration

### What you have

- **Partner webhook:** POST to partnerWebhookUrl with payload (telegramId, productKey, cost\*, timestamp, partnerPayloadTemplate); expect code/coupon in response; on failure, refund and return 502.
- **partnerPayloadTemplate:** Merged into payload.

### Extensions

| Extension                         | What to add                                                        | Where                                                                                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Webhook retry**                 | Retry partner call on 5xx or timeout.                              | In redemption route: wrap axios in retry (e.g. 2 retries, backoff). Or queue job "partner_redeem" and worker retries; on final failure, refund and set status failed.      |
| **Idempotency**                   | Same user + productKey + idempotency key → return same redemption. | Redemption: `idempotencyKey` (unique per user+product+key). Client sends header or body idempotencyKey; if exists, return existing redemption.                             |
| **Webhook signing**               | Partner verifies request is from you.                              | Compute HMAC of payload with shared secret; send header `X-Webhook-Signature`. Product or global config: `partnerWebhookSecret`. Partner verifies before issuing code.     |
| **Partner response schema**       | Standardize code/coupon/url.                                       | Document expected response: `{ code?, coupon?, redemptionCode?, url?, expiresAt? }`. Backend already reads code/coupon/redemptionCode; add url for "open this link" flows. |
| **Partner dashboard (read-only)** | Partner sees redemptions for their products.                       | New auth: partner API key per product or partnerId. `GET /api/partner/redemptions?productKey=...` (only their products). Use for reconciliation.                           |

---

## 8. Education × MemeFi (schools & courses)

### What you have

- **Meme:** educationCategory (study_humor, exam_tips, school_events, general_edu).
- **Redemption:** school_fee_discount, lms_premium, exam_prep, merch.

### Extensions

| Extension                               | What to add                                                                | Where                                                                                                                                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **School/course entities**              | Link memes and users to schools/courses.                                   | New models: School (name, slug, metadata), Course (schoolId, name, slug). Meme: optional `schoolId`, `courseId`. User: optional `schoolId`. Admin or partner creates schools/courses. |
| **Leaderboard per school**              | Top memes and creators per school.                                         | Leaderboard API: `?schoolId=...`. Filter Meme by schoolId; same aggregation. Miniapp: school selector (if user has school) or public school list.                                     |
| **"Educational creator" badge**         | Badge for users who often post in education categories and get high score. | Compute from Meme: count memes in educationCategory, sum engagementScore; if above threshold, set User badge or MemeCreatorStats.educationBadge. Display in profile and leaderboard.  |
| **School-specific redemption products** | school_fee_discount only for School X.                                     | RedemptionProduct: `schoolId`. List products: filter by user.schoolId. Partner webhook receives schoolId for correct discount.                                                        |
| **LMS progress ↔ redemption**           | Unlock redemption after completing a University module.                    | RedemptionProduct: `requiredModuleId` or `requiredCourseId`. Redeem route: check University progress (your existing progress API); if not completed, 403.                             |

---

## 9. Token & governance (MemeFi-specific)

### What you have

- Boost = off-chain lock (MemeBoost, debit user). Economy: AIBA/NEUR credited via LedgerEntry.

### Extensions

| Extension                  | What to add                                         | Where                                                                                                                                                                 |
| -------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Governance over pool %** | DAO proposal to change poolPctTop10, etc.           | Store MemeFiConfig pool % in a table that can be updated by governance; or snapshot config at proposal execution. Existing DAO creates proposal type "memefi_config". |
| **MemeFi staking**         | Stake AIBA to earn a share of MemeFi pool or bonus. | New product or staking pool: "Stake X AIBA for 30d → get Y% of daily MemeFi booster pool." Distribution job credits stakers. Reuse existing staking patterns.         |
| **Viral meme NFT**         | Mint top meme as NFT (one-time).                    | When meme wins daily top 1 or weekly top 1, offer creator "Mint as NFT" (pay AIBA or free); same broker-mint flow but for Meme; store memeId and NFT address on Meme. |

---

## 10. Operational & analytics

### What you have

- Admin: MemeFi config GET/PATCH; Redemption products CRUD + seed. Cron: daily MemeFi rewards.

### Extensions

| Extension                          | What to add                                         | Where                                                                                                                                                                                     |
| ---------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin: bulk product import**     | CSV/JSON upload for many RedemptionProducts.        | Admin route `POST /api/admin/redemption/products/bulk` (body: array of product objects). Validate and insert; return created/errors.                                                      |
| **Redemption report**              | Export redemptions by product, date range.          | `GET /api/admin/redemption/report?productKey=&from=&to=` → CSV or JSON. Aggregate Redemption by productKey, status; optional group by day.                                                |
| **MemeFi analytics**               | Engagement funnel, top creators, pool distribution. | Admin or internal: dashboard that queries Meme (count by day, by category), MemeBoost (volume), LedgerEntry (memefi\_\* reasons). Optional: store daily snapshot in Analytics collection. |
| **Cron: timezone or multi-window** | Run "daily" at different times per region.          | Keep UTC day; optional second job "memefiDailyRewardsLocal" with timezone offset (e.g. Asia/Kolkata start of day) and separate pool config. More complex; usually one UTC day is enough.  |
| **Idempotent daily job**           | Avoid double-credit if cron runs twice.             | Store in MemeFiDailyRun (dayKey, status, completedAt). At start of run, if dayKey exists and status completed, return early. After success, upsert completed.                             |

---

## Summary table (quick reference)

| Area           | Extensions (high level)                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Content**    | Templates, video/GIF, AI caption, watermark, hashtags, draft/publish, more categories                             |
| **Engagement** | Reactions, save/bookmark, remix, category weights, quality penalty, trending window, view count                   |
| **Rewards**    | Weekly/monthly pools, per-category pools, creator tiers, lottery from comment/share, per-user cap, on-chain boost |
| **Discovery**  | For-you feed, trending tab, search, leaderboard by school                                                         |
| **Moderation** | Auto-hide threshold, appeal flow, trusted creator, report taxonomy                                                |
| **Redemption** | New types, eligibility rules, school-scoped products, code expiry, batch codes, multi-use codes                   |
| **Partner**    | Webhook retry, idempotency, signing, response schema, partner dashboard                                           |
| **Education**  | School/course entities, leaderboard per school, education badge, school products, LMS progress gate               |
| **Token**      | Governance over config, MemeFi staking, viral meme NFT                                                            |
| **Ops**        | Bulk product import, redemption report, MemeFi analytics, idempotent cron                                         |

---

# Part B — Deep implementation, security, operations

---

## Deep implementation notes (schema, API, steps, edge cases)

### 1. Content — Hashtags, draft/publish, video

**Hashtags (Meme.tags)**

- Schema: `tags: [{ type: String, trim: true }]`, index: `MemeSchema.index({ tags: 1 })`; optional compound `{ tags: 1, engagementScore: -1 }` for leaderboard by tag.
- Steps: (1) Add field, default `[]`. (2) In upload: parse caption for `#word` (regex `/#(\w+)/g`) and/or accept `tags: string[]` in body; normalize to lowercase, max 10 tags, max 30 chars each. (3) Feed: `?tag=exam` → `{ tags: tag }`. (4) Backfill: optional migration setting `tags: []` for existing memes.
- Edge cases: empty tag after trim → skip; duplicate tags → dedupe; tags not in allowlist → allow anyway (or add MemeFiConfig.tagAllowlist).

**Draft / publish**

- Schema: `status: { type: String, enum: ['draft', 'published'], default: 'draft' }`, `publishedAt: { type: Date, default: null }`.
- Steps: (1) Add fields; default existing memes to `published` and `publishedAt: createdAt`. (2) Upload: allow `status: 'draft'`; feed and daily job filter `status: 'published'`. (3) `PATCH /api/memefi/memes/:id/publish` (owner only) sets `status: 'published'`, `publishedAt: new Date()`. (4) Scheduled publish: cron every 5m checks Meme with `status: 'scheduled'` and `scheduledFor <= now` → publish (optional).
- Edge case: draft must not appear in leaderboard or pool; recompute score only after publish if you use `publishedAt` in time decay.

**Video / GIF**

- Schema: `videoUrl: { type: String, default: '' }`, `mediaType: { type: String, enum: ['image', 'video', 'gif'], default: 'image' }`.
- Steps: (1) Add fields. (2) Upload: if `videoUrl` present, set `mediaType: 'video'` or `'gif'` from body or detect from URL/header. (3) Feed/detail: render `<video>` when `mediaType !== 'image'`; fallback image for thumbnail. (4) Scoring: unchanged unless you add `weightVideoView` and Meme.viewCount + view endpoint.

---

### 2. Engagement — Reactions, save, category weights, auto-hide

**Reactions (MemeReaction)**

- Schema: `MemeReactionSchema = { memeId: ObjectId, ref: 'Meme', telegramId: String, reactionType: String }`, unique compound index `(memeId, telegramId)` (one reaction per user per meme; replace on change).
- Steps: (1) Create model. (2) `POST /api/memefi/memes/:id/reaction` body `{ reactionType: 'fire'|'funny'|'edu' }` — upsert reaction, then recompute meme score. (3) MemeFiConfig: `reactionWeights: { fire: 1, funny: 1, edu: 1.2 }`. In `computeEngagementScore`, aggregate reaction counts (or store counts on Meme: `reactionCounts: { fire: 0, funny: 0 }` updated on reaction change). (4) Feed: include reactionCounts; detail: show picker and counts.
- Edge case: reactionType not in config → treat as 1; delete reaction → decrement count and recompute.

**Save / bookmark (MemeSave)**

- Schema: `MemeSaveSchema = { memeId: ObjectId, telegramId: String }`, unique `(memeId, telegramId)`.
- Steps: (1) Create model. (2) `POST /api/memefi/memes/:id/save` toggle (add if not exists, delete if exists). (3) `GET /api/memefi/me/saved?limit=&offset=` list saved meme IDs or full memes. (4) Optional: Meme.savedCount or aggregate on read; optional weightSaved in config for score.
- Edge case: meme deleted/hidden → 404 or exclude from saved list.

**Category-specific weights**

- MemeFiConfig: `educationWeights: { study_humor: { weightLike: 1.2, weightComment: 2 }, ... }` (optional overrides).
- In `computeEngagementScore(meme, cfg)`: if `meme.educationCategory && cfg.educationWeights?.[meme.educationCategory]`, use those weights; else use global cfg weights.
- Edge case: unknown category in config → fallback to global.

**Auto-hide by report threshold**

- MemeFiConfig: `autoHideReportThreshold: { type: Number, default: 0 }` (0 = off).
- In report route after `Meme.updateOne` incrementing reportCount: read meme again; if `reportCount >= autoHideReportThreshold`, `Meme.updateOne({ _id }, { $set: { hidden: true, hiddenReason: 'auto_hide_report_threshold' } })`.
- Edge case: trusted creator (User.memefiTrusted) → skip auto-hide (check before set).

---

### 3. Rewards — Idempotent daily job, weekly pool, per-category pools, cap per user

**Idempotent daily job**

- Model: `MemeFiDailyRunSchema = { dayKey: String, unique, status: 'running'|'completed'|'failed', completedAt: Date, resultSummary: Object }`.
- Steps: (1) At start of `runDailyMemeFiRewards(dayKey)`, `findOneAndUpdate({ dayKey }, { $set: { status: 'running' } }, { upsert: true })`. If doc already existed with status `completed`, return existing result (or skip). (2) On success: `updateOne({ dayKey }, { $set: { status: 'completed', completedAt: new Date(), resultSummary: results } })`. (3) On throw: set status `failed`.
- Edge case: two crons at same time — upsert with status running; second one sees running and can either wait or return “already running” (don’t double-credit).

**Weekly pool**

- MemeFiConfig: `weeklyPoolAiba`, `weeklyPoolNeur`, `weeklyTopN`.
- Job: `runWeeklyMemeFiRewards(weekKey)` e.g. `2025-W07`. Window: startOfWeek (UTC), endOfWeek. Same logic as daily: top N memes by engagementScore in window, split pool. Use same idempotent pattern: `MemeFiWeeklyRun` with weekKey.
- Edge case: week boundary; use ISO week (Monday–Sunday) or your own window.

**Per-educationCategory pools**

- MemeFiConfig: `categoryPools: { study_humor: { dailyPoolAiba: 500, dailyPoolNeur: 1000, topN: 5 }, ... }`.
- In daily job: for each key in categoryPools, run same 4 buckets (top, booster, lottery, mining) with `memeMatch = { ...memeMatch, educationCategory: key }`. Use same LedgerEntry reasons + meta.category.
- Edge case: category has no memes that day → pool unused or carry over (your choice; usually leave unused).

**Cap per user per day**

- MemeFiConfig: `maxAibaPerUserPerDay`, `maxNeurPerUserPerDay` (0 = no cap).
- Before each `creditAibaNoCap` / `creditNeurNoCap` in daily job: aggregate LedgerEntry for that telegramId, reason in `['memefi_top_meme','memefi_booster','memefi_lottery','memefi_mining']`, sourceId = dayKey (or createdAt in day); sum amountAiba/amountNeur. If adding this credit would exceed cap, skip or set credit to `min(credit, cap - already)`.
- Edge case: cap changed mid-day — use config at credit time.

---

### 4. Discovery — Trending, search, Redis cache

**Trending**

- API: `GET /api/memefi/feed?sort=score&window=6h|24h|7d` or `GET /api/memefi/trending?window=6h`.
- Query: `createdAt >= now - window`, sort `engagementScore: -1`, limit 50.
- Edge case: window=7d can be heavy; ensure index `{ createdAt: -1, engagementScore: -1 }`.

**Search**

- Meme schema: text index `MemeSchema.index({ caption: 'text', tags: 'text' }, { weights: { caption: 2, tags: 1 } })`.
- Feed: `?q=...` → `Meme.find({ $text: { $search: q } }, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } })`.
- Edge case: empty q → ignore; sanitize q to avoid $regex injection if you ever switch to regex.

**Redis leaderboard cache**

- Key: `memefi:leaderboard:score:50`, value: JSON array of top 50 meme IDs or full docs, TTL 60.
- On: feed read (leaderboard), after recomputeMemeScore for any meme, invalidate key (or TTL only).
- Edge case: cache miss → query DB and set cache.

---

### 5. Moderation — Appeal flow, trusted creator

**MemeAppeal**

- Schema: `{ memeId: ObjectId, telegramId: String, reason: String, status: 'pending'|'approved'|'rejected', reviewedAt: Date, reviewedBy: String }`. Index (memeId, status).
- `POST /api/memefi/memes/:id/appeal` (owner only, meme hidden) creates appeal with status pending.
- Admin: `PATCH /api/admin/memefi/appeals/:id` body `{ status: 'approved'|'rejected' }`; if approved, set Meme.hidden=false, hiddenReason=''.

**Trusted creator**

- User schema: `memefiTrusted: { type: Boolean, default: false }`.
- In auto-hide logic: if User.memefiTrusted, do not set hidden. Optional: in scoring, multiply by 1.1 for trusted (config).

---

### 6. Redemption — Code expiry, eligibility, batch codes, idempotency, retry, signing

**Code expiry**

- Redemption schema: `expiresAt: { type: Date, default: null }`.
- RedemptionProduct: `codeValidityDays: { type: Number, default: 0 }` (0 = no expiry). When creating Redemption, if codeValidityDays > 0, set `expiresAt = new Date(Date.now() + codeValidityDays * 24 * 60 * 60 * 1000)`.
- Cron or on partner “consume” call: set status to 'expired' when expiresAt < now.

**Eligibility**

- RedemptionProduct: `eligibilityMinAiba`, `eligibilityMinNeur`, `eligibilityCourseId` (ObjectId or string).
- In redeem route before debit: if eligibilityMinAiba, check user.aibaBalance >= eligibilityMinAiba; same for NEUR. If eligibilityCourseId, call University progress API and require module/course completed. 403 if not met.

**Batch codes**

- Model: `RedemptionCodeBatchSchema = { productKey: String, codes: [String], nextIndex: Number }`. Or separate `RedemptionCodePool` (productKey, code, assigned: boolean, redemptionId).
- Redeem: find batch for productKey where nextIndex < codes.length; take codes[nextIndex], increment nextIndex; assign to Redemption. If no batch or exhausted, fall back to generate code (or 403 “sold out”).

**Idempotency (redemption)**

- Redemption schema: `idempotencyKey: { type: String, sparse: true, unique: true }`.
- Client sends `Idempotency-Key: <uuid>` or body `idempotencyKey`. Key = `telegramId + productKey + idempotencyKey`. Before debit, find Redemption by idempotencyKey; if exists, return 200 + same redemption.

**Webhook retry**

- Wrap axios in retry: max 3 attempts, backoff 1s/2s/4s, retry on 5xx or timeout. On final failure: refund (creditAibaNoCap/creditNeurNoCap + User.starsBalance), set Redemption.status = 'failed', partnerResponse = { error }. Return 502.

**Webhook signing**

- RedemptionProduct or env: `partnerWebhookSecret`. Before POST, `signature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex')`; header `X-Webhook-Signature: sha256=<signature>`. Partner verifies before issuing code.

---

### 7. Education — School/course, leaderboard per school, education badge

**School / Course models**

- `SchoolSchema = { name: String, slug: String, unique, metadata: Object }`.
- `CourseSchema = { schoolId: ObjectId, name: String, slug: String, metadata: Object }`, index (schoolId, slug).
- Meme: `schoolId: ObjectId, courseId: ObjectId` (optional). User: `schoolId: ObjectId` (optional).
- Admin or partner: POST schools, POST courses; PATCH User/Meme to set schoolId/courseId.

**Leaderboard per school**

- `GET /api/memefi/leaderboard?by=score|creators&schoolId=...` — add to query filter `schoolId` when schoolId present. Same aggregation, scoped to school.

**Educational creator badge**

- Compute: aggregate Meme by ownerTelegramId where educationCategory is set, sum engagementScore; if sum > threshold (config) and count >= 5, set User.educationCreatorBadge = true (or MemeCreatorStats.educationBadge). Run as daily or weekly job; display in profile.

---

### 8. Ops — Idempotent cron (see above), bulk import, report

**Bulk product import**

- `POST /api/admin/redemption/products/bulk` body `{ products: [{ key, name, type, costAiba, ... }, ...] }`. Validate each (key required, type in enum); insert many; return `{ created: number, errors: [{ index, message }] }`. Use insertMany with ordered: false to get per-doc errors.

**Redemption report**

- `GET /api/admin/redemption/report?productKey=&from=&to=&format=json|csv`. Aggregate Redemption by productKey, status, optional group by day. Return JSON or stream CSV. Auth: admin only.

---

## Alternatives & tradeoffs

| Extension                   | Option A                                      | Option B                                                | When to choose                                                        |
| --------------------------- | --------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| **For-you feed**            | Boost memes from creators user liked (simple) | Collaborative filtering or embedding similarity (heavy) | A for MVP; B when you have scale and data.                            |
| **Weekly pool**             | Separate job + MemeFiWeeklyRun idempotency    | Same job with “mode: daily \| weekly” and weekKey       | Separate job keeps daily logic simple.                                |
| **Partner webhook failure** | Synchronous retry in request                  | Queue job + worker retries, refund on final fail        | Sync retry for low latency; queue for many partners or long timeouts. |
| **Leaderboard cache**       | Redis with TTL only                           | Redis + invalidate on engagement                        | TTL-only is simpler; invalidate reduces staleness.                    |
| **Per-category pool**       | One run loop over categories                  | Separate cron per category                              | One run is easier to reason about and keep idempotent.                |
| **Batch codes**             | Pre-loaded array with nextIndex               | Separate RedemptionCodePool with assigned flag          | Array for small batches; pool for large and concurrent redeem.        |

---

## Security & abuse

| Area                | Risk                                             | Mitigation                                                                                                                           |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Upload**          | Spam, illegal content, URL to malicious image    | Rate limit per user (e.g. 10/hour); validate imageUrl (allowlist origin, HEAD check); optional moderation queue; report + auto-hide. |
| **Engagement**      | Fake likes/comments/shares (bots, multi-account) | Rate limit like/comment/share per user per meme and global; Telegram initData validation; anomaly: same IP many accounts → flag.     |
| **Boost**           | Wash trading, pump-and-dump                      | Boost lock period; cap boost per meme per user; monitor sudden spikes; optional cooling-off before reward.                           |
| **Report**          | Report abuse (mass report to hide competitor)    | Rate limit reports per user; auto-hide only above threshold; trusted creator bypass; appeal flow.                                    |
| **Redemption**      | Theft of codes, double redeem, partner fraud     | Idempotency key; webhook signing; refund on partner failure; rate limit redeem per user; partner dashboard for reconciliation.       |
| **Partner webhook** | Partner replays request, impersonation           | HMAC signing; idempotency; partner sees only their product redemptions.                                                              |
| **Daily job**       | Double run → double credit                       | Idempotent run record (MemeFiDailyRun); status check at start.                                                                       |
| **Eligibility**     | User fakes course completion                     | Progress stored server-side; redeem checks your University API, not client.                                                          |

---

## Edge cases & failure handling

| Scenario                                               | Handling                                                                                                             |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Cron runs twice same day**                           | MemeFiDailyRun dayKey + status completed → return early; no second credit.                                           |
| **Partner webhook timeout after debit**                | Retry with backoff; on final failure refund and set Redemption.status = 'failed'; return 502; user can retry redeem. |
| **Partner returns 200 but no code**                    | Treat as failure; refund; store partnerResponse; optionally alert.                                                   |
| **Redeem with idempotency key that already succeeded** | Return 200 with same redemption (don’t debit again).                                                                 |
| **Meme deleted while in daily top**                    | Job already read meme list; credit by ownerTelegramId; meme delete doesn’t undo LedgerEntry.                         |
| **User at cap when crediting**                         | Skip that user’s credit or reduce to (cap - already); don’t fail the job.                                            |
| **Batch codes exhausted mid-redeem**                   | Return 403 “product temporarily unavailable”; or fallback to generated code if product allows.                       |
| **Appeal approved but meme re-reported**               | Normal flow; can auto-hide again if threshold reached.                                                               |

---

## Performance & scale

| Item                | Recommendation                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| **Meme feed**       | Index: `{ status: 1, createdAt: -1 }`, `{ status: 1, engagementScore: -1 }`; limit default 20, max 50.    |
| **Leaderboard**     | Index: `{ hidden: 1, engagementScore: -1, createdAt: -1 }`; add Redis cache for top 50–100.               |
| **Daily job**       | Aggregate in batches; use lean(); credit in loop (or bulk if you add bulk credit API).                    |
| **Redemption list** | Index on (telegramId, createdAt); paginate /me.                                                           |
| **Search**          | Text index on caption + tags; limit results.                                                              |
| **Recompute score** | On engagement event: queue job or run async so response isn’t blocked; batch recompute in cron if needed. |
| **Partner webhook** | Timeout 10s; retry 2–3x; consider queue for many partners.                                                |

---

## Testing & validation

| Area           | What to test                                                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scoring**    | Unit: computeEngagementScore for known counts and config; timeDecayFactor for age; category overrides.                                                                                                                          |
| **Daily job**  | Integration: seed memes/boosts/likes for a dayKey; run job; assert LedgerEntry counts and amounts; run again → no double credit (idempotent).                                                                                   |
| **Redemption** | Unit: eligibility checks, cap checks; integration: redeem with mock webhook (return code), assert debit and Redemption; redeem with failing webhook → refund and status failed; idempotency key same request → same redemption. |
| **Feed**       | Integration: draft not in feed; tag filter; trending window filter; search returns only matching.                                                                                                                               |
| **Moderation** | Report count reaches threshold → meme hidden; trusted creator not auto-hidden; appeal approve → meme visible.                                                                                                                   |

Use this doc as a roadmap: pick one or two extensions per sprint, implement in the indicated files, and extend config/schema as needed. Cross-ref [MEMEFI-LMS-IMPLEMENTATION.md](MEMEFI-LMS-IMPLEMENTATION.md) for current locations.
