# Super Admin Wallets — Complete Reference

All TON transaction charges in AIBA Arena go to **Super Admin wallets**. Each flow has a dedicated env var. Configure these in `.env` (or your hosting provider’s env) before enabling the corresponding features.

---

## Quick reference table

| Super Admin name | Env var | Config (Admin → Economy) | API |
|------------------|---------|--------------------------|-----|
| **P2P AIBA send** | `P2P_AIBA_SEND_WALLET` | `p2pAibaSendFeeTonNano` (default 0.1 TON) | `POST /api/p2p-aiba/send` |
| **AIBA in gifts** | `AIBA_IN_GIFTS_WALLET` | `aibaInGiftsFeeTonNano` (default 0.1 TON) | `POST /api/gifts/send-aiba` |
| **Buy AIBA with TON** | `BUY_AIBA_WITH_TON_WALLET` | `buyAibaWithTonFeeBps` (default 5%) | `POST /api/p2p-aiba/buy` |
| **Donate a broker** | `DONATE_BROKER_WALLET` | `donateBrokerFeeTonNano` (default 0.5 TON) | `POST /api/donate/broker` |
| **Donate a car** | `DONATE_CAR_WALLET` | `donateCarFeeTonNano` (default 0.5 TON) | `POST /api/donate/car` |
| **Donate a bike** | `DONATE_BIKE_WALLET` | `donateBikeFeeTonNano` (default 0.5 TON) | `POST /api/donate/bike` |
| **Donate gifts** | `DONATE_GIFTS_WALLET` | `donateGiftsFeeTonNano` (default 0.1 TON) | `POST /api/donate/gifts` |
| **Cancelled stakes** | `CANCELLED_STAKES_WALLET` | AIBA fee (5% default) from early stake cancel → Treasury model (`staking_cancel_early_fee`). Env reserved for future TON-based fee. | `POST /api/staking/cancel-early` |
| Create broker (TON) | `CREATED_BROKERS_WALLET` | `createBrokerCostTonNano` (1–10 TON) | `POST /api/brokers/create-with-ton` |
| Boost profile | `BOOST_PROFILE_WALLET` | `boostProfileCostTonNano` (1–10 TON) | `POST /api/boosts/buy-profile-with-ton` |
| Gifts (basic) | `GIFTS_WALLET` | `giftCostTonNano` (1–10 TON) | `POST /api/gifts/send` |
| Stars Store | `STARS_STORE_WALLET` | `starsStorePackPriceTonNano` | `POST /api/stars-store/buy-with-ton` |
| Car Racing | `CAR_RACING_WALLET` | `createCarCostTonNano` (1–10 TON) | `POST /api/car-racing/create-with-ton` |
| Bike Racing | `MOTORCYCLE_RACING_WALLET` | `createBikeCostTonNano` (1–10 TON) | `POST /api/bike-racing/create-with-ton` |
| Create group | `LEADER_BOARD_WALLET` | `createGroupCostTonNano` (1–10 TON) | `POST /api/guilds/create` |
| Boost group | `BOOST_GROUP_WALLET` | `boostGroupCostTonNano` (1–10 TON) | `POST /api/guilds/:guildId/boost` |
| Premium | `PREMIUM_WALLET` | `premiumCostTonNano` (e.g. 5 TON) | `POST /api/premium/buy` |
| Battle boost | `BOOST_TON_WALLET` | `boostCostTonNano` | `POST /api/boosts/buy-with-ton` |
| University badge | `UNIVERSITY_BADGE_TON_WALLET` | `courseCompletionBadgeMintCostTonNano`, `fullCourseCompletionCertificateMintCostTonNano` | `POST /api/university/mint-*` |

---

## 1. P2P AIBA send

**Super Admin name:** P2P AIBA send  
**Env:** `P2P_AIBA_SEND_WALLET`  
**Config:** `p2pAibaSendFeeTonNano` (default 0.1 TON = 100_000_000 nano)

User pays a TON fee, then sends AIBA to another user. TON goes to this wallet.

- **API:** `POST /api/p2p-aiba/send`  
- **Body:** `{ toTelegramId?, toUsername?, amountAiba, txHash }`  
- **UI:** Wallet tab → P2P AIBA send  
- **Requires:** `oracleAibaPerTon` for rate display; user must have sufficient AIBA balance  

---

## 2. AIBA in gifts

**Super Admin name:** AIBA in gifts  
**Env:** `AIBA_IN_GIFTS_WALLET`  
**Config:** `aibaInGiftsFeeTonNano` (default 0.1 TON)

User pays TON (amount/rate + fee) and sends AIBA to a recipient. TON goes to this wallet.

