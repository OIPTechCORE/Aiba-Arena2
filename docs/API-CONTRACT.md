# API Contract — Multiverse Expansion

**Version:** Feb 2026  
**Status:** Phase 1 baseline (schemas + endpoints for new systems).

This document defines the **API surface** for core flows, Realms, Missions, Mentors, Assets, Marketplace, Governance, and Treasury telemetry.

## 0) Core (Economy, Vault, Wallet, Battle)

**GET** `/api/economy/me` — Auth. User balances (NEUR, AIBA, Stars, Diamonds), wallet, badges, economy config snapshot.  
**POST** `/api/economy/claim-aiba` — Auth. Body: `{ requestId, amount? }`. Create signed claim for on-chain withdrawal. Idempotent.

**GET** `/api/vault/claim-status` — Query: `to`, `seqno`, `validUntil`, `amount`. Returns `{ status: "pending"|"confirmed"|"expired"|... }`.  
**GET** `/api/vault/last-seqno` — Query: `to`. Vault last seqno for claim tracking.  
**GET** `/api/vault/inventory` — Vault inventory (for display).

**POST** `/api/wallet/connect` — Auth. Body: `{ address }`. Link TON wallet to user.

**POST** `/api/battle/run` — Auth. Body: `{ brokerId, arena, league? }`. Run battle; returns score, rewards.

**Health & Monitoring:** `GET /health` (root, not under `/api`) returns `{ ok: true }` for uptime checks. System status (operational/maintenance) is `GET /api/comms/status`. Prometheus: `GET /metrics`.

**Idempotency:** Many POST endpoints (staking, marketplace buy, etc.) accept `requestId` in the request body or `X-Request-Id` header to ensure idempotency. Include it when retrying to avoid double-spending.

---

## 1) Realms & Missions

**GET** `/api/realms`  
Returns `{ realms: Realm[] }`

**GET** `/api/realms/:key`  
Returns `{ realm: Realm }`

**GET** `/api/missions?realmKey=...`  
Returns `{ missions: Mission[] }`

**POST** `/api/missions/complete`  
Body: `{ missionId }`  
Returns `{ ok: true, rewardAiba, rewardNeur, xp }`

---

## 2) Mentors

**GET** `/api/mentors`  
Returns `{ mentors: Mentor[] }`

**POST** `/api/mentors/assign`  
Body: `{ mentorId }`  
Returns `{ ok: true }`

**POST** `/api/mentors/upgrade`  
Body: `{ mentorId }`  
Returns `{ ok: true, costAiba }`

**POST** `/api/mentors/stake` — Body: `{ mentorId, amountAiba }`. Stake AIBA to mentor.  
**POST** `/api/mentors/unstake` — Body: `{ stakeId }`. Unstake.  
**GET** `/api/mentors/stakes` — Auth. User's mentor stakes.  
**GET** `/api/mentors/stake-info` — Public. Mentor vault/stake info.

---

## 2a) Guilds (Groups)

*Route order:* `/list`, `/mine`, `/top` must be defined before `/:guildId` routes (otherwise `GET /list` matches `/:guildId` with guildId=`list`).

**GET** `/api/guilds/list` — Query: `limit`. All active guilds (sorted by boost count).  
**GET** `/api/guilds/mine` — Auth. User's guilds.  
**GET** `/api/guilds/top` — Alias for list (limit 50).  
**POST** `/api/guilds/create` — Body: `{ name, bio?, txHash? }`. Top N by score create free; others pay TON.  
**POST** `/api/guilds/join` — Body: `{ guildId }`  
**POST** `/api/guilds/leave` — Body: `{ guildId }`. Leave a guild.  
**POST** `/api/guilds/:guildId/boost` — Body: `{ txHash }` — Pay TON to boost group  
**POST** `/api/guilds/deposit-broker` — Body: `{ guildId, brokerId }`  
**POST** `/api/guilds/withdraw-broker` — Body: `{ guildId, brokerId }`  
**GET** `/api/guilds/:guildId/pool` — Auth. Guild's pooled brokers.

---

## 2b) Breeding (Brokers)

