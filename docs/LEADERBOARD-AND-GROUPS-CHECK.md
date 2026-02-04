# Leaderboard & Groups — Deep Check

This document verifies the codebase against the **leaderboard and groups** requirements. Each requirement is checked against routes, models, config, and UI.

---

## 1. All users globally should be able to see the leaderboard

| Requirement | Status | Where |
|-------------|--------|--------|
| Leaderboard visible to all app users | **Implemented** | `GET /api/leaderboard` — requires Telegram auth (`requireTelegram`). Any user who can open the miniapp (authenticated) can call this. |
| No country or region filter | **Implemented** | `backend/routes/leaderboard.js`: aggregation is over **all** battles/users; no `country` or `region` filter in the pipeline. Comment in code: *"Global leaderboard: all users worldwide, no country filter."* |
| Miniapp shows leaderboard | **Implemented** | `miniapp/src/app/page.js`: Home tab fetches `/api/leaderboard?by=score|aiba|neur|battles&limit=100` and displays top entries (e.g. slice 0–12). |

**Conclusion:** All users (globally, any country) who use the app can see the leaderboard once authenticated.

---

## 2. The leaderboard should show every user from every country worldwide

| Requirement | Status | Where |
|-------------|--------|--------|
| No geographic filtering | **Implemented** | Leaderboard aggregates by `ownerTelegramId` from **all** battles; no filter by country, locale, or IP. |
| Users from any country appear | **Implemented** | User/country is not stored or used in the leaderboard query. Every user with battle activity is ranked. |

**Conclusion:** The leaderboard is global; it shows every user worldwide with no country-based filtering.

---

## 3. Top-most leaders should be able to create groups

| Requirement | Status | Where |
|-------------|--------|--------|
| Top N by score can create a group | **Implemented** | `POST /api/guilds/create`: uses `leaderboardTopFreeCreate` (default 50). User’s rank is computed (by total score); if `rank <= topFree`, they can create **without** paying TON. |
| Rank source | **Implemented** | Rank = count of users with **higher** total score + 1. Same logic as `GET /api/leaderboard/my-rank`. |

**Conclusion:** Top N leaders (by total score) can create a group for free. N is configurable in Super Admin (Economy config: `leaderboardTopFreeCreate`).

---

## 4. Created group(s) should have a multitude of benefits

| Benefit | Status | Where |
|---------|--------|--------|
| Guild Wars arena | **Implemented** | Game mode `guildWars` requires guild membership. Battle route checks guild for guildWars; rewards split (e.g. 80% to user, 20% to guild vault). |
| Guild vault (NEUR) | **Implemented** | `Guild.vaultNeur` (and `vaultAiba`). Guild Wars reward share is credited to the guild. |
| Pooled brokers | **Implemented** | Members can deposit brokers into the guild pool (`POST /api/guilds/deposit-broker`); used for guild wars / matchmaking. |
| Boost count & visibility | **Implemented** | `Guild.boostCount`, `boostedUntil`. Groups list is sorted by `boostCount` then `createdAt` — boosted groups appear higher. |
| Join/leave, membership | **Implemented** | Any user can join (`POST /api/guilds/join`) or leave (`POST /api/guilds/leave`). |

**Conclusion:** Groups provide: Guild Wars access, guild vault (NEUR share), broker pool, boost-based visibility, and membership. Multiple benefits are in place.

---

## 5. There should be an option of paying to create a group

| Requirement | Status | Where |
|-------------|--------|--------|
| Pay TON to create if not top N | **Implemented** | `POST /api/guilds/create`: if user’s rank &gt; `leaderboardTopFreeCreate`, they must send `txHash` proving TON payment. |
| Payment verification | **Implemented** | `verifyTonPayment(txHash, leaderBoardWallet, costNano)` — checks tx on-chain (value ≥ cost, recipient = LEADER_BOARD_WALLET). |

**Conclusion:** Users not in the top N can create a group by paying TON; payment is verified on-chain.

---

## 6. Create-group cost: 1–10 TON, adjustable, TON → Super Admin’s leader board wallet

| Requirement | Status | Where |
|-------------|--------|--------|
| Cost between 1 TON and 10 TON | **Implemented** | `EconomyConfig.createGroupCostTonNano` (default 1e9 = 1 TON). **Admin PATCH** clamps value to **1e9–10e9** (1–10 TON) in `adminEconomy.js`. |
| Adjustable in Super Admin dashboard | **Implemented** | Admin → Economy tab loads full config (GET `/api/admin/economy/config`); JSON includes `createGroupCostTonNano`. Saving (PATCH) updates it. Backend accepts the key and clamps to 1–10 TON. |
| Paid TON goes to Super Admin’s leader board wallet | **Implemented** | `LEADER_BOARD_WALLET` env var. Payment is verified to that address in `verifyTonPayment(txHash, leaderBoardWallet, costNano)`. |

