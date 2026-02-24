# MemeFi Deep Check — Strategy vs Implementation

This document audits the **current MemeFi implementation** in Aiba-Arena2 against the **strategic architecture** (standalone MemeFi mini app × token ecosystem × existing Telegram project × LMS/school-fees growth engine). It answers: _What exists, what’s partial, and what’s missing to match the vision._

---

## 1. Strategic pillars (your target)

| Pillar | Intent                                                                                     |
| ------ | ------------------------------------------------------------------------------------------ |
| **A**  | Integrate into existing Telegram project (Memes + Earn as tabs)                            |
| **B**  | Embed in token economy (AIBA/NEUR earn, boost, redeem)                                     |
| **C**  | Standalone MemeFi-style mini app (full creation → reward loop)                             |
| **D**  | Growth engine for school-fees / LMS (earn tokens → redeem for fees, LMS, exam prep, merch) |

**Target model:** One core MemeFi engine that plugs into multiple verticals (gaming, education, fintech).

---

## 2. Core system vs implementation

### 2.1 Meme creation layer

| Strategic requirement        | Status     | Where / note                                                                   |
| ---------------------------- | ---------- | ------------------------------------------------------------------------------ |
| Upload image                 | ✅         | `POST /api/memefi/upload` (imageUrl + caption); client uploads elsewhere first |
| Caption + category tagging   | ✅         | caption, category, educationCategory, tags[] in upload                         |
| Meme templates               | ⚠️ Partial | Schema has `templateId`; no templates API or UI picker                         |
| Auto watermark (brand/token) | ⚠️ Partial | Schema has `watermarkApplied`; no server-side watermarking job                 |
| AI caption assistant         | ❌         | Not implemented                                                                |
| Draft / publish later        | ✅         | status draft\|published, PATCH publish; UI has draft + My drafts               |

**Verdict:** Creation is **solid** for image + caption + tags + categories + draft. Templates and watermark are **optional** next steps; AI caption is **not** in codebase.

---

### 2.2 Engagement engine

| Strategic requirement             | Status | Where / note                                                               |
| --------------------------------- | ------ | -------------------------------------------------------------------------- |
| Like                              | ✅     | POST like (toggle), likeCount on meme                                      |
| Comment                           | ✅     | POST comment, commentCount, GET comments                                   |
| Share (internal / external)       | ✅     | kind: internal \| external, internalShareCount, externalShareCount         |
| Boost (stake token)               | ✅     | POST boost (amountAiba, amountNeur), off-chain lock, boostTotal            |
| Report (anti-spam)                | ✅     | POST report, auto-hide at threshold (MemeFiConfig.autoHideReportThreshold) |
| Reactions (e.g. fire, funny, edu) | ✅     | MemeReaction, POST reaction, reactionWeights in score                      |
| Save / bookmark                   | ✅     | MemeSave, POST save toggle, GET me/saved, “My saved” in UI                 |

**Verdict:** Engagement engine is **complete** relative to the doc (like, comment, share, boost, report, reactions, save).

---

### 2.3 Scoring algorithm

| Strategic formula                                           | Implementation                                                                                             |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Like × 1, Comment × 2, InternalShare × 3, ExternalShare × 5 | ✅ `memefiScoring.js`: weightLike/weightComment/weightInternalShare/weightExternalShare (defaults 1,2,3,5) |
| Boost × multiplier                                          | ✅ boostMultiplierPerUnit; boostTotal in formula                                                           |
| Time decay                                                  | ✅ timeDecayFactor = 0.5^(hours / halfLifeHours); score = raw × decay                                      |
| Reaction weights                                            | ✅ reactionWeights per type; educationWeights per educationCategory                                        |

**Verdict:** Scoring **matches** the intended formula (engagement weights + boost + time decay). Education and reaction overrides are supported.

---

### 2.4 Reward engine

| Strategic split                              | Implementation                                                         |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| Top N memes share 40%                        | ✅ poolPctTop10 (default 40), topN (default 10)                        |
| Boosters share 20%                           | ✅ poolPctBoosters (20)                                                |
| Random engagement lottery 10%                | ✅ poolPctLottery (10), lotteryWinnersCount (20)                       |
| Meme mining pool 30%                         | ✅ poolPctMining (30) — creators who posted that day                   |
| Idempotent daily run                         | ✅ MemeFiDailyRun by dayKey; no double-credit                          |
| Creator tiers (Bronze → Platinum multiplier) | ✅ creatorTiers in MemeFiConfig; applied in daily job for top + mining |
| Weekly pool (top of week)                    | ✅ memefiWeeklyRewards.js, weeklyPoolAiba/Neur, weeklyTopN             |
| Per-educationCategory pools                  | ✅ categoryPools in config; daily job runs per category                |
| Cap per user per day                         | ✅ maxAibaPerUserPerDay, maxNeurPerUserPerDay                          |