**POST** `/api/breeding/breed` — Body: `{ brokerIdA, brokerIdB }`. Combines two brokers into one (burns both + AIBA cost from Economy config `breedCostAiba`). Returns `{ ok: true, child }`.

---

## 3) Assets & Marketplace

**POST** `/api/assets/mint`  
Body: `{ category, name, realmKey, metadataUri }`  
Returns `{ asset }`

**POST** `/api/assets/upgrade`  
Body: `{ assetId }`  
Returns `{ asset }`

**GET** `/api/assets/mine`  
Returns `{ assets: Asset[] }`

### 3a) Broker Marketplace (Brokers)

**GET** `/api/marketplace/listings`  
Query: `limit`  
Returns `Listing[]`

**POST** `/api/marketplace/list`  
Body: `{ brokerId, priceAIBA, priceNEUR }`  
Returns `Listing`

**POST** `/api/marketplace/delist`  
Body: `{ listingId }`  
Returns `{ ok: true, listing }`

**POST** `/api/marketplace/buy`  
Body: `{ listingId, requestId }`  
Returns `{ ok: true, broker, listingId }`

**GET** `/api/marketplace/system-brokers` — Catalog of brokers sold by system (AIBA).  
**POST** `/api/marketplace/buy-system-broker` — Body: `{ catalogId }`. Purchase broker from system.

### 3b) Car Racing (full API)

**GET** `/api/car-racing/config` — Racing config, wallet, car classes.  
**GET** `/api/car-racing/tracks` — Query: `league`. Active tracks.  
**GET** `/api/car-racing/races` — Query: `status`, `limit`. Open races with entry count.  
**GET** `/api/car-racing/cars` — Auth. User's cars.  
**GET** `/api/car-racing/listings` — Auth. Active car listings from players.  
**GET** `/api/car-racing/leaderboard` — Query: `limit`. Top racers.  
**GET** `/api/car-racing/system-cars` — Catalog of cars sold by system (AIBA).  
**GET** `/api/car-racing/race/:id` — Single race with entries.  
**POST** `/api/car-racing/create` — Body: `{ requestId }`. Create car with AIBA.  
**POST** `/api/car-racing/create-with-ton` — Body: `{ txHash }`. Create car with TON → CAR_RACING_WALLET.  
**POST** `/api/car-racing/enter` — Body: `{ requestId, raceId, carId }`. Enter race.  
**POST** `/api/car-racing/list` — Body: `{ carId, priceAIBA }`. List your car for sale.  
**POST** `/api/car-racing/buy-car` — Body: `{ listingId, requestId }`. Buy car from player listing.  
**POST** `/api/car-racing/buy-system-car` — Body: `{ catalogId }`. Purchase car from system.

### 3c) Bike Racing (full API)

**GET** `/api/bike-racing/config` — Racing config, wallet, bike classes.  
**GET** `/api/bike-racing/tracks` — Query: `league`. Active tracks.  
**GET** `/api/bike-racing/races` — Query: `status`, `limit`. Open races with entry count.  
**GET** `/api/bike-racing/bikes` — Auth. User's bikes.  
**GET** `/api/bike-racing/listings` — Auth. Active bike listings from players.  
**GET** `/api/bike-racing/leaderboard` — Query: `limit`. Top racers.  
**GET** `/api/bike-racing/system-bikes` — Catalog of bikes sold by system (AIBA).  
**GET** `/api/bike-racing/race/:id` — Single race with entries.  
**POST** `/api/bike-racing/create` — Body: `{ requestId }`. Create bike with AIBA.  
**POST** `/api/bike-racing/create-with-ton` — Body: `{ txHash }`. Create bike with TON → MOTORCYCLE_RACING_WALLET.  
**POST** `/api/bike-racing/enter` — Body: `{ requestId, raceId, bikeId }`. Enter race.  
**POST** `/api/bike-racing/list` — Body: `{ bikeId, priceAIBA }`. List your bike for sale.  
**POST** `/api/bike-racing/buy-bike` — Body: `{ listingId, requestId }`. Buy bike from player listing.  
**POST** `/api/bike-racing/buy-system-bike` — Body: `{ catalogId }`. Purchase bike from system.

### 3d) Asset Marketplace (NFT Assets)