**Conclusion:** Create-group cost is 1–10 TON (enforced on save), adjustable in Super Admin Economy config, and paid TON goes to `LEADER_BOARD_WALLET`.

---

## 7. Groups should be seen by all users globally

| Requirement | Status | Where |
|-------------|--------|--------|
| All groups visible globally | **Implemented** | `GET /api/guilds/list`: returns `Guild.find({ active: true })`, sorted by `boostCount`, `createdAt`; limit up to 300. No country or region filter. |
| Miniapp shows all groups | **Implemented** | Guilds tab fetches `/api/guilds/list?limit=200` and displays “Discover all” with Join and Boost per group. |

**Conclusion:** All active groups are visible to every user globally via the list endpoint and miniapp.

---

## 8. All users globally are free to join any group

| Requirement | Status | Where |
|-------------|--------|--------|
| Join without payment | **Implemented** | `POST /api/guilds/join` with `guildId`; no payment or fee. User is added to `guild.members`. |
| No restriction by country or role | **Implemented** | No check for country or prior membership elsewhere; any authenticated user can join any active guild. |

**Conclusion:** Joining a group is free and open to all users globally.

---

## 9. Any user in any group can boost the group (and cost 1–10 TON, adjustable, TON → Boost Group wallet)

| Requirement | Status | Where |
|-------------|--------|--------|
| Any user can boost a group | **Implemented** | `POST /api/guilds/:guildId/boost` with `txHash`. No check that the user is a member; **any** authenticated user can boost **any** group. |
| Cost between 1 TON and 10 TON | **Implemented** | `EconomyConfig.boostGroupCostTonNano` (default 1e9). **Admin PATCH** clamps to **1e9–10e9** (1–10 TON) in `adminEconomy.js`. |
| Adjustable in Super Admin dashboard | **Implemented** | Same Economy config JSON; `boostGroupCostTonNano` is included and updated on save (with clamp). |
| Paid TON goes to Super Admin’s boost group wallet | **Implemented** | `BOOST_GROUP_WALLET` env var. `verifyTonPayment(txHash, boostWallet, costNano)` verifies payment to this address. |

**Conclusion:** Any user can boost any group; cost is 1–10 TON (enforced on save), adjustable in Super Admin Economy, and paid TON goes to `BOOST_GROUP_WALLET`.

---

## Summary table

| # | Requirement | Status |
|---|-------------|--------|
| 1 | All users globally can see the leaderboard | ✅ Implemented |
| 2 | Leaderboard shows every user from every country worldwide | ✅ Implemented |
| 3 | Top-most leaders can create groups | ✅ Implemented |
| 4 | Created groups have a multitude of benefits | ✅ Implemented |
| 5 | Option of paying to create a group | ✅ Implemented |
| 6 | Create cost 1–10 TON; adjustable; TON → Leader Board wallet | ✅ Implemented (clamp added in admin) |
| 7 | Groups seen by all users globally | ✅ Implemented |
| 8 | All users globally free to join any group | ✅ Implemented |
| 9 | Any user can boost a group; cost 1–10 TON; adjustable; TON → Boost Group wallet | ✅ Implemented (clamp added in admin) |

---

## Code references (quick)

- **Leaderboard:** `backend/routes/leaderboard.js` (GET `/`, GET `/my-rank`).
- **Guilds:** `backend/routes/guilds.js` (create, join, list, boost, deposit/withdraw broker).
- **Economy config:** `backend/models/EconomyConfig.js` (`createGroupCostTonNano`, `boostGroupCostTonNano`, `leaderboardTopFreeCreate`).
- **Admin Economy:** `backend/routes/adminEconomy.js` (PATCH config; create/boost cost clamped to 1–10 TON).
- **Env:** `LEADER_BOARD_WALLET`, `BOOST_GROUP_WALLET` in `backend/.env.example`.
- **Miniapp:** `miniapp/src/app/page.js` (leaderboard fetch/display; guilds list, create, join, boost).

---

## Fix applied in this check

- **Admin Economy:** `createGroupCostTonNano` and `boostGroupCostTonNano` were not in the `allowedTopLevel` set, so in production the PATCH would reject them as unknown fields. They have been **added** to the allowed set.
- **1–10 TON range:** When Super Admin sets create or boost cost, the backend now **clamps** the value to 1e9–10e9 nano (1–10 TON) so the cost always stays within the required range.

All requirements are met; the leaderboard is global, groups are visible and joinable by everyone, top leaders can create for free, others can pay 1–10 TON to create (or boost), and both costs are adjustable in the Super Admin dashboard with TON going to the correct wallets.
