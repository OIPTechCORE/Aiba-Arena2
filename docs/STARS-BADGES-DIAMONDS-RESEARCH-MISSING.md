# Deep Research: What Was Missing (Stars, Badges, Diamonds)

After implementing Stars, Profile Badges, and Diamonds per the plan, this document captures **gaps** found via codebase audit, plan re-read, and alignment with Telegram/X product patterns.

---

## 1. Plan vs implementation

| Plan requirement | Status | Notes |
|------------------|--------|--------|
| Stars: "Every **battle win** grants Stars" | **Gap** | Implemented as "every battle"; plan says *win* (score > 0). |
| Leaderboard: "badge icon next to username" | **Missing** | Leaderboard API does not return `badges`; UI does not render them. |
| Profile card: "Avatar placeholder, **username**" | **Missing** | Only badges shown; no Telegram username/avatar. |
| "Balance strip or header: Optional small **verified** badge" | **Missing** | No verified indicator next to balance. |
| "Optional **auto-award** (e.g. top 10 → top_leader)" | **Missing** | No cron or hook to assign `top_leader` from leaderboard. |
| Push notification: battle win | **Partial** | `notifyBattleWin` does not mention Stars or Diamond. |

---

## 2. Backend gaps

- **Leaderboard API** (`GET /api/leaderboard`): Aggregation has `$lookup` to `users` but `$project` does not include `badges`. Rows have `username` but not `badges`.
- **Stars eligibility**: Plan says "battle **win**"; code credits stars on every battle. Should credit only when `score > 0`.
- **Charity leaderboard**: Returns `telegramId` and amounts only; no user lookup for `badges` (optional enhancement).
- **Admin**: No read-only view of a user’s stars/diamonds/badges (admin credit-user and mod badges are write-only). Optional: user detail or ledger filter by currency (Stars/Diamonds not in ledger today—MVP earn/display only).

---

## 3. Miniapp gaps

- **Leaderboard tab**: Renders `row.username || row.telegramId` and stats; no badge pills. Backend must expose `badges` and UI must render them (reuse `BADGE_LABELS` + `.badge-pill`).
- **Profile card**: Shows badges only. Should show Telegram display name/username from `getTelegramUserUnsafe()` (no API change).
- **Balance strip / header**: No small "verified" badge when user has `verified` in `economyMe.badges`.

---

## 4. Notifications

- **telegramNotify.notifyBattleWin**: Message includes score, arena, AIBA, NEUR. Should optionally include "+X Stars" and "+N Diamond (first win!)" when applicable. Caller has `rewardAiba`, `rewardNeur` but not stars/diamond; battle route calls it before building `battlePayload`, so we need to pass `starsGranted` and `firstWinDiamond` into the notifier (or refactor so notification is sent after payload is known).

---

## 5. External / product alignment

- **Telegram Stars (real)**: Users buy Stars; bots receive and can withdraw in TON. Our Stars are in-app only (MVP); no withdrawal—matches plan.
- **Telegram Diamonds / TON**: "Diamonds" in TON/Fragment context often refers to premium usernames/NFTs. Our in-app "Diamonds" are a separate premium currency (first win, etc.); naming is fine, no product gap.
- **X (Twitter) badges**: Shown on profile and next to names in replies/timeline. We add profile card and leaderboard badges to match.

---

## 6. Fixes applied (after this research) ✅

1. **Stars only on win**: Credit `starRewardPerBattle` only when `score > 0` (battle route).
2. **Leaderboard**: Added `badges` to aggregation `$project` in `GET /api/leaderboard`; miniapp leaderboard rows render badge pills (up to 3 per row, `.badge-pill--inline`).
3. **notifyBattleWin**: Now accepts `starsGranted`, `firstWinDiamond`; message includes "⭐ +X Stars" and "💎 +N Diamond (first win!)" when present.
4. **Profile card**: Shows Telegram display name (username or first_name + last_name) from `getTelegramUserUnsafe()` above badges.
5. **Verified in strip**: Small cyan "✓" badge shown at start of balance strip when `economyMe.badges` includes `verified` (`.balance-strip__verified`).
6. **Charity leaderboard badges** (optional): Omit for MVP; can add user lookup + badges later.
7. **Auto-award top_leader** (optional): Defer; requires cron or post-battle hook and leaderboard query.

---

## 7. Optional / future

- Ledger entries for Stars/Diamonds (audit trail).
- Admin "user detail" showing stars, diamonds, badges.
- Charity leaderboard: include user badges.
- Auto-assign `top_leader` for top N by score (scheduled job or on rank fetch).
