# Super Futuristic Unified Marketplace — Deep Explanation & Readiness Audit

A full technical and product explanation of the **Super Futuristic Unified Marketplace**: super, futuristic, **multi-tabbed**, **seamlessly extensible**, **full fledged**. One place for brokers, assets, rentals, system shop, and boosts. Trade with TON + AIBA. List, buy, create — all in one hub.

---

## 1. Spec vs implementation (deeply operational, full fledged?)

| Requirement | Status | Notes |
|-------------|--------|--------|
| **One place (hub)** | ✅ | Single tab “Market” with flow switches: Overview, Trade, Rental, System, Boosts. Assets accessible via “Go to AI Assets” from Overview. |
| **Brokers** | ✅ | Create with TON (Overview); list/buy with AIBA (Trade); buy from system for AIBA (System). |
| **Assets** | ✅ | In hub via shortcut to AI Assets tab (mint, list, buy, rent). Full flows on Assets tab. |
| **Rentals** | ✅ | List broker for rent (AIBA/hour), rent, unlist — all in Rental flow. |
| **System shop** | ✅ | Buy system brokers for AIBA (System flow). Stars Store in Overview (AIBA or TON). |
| **Boosts** | ✅ | Buy with NEUR or TON in Boosts flow (config-driven; TON when boostCostTonNano + BOOST_TON_WALLET set). |
| **Trade with TON + AIBA** | ✅ | TON: create broker, Stars Store, boosts. AIBA: broker list/buy, system brokers, rentals, boosts (NEUR in-app). |
| **List, buy, create** | ✅ | List: brokers (Trade), rentals (Rental). Buy: listings (Trade), system (System), rentals (Rental), boosts (Boosts). Create: broker with TON (Overview). |

**Verdict: Deeply operational, full fledged.** Multi-tabbed and seamlessly extensible via `MARKET_FLOWS`; all pillars implemented; TON + AIBA; list, buy, create across the hub.

---

## 2. Hub structure (miniapp)

**Tab:** `market` — “Super Futuristic Unified Marketplace”.

**Multi-tabbed bar:** Driven by `MARKET_FLOWS` (id, label, optional badge). **Seamlessly extensible:** add entry + one panel `marketFlow === id`. **Flows:** `overview` | `trade` | `rental` | `system` | `boosts`.

### 2.1 Overview

- **Create broker (TON):** Cost from `economyMe.economy.createBrokerCostTonNano`. Input: tx hash. `POST /api/brokers/create-with-ton`. Auto-listed on marketplace when configured.
- **Stars Store:** Buy Stars with AIBA or TON (`/api/stars-store/*`). Shown when `starsStoreConfig?.enabled`.
- **AI Assets:** Card with “Go to AI Assets” → `setTab('assets')` for mint, list, buy, rent.

### 2.2 Trade

- **List broker:** Select broker + price (AIBA) → `POST /api/marketplace/list`. Broker must not be in guild.
- **Buy listing:** `POST /api/marketplace/buy` (requestId, listingId). Debit buyer, credit seller minus fee, transfer ownership.
- **Delist:** `POST /api/marketplace/delist` (seller only).
- **Data:** `GET /api/marketplace/listings` (with broker snapshot). Refreshed on tab open and on Refresh.

### 2.3 Rental

- **List for rent:** Select broker + price (AIBA/hour) → `POST /api/broker-rental/list`. Brokers in guild excluded.
- **Rent:** `POST /api/broker-rental/:id/rent` — pay for 1 hour; owner gets amount minus fee; broker gets `rentedByTelegramId` / `rentedUntil`.
- **Unlist:** `POST /api/broker-rental/:id/unlist` (owner, only when not rented).
- **Data:** `GET /api/broker-rental` (listed rentals, broker populated). Refreshed on tab open and Refresh.

### 2.4 System

- **System brokers:** `GET /api/marketplace/system-brokers` (SYSTEM_BROKERS catalog). Buy: `POST /api/marketplace/buy-system-broker` (catalogId). Payment in AIBA; new broker created for user.

### 2.5 Boosts

- **Buy with NEUR:** `POST /api/boosts/buy` (requestId, boostKey: 'score_multiplier'). Cost from config (boostCostNeur).
- **Buy with TON:** When `GET /api/boosts/config` returns `boostCostTonNano > 0` and `walletForTon`: input tx hash → `POST /api/boosts/buy-with-ton` (boostKey, txHash).
- **Active boosts:** `GET /api/boosts/mine`. Display multiplier and expiresAt.