**Verdict:** Reward engine is **aligned** with the 40/20/10/30 design, plus tiers, weekly, category pools, and caps.

---

### 2.5 Token ecosystem integration

| Strategic element               | Status | Where / note                                                                              |
| ------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| TON wallet connection           | ✅     | Miniapp uses TonConnect; Wallet tab, claim, etc.                                          |
| Meme boosting with tokens       | ✅     | Boost with AIBA/NEUR (off-chain lock); boosters earn from daily pool                      |
| Creator tier upgrades           | ✅     | Tiers by minMemes + minTotalScore; multiplier in rewards (no explicit “upgrade” purchase) |
| Tokens for premium competitions | ⚠️     | No dedicated “meme competition” product; DAO/staking exist separately                     |
| Governance voting               | ✅     | DAO (proposals + vote); not meme-theme voting                                             |
| NFT minting for viral memes     | ❌     | No meme→NFT in codebase                                                                   |

**Verdict:** **Token integration is strong** (earn AIBA/NEUR from MemeFi, boost with AIBA/NEUR, redeem elsewhere). Premium meme competitions and viral-meme NFT are **not** implemented.

---

### 2.6 Integration into existing Telegram project (A)

| Requirement                               | Status                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| “Memes” tab                               | ✅ Miniapp: Memes tab with Feed / Trending / Saved / Drafts                           |
| “Earn” tab                                | ✅ Earn tab: earn-summary, redemption products, my redemptions                        |
| Leaderboard                               | ✅ Meme leaderboard (score/creators), optional schoolId; Global Leaderboard elsewhere |
| Single app: users earn via memes + redeem | ✅ Same app: Memes → engagement → daily/weekly rewards; Earn → redeem products        |

**Verdict:** **Fully integrated** as a tabbed experience inside the existing mini app.

---

### 2.7 LMS / school-fees growth engine (D)

| Requirement                                                     | Status | Where / note                                                                             |
| --------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| Products for school fee discount, LMS premium, exam prep, merch | ✅     | RedemptionProduct types: school_fee_discount, lms_premium, exam_prep, merch, etc.        |
| School-scoped products                                          | ✅     | RedemptionProduct.schoolId; GET /api/redemption/products/for-me filters by user.schoolId |
| User earns tokens (MemeFi + rest of app)                        | ✅     | MemeFi daily/weekly + other earn paths → AIBA/NEUR/Stars                                 |
| User redeems for fees/LMS/merch                                 | ✅     | POST redeem; idempotency; expiresAt; partner webhook or code                             |
| Eligibility (min balance, course, school)                       | ✅     | eligibilityMinAiba/Neur, eligibilityCourseId; schoolId for product availability          |
| Education categories in memes                                   | ✅     | educationCategory; study_humor, exam_tips, school_events, general_edu; feed filter       |
| Education creator badge                                         | ✅     | memefiEducationBadge job; educationCreatorBadgeMinMemeCount/Score                        |

**Verdict:** **LMS/school-fees layer is implemented**: earn (including MemeFi) → redeem for school/LMS/exam/merch; school-scoped and eligibility rules in place.

---

## 3. Growth flywheel (strategy vs code)

| Step in your doc          | In codebase                                                                    |
| ------------------------- | ------------------------------------------------------------------------------ |
| Users create memes        | ✅ Upload, draft/publish, tags, categories                                     |
| Memes get engagement      | ✅ Like, comment, share, boost, reactions, save                                |
| Engagement tracked        | ✅ Counts on Meme; engagementScore with time decay                             |
| User rewarded             | ✅ Daily (top/booster/lottery/mining) + weekly + category pools; creator tiers |
| More users join to earn   | ✅ Via Telegram + shared memes / links (no dedicated “invite” in MemeFi)       |
| More memes created        | ✅ Feed, trending, leaderboard drive visibility                                |
| Token attention increases | ✅ Boost with AIBA/NEUR; rewards in AIBA/NEUR; redeem for real utility         |

