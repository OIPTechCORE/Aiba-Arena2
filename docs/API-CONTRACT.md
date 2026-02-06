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
Body: `{ mentorId, tier }`  
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

**POST** `/api/marketplace/list`  
Body: `{ assetId, priceAiba, listingType }`  
Returns `{ listing }`

**GET** `/api/marketplace/listings`  
Query: `listingType`, `realmKey`, `category`  
Returns `{ listings: AssetListing[] }`

**POST** `/api/marketplace/buy`  
Body: `{ listingId }`  
Returns `{ ok: true, asset }`

**POST** `/api/marketplace/rent`  
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
Returns `{ burnTotal, treasuryTotal, rewardsTotal, stakingTotal }`

**GET** `/api/treasury/ops`  
Returns `{ ops: TreasuryOp[] }`

---

## 6) Admin (ops tuning)

**GET** `/api/admin/realms`  
**POST** `/api/admin/realms` (create/update)

**GET** `/api/admin/economy`  
**POST** `/api/admin/economy` (update splits/fees)

**GET** `/api/admin/marketplace/metrics`  
**GET** `/api/admin/treasury/metrics`

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
