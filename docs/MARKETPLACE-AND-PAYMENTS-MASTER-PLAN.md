# Unified Marketplace & Payments — 360° Master Plan

This document is the **master plan** for the super, futuristic marketplace and all payments. **All payments are in TON or AIBA only.** Goal: position **AIBA** for billions-of-dollars market cap by making it the primary in-app value and reward token, with TON as the on-ramp and Super Admin revenue.

---

## 1. Payment Principles

| Principle | Description |
|-----------|-------------|
| **Dual currency** | **TON** — entry fees, creation fees, boosts, gifts, group create/boost. **AIBA** — marketplace purchases, upgrades, in-app rewards, staking, governance. |
| **AIBA demand** | Battle rewards, referrals, daily rewards, and marketplace **sales** are in AIBA. Buying brokers/items on the marketplace **spends AIBA**, increasing circulation and perceived value. Listing prices in AIBA drive demand. |
| **TON as on-ramp** | Users pay TON to create brokers, boost profile, send gifts, create/boost groups. All TON goes to **Super Admin wallets** (one per product group for accounting). |
| **No other tokens** | No NEUR for marketplace listings (NEUR stays gameplay-only). No third-party tokens. TON + AIBA only. |

---

## 2. Super Admin Wallets (per product group)

Every TON payment type has its **own wallet** in the Super Admin dashboard (env vars). This gives clear accounting and optional future treasury splits.

| Product / feature | Env var | Cost (config) | Adjustable in Super Admin |
|-------------------|---------|----------------|---------------------------|
| **Create broker** (pay TON to mint a new broker) | `CREATED_BROKERS_WALLET` | `createBrokerCostTonNano` (1–10 TON) | Yes (Economy config) |
| **Boost your profile** (visibility/recognition) | `BOOST_PROFILE_WALLET` | `boostProfileCostTonNano` (1–10 TON) | Yes |
| **Gifts** (send gift to another user) | `GIFTS_WALLET` | `giftCostTonNano` (1–10 TON) | Yes |
| **Battle boost** (reward multiplier, pay TON) | `BOOST_TON_WALLET` | `boostCostTonNano` | Yes |
| **Create group** (pay TON if not top leader) | `LEADER_BOARD_WALLET` | `createGroupCostTonNano` (1–10 TON) | Yes |
| **Boost group** | `BOOST_GROUP_WALLET` | `boostGroupCostTonNano` (1–10 TON) | Yes |

All costs in the 1–10 TON range are **clamped** in the backend when Super Admin saves Economy config.

---

## 3. Unified Marketplace — What it is

- **One global marketplace** where all users (worldwide) can:
  - **Browse** listings (brokers, future: items).
  - **Sell** brokers they own (list for **AIBA** and optionally NEUR).
  - **Buy** listed brokers with **AIBA** (buyer pays; seller receives AIBA minus fee; fee can burn or go to treasury to support AIBA value).
- **Listing currency:** Primary **AIBA** (and optional NEUR). No TON as listing price (TON is for creation/boosts/gifts only).
- **Creation flow:** User pays **TON** once to **create** a new broker → that broker is **automatically listed** on the marketplace so it is visible globally. The creating user is the seller and gets **global recognition** (shown as seller on the listing).

---

## 4. Create broker with TON (flow)

1. User chooses **Create broker (pay TON)**.
2. Cost shown from config: **1–10 TON** (adjustable in Super Admin).
3. User sends TON to **CREATED_BROKERS_WALLET** (amount ≥ cost).
4. User submits **txHash** to backend.
5. Backend verifies payment (on-chain), then:
   - Creates a new **Broker** (owner = user).
   - Creates a **Listing** (broker, seller = user, default price in **AIBA** from config so it appears on marketplace).
6. Broker appears on **global marketplace**; user is shown as seller → **global recognition**.

**Config:** `createBrokerCostTonNano` (1e9–10e9), `marketplaceDefaultNewBrokerPriceAIBA` (e.g. min listing price so auto-listed brokers are visible).

---

## 5. Marketplace — Buy / Sell (AIBA)

- **Sell:** User lists an owned broker with **priceAIBA** (and optional priceNEUR). Listing is global.
- **Buy:** Buyer pays in **AIBA**; seller receives AIBA minus marketplace fee. Fee can be burned or sent to treasury (config: `marketplaceFeeBps`, `marketplaceBurnBps`). Ownership transfers to buyer.
- **Recognition:** When a user’s broker is listed, they are **published globally** as the seller (sellerTelegramId / username on listing). Top sellers can be surfaced in a “Creators” or “Sellers” spotlight (future).

---

## 6. Boost your profile

- User pays **TON** (1–10 TON, configurable).
- Payment goes to **BOOST_PROFILE_WALLET**.
- In return, user gets **profile boost** (e.g. `profileBoostedUntil` on User). While boosted:
  - Badge or label “Boosted” on profile/leaderboard.
  - Optional: higher visibility (e.g. sort boost in discovery).
- Config: `boostProfileCostTonNano` (1–10 TON, clamped).

---

## 7. Gifts system

- User pays **TON** (1–10 TON, configurable) to send a **gift** to another user (e.g. by telegramId or username).
- Payment goes to **GIFTS_WALLET**.
- Backend records the gift (from, to, amount, txHash). Recipient can see “Gifts received” (count or list). Optional: badge “Gift receiver” or “Generous” for giver.
- Config: `giftCostTonNano` (1–10 TON, clamped).