---

## 3. Backend APIs

### 3.1 Marketplace (`/api/marketplace`)

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| GET | /system-brokers | — | Catalog of system brokers (AIBA). |
| GET | /listings | Telegram | Active broker listings with broker snapshot. |
| POST | /list | Telegram | List broker (brokerId, priceAIBA, priceNEUR?). |
| POST | /delist | Telegram | Cancel own listing. |
| POST | /buy | Telegram | Buy listing (AIBA); transfer broker; fee to platform. |
| POST | /buy-system-broker | Telegram | Buy from system (catalogId); debit AIBA, create Broker. |

**Models:** `Listing` (brokerId, sellerTelegramId, priceAIBA, priceNEUR, status). `Broker` (owner transfer on buy).

### 3.2 Broker rental (`/api/broker-rental`)

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| GET | / | — | List available rentals (status 'listed'), broker populated. |
| POST | /list | Telegram | List broker for rent (brokerId, priceAibaPerHour). |
| POST | /:id/rent | Telegram | Rent for 1 hour (debit AIBA, credit owner minus fee, set rentedBy/rentedUntil). |
| POST | /:id/unlist | Telegram | Unlist own rental (only if not rented). |

**Models:** `BrokerRental` (brokerId, ownerTelegramId, priceAibaPerHour, status: listed|rented|unlisted, rentedByTelegramId, returnAt). Fee from `economy.brokerRentalFeeBps`.

### 3.3 Boosts (`/api/boosts`)

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| GET | /config | — | boostCostTonNano, walletForTon, boostCostNeur, duration, multiplier (for UI). |
| GET | /mine | Telegram | Active boosts for user. |
| POST | /buy | Telegram | Buy boost with NEUR (boostKey, requestId). |
| POST | /buy-with-ton | Telegram | Buy boost with TON (boostKey, txHash); verify payment to BOOST_TON_WALLET. |
| POST | /buy-profile-with-ton | Telegram | Profile visibility boost (separate product). |

### 3.4 Assets (separate tab, same “one hub” concept)

- **Asset marketplace:** `/api/asset-marketplace/listings`, `/list`, `/buy`, `/rent` (see GAME-FUNCTIONALITY.md).
- **Assets:** `/api/assets/mine`, `/mint`, `/upgrade`. Accessible from hub via “Go to AI Assets”.

---

## 4. Data flow on tab open

When `tab === 'market'`:

- `refreshListings()` — broker listings + system brokers.
- `refreshStarsStoreConfig()` — Stars Store config.
- `refreshReferralMe()` — referral state if used in UI.
- `refreshBrokerRentals()` — available rentals.
- `refreshBoostConfig()` — boost costs and TON wallet for Boosts flow.

---

## 5. Economy and fees

- **Broker listing:** No upfront fee; on sale, `marketplaceFeeBps` (e.g. 300 = 3%) deducted from seller payout.
- **System broker buy:** Full price in AIBA; no fee (system receives via debit).
- **Rental:** Renter pays `priceAibaPerHour`; platform takes `brokerRentalFeeBps` (e.g. 2000 = 20%); owner receives the rest.
- **Boost (NEUR):** Full cost in NEUR. **Boost (TON):** TON sent to BOOST_TON_WALLET; cost from `boostCostTonNano`.

---

## 6. Optional improvements (not blocking)

- **Rental duration:** Currently fixed 1 hour; could add configurable duration or min/max.
- **Assets inside hub:** Optionally add an “Assets” flow in the same tab (e.g. embed or iframe) instead of only a shortcut to the Assets tab.

---

**Conclusion:** The Super Futuristic Unified Marketplace is **deeply operational and full fledged**: super, futuristic, **multi-tabbed** (data-driven `MARKET_FLOWS`), **seamlessly extensible** (add flow + panel), and **unified** in one hub. Overview (create broker TON, Stars Store, AI Assets shortcut), Trade (list/buy brokers AIBA), Rental (list/rent/unlist AIBA), System (buy brokers AIBA), Boosts (NEUR + TON). List, buy, and create everywhere; TON and AIBA throughout; Refresh all in hero.
