# Miniapp UI vs Backend — Deep Assessment

This document compares what the **backend** exposes (MemeFi/LMS, redemption, extensions P0–P5) with what the **miniapp** actually uses and shows. Gaps are “backend exists, UI missing” or “UI could use a different endpoint.”

---

## 1. Summary

| Area                    | Backend                                                            | Miniapp UI                                                    | Gap                                                   |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- | ----------------------------------------------------- | -------- | ----------------------------------- |
| **MemeFi feed**         | Feed with `tag`, `window`, `sort`, `category`, `educationCategory` | Feed with fixed `sort=recent`, no tag/window/category filters | **Medium** — no trending, no tag, no sort=score in UI |
| **Meme create**         | Upload accepts `tags[]`, `status` (draft/published)                | Sends only imageUrl, caption, category, educationCategory     | **Medium** — no tags input, no draft option           |
| **Meme detail**         | Like, comment, share, boost, report, **reaction**, **save**        | Like, comment, share, boost, report only                      | **Medium** — no reaction picker, no Save button       |
| **Meme publish**        | PATCH `/memes/:id/publish` for drafts                              | No “Publish” for drafts; no draft list                        | **Medium** — drafts not surfaced                      |
| **Meme leaderboard**    | `?schoolId=` filter, score/creators                                | No schoolId selector                                          | **Low** — school filter missing                       |
| **Trending**            | GET `/api/memefi/trending?window=6h                                | 24h                                                           | 7d`                                                   | Not used | **Medium** — no trending tab/filter |
| **Saved memes**         | GET `/api/memefi/me/saved`                                         | Not used                                                      | **Medium** — no “My saved” list or Save on detail     |
| **Redemption products** | GET `/api/redemption/products/for-me` (school-scoped)              | Uses GET `/api/redemption/products` only                      | **Low** — for-me gives correct list for school users  |
| **Redeem**              | Idempotency key, returns `expiresAt`                               | No idempotency key sent; doesn’t show expiresAt               | **Low** — safe but no expiry display                  |
| **My redemptions**      | Each has `expiresAt`, `code`, `status`                             | Shows productKey, code, status; no expiresAt                  | **Low** — show expiry in list                         |
| **Appeal**              | POST `/memes/:id/appeal`, admin resolve                            | No appeal button for hidden memes                             | **Medium** — creators can’t appeal from app           |
| **Partner dashboard**   | GET `/api/partner/redemptions` (API key auth)                      | No partner UI in miniapp                                      | **By design** — partners use external tools           |
| **Schools/Courses**     | School/Course CRUD (admin), User.schoolId, Meme.schoolId           | No school selector in profile or meme create                  | **Medium** — school/course not in UI                  |

**Current status (post–UI alignment):** The miniapp now implements feed filters (sort, tag, window, category, educationCategory) and Load more; Create with tags and draft/publish; Detail with reactions, Save, and Appeal when hidden; Publish draft + My drafts; Trending view; My saved list; leaderboard School ID input; redemption for-me, idempotency key, and expiresAt in success + My redemptions. **Still open:** school/course in profile and meme create; templateId (optional); partner dashboard remains out of scope by design.

---

## 2. MemeFi — Feed

| Backend                                                                            | Miniapp         |
| ---------------------------------------------------------------------------------- | --------------- | --- | --- | -------------------------------------------------------- |
| `GET /api/memefi/feed?limit=&offset=&category=&educationCategory=&tag=&sort=recent | score&window=6h | 24h | 7d` | `GET .../feed?limit=20&offset=0&sort=recent` (hardcoded) |

**Gaps:**

- **tag** — Backend supports `?tag=exam`. UI has no tag filter or hashtag chips.
- **window** — Backend supports “trending” window. UI doesn’t pass `window`; no “Trending” or “Last 6h” filter.
- **sort** — Backend supports `sort=score`. UI always uses `recent`; no “Top by score” option.
- **category / educationCategory** — Backend supports. UI has no feed filter dropdown (only create uses category).
- **Pagination** — Backend supports offset. UI loads once (limit=20, offset=0); no “Load more”.

**Recommendation:** Add feed filters: sort (recent / score), optional tag, optional window (6h / 24h / 7d) or link to Trending; optional category/educationCategory. Add “Load more” with offset.

---

## 3. MemeFi — Create / Upload

| Backend                                                                                                                                       | Miniapp                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/memefi/upload` body: `imageUrl`, `caption`, `templateId`, `category`, `educationCategory`, `tags[]`, `status` (draft \| published) | Sends: `imageUrl`, `caption`, `category`, `educationCategory` (derived from category). Does **not** send `tags`, `status`. |

**Gaps:**

- **tags** — Backend accepts `tags: string[]` (and parses `#hashtag` from caption). UI has no tag input or display of parsed tags; upload doesn’t send explicit tags.
- **status** — Backend accepts `status: 'draft' | 'published'`. UI always publishes (no draft option).
- **templateId** — Backend accepts; UI doesn’t use templates.

**Recommendation:** Add optional tag input or show “Add tags” (max 10). Add “Save as draft” vs “Publish” so creator can post later via PATCH publish.

---