- **API:** `POST /api/gifts/send-aiba`  
- **Body:** `{ txHash, toTelegramId?, toUsername?, amountAiba, message? }`  
- **UI:** Wallet tab → AIBA in gifts  
- **Requires:** `oracleAibaPerTon` for cost calculation  

---

## 3. Buy AIBA with TON

**Super Admin name:** Buy AIBA with TON  
**Env:** `BUY_AIBA_WITH_TON_WALLET`  
**Config:** `buyAibaWithTonFeeBps` (default 500 = 5%)

User sends TON to purchase AIBA. Full TON goes to this wallet; user receives AIBA at `oracle rate × (1 - feeBps/10000)`.

- **API:** `POST /api/p2p-aiba/buy`  
- **Body:** `{ txHash }`  
- **UI:** Wallet tab → Buy AIBA with TON  
- **Requires:** `oracleAibaPerTon`; any TON-supported wallet  

---

## 4. Donate (broker, car, bike, gifts)

All four flows use a TON fee paid to the corresponding Super Admin wallet.

### 4a. Donate a broker

**Env:** `DONATE_BROKER_WALLET`  
**Config:** `donateBrokerFeeTonNano` (default 0.5 TON)  
**API:** `POST /api/donate/broker` — Body: `{ brokerId, txHash }`  
**Note:** Broker must not be in a guild; it moves to donation pool.

### 4b. Donate a car

**Env:** `DONATE_CAR_WALLET`  
**Config:** `donateCarFeeTonNano` (default 0.5 TON)  
**API:** `POST /api/donate/car` — Body: `{ carId, txHash }`  

### 4c. Donate a bike

**Env:** `DONATE_BIKE_WALLET`  
**Config:** `donateBikeFeeTonNano` (default 0.5 TON)  
**API:** `POST /api/donate/bike` — Body: `{ bikeId, txHash }`  

### 4d. Donate gifts

**Env:** `DONATE_GIFTS_WALLET`  
**Config:** `donateGiftsFeeTonNano` (default 0.1 TON)  
**API:** `POST /api/donate/gifts` — Body: `{ txHash }`  

---

## 5. Other TON flows

| Flow | Env | Economy config key | Notes |
|------|-----|--------------------|-------|
| Create broker with TON | `CREATED_BROKERS_WALLET` | `createBrokerCostTonNano` | Auto-lists on marketplace |
| Boost profile | `BOOST_PROFILE_WALLET` | `boostProfileCostTonNano` | Profile visibility |
| Basic gift | `GIFTS_WALLET` | `giftCostTonNano` | Fixed TON gift |
| Stars Store | `STARS_STORE_WALLET` | `starsStorePackPriceTonNano` | Buy Stars with TON |
| Car Racing create | `CAR_RACING_WALLET` | `createCarCostTonNano` | Create car with TON |
| Bike Racing create | `MOTORCYCLE_RACING_WALLET` | `createBikeCostTonNano` | Create bike with TON |
| Create guild | `LEADER_BOARD_WALLET` | `createGroupCostTonNano` | Top leaders create free |
| Boost guild | `BOOST_GROUP_WALLET` | `boostGroupCostTonNano` | Boost group with TON |
| Premium | `PREMIUM_WALLET` | `premiumCostTonNano` | Subscription |
| Battle boost | `BOOST_TON_WALLET` | `boostCostTonNano` | Battle reward multiplier |
| University mint | `UNIVERSITY_BADGE_TON_WALLET` | `courseCompletionBadgeMintCostTonNano`, etc. | Course badges, certificates |

---

## Setup checklist

1. **Create TON wallets** for each flow you want to enable.  
2. **Add env vars** in `.env` (or hosting env, e.g. Vercel, Railway):
   ```
   P2P_AIBA_SEND_WALLET=UQ...
   AIBA_IN_GIFTS_WALLET=UQ...
   BUY_AIBA_WITH_TON_WALLET=UQ...
   DONATE_BROKER_WALLET=UQ...
   DONATE_CAR_WALLET=UQ...
   DONATE_BIKE_WALLET=UQ...
   DONATE_GIFTS_WALLET=UQ...
   # ... etc.
   ```
3. **Set oracle** (for P2P, AIBA gifts, Buy AIBA): Admin → Economy → `oracleAibaPerTon` or enable automated oracle.  
4. **Adjust fees** (optional): Admin → Economy → update fee config keys (e.g. `p2pAibaSendFeeTonNano`, `donateBrokerFeeTonNano`).

---

## Related docs

- **API-CONTRACT.md** — Full API reference (sections 5b, 5c, 5d)  
- **backend/.env.example** — All env vars with comments  
- **MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md** — TON + AIBA payment design  
