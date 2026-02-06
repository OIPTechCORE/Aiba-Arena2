# Test Plan — Multiverse Expansion

**Scope:** Realms, Missions, Mentors, Assets, Marketplace, Governance, Treasury Ops.

## 1) Backend API checks

- `GET /api/realms` returns list (seeded or empty)
- `GET /api/missions?realmKey=...` returns missions
- `POST /api/missions/complete` rewards AIBA/NEUR
- `GET /api/mentors` returns mentors
- `POST /api/mentors/assign` updates user mentor
- `POST /api/assets/mint` creates asset and debits AIBA
- `POST /api/assets/upgrade` upgrades asset and debits AIBA
- `GET /api/assets/mine` returns user assets
- `POST /api/asset-marketplace/list` creates listing
- `POST /api/asset-marketplace/buy` transfers ownership
- `POST /api/asset-marketplace/rent` creates rental
- `GET /api/governance/proposals` returns proposals
- `POST /api/governance/propose` creates proposal
- `POST /api/governance/vote` increments votes
- `GET /api/treasury/ops` returns burn/treasury/rewards/staking ledger

## 2) Miniapp UX checks

- Tabs present: Realms, Assets, Governance
- Realms: realm select, mission list, complete mission updates balances
- Mentors: assign mentor, status message updates
- Assets: mint + upgrade + list + buy + rent flows
- Governance: propose and vote flows

## 3) Admin checks

- Realms tab: create/update realm + list view
- Marketplace tab: metrics load
- Treasury Ops tab: metrics load

## 4) Contracts

- Build: `npm run build`
- Tests: `npm test` (includes AiAssetRegistry and AiAssetMarketplaceEscrow)

## 5) Deployment

- Vercel backend env includes new admin endpoints
- Miniapp uses updated tabs; assets/realms/governance visible