## 4. MemeFi — Detail (single meme)

| Backend                                                                                                                                       | Miniapp                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Like, Comment, Share (internal/external), Boost, Report. **Reaction** (POST `/memes/:id/reaction`), **Save** (POST `/memes/:id/save` toggle). | Like, Share (in-app + Telegram), Boost, Comment, Report. **No Reaction, no Save.** |

**Gaps:**

- **Reaction** — Backend: one reaction per user per meme (e.g. fire, funny, edu). UI has no reaction picker or reaction counts.
- **Save** — Backend: toggle save, GET me/saved. UI has no “Save” / “Saved” button and no “My saved” list.

**Recommendation:** On meme detail add reaction chips (e.g. fire, funny, edu) and call POST reaction; show counts. Add “Save” / “Saved” button and a “My saved” section (call GET me/saved, then load memes by id).

---

## 5. MemeFi — Publish (drafts)

| Backend                                                                                                    | Miniapp                             |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `PATCH /api/memefi/memes/:id/publish` — sets status=published, publishedAt=now. Feed only shows published. | No draft list; no “Publish” button. |

**Gap:** If a meme is created as draft (once UI supports it), creator needs a way to see drafts and publish. Currently no “My drafts” or “Publish” on detail.

**Recommendation:** When draft create exists, add “My drafts” (feed with `status=draft` for owner) and “Publish” on draft detail.

---

## 6. MemeFi — Leaderboard

| Backend                               | Miniapp                                                 |
| ------------------------------------- | ------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| `GET /api/memefi/leaderboard?by=score | creators&limit=&category=&educationCategory=&schoolId=` | `GET .../leaderboard?by=score | creators&limit=20`. No schoolId, category, or educationCategory. |

**Gap:** **schoolId** — Backend supports per-school leaderboard. UI has no school selector (and no User school in profile), so global only.

**Recommendation:** If schools are in use, add optional school dropdown (from `/api/schools` or similar) and pass `schoolId` when selected.

---

## 7. MemeFi — Trending

| Backend                             | Miniapp |
| ----------------------------------- | ------- | ---------- | ----------- |
| `GET /api/memefi/trending?window=6h | 24h     | 7d&limit=` | Not called. |

**Gap:** Full “trending” endpoint exists but isn’t used. Feed can approximate with `?sort=score&window=6h` but dedicated trending is clearer.

**Recommendation:** Add “Trending” sub-tab or filter in Memes tab that calls `/api/memefi/trending?window=24h` (or 6h/7d selector).

---

## 8. MemeFi — Appeal & hidden memes

| Backend                                                                             | Miniapp                                                                                        |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `POST /api/memefi/memes/:id/appeal` (owner, meme hidden). Admin: GET/PATCH appeals. | No appeal button. When a meme is hidden (e.g. auto-hide), creator has no in-app way to appeal. |

**Gap:** Appeal flow exists in API only. Creator doesn’t see “This meme was hidden; you can appeal” or “Appeal” button.

**Recommendation:** On meme detail, if `meme.hidden === true` and current user is owner, show “This meme was hidden. Appeal?” and call POST appeal. Optionally show “Appeal pending” if appeal exists with status pending.

---

## 9. Redemption — Products list

| Backend                                                                                                                             | Miniapp                                   |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `GET /api/redemption/products` — all enabled. `GET /api/redemption/products/for-me` — enabled + for user’s school (or global only). | Uses `GET /api/redemption/products` only. |

**Gap:** **for-me** — When products are school-scoped (`schoolId` set), listing “for-me” returns only products for the user’s school (or global). Using only `/products` may show products the user can’t redeem (403 on redeem). So far you may have only global products; when school products exist, UI should use `/products/for-me` on Earn tab.

**Recommendation:** Switch Earn tab to `GET /api/redemption/products/for-me` so school-scoped products are correct. Fallback to `/products` if for-me returns 404 (e.g. route added later).

---

## 10. Redemption — Redeem

