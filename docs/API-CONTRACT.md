# API Contract — Multiverse Expansion

**Version:** Feb 2025  
**Status:** Phase 1 baseline (schemas + endpoints for new systems).

This document defines the **API surface** for Realms, Missions, Mentors, Assets, Marketplace, Governance, and Treasury telemetry.

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
Body: `{ listingId }`  
Returns `{ ok: true, broker, listingId }`

### 3b) Asset Marketplace (NFT Assets)

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

## 4) Governance

**GET** `/api/governance/proposals`  
Returns `{ proposals: GovernanceProposal[] }`

**POST** `/api/governance/propose`  
Body: `{ title, description, actions[] }`  
Returns `{ proposal }`

**POST** `/api/governance/vote`  
Body: `{ proposalId, vote: 'for'|'against' }`  
Returns `{ ok: true }`

---

## 5) Treasury & Telemetry

**GET** `/api/treasury/summary`  
Returns `{ balanceAiba, balanceNeur, totalPaidOutAiba, totalPaidOutNeur }`

**GET** `/api/treasury/ops`  
Returns `{ ops: TreasuryOp[] }`

**GET** `/api/comms/status`  
Returns `{ status: "operational", updatedAt }`

---

## 6) Admin (ops tuning)

**GET** `/api/admin/realms`  
**POST** `/api/admin/realms` (create/update)

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
**PATCH** `/api/admin/treasury/oracle`  
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
