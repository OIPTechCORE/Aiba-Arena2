# Backend vs Miniapp – Feature Audit

This document confirms that all backend MemeFi/Economy/Schools/Staking features are reflected in the miniapp UI. Gaps have been closed.

---

## 1. Memes + Earn visibility (hero, nav, onboarding)

| Backend / Product                   | Miniapp                                                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| MemeFi feed, create, earn endpoints | **Home**: Dismissible “Create & Earn” onboarding card; quick-access strip with **Memes** and **Earn** first; “Create & Earn” hero card. |
| Tab structure                       | **Memes** and **Earn** in main tab list (positions 4–5) with NEW badges.                                                                |

**Status:** Implemented. No gap.

---

## 2. Sharing UX and redemption prominence

| Backend / Product                          | Miniapp                                                                                                                                             |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Share copy / CTA                           | Meme share uses: “Create memes & earn AIBA/NEUR in AIBA Arena”. Detail view: “Shared! More shares = higher score = more rewards.”                   |
| Redemption API (idempotencyKey, expiresAt) | Earn tab: “Turn AIBA & NEUR into real value” card; Redeem section; redeem flow sends `idempotencyKey`; success and My redemptions show `expiresAt`. |

**Status:** Implemented. No gap.

---

## 3. Creator tiers (config, job multipliers)

| Backend                                                                                              | Miniapp                                                                           |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `MemeFiConfig.creatorTiers` (bronze/silver/gold/platinum, minMemes, minTotalScore, rewardMultiplier) | Config editable in Admin → MemeFi.                                                |
| Daily job applies tier multiplier for top10 + mining                                                 | `memefiDailyRewards.js` uses tier from config.                                    |
| `GET /api/memefi/earn-summary` returns `creatorTier`                                                 | Earn tab shows “Creator tier: BRONZE/SILVER/GOLD/PLATINUM” and short explanation. |

**Status:** Implemented. No gap.

---

## 4. Templates (model, API, picker in create)

| Backend                                           | Miniapp                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `MemeTemplate` model, `GET /api/memefi/templates` | Miniapp calls `refreshMemefiTemplates()` (e.g. when Memes tab is active).       |
| `POST /api/memefi/upload` accepts `templateId`    | Create form has optional template picker; `templateId` sent on upload when set. |

**Status:** Implemented. No gap.

---

## 5. School selector (profile + meme create)

| Backend                                                                     | Miniapp                                                                                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/schools`                                                          | `refreshSchoolsList()`; used in Profile and Meme create.                                                                                          |
| `GET /api/economy/me` → `schoolId`; `PATCH /api/economy/me` with `schoolId` | Profile: “School (MemeFi / LMS)” dropdown; selection saved via PATCH.                                                                             |
| Meme upload can accept `schoolId`                                           | Meme create: School dropdown; `schoolId` sent on upload when set. Memes tab syncs `memefiCreateSchoolId` from `economyMe?.schoolId` when missing. |

**Status:** Implemented. No gap.

**Enhancement applied:** When user opens the Profile tab, `refreshEconomy()` is now called so `economyMe` (and thus `schoolId`) is always up to date for the school selector, even if Profile is opened before other tabs.

---

## 6. Other backend ↔ miniapp alignments

- **Staking:** `GET /api/staking/periods` returns `minAiba` and `periods` → miniapp uses them for minimum stake and period list (Yield Vault).
- **Economy:** `GET /api/economy/me` used for balance strip, profile school, and Meme create school default.
- **Feed:** Sort, tag, time window, category, load more, trending – implemented. Create tags, draft, publish, My drafts – implemented. Detail: reactions, save, appeal; My saved – implemented.
- **Leaderboard:** `schoolId` filter supported in backend and miniapp.
- **Redemption:** For-me view, idempotency, `expiresAt` – implemented.

---

## Optional UX improvements (non-gaps)

- **Report meme:** Use a reason dropdown (e.g. spam, inappropriate, other) instead of a fixed `'spam'` value.
- **Feed cards:** Consider an in-app “Share” action on cards (in addition to external share) for consistency with detail view.

---

## Conclusion

All five requested areas (Memes+Earn visibility, Sharing + redemption prominence, Creator tiers, Templates, School selector) are implemented end-to-end in both backend and miniapp. The only change made in this audit was ensuring the Profile tab refreshes economy (and thus school) when opened.