---

## 8. Payment flow summary (360°)

| Action | Currency | Recipient (value) | Backend / config |
|--------|----------|-------------------|------------------|
| Create broker | TON | Super Admin (CREATED_BROKERS_WALLET) | createBrokerCostTonNano |
| List broker | — | — | price in AIBA (seller sets) |
| Buy broker | AIBA | Seller (minus fee); fee → burn/treasury | marketplaceFeeBps, marketplaceBurnBps |
| Boost profile | TON | Super Admin (BOOST_PROFILE_WALLET) | boostProfileCostTonNano |
| Send gift | TON | Super Admin (GIFTS_WALLET) | giftCostTonNano |
| Battle boost | TON | Super Admin (BOOST_TON_WALLET) | boostCostTonNano |
| Create group | TON | Super Admin (LEADER_BOARD_WALLET) | createGroupCostTonNano |
| Boost group | TON | Super Admin (BOOST_GROUP_WALLET) | boostGroupCostTonNano |

---

## 9. AIBA market cap strategy (short)

- **Demand:** Battle rewards, referrals, daily, staking, and **marketplace activity** (buying brokers with AIBA) keep AIBA in circulation and desired.
- **Supply control:** Burns (marketplace fee burn, upgrade costs), caps, and treasury design support long-term value.
- **Single in-app token for value:** All “value” transactions (buy/sell brokers, upgrades, stakes) in AIBA; TON reserved for “entry” and “Super Admin revenue” so AIBA is the heart of the economy.

---

## 10. Implementation checklist

- [x] Economy config: `createBrokerCostTonNano`, `boostProfileCostTonNano`, `giftCostTonNano` (1–10 TON), `boostProfileDurationDays`, `marketplaceDefaultNewBrokerPriceAIBA`.
- [x] Env: `CREATED_BROKERS_WALLET`, `BOOST_PROFILE_WALLET`, `GIFTS_WALLET`.
- [x] POST `/api/brokers/create-with-ton`: verify TON → create broker → auto-list on marketplace.
- [x] POST `/api/boosts/buy-profile-with-ton`: verify TON → set User.profileBoostedUntil.
- [x] POST `/api/gifts/send`, GET `/api/gifts/received`, GET `/api/gifts/sent`: verify TON → record gift; list received/sent.
- [x] Admin Economy: allow and clamp all new cost keys (1–10 TON range).
- [x] Miniapp: Create broker (TON), Boost profile (TON), Gifts (TON) UI; Market tab lists + create broker card; Wallet tab profile boost + gifts.

---

## 11. Implementation reference (codebase)

| Layer | Location | Details |
|-------|----------|---------|
| **Backend routes** | `backend/routes/brokers.js` | POST `/api/brokers/create-with-ton` (txHash → Broker + Listing). |
| | `backend/routes/boosts.js` | POST `/api/boosts/buy-profile-with-ton` (txHash → User.profileBoostedUntil). |
| | `backend/routes/gifts.js` | POST `/api/gifts/send`, GET `/api/gifts/received`, GET `/api/gifts/sent`. |
| **TON verification** | `backend/util/tonVerify.js` | `verifyTonPayment(txHash, wallet, amountNano)` — on-chain check. |
| **Models** | `backend/models/Broker.js` | `createdWithTonTxHash` (idempotency for create-with-ton). |
| | `backend/models/User.js` | `profileBoostedUntil` (Date). |
| | `backend/models/Gift.js` | fromTelegramId, toTelegramId, amountNano, txHash, message. |
| | `backend/models/UsedTonTxHash.js` | txHash, purpose, ownerTelegramId (idempotency for boost/gift). |
| **Economy config** | `backend/models/EconomyConfig.js` | createBrokerCostTonNano, boostProfileCostTonNano, giftCostTonNano, boostProfileDurationDays, marketplaceDefaultNewBrokerPriceAIBA. |
| **Admin** | `backend/routes/adminEconomy.js` | New keys in allowedTopLevel; clamp 1e9–10e9 for TON costs. |
| **Economy API** | `backend/routes/economy.js` | GET `/api/economy/me` exposes economy.* and profileBoostedUntil. |
| **Miniapp** | `miniapp/src/app/page.js` | **Market tab:** “Create your broker (pay TON)” card (cost, txHash, submit). **Wallet tab:** “Boost your profile” card; “Gifts” card (send form + received/sent lists). Tab-based refresh: market → listings; wallet → gifts. |
| **Env** | `backend/.env.example` | CREATED_BROKERS_WALLET, BOOST_PROFILE_WALLET, GIFTS_WALLET. |

Related docs: **PROJECT-DESCRIPTION-SYSTEMATIC.md** (full routes/models), **USER-GUIDE.md** (player flows, all tabs), **NFT-MULTIVERSE-MASTER-PLAN.md** (NFT Multiverse: own, stake, earn AIBA; benefits for User, AIBA token, Super Admin), **LEADERBOARD-AND-GROUPS-CHECK.md** (groups: pay to create, boost with TON), **deployment.md** / **mainnet-readiness.md** (env and wallets).

---

This is the **360° master plan** for the unified marketplace and all payments (TON + AIBA only, Super Admin wallets per product group, AIBA toward billions market cap).
