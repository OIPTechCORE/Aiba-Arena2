# NFT Multiverse — Master Plan

This document is the **master plan** for the AIBA Arena **NFT Multiverse**: multiple NFT universes (collections) with clear benefits for **Users**, **AIBA Token** (billions market cap), and **Super Admin** (billions revenue potential).

---

## 1. Vision

- **One ecosystem, many universes:** Brokers, Arena Legends, Badges, Certificates, and future collections (Land, Art) form a single **Multiverse** where every action drives value to users, AIBA, and platform.
- **Each party can reach billions:** Users earn from ownership, trading, staking, and royalties; AIBA gains from every mint, trade, and stake; Super Admin earns from TON mints, fees, and royalties.

---

## 2. Universes (Collections)

| Universe        | Type     | Mint currency | Who mints | On-chain | Benefit to AIBA / Admin |
|----------------|----------|---------------|-----------|----------|--------------------------|
| **Broker**     | Game     | AIBA          | Owner     | Yes      | Mint burns AIBA; marketplace fee %; treasury/burn |
| **Arena Legend** | Rare   | AIBA          | User (e.g. 100 wins) | Yes (future) | Mint burns AIBA; fee on sale; staking locks AIBA |
| **Course Badge** | Badge   | TON           | Graduate (1+ course) | Optional | TON → Super Admin wallet |
| **Full Certificate** | Badge | TON        | Full graduate | Optional | TON → Super Admin wallet |
| **Land** (future) | Utility | AIBA + TON | User      | Yes      | Dual revenue; rent in AIBA |
| **Art** (future) | Creator  | TON + AIBA   | Creators  | Yes      | Royalties % to creator + treasury |

- **Broker:** Already implemented (BrokerMintJob, pay AIBA; on-chain Broker NFT).
- **Arena Legend:** New. Unlock condition (e.g. 100 battle wins); mint cost in AIBA; rare collectible; stakable for AIBA rewards.
- **Course Badge / Full Certificate:** Already exist as badge mints (TON); can be represented in Multiverse and later as on-chain NFTs.
- **Land / Art:** Placeholders for future expansion (config-driven).

---

## 3. Benefits — A. USER (Billions Potential)

| Benefit | Description | Revenue / value potential |
|---------|-------------|---------------------------|
| **Ownership** | True on-chain ownership of Brokers, Legends, Badges; tradeable, provable. | Asset value grows with ecosystem; resale at higher prices. |
| **Trading** | Sell NFTs on marketplace for AIBA (and future TON); buy rare items. | Users capture value from secondary sales; flip for profit. |
| **Staking rewards** | Stake eligible NFTs (Broker, Arena Legend) to earn **AIBA daily**. Lock NFT → earn APY in AIBA. | Passive income in AIBA; compound over time. |
| **Royalties** | Creator/owner gets % of every secondary sale (configurable). | Recurring income from resales. |
| **Profile & status** | Display NFTs on profile; boosted visibility; badges and certificates. | Recognition, clout, influencer deals. |
| **Exclusive access** | Future: NFT-gated events, arenas, or rewards. | Premium experiences, early access. |
| **Play-to-earn** | Earn AIBA from battles → mint Broker NFT → sell or stake. | Full loop: play → own → earn. |

---

## 4. Benefits — B. AIBA TOKEN (Billions Market Cap)

| Lever | Description | Effect on market cap |
|-------|-------------|----------------------|
| **Mint sink** | Minting Broker and Arena Legend costs **AIBA** (burn or treasury). | Constant buy pressure; supply reduction or locked in treasury. |
| **Marketplace currency** | All primary and secondary sales in **AIBA**. | Every trade demands AIBA; volume = demand. |
| **Staking lock** | To stake an NFT for rewards, user may need to lock **AIBA** alongside (optional) or stake alone; rewards paid in AIBA. | Reduces circulating supply; rewards drive long-term holding. |
| **Fee burn** | Configurable % of marketplace fee **burned** (marketplaceBurnBps). | Deflationary pressure. |
| **Listing in AIBA** | Listings priced in AIBA; discovery and bids in AIBA. | Single in-app store of value. |
| **Buy-back** | Treasury uses part of fee revenue to buy back AIBA from market. | Price support, scarcity. |

Result: **AIBA** becomes the only in-app value token for the Multiverse; every mint, stake, and trade reinforces demand and scarcity → path to **billions market cap**.

---

## 5. Benefits — C. SUPER ADMIN (Billions Revenue)