**GET** `/api/asset-marketplace/listings`  
Query: `listingType`  
Returns `{ listings: AssetListing[] }`

**GET** `/api/asset-marketplace/onchain-info`  
Query: `listingId`  
Returns `{ listingId, priceAiba, escrowAddress, escrowJettonWallet, jettonMaster }`

**POST** `/api/asset-marketplace/list`  
Body: `{ assetId, priceAiba, listingType }`  
Returns `{ listing }`

**POST** `/api/asset-marketplace/buy`  
Body: `{ listingId }`  
Returns `{ ok: true, asset }`

**POST** `/api/asset-marketplace/rent`  
Body: `{ listingId, durationHours }`  
Returns `{ rental }`

---

## 4) Governance & DAO

There are two governance systems:
- **DAO** (`/api/dao`): Community proposals with staking requirement; used in DAO tab.
- **Governance** (`/api/governance`): Realm/Mentor proposals (GovernanceProposal); used in Realms/Assets tab.

### 4a) DAO (Community proposals)

**GET** `/api/dao/proposals`  
Query: `limit`, `status` (active|closed)  
Returns proposals with votesFor, votesAgainst.

**GET** `/api/dao/proposals/:id`  
Returns single proposal with vote counts and myVote.

**POST** `/api/dao/proposals`  
Body: `{ title, description?, type?, recipientTelegramId?, payoutAiba?, payoutNeur? }`  
Returns `{ proposal }`  

**Staking requirement:** User must have staked ≥ `daoProposalMinStakedAiba` (default 10,000 AIBA) for ≥ `daoProposalMinStakeDays` (default 30 days) to create proposals. Configure in Admin → Economy. If not met: 403 `staking_required`.

**POST** `/api/dao/vote`  
Body: `{ proposalId, support: true|false }`  
Returns `{ ok: true }`. One vote per user per proposal; can change vote.

**PATCH** `/api/dao/proposals/:id/close` — Admin: close proposal  
**POST** `/api/dao/proposals/:id/execute` — Admin: execute treasury_payout

### 4b) Governance (Realm proposals)

**GET** `/api/governance/proposals` — Returns `{ proposals }` (GovernanceProposal[])  
**POST** `/api/governance/propose` — Body: `{ title, description?, actions? }`  
**POST** `/api/governance/vote` — Body: `{ proposalId, vote: 'for'|'against' }`

---

## 5) Treasury & Telemetry

**GET** `/api/treasury/summary`  
Returns `{ balanceAiba, balanceNeur, totalPaidOutAiba, totalPaidOutNeur }`

**GET** `/api/treasury/ops`  
Returns `{ ops: TreasuryOp[] }`

**GET** `/api/comms/status` — Returns `{ status: "operational", updatedAt }`  
**GET** `/api/comms/config` — Returns `{ supportLink, supportTelegramGroup }` (Admin → Economy)

### Announcements & Support (Unified Comms)