**Gap:** No explicit **share-to-earn** or **referral** inside MemeFi (referrals exist elsewhere in app). Otherwise the loop is **implemented**.

---

## 4. UI/UX (card feed, metrics, leaderboard, gamification)

| Strategic UI element                       | Status                                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Card-based scroll feed                     | ✅ Feed with filters (sort, tag, window, category, educationCategory), Load more                                            |
| Engagement metrics (likes, shares, points) | ✅ Score, likeCount, commentCount, boostTotal, reaction counts on detail and cards                                          |
| Leaderboard visibility                     | ✅ Meme leaderboard (score/creators), optional schoolId; link from Leaderboard tab                                          |
| Gamified indicators (badges, streaks)      | ⚠️ Creator tiers exist in backend; education badge job exists. **No tier/badge badges in Meme UI** (e.g. “Silver Creator”). |
| Trending                                   | ✅ Trending view, window 6h/24h/7d                                                                                          |
| My saved / My drafts                       | ✅ Both in UI                                                                                                               |

**Gap:** **Creator tier / education badges** are not yet **surfaced in the Memes tab** (e.g. “Gold Creator”, “Education Creator”). Backend is ready.

---

## 5. Governance / community layer (from your doc)

| Idea in doc                          | Status                                                            |
| ------------------------------------ | ----------------------------------------------------------------- |
| Community vote on weekly meme themes | ❌ No meme-theme voting or theme config in MemeFi                 |
| Reward adjustments by vote           | ❌ DAO exists for general proposals, not MemeFi config            |
| Meme competitions (themed)           | ❌ No “competition” or “campaign” entity with start/end and theme |

**Verdict:** **Governance is general DAO**, not MemeFi-specific. Adding “weekly theme” or “meme competition” would be new feature work.

---

## 6. What’s missing or optional (summary)

| Area                     | Missing / optional                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------- |
| **Creation**             | Templates API + picker; server-side watermark; AI caption (optional).                  |
| **Token / gamification** | NFT for viral memes; explicit “premium meme competition” product.                      |
| **UI**                   | Creator tier + education badge labels in Memes tab.                                    |
| **Governance**           | Meme-theme voting; meme-specific competitions/campaigns.                               |
| **Growth**               | Explicit share-to-earn or referral inside MemeFi (rest of app has referral elsewhere). |

---

## 7. Standalone MemeFi mini app (C)

**Current:** MemeFi is a **module inside** Aiba-Arena2 (Memes + Earn tabs, same backend, same token economy). It is **not** a separate deployable “MemeFi-only” app.

To make it **standalone** in the sense of a separate mini app:

- **Option 1 (recommended):** Keep one codebase; add a **launch mode** or **build flag** (e.g. “MemeFi-only”) that hides other tabs (Arenas, Brokers, etc.) and shows only Memes + Earn + Wallet. Same backend, different front-end bundle.
- **Option 2:** Fork miniapp into a second repo that only includes Memes + Earn + Wallet and points to same (or dedicated) backend. More maintenance.

**Backend** is already a **single MemeFi engine**: one set of routes, config, and jobs. It can serve multiple front-ends (current full app or a MemeFi-only shell).

---

## 8. Conclusion

| Strategic goal                                   | Assessment                                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **A — Integrate into existing Telegram project** | ✅ Done: Memes + Earn tabs, same app.                                                               |
| **B — Embed in token economy**                   | ✅ Done: earn AIBA/NEUR, boost with AIBA/NEUR, redeem in Earn tab.                                  |
| **C — Standalone MemeFi-style mini app**         | ⚠️ Same engine, not a separate app; achievable via “MemeFi-only” front-end mode or separate bundle. |
| **D — LMS / school-fees growth engine**          | ✅ Done: redemption products (school/LMS/exam/merch), school-scoped, eligibility, for-me API.       |

**Core engine:** Creation, engagement, scoring, rewards (daily + weekly + category + tiers + caps), token boost, save, reactions, draft/publish, appeal, school leaderboard, and LMS/school-fees redemption are **in place**. The main gaps are **product-level** (templates, watermark, AI caption), **governance** (meme themes, meme competitions), **UI polish** (tier/badge in Memes tab), and **packaging** (optional standalone MemeFi-only front-end). The architecture you described is largely **already built**; the rest is extension and positioning.