| Backend                                                                                                                | Miniapp                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/redemption/redeem` body: `productKey`, optional `idempotencyKey`. Response: `code`, `expiresAt`, `message`. | POST with `{ productKey: p.key }`. No idempotency key. Shows `r.data?.message` and `r.data?.code`; does not show `expiresAt`. |

**Gaps:**

- **idempotencyKey** — Backend supports; UI doesn’t send. Risk: double-tap or retry can create two redemptions (backend will debit twice). Sending a client-generated UUID per “Redeem” click would prevent that.
- **expiresAt** — Backend returns when product has `codeValidityDays`. UI doesn’t display it; user may not know when code expires.

**Recommendation:** Generate a short idempotency key (e.g. `productKey + timestamp` or UUID) when user taps Redeem and send in body. Show “Code expires at …” when `expiresAt` is present.

---

## 11. Redemption — My redemptions

| Backend                                                                         | Miniapp                                                             |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Each redemption: `productKey`, `code`, `status`, `expiresAt`, `createdAt`, etc. | List shows `productKey`, `code`/`status`, `status`. No `expiresAt`. |

**Gap:** **expiresAt** — Not shown. Users with code validity period don’t see “Valid until …”.

**Recommendation:** In “My redemptions” list, show `expiresAt` (e.g. “Valid until 15 Mar 2025”) when present.

---

## 12. Schools / User profile

| Backend                                                                                                                                   | Miniapp                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `User.schoolId`; School/Course models; admin CRUD. Meme can have `schoolId`, `courseId`. Leaderboard and redemption can be school-scoped. | No school selector in profile or settings. No school/course on meme create. |

**Gap:** School/course are backend-only. Users can’t set or see their school; creators can’t attach school/course to memes; leaderboard can’t be filtered by school in UI.

**Recommendation:** If schools are used: (1) Profile or Settings: “School” dropdown (from admin API or public list). PATCH user to set `schoolId`. (2) Meme create: optional “School” / “Course” when available. (3) Leaderboard: school filter as above.

---

## 13. Partner dashboard

| Backend                                                                                                          | Miniapp                   |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `GET /api/partner/redemptions` — auth by `X-Partner-API-Key` (product’s `partnerApiKey`). For external partners. | No partner UI in miniapp. |

**Assessment:** By design. Partners (schools, LMS, merch) use their own dashboard or API client with API key. No change needed in miniapp unless you add a “Partner portal” tab (separate app or internal page).

---

## 14. API usage summary (miniapp → backend)

| Miniapp calls                                        | Backend | Notes                                                   |
| ---------------------------------------------------- | ------- | ------------------------------------------------------- |
| `GET /api/memefi/feed?limit=20&offset=0&sort=recent` | ✅      | Add params for tag, window, sort=score, category.       |
| `GET /api/memefi/me/likes`                           | ✅      | Returns array of meme IDs; UI uses for “Liked” state.   |
| `GET /api/memefi/leaderboard?by=&limit=20`           | ✅      | Add schoolId when school filter added.                  |
| `GET /api/memefi/memes/:id`                          | ✅      | —                                                       |
| `GET /api/memefi/memes/:id/comments`                 | ✅      | —                                                       |
| `POST /api/memefi/upload`                            | ✅      | Add tags, status (draft/published).                     |
| `POST /api/memefi/memes/:id/like`                    | ✅      | —                                                       |
| `POST /api/memefi/memes/:id/comment`                 | ✅      | —                                                       |
| `POST /api/memefi/memes/:id/share`                   | ✅      | —                                                       |
| `POST /api/memefi/memes/:id/boost`                   | ✅      | —                                                       |
| `POST /api/memefi/memes/:id/report`                  | ✅      | —                                                       |
| `GET /api/memefi/earn-summary`                       | ✅      | —                                                       |
| `GET /api/redemption/products`                       | ✅      | Prefer `/products/for-me` when school-aware.            |
| `GET /api/redemption/me`                             | ✅      | —                                                       |
| `POST /api/redemption/redeem`                        | ✅      | Add idempotencyKey; show expiresAt in success and list. |
| **Not used**                                         |         |                                                         |
| `GET /api/memefi/trending`                           | ❌      | Add Trending in Memes tab.                              |
| `GET /api/memefi/me/saved`                           | ❌      | Add “My saved” + Save button on detail.                 |
| `POST /api/memefi/memes/:id/save`                    | ❌      | Toggle save on detail.                                  |
| `POST /api/memefi/memes/:id/reaction`                | ❌      | Reaction picker on detail.                              |
| `PATCH /api/memefi/memes/:id/publish`                | ❌      | After adding drafts.                                    |
| `GET /api/redemption/products/for-me`                | ❌      | Use on Earn tab for school-scoped list.                 |

---

## 15. Priority order for UI work

1. **High impact, quick**
    - Feed: add **sort** (recent / score) and **window** or link to **Trending**.
    - Redemption: show **expiresAt** on success and in My redemptions; send **idempotencyKey** on Redeem.
    - Earn: use **GET /api/redemption/products/for-me** when available.

2. **High impact, more work**
    - Meme detail: **Reaction** picker + **Save** button; **“My saved”** list.
    - Create: **tags** (input or from # in caption), **draft** option; then **Publish** and “My drafts” for drafts.

3. **When schools are used**
    - Profile: **school** selector; meme create: optional **school/course**; leaderboard: **schoolId** filter.

4. **Trust & safety**
    - **Appeal**: on meme detail when hidden and owner, show “Appeal” and call POST appeal.

5. **Optional**
    - Partner dashboard: keep out of miniapp unless you add a dedicated partner portal.

---

## 16. Conclusion

- **Backend** exposes MemeFi/LMS and P0–P5: feed params, trending, reactions, save, draft/publish, appeal, school/course, redemption for-me, idempotency, expiry.
- **Miniapp (current):** Core flows and most extensions are now aligned: feed (sort, tag, window, category, educationCategory, Load more), Create (tags, draft/publish), Detail (reactions, Save, Appeal when hidden), Publish draft + My drafts, Trending, My saved, leaderboard schoolId, redemption for-me + idempotency + expiresAt. **Still not in UI:** school/course in profile or meme create; templateId; partner dashboard (by design).

Remaining optional work: add school/course selector in profile and on meme create when schools are in use; optionally expose template picker for create.
