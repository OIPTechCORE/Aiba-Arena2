# Audit & status — Project assessment, leaderboard, ecosystems, vision

Single reference for codebase audits and status checks: project assessment, leaderboard & groups, ecosystems (NFT, staking, CoE, Wall of Fame), and vision vs implementation.

---

## 1. Project assessment (summary)

**Scope:** Contracts, backend, miniapp, admin, docs, CI.

**Status:** Feature-complete for testnet/MVP. Contracts build and have tests; backend has production-readiness checks and Vercel serverless; miniapp implements full user flow. Mainnet readiness requires env, key isolation, monitoring, backups (see DEPLOYMENT-AND-ENV.md and OPERATIONS.md).

| Component | Path | Status |
|-----------|------|--------|
| Contracts | `contracts/` | Tact/Blueprint; build + tests |
| Backend | `backend/` | Express, Mongoose; `backend/tests/` Node --test |
| Miniapp | `miniapp/` | Next.js 14, TonConnect |
| Admin | `admin-panel/` | Next.js, backend API |
| Docs | `docs/` | Deployment, operations, testing, feature plans |
| CI | `.github/workflows/ci.yml` | Build, test, lint, miniapp & admin build |

---

## 2. Leaderboard & groups

- **Global leaderboard:** `GET /api/leaderboard` (Telegram auth); no country/region filter; all users worldwide. Miniapp shows top entries (score, AIBA, NEUR, battles).
- **Top leaders create groups:** Top N by score (config: `leaderboardTopFreeCreate`, default 50) can create a guild without paying TON. Rank = count of users with higher total score + 1.
- **Guild benefits:** Guild Wars arena, guild vault (NEUR/AIBA), deposit brokers to pool, boost count & visibility, join/leave. Implemented in `guilds` routes and miniapp Guilds tab.

---

## 3. Ecosystems audit (NFT, staking, CoE, Wall of Fame)

| Ecosystem | Backend | Miniapp | Verdict |
|-----------|---------|---------|---------|
| **NFT creator** | Broker mint (AIBA → BrokerMintJob), create-with-TON, metadata | Brokers tab mint; Market “Create broker (pay TON)” | Present; optional: dedicated tab, gallery, “Creator Lab” |
| **Staking** | Staking model, stake/unstake/claim, APY | Wallet tab staking card | Present; optional: dedicated “Yield Vault” tab |
| **Center of Excellence** | No CoE model/routes | No CoE tab | Absent; University tab is the learning hub |
| **Wall of Fame** | Leaderboard, badges | Leaderboard tab, badges in profile/leaderboard | Present (leaderboard + badges) |

---

## 4. Vision vs codebase

Use this section to track high-level vision vs implementation. Key alignments: battles, economy (NEUR/AIBA), brokers, marketplace, guilds, referrals, car/bike racing, university, charity, multiverse (NFT/stake), governance, wallet (TonConnect, claim). Gaps: optional enhancements (e.g. CoE as branded product, NFT gallery, dedicated staking tab) and operational hardening (monitoring, backups, key rotation) per OPERATIONS.md.

---

## 5. Up-to-date check

When auditing “is everything up to date”: (1) Backend and miniapp env match DEPLOYMENT-AND-ENV.md. (2) All required env set for target (localhost vs prod). (3) CI green; backend and miniapp tests pass. (4) No committed secrets; runbook and monitoring in place for production.