**GET** `/api/announcements` — Auth. Query: `limit`. Returns `{ items: Announcement[], unreadCount }` (items = announcements; unreadCount = count newer than user's lastSeenAnnouncementId).  
**POST** `/api/announcements/seen` — Body: `{ announcementId }`. Mark as read; updates lastSeenAnnouncementId.  
**POST** `/api/support/request` — Body: `{ subject, message }`. Submit support request; admins view in Admin → Support. `subject` must be one of: `question`, `bug`, `feature`, `account`, `other` (case-insensitive; invalid → `other`).

---

## 5a) Multiverse (NFT Universes, Staking)

**GET** `/api/multiverse/universes` — List active NFT universes (mint costs, staking enabled). Returns `{ universes, nftStakingRewardPerDayAiba, nftStakingApyPercent }`.  
**GET** `/api/multiverse/me` — Auth. User's NFTs (brokers with on-chain NFT; staked flag). Returns `{ nfts }`.  
**POST** `/api/multiverse/stake` — Auth. Body: `{ brokerId }`. Stake broker NFT to earn AIBA.  
**POST** `/api/multiverse/unstake` — Auth. Body: `{ brokerId }`. Unstake.  
**GET** `/api/multiverse/staking/rewards` — Auth. Pending staking rewards.  
**POST** `/api/multiverse/staking/claim` — Auth. Body: `{ requestId }`. Claim pending NFT staking rewards.

---

## 5b) Trainers (Global Network, Dashboard, Leaderboard)

**GET** `/api/trainers/me` — My trainer stats (auth)  
**POST** `/api/trainers/apply` — Apply to become trainer; body `{ ref? }`  
**GET** `/api/trainers/network` — Public; query `sort`, `limit`  
**GET** `/api/trainers/leaderboard` — Public; query `by`, `limit`  
**PATCH** `/api/trainers/profile` — Update displayName, bio, specialty, region (auth)  
**POST** `/api/trainers/claim-rewards` — Auth. Body: `{ requestId }`. Claim pending AIBA.  
**POST** `/api/trainers/register-use` — Record referee (auth)  
**GET** `/api/trainers/recruit-link` — Query `ref`; returns `{ url, ref }`  
**Admin:** `GET /api/admin/trainers`, `PATCH /api/admin/trainers/:id` (status: approve/suspend)

---

## 5c) P2P AIBA & Buy AIBA with TON

All transaction charges (TON) go to Super Admin wallets. Use any TON-supported wallet.

**See [SUPER-ADMIN-WALLETS.md](SUPER-ADMIN-WALLETS.md) for complete reference (all flows, env vars, config keys).**

**GET** `/api/oracle/price` — Returns `{ aibaPerTon, neurPerAiba, updatedAt }` (AIBA per TON from automated oracle or manual config)  
**GET** `/api/p2p-aiba/config` — Fees (p2pSendFeeTonNano, buyFeeBps, aibaInGiftsFeeTonNano), oracle, wallet presence  
**POST** `/api/p2p-aiba/send` — Body: `{ toTelegramId?, toUsername?, amountAiba, txHash }` — Tx charge → **P2P AIBA send** (P2P_AIBA_SEND_WALLET); send AIBA to recipient  
**POST** `/api/p2p-aiba/buy` — Body: `{ txHash }` — Tx charge → **Buy AIBA with TON** (BUY_AIBA_WITH_TON_WALLET); receive AIBA at oracle rate minus fee

---

## 5d) Gifts (extended)

**POST** `/api/gifts/send-aiba` — Body: `{ txHash, toTelegramId?, toUsername?, amountAiba, message? }` — Pay TON + fee → **AIBA in gifts** (AIBA_IN_GIFTS_WALLET); recipient receives AIBA. Tx charge to Super Admin.

---

## 5e) Staking

**GET** `/api/staking/summary` — Auth. Returns `{ stakedAmount, apyPercent, lastClaimedAt, lockedAt, pendingReward }`  
**GET** `/api/staking/periods` — Returns `{ periods: [{ days, apyPercent }], minAiba }` (configurable; default min 100 AIBA, 30/90/180/365 days). `minAiba` = minimum stake (flexible + locked); ecosystem-aligned: Admin → Economy.  
**GET** `/api/staking/locks` — Auth. Returns user's period-based locks (StakingLock[])  
**POST** `/api/staking/stake` — Body: `{ amount, requestId? }` (or `X-Request-Id` header). Flexible staking (no lock period). Min: `stakingMinAiba` (default 100 AIBA). If below min: 400 `min_stake_required`. `requestId` required for idempotency.  
**POST** `/api/staking/unstake` — Body: `{ amount, requestId }`. Unstake flexible amount.  
**POST** `/api/staking/stake-locked` — Body: `{ amount, periodDays, requestId }`. Lock AIBA for period; returns `{ lock, expectedRewardAiba }`. Min: `stakingMinAiba` (default 100 AIBA). If below min: 400 `min_stake_required`.  
**POST** `/api/staking/cancel-early` — Body: `{ lockId, requestId }`. Cancel lock before period ends; fee (default 5% = 500 bps) → Treasury (CANCELLED_STAKES_WALLET). Returns `{ returnedAiba, feeAiba }`.  
**POST** `/api/staking/claim-lock` — Body: `{ lockId, requestId }`. When lock matured, claim principal + rewards.  
**POST** `/api/staking/claim` — Body: `{ requestId }`. Claim flexible-staking pending rewards.

Config: `stakingApyPercent`, `stakingMinAiba`, `stakingPeriods`, `stakingCancelEarlyFeeBps` (Admin → Economy; PATCH `/api/admin/economy/config`). `stakingMinAiba` = min AIBA to stake (flexible + locked; default 100, ecosystem-aligned: 1T AIBA, broker mint cost). Min displayed in Yield Vault hero, locked/flexible staking, and Wallet tab staking flow. See [SUPER-ADMIN-WALLETS.md](SUPER-ADMIN-WALLETS.md) for CANCELLED_STAKES_WALLET.

---

## 5e.2) Predict / Bet (Battle of the hour)

Users bet AIBA on which broker scores higher. Vig (default 3%) → treasury.

**GET** `/api/predict/events` — List open (or resolved) events  
**GET** `/api/predict/events/:id` — Single event with bet count  
**POST** `/api/predict/events/:id/bet` — Body: `{ brokerId, amountAiba }` — Place bet (max per Economy config)  
**Admin:** `POST /api/admin/predict/events` (create), `POST /api/admin/predict/events/:id/resolve` (run battle, pay winners, vig → TreasuryOp)

Config: `predictVigBps`, `predictMaxBetAiba` (Admin → Economy).

---

## 5f) Referrals & Creator Economy

**GET** `/api/referrals/top` — Public. Top referrers by uses.  
**GET** `/api/referrals/me` — Auth. User's referral code (if any).  
**GET** `/api/referrals/me/stats` — Auth. Total NEUR & AIBA earned from referrals.  
**POST** `/api/referrals/create` — Auth. Create referral code (returns existing if any).  
**POST** `/api/referrals/use` — Body: `{ code }`. Apply a friend's code. Referee must have wallet connected (anti-sybil); if not: 403 `wallet_required`.

Referrers earn % of their referrals' battle, race, tournament, and global boss rewards. Tier-based: 100 refs = 3%, 1k = 5%, 10k = 7% (configurable). Config: `creatorPercentBps`, `creatorTier100RefsBps`, `creatorTier1000RefsBps`, `creatorTier10000RefsBps`.

---

## 5g) Donate (broker, car, bike, gifts)

Tx charge (TON) → Super Admin wallet per type. **See [SUPER-ADMIN-WALLETS.md](SUPER-ADMIN-WALLETS.md) for env vars and config.**

**GET** `/api/donate/config` — Fee amounts (donateBrokerFeeTonNano, etc.), wallet presence  
**POST** `/api/donate/broker` — Body: `{ brokerId, txHash }` — Tx charge → **DONATE A BROKER** (DONATE_BROKER_WALLET)  
**POST** `/api/donate/car` — Body: `{ carId, txHash }` — Tx charge → **DONATE A CAR** (DONATE_CAR_WALLET)  
**POST** `/api/donate/bike` — Body: `{ bikeId, txHash }` — Tx charge → **DONATE A BIKE** (DONATE_BIKE_WALLET)  
**POST** `/api/donate/gifts` — Body: `{ txHash }` — Tx charge → **DONATE GIFTS** (DONATE_GIFTS_WALLET)

---

## 5h) Charity, Daily, Premium, Broker Rental, Tasks

### Charity
**GET** `/api/charity/campaigns` — Query: `featured`, `cause`, `status`, `limit`. Active/ended campaigns.  
**GET** `/api/charity/campaigns/:id` — Single campaign + recent donations.  
**GET** `/api/charity/stats` — Aggregate stats.  
**GET** `/api/charity/my-impact` — Auth. User's donation impact.  
**GET** `/api/charity/leaderboard` — Query: `by` (impact|neur|aiba|count), `limit`.  
**POST** `/api/charity/donate` — Auth. Body: `{ campaignId, amountNeur?, amountAiba?, message?, anonymous? }`.

### Daily
**GET** `/api/daily/status` — Auth. Daily reward and combo eligibility.  
**POST** `/api/daily/claim` — Auth. Claim daily NEUR.  
**POST** `/api/daily/combo-claim` — Auth. Claim combo bonus (dailyComboRequirementAiba + dailyComboBonusAiba).

### Premium
**GET** `/api/premium/status` — Auth. Premium status (active, premiumUntil).  
**POST** `/api/premium/buy` — Body: `{ txHash }` — Pay TON → BOOST_PROFILE_WALLET; activate premium.

### Broker Rental
**GET** `/api/broker-rental` — List available rentals (status=listed).  
**POST** `/api/broker-rental/list` — Auth. Body: `{ brokerId, priceAibaPerHour }`. List broker for rent.  
**POST** `/api/broker-rental/:id/rent` — Auth. Rent broker (pay AIBA, 1 hour; fee → treasury).  
**POST** `/api/broker-rental/:id/unlist` — Auth. Unlist your broker.

### Tasks
**GET** `/api/tasks` — Auth. Personalized task feed + profile.

### Tours, Global Boss, Stars Store
**GET** `/api/tournaments` — Query: `status`. List tournaments.  
**GET** `/api/tournaments/:id` — Single tournament.  
**POST** `/api/tournaments/:id/enter` — Auth. Body: `{ brokerId }`. Enter tournament.  
**GET** `/api/global-boss` — Current boss state (HP, status).  
**POST** `/api/global-boss/record-damage` — Auth. Body: `{ brokerId, score }`. Record damage.  
**GET** `/api/stars-store/config` — Pack sizes, prices (AIBA, TON).  
**POST** `/api/stars-store/buy-with-aiba` — Body: `{ requestId }`. Buy Stars with AIBA.  
**POST** `/api/stars-store/buy-with-ton` — Body: `{ txHash }`. Buy Stars with TON → STARS_STORE_WALLET.

---

## 6) Admin (ops tuning)

**GET** `/api/admin/realms`  
**POST** `/api/admin/realms` (create/update)

**GET/POST/PATCH/DELETE** `/api/admin/announcements` — Announcements CRUD; `POST /api/admin/announcements/:id/broadcast` — Send to all users via Telegram.  
**GET** `/api/admin/support` — Support requests; **PATCH** `/api/admin/support/:id` — Update status.

**GET** `/api/admin/economy/config`  
**PATCH** `/api/admin/economy/config`  
**GET** `/api/admin/economy/day`  
**GET** `/api/admin/economy/ledger`  
**GET** `/api/admin/economy/simulate`  
**POST** `/api/admin/economy/credit-user`

**GET** `/api/admin/marketplace/metrics`  
**GET** `/api/admin/treasury`  
**POST** `/api/admin/treasury/fund`  
**GET** `/api/admin/treasury/reserve`  
**POST** `/api/admin/treasury/reserve/fund`  
**GET** `/api/admin/treasury/buyback`  
**POST** `/api/admin/treasury/buyback/fund`  
**PATCH** `/api/admin/treasury/oracle` — Manual oracleAibaPerTon / oracleNeurPerAiba (one-off override)  
**GET** `/api/admin/oracle/status` — Oracle config (auto-update, aibaUsd, min/max/fallback, lastUpdatedAt)  
**POST** `/api/admin/oracle/update` — Trigger one oracle update cycle (fetches TON price, computes AIBA/TON, persists)  
**GET** `/api/admin/treasury-ops/metrics`

---

## Types (summary)

- **Realm**: `{ key, name, description, level, order, active, unlockCriteria, tracks[] }`
- **Mission**: `{ realmKey, title, description, type, rewardAiba, rewardNeur, xp, order, requirements, active }`
- **Mentor**: `{ key, name, realmKey, tier, description, perks[], stakingRequiredAiba, active }`
- **Asset**: `{ ownerId, category, name, realmKey, rarity, level, upgradeCount, status, metadataUri, stats }`
- **AssetListing**: `{ assetId, sellerId, priceAiba, listingType, status, feeBps, expiresAt }`
- **Rental**: `{ assetId, ownerId, renterId, priceAiba, durationHours, status, startedAt, endsAt }`
- **GovernanceProposal**: `{ title, description, status, votesFor, votesAgainst, startAt, endAt, actions[] }`
- **TreasuryOp**: `{ type, amountAiba, source, refId }`
