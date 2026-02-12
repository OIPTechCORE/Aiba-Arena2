# Stars, profile badges & diamonds — Plan, vision, gaps

Single reference for **Telegram Stars–style** currency, **X-style profile badges**, and **TON Diamonds** in AIBA Arena.

---

## 1. Vision

- **Stars** — In-app recognition and tips. Earned from battles (configurable per win); displayed in balance strip and Wallet; future: tips, charity, boosts.
- **Profile badges** — verified, early_adopter, top_donor, guild_leader, top_leader, champion. Assigned by admin or auto (e.g. top leaderboard → top_leader). Shown as pills next to username and in leaderboards.
- **Diamonds** — Premium TON asset. Earned on first win and select achievements; displayed as status. Futuristic diamond icon and styling.

All three integrate with the balance strip and modular miniapp UI.

---

## 2. Implementation (plan summary)

**Stars:** `User.starsBalance`; `EconomyConfig.starRewardPerBattle`; credit on battle win; balance strip + Wallet card with star icon.

**Badges:** `User.badges[]`; admin `POST /api/admin/mod/user-badges`; auto top_leader via sync job; `BADGE_LABELS` (label, color, title); Profile card pills, leaderboard inline pills, optional verified mark in balance strip.

**Diamonds:** `User.diamondsBalance`; first win + optional achievements; balance strip + Wallet card; diamond icon and premium styling.

**Economy /me:** Returns `starsBalance`, `diamondsBalance`, `badges`, and economy config (e.g. starRewardPerBattle).

---

## 3. Gaps and follow-ups (research)

| Area | Gap / note |
|------|------------|
| Stars eligibility | Plan: “battle **win**”; confirm credit only when score > 0 if desired. |
| Leaderboard badges | Leaderboard API should return `badges`; UI should render badge pills (BADGE_LABELS + .badge-pill). |
| Profile card | Show Telegram display name/username (e.g. from getTelegramUserUnsafe()); not only badges. |
| Balance strip | Optional small “verified” badge when user has `verified` in economyMe.badges. |
| Auto top_leader | Cron or hook to assign top_leader from leaderboard top N. |
| Notifications | notifyBattleWin: optionally include “+X Stars” and “+N Diamond (first win!)”; pass starsGranted and firstWinDiamond to notifier. |
| Admin | Optional: read-only view of user stars/diamonds/badges; ledger filter by currency. |

Backend: leaderboard aggregation `$project` should include `badges` from users. Charity leaderboard can optionally expose badges. Miniapp: leaderboard tab render badges; profile card show username/avatar.
