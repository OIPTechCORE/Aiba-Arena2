# Audit & status — Project assessment, leaderboard, ecosystems, vision

Single reference for codebase audits and status checks: project assessment, leaderboard & groups, ecosystems (NFT, staking, CoE, Wall of Fame), and vision vs implementation.

---

## 1. Project assessment (summary)

**Scope:** Contracts, backend, miniapp, admin, docs, CI.

**Status:** Feature-complete for testnet/MVP. Contracts build and have tests; backend has production-readiness checks and Vercel serverless; miniapp implements full user flow. Mainnet readiness requires env, key isolation, monitoring, backups (see DEPLOYMENT-AND-ENV.md and OPERATIONS.md).

| Component | Path                       | Status                                          |
| --------- | -------------------------- | ----------------------------------------------- |
| Contracts | `contracts/`               | Tact/Blueprint; build + tests                   |
| Backend   | `backend/`                 | Express, Mongoose; `backend/tests/` Node --test |
| Miniapp   | `miniapp/`                 | Next.js 15, TonConnect                          |
| Admin     | `admin-panel/`             | Next.js 14, backend API                         |
| Docs      | `docs/`                    | Deployment, operations, testing, feature plans  |
| CI        | `.github/workflows/ci.yml` | Build, test, lint, miniapp & admin build        |

---

## 2. Leaderboard & groups

- **Global leaderboard:** `GET /api/leaderboard` (Telegram auth); no country/region filter; all users worldwide. Miniapp shows top entries (score, AIBA, NEUR, battles).
- **Top leaders create groups:** Top N by score (config: `leaderboardTopFreeCreate`, default 50) can create a guild without paying TON. Rank = count of users with higher total score + 1.
- **Guild benefits:** Guild Wars arena, guild vault (NEUR/AIBA), deposit brokers to pool, boost count & visibility, join/leave. Implemented in `guilds` routes and miniapp Guilds tab.

---

## 3. Ecosystems audit (NFT, staking, CoE, Wall of Fame)

| Ecosystem                | Backend                                                                                                                         | Miniapp                                                                                                                                   | Verdict                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **NFT creator**          | Broker mint (AIBA → BrokerMintJob), create-with-TON, metadata                                                                   | Brokers tab mint; Market “Create broker (pay TON)”                                                                                        | Present; optional: dedicated tab, gallery, “Creator Lab” |
| **Staking**              | Staking model, stake/unstake/claim; locked periods (30/90/180/365d), stake-locked, cancel-early (fee→Treasury), claim-lock; APY | Wallet tab: flexible + locked staking, periods, reward preview, countdown, cancel-early, claim-lock                                       | Present; optional: dedicated “Yield Vault” tab           |
| **Center of Excellence** | University + Trainers + Referrals routes                                                                                        | **CoE tab**: branded stats bar, University (modules, Graduate badge), Trainers (status, earned AIBA), Creator Economy (refs, tier badges) | Present; CoE branded product tab implemented             |
| **Wall of Fame**         | Leaderboard, badges                                                                                                             | Leaderboard tab, badges in profile/leaderboard                                                                                            | Present (leaderboard + badges)                           |
| **Trainers**             | Global network, dashboard, leaderboard                                                                                          | `/trainer` portal; network, leaderboard, profile editor; viral recruitment; 5 AIBA/user, 20 AIBA/recruited trainer                        | Present; Super Admin approves at /admin                  |

---

## 4. Vision vs codebase

Use this section to track high-level vision vs implementation.

**Key alignments (backend + miniapp implemented):** battles, economy (NEUR/AIBA), **brokers for sale** (Market Trade + system catalog), **cars for sale** (Car Racing → Market: list/buy from players or system), **bikes for sale** (Bike Racing → Market: list/buy from players or system), Super Futuristic Unified Marketplace, guilds (create/join, deposit brokers, Guild Wars, top N free create), referrals, car/bike racing (races, leaderboard), university, charity (Max NEUR/AIBA, presets, message, anonymous, **campaign detail** with recent donations via `GET /api/charity/campaigns/:id`), multiverse (NFT/stake), **Governance** (realm proposals) + **DAO** (community proposals, staking requirement for create), wallet (TonConnect, claim, staking flow switch), **trainers** (global network, dashboard, leaderboard, viral recruitment), **Unified Comms** (announcements read/unread, support form, collapsible FAQ), predict (Battle of the hour), broker rental (list, rent, unlist own).

**Gaps (closed):** All previously identified gaps have been implemented:

| Gap                           | Implementation                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CoE as branded product**    | Dedicated CoE tab (`tab === 'coe'`) with branded hero (`coe-hero`), stats bar (University modules, Trainer status+earned AIBA, Creator refs+earned NEUR/AIBA), and three cards: University, Trainers, Creator Economy. CSS: `coe-hero`, `coe-stats-bar`, `coe-grid`, `coe-card` in globals.css.                                                                         |
| **NFT gallery**               | Dedicated NFT Gallery tab (`tab === 'nftGallery'`) with My NFTs grid/list view toggle, All/Staked/Available filter, `nft-gallery`, `nft-gallery-card`, `nft-gallery-card--large`, stake/unstake per NFT, rewards claim. CSS: `nft-gallery-dedicated`, `nft-gallery`, `nft-gallery-card`, `nft-gallery-card--large`.                                                     |
| **Dedicated Yield Vault tab** | Dedicated staking tab (`tab === 'staking'`) with locked + flexible staking, periods, reward preview, cancel-early, claim-lock. CSS: `yield-vault-hero`. Home quick-access: featured strip (CoE · NFT Gallery · Yield Vault) + dedicated Yield Vault card + Command Center button. In TAB_LIST and HOME_GRID_IDS.                                                        |
| **Operational hardening**     | `scripts/monitoring-check.js` (health, metrics, vault, --json for alerting); `scripts/health-check.js` (--vault, CI-friendly); [BACKUP-RUNBOOK.md](BACKUP-RUNBOOK.md) (MongoDB, secrets, TON, code, cron example); [KEY-ROTATION.md](KEY-ROTATION.md) (Oracle, Admin JWT, Bot token, Battle seed). OPERATIONS.md references all, includes cron examples for monitoring. |

---

## 5. Deep implementation checklist (backend + frontend)

| Feature                        | Backend                                                                                                                                         | Frontend (miniapp)                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Brokers for sale**           | `POST /api/marketplace/buy`, `POST /api/marketplace/buy-system-broker`, system catalog                                                          | Market tab → Trade                                                                    |
| **Cars for sale**              | `POST /api/car-racing/buy-car`, `POST /api/car-racing/buy-system-car`, `GET /api/car-racing/listings`, `GET /api/car-racing/system-cars`        | Car Racing tab (listings + system catalog)                                            |
| **Bikes for sale**             | `POST /api/bike-racing/buy-bike`, `POST /api/bike-racing/buy-system-bike`, `GET /api/bike-racing/listings`, `GET /api/bike-racing/system-bikes` | Bike Racing tab (listings + system catalog)                                           |
| **Locked staking**             | `POST /api/staking/stake-locked`, `POST /api/staking/cancel-early`, `POST /api/staking/claim-lock`                                              | Yield Vault tab; Wallet tab staking card; Home quick-access (dedicated card + button) |
| **CoE (Center of Excellence)** | University, Trainers, Referrals APIs                                                                                                            | CoE tab (branded hero, stats bar, University + Trainers + Creator Economy cards)      |
| **NFT Gallery**                | Multiverse/staking APIs                                                                                                                         | Dedicated NFT Gallery tab (My NFTs grid gallery, stake/unstake per NFT)               |
| **Leaderboard**                | `GET /api/leaderboard`, `GET /api/leaderboard/my-rank`                                                                                          | Leaderboard tab                                                                       |
| **Guilds**                     | `guilds` routes (create, join, deposit, Guild Wars)                                                                                             | Guilds tab                                                                            |
| **Trainers**                   | `trainers.js`, `adminTrainers.js`                                                                                                               | `/trainer` portal                                                                     |
| **DAO**                        | Governance routes, staking requirement for proposals                                                                                            | Governance tab                                                                        |
| **Unified Comms**              | Announcements, support form, read/unread                                                                                                        | In-app announcements, support                                                         |
| **Predict**                    | Battle of the hour (predict)                                                                                                                    | Arena / battle flow                                                                   |
| **Broker rental**              | `broker-rental` routes                                                                                                                          | Market / Brokers                                                                      |

---

## 6. Implemented feature paths (quick reference)

| Feature                       | Miniapp                                                               | Scripts / docs                                           |
| ----------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| CoE tab                       | `page.js` tab `coe`                                                   | —                                                        |
| NFT Gallery tab               | `page.js` tab `nftGallery` (view toggle, All/Staked/Available filter) | —                                                        |
| Yield Vault tab               | `page.js` tab `staking`                                               | —                                                        |
| Home quick-access strip       | CoE · NFT Gallery · Yield Vault buttons above Yield Vault card        | —                                                        |
| Home Yield Vault quick-access | Dedicated card + Command Center button                                | —                                                        |
| Operational monitoring        | —                                                                     | `scripts/monitoring-check.js`, `scripts/health-check.js` |
| Backup runbook                | —                                                                     | `docs/BACKUP-RUNBOOK.md` (includes cron example)         |
| Key rotation                  | —                                                                     | `docs/KEY-ROTATION.md`                                   |

---

## 7. Latest implementation status (gaps closed)

| Area                      | Implementation                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **CoE tab**               | Branded hero, stats bar (University/Trainers/Creator), three cards. `page.js` tab `coe`.                            |
| **NFT Gallery tab**       | Dedicated tab with Gallery/List view toggle, All/Staked/Available filter. `page.js` tab `nftGallery`.               |
| **Yield Vault tab**       | Locked + flexible staking, reward preview, cancel-early, claim-lock. `page.js` tab `staking`.                       |
| **Home quick-access**     | Featured strip: CoE · NFT Gallery · Yield Vault + dedicated Yield Vault card + Command Center button.               |
| **Operational hardening** | `scripts/monitoring-check.js`, `scripts/health-check.js`, BACKUP-RUNBOOK.md (cron), KEY-ROTATION.md, OPERATIONS.md. |