| Revenue stream | Description | Scale |
|----------------|-------------|--------|
| **TON mints** | Course Badge, Full Certificate, future Land/Art mints: user pays **TON** → dedicated wallet per product. | Millions of users × 1–15 TON per mint = massive TON inflow. |
| **Marketplace fee** | % of every AIBA sale (marketplaceFeeBps); share to treasury (minus burn). | Fee on every secondary sale; grows with volume. |
| **Royalties** | On-chain or off-chain royalty % on secondary sales; portion to treasury. | Recurring % of resales. |
| **Listing fees** | Optional: pay TON or AIBA to list in premium slots (future). | Premium placement revenue. |
| **Dedicated wallets** | Each product (create broker, boost, gifts, badges, etc.) has its own wallet; clear accounting and treasury splits. | Transparent, auditable, scalable. |

Super Admin can direct TON and fee revenue into treasury, buy-back, and ecosystem grants → **billions** as the platform scales.

---

## 6. NFT Staking (Core Feature)

- **Eligible NFTs:** Broker (with linked on-chain NFT), Arena Legend (when implemented).
- **Mechanism:** User “stakes” NFT (record in DB; on-chain transfer to vault optional later). Staked NFT earns **AIBA daily** at a configurable **APY** (e.g. `nftStakingApyPercent`).
- **Reward:** Calculated from NFT’s “value” or fixed reward per NFT per day; paid from emission or treasury.
- **Unstake:** User unstakes; NFT returns to user; rewards stop.
- **Benefit to AIBA:** Staking rewards paid in AIBA; optionally require locking extra AIBA to stake → more demand and lock.

Config: `nftStakingApyPercent`, `nftStakingRewardPerDayAiba` (fixed per NFT), or formula.

---

## 7. Implementation Summary

| Layer | Component | Status / plan |
|-------|-----------|----------------|
| **Backend** | `NftUniverse` model | Define universes (broker, arena_legend, badge_course, etc.) with mint cost (AIBA/TON), wallet env, feeBps. |
| **Backend** | Multiverse routes | GET `/api/multiverse/universes`, GET `/api/multiverse/me` (my NFTs by universe), POST `/api/multiverse/mint` (delegate to broker/badge flow by universe). |
| **Backend** | NFT Staking | Model `NftStake` (user, nftItemAddress or brokerId, universe, stakedAt); routes: stake, unstake, claim; cron or on-claim to grant AIBA. |
| **Backend** | Economy config | `nftStakingApyPercent`, `nftStakingRewardPerDayAiba`, `arenaLegendMintCostAiba`, `arenaLegendUnlockWins`. |
| **Backend** | Marketplace | Already broker-based; extend Listing or add `NftListing` for other universes when on-chain NFTs exist. |
| **Admin** | Multiverse config | CRUD universes; set mint costs, wallets, fees. |
| **Miniapp** | Multiverse tab | List universes; “My NFTs” (brokers with NFT, staked); Mint (Broker/Arena Legend with AIBA); Stake / Unstake. |
| **Contracts** | Broker NFT | Existing. Arena Legend: new collection or same collection with different content. |

---

## 8. Checklist (Implementation)

- [x] **NftUniverse** model: slug, name, type, mintCostAiba, mintCostTonNano, tonWalletEnvVar, feeBps, burnBps, stakingEnabled, active, order.
- [x] **NftStake** model: telegramId, brokerId, universeSlug, stakedAt, lastRewardAt.
- [x] EconomyConfig: nftStakingApyPercent, nftStakingRewardPerDayAiba, arenaLegendMintCostAiba, arenaLegendUnlockWins.
- [x] GET `/api/multiverse/universes` — list active universes with mint costs and eligibility.
- [x] GET `/api/multiverse/me` — my NFTs (brokers with nftItemAddress).
- [x] POST `/api/multiverse/stake` — stake a broker NFT (brokerId); start earning AIBA.
- [x] POST `/api/multiverse/unstake` — unstake; stop rewards.
- [x] GET `/api/multiverse/staking/rewards` — claimable and staked count.
- [x] POST `/api/multiverse/staking/claim` — claim all pending NFT staking rewards (no cron; on-demand claim).
- [x] Admin: GET `/api/admin/multiverse/universes`, PATCH `/api/admin/multiverse/universes/:slug`, GET `/api/admin/multiverse/stakes`.
- [x] Miniapp: Multiverse tab — universes list, my NFTs, stake/unstake, claim rewards.

---

This is the **master plan** for the NFT Multiverse: multiple universes, staking, and unified benefits for Users, AIBA (billions market cap), and Super Admin (billions revenue).
