# Rollout features – where they live

Quick map of the five product/backend items to the codebase.

## 1. Memes + Earn visibility (hero, nav, onboarding)

- **Miniapp:** `miniapp/src/app/HomeContent.js`
    - Quick-access strip: Memes and Earn tabs in the strip.
    - Hero: "Create & Earn" card linking to Memes and Earn.
    - Onboarding: Dismissible tip "New: Create & Earn" (links to Memes and Earn).
- Optional: persist `memesEarnTipDismissed` in localStorage so it survives refresh.

## 2. Sharing UX and redemption prominence

- **Miniapp:** `miniapp/src/app/HomeContent.js`
    - Meme share copy: "Create memes & earn AIBA/NEUR in AIBA Arena"; detail shows "Shared! More shares = higher score = more rewards." (clears after 3s).
    - Earn tab: Redemption banner ("Turn AIBA & NEUR into real value") and creator tier line from `earnSummary.creatorTier`.

## 3. Creator tiers (config, job multipliers)

- **Backend:** `backend/models/MemeFiConfig.js` – `creatorTiers` (bronze/silver/gold/platinum: minMemes, minTotalScore, rewardMultiplier).
- **Backend:** `backend/jobs/memefiDailyRewards.js` – `getCreatorTierForTelegram` / `getCreatorTierMultiplierForTelegram` for top10 and mining shares.
- **API:** `GET /api/memefi/earn-summary` returns `creatorTier`.
- **Miniapp:** Earn tab shows creator tier from `earnSummary.creatorTier`.

## 4. Templates (model, API, picker in create)

- **Backend:** `backend/models/MemeTemplate.js` – model; `GET /api/memefi/templates` (public); admin CRUD under `/api/admin/memefi/templates`.
- **Miniapp:** `HomeContent.js` – `memefiTemplatesList`, `memefiCreateTemplateId`, `refreshMemefiTemplates()`; create form has optional template dropdown; `submitMemefiCreate` sends `templateId`.

## 5. School selector (profile + meme create)

- **Backend:** `GET /api/schools` (public); `PATCH /api/economy/me` accepts `schoolId`; upload can send `schoolId`.
- **Miniapp:** `HomeContent.js` – `schoolsList`, `profileSchoolId`, `memefiCreateSchoolId`, `refreshSchoolsList()`; Profile has "School (MemeFi / LMS)" dropdown and "Save school"; Meme create has optional "School" dropdown; create form school defaulted from `economyMe.schoolId` when opening Memes; profile school dropdown synced when `economyMe` loads.