---

## 9. Deep implementation verification (gaps closed)

**Last scan:** Comprehensive codebase scan confirming all gap items from OPERATIONS.md and previous audits are implemented.

| Gap item                      | Location                                                                                           | Status                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **CoE as branded product**    | `page.js` tab `coe` (~4414); `globals.css` `.coe-hero`, `.coe-stats-bar`, `.coe-grid`, `.coe-card` | Hero + stats bar + three cards                                             |
| **NFT Gallery dedicated tab** | `page.js` tab `nftGallery` (~4136); `.nft-gallery-dedicated`, `.nft-gallery`, `.nft-gallery-card`  | Gallery/List, All/Staked/Available, stake/unstake per NFT                  |
| **Dedicated Yield Vault tab** | `page.js` tab `staking` (~5004); `.yield-vault-hero`; `TAB_LIST` `staking`                         | Locked + flexible, cancel-early, claim-lock; `.home-overview__yield-vault` |
| **Home quick-access**         | `page.js` ~3107: CoE · NFT Gallery · Yield Vault strip; dedicated Yield Vault card                 | Yield Vault primary button                                                 |
| **Creator stats API**         | Backend `referrals.js` `GET /api/referrals/me/stats`                                               | earnedNeur, earnedAiba                                                     |
| **Monitoring**                | `scripts/monitoring-check.js` — health, metrics, vault, `--json`, `--vault`                        | Implemented                                                                |
| **Health check**              | `scripts/health-check.js` — `--vault`, exit 0/1                                                    | Implemented                                                                |
| **Backup runbook**            | `docs/BACKUP-RUNBOOK.md` — MongoDB, secrets, TON, code, cron                                       | Implemented                                                                |
| **Key rotation**              | `docs/KEY-ROTATION.md` — Oracle, Admin JWT, Bot token, Battle seed                                 | Implemented                                                                |
| **OPERATIONS.md**             | §4 — scripts, cron, BACKUP-RUNBOOK, KEY-ROTATION                                                   | Implemented                                                                |

---

## 10. Deepest implementation (complete)

**Date:** Final gap-closure implementation.

**Implemented features:**

| Feature                   | Details                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CoE tab**               | Branded hero, stats bar (University modules, Trainer status+earned AIBA, Creator refs+earned NEUR/AIBA), three cards (University, Trainers, Creator Economy). Refresh on tab focus.                                                                                                                                                                                    |
| **NFT Gallery tab**       | Dedicated tab with Gallery/List view toggle, All/Staked/Available filter, `nft-gallery-card--large`, stake/unstake per NFT, rewards claim. CSS: `nft-gallery-dedicated`, `nft-gallery`, `nft-gallery-card`.                                                                                                                                                            |
| **Yield Vault tab**       | Hero shows minimum stake (ecosystem-aligned: 1T AIBA, broker mint cost); mini stats bar (active locks, total locked AIBA). Locked staking: min displayed, input label, enforce on confirm. Flexible staking: min displayed, placeholder, enforce on stake. Wallet tab staking: same min displayed and enforced. CSS: `yield-vault-hero`, `home-overview__yield-vault`. |
| **Home quick-access**     | Featured strip (`.home-featured-strip`): CoE · NFT Gallery · Yield Vault buttons + dedicated Yield Vault card + Command Center Yield Vault button.                                                                                                                                                                                                                     |
| **Operational hardening** | `scripts/monitoring-check.js` (health, metrics, vault, `--json`), `scripts/health-check.js` (`--vault`). BACKUP-RUNBOOK.md (MongoDB, secrets, TON, cron). KEY-ROTATION.md (Oracle, Admin JWT, Bot, Battle seed). OPERATIONS.md §4–5 (scripts, cron, checklist).                                                                                                        |

**Navigation:** CoE, NFT Gallery, Yield Vault in `TAB_LIST` and `HOME_GRID_IDS`; accessible from tab bar and Home grid.

---

## 10. Global scan (docs, APIs, endpoints) — gaps fixed

| Issue                    | Fix                                                                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Guilds route order**   | `GET /api/guilds/list` was defined _after_ `GET /api/guilds/:guildId/pool`, so requests to `/list` matched `/:guildId` with guildId=`"list"` and failed validation. Reordered: `/list`, `/mine`, `/top` now come _before_ `/:guildId/pool`. |
| **API-CONTRACT.md gaps** | Added §5h: Charity (campaigns, stats, my-impact, leaderboard, donate), Daily (claim, combo-claim, status), Premium (status, buy), Broker Rental (list, rent, unlist), Tasks, Tournaments, Global Boss, Stars Store.                         |
| **Announcements doc**    | Clarified `GET /api/announcements` returns `{ items: Announcement[], unreadCount }`; added Auth requirement.                                                                                                                                |

---

## 11. Up-to-date check

When auditing “is everything up to date”: (1) Backend and miniapp env match DEPLOYMENT-AND-ENV.md. (2) All required env set for target (localhost vs prod). (3) CI green; backend and miniapp tests pass. (4) No committed secrets; runbook and monitoring in place for production.
