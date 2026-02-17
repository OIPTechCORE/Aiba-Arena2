# Docs index

Related docs have been merged so there are fewer, clearer files.

## Android UI/UX rollout navigation (Phase 1–4)

| Phase | UI label | Primary docs |
|------|----------|--------------|
| **Phase 1** | **Fast Win — Android UI/UX shell (top app bar + sticky bottom nav)** | `USER-GUIDE.md`, `TELEGRAM-MINI-APP-UI-UX-AUDIT.md` |
| **Phase 2** | **Home + Tasks card redesign (spacing, typography, button sizing)** | `USER-GUIDE.md`, `TESTING.md` |
| **Phase 3** | **Market + Racing flow redesign (sheet-style detail views)** | `FEATURE-PLANS.md`, `USER-GUIDE.md`, `TESTING.md` |
| **Phase 4** | **Component system cleanup + theming + QA pass** | `AUDIT-AND-STATUS.md`, `TESTING.md`, `OPERATIONS.md` |

Use this phase table first, then open the detailed docs below.

| Doc | Contents |
|-----|----------|
| **DEPLOYMENT-AND-ENV.md** | Localhost, Vercel, Telegram: env checklist, backend + miniapp + admin, security, mainnet readiness. |
| **OPERATIONS.md** | Runbook, key management, incident response, monitoring, production readiness status. |
| **TESTING.md** | Backend unit/API/integration tests, miniapp build, contracts, CI; extended test plan (Realms, Assets, Governance). |
| **USER-GUIDE.md** | How to play: tabs, wallet, brokers, battles, marketplace, guilds, referrals, racing, university, charity, multiverse, troubleshooting. |
| **FEATURE-PLANS.md** | University, autonomous racing, charity, marketplace & payments, NFT multiverse, comms, economy (vision + key design). |
| **STARS-BADGES-DIAMONDS.md** | Stars, profile badges, diamonds: plan, vision, implementation gaps. |
| **AUDIT-AND-STATUS.md** | Project assessment, leaderboard & groups, ecosystems audit (NFT, staking, CoE, Wall of Fame, Trainers), vision vs codebase. |
| **WHAT-IS-AIBA-ARENA.md** | Deep from-zero explainer: what AIBA Arena is, who it's for, core loop, tokens, features, where to play. |
| **GAME-FUNCTIONALITY.md** | Expanded game functionality: battle engine, brokers, economy config, trainers, automation, racing, security, data flows, API mapping. |
| **GAP-AUDIT.md** | Docs vs code gap investigation: privacy/terms, ads, brokers/cars/bikes, extensibility, recommendations. |
| **ADVISORY-TOKENOMICS-VIRAL-FOUNDER-REVENUE.md** | Advisory: 1T AIBA mint, viral growth strategies, founder revenue calculations. |
| **AIBA-SELF-AUTOMATION.md** | Dynamic caps, allocation config, mint constraints, anti-inflation, referralUnlock3BonusBps. |
| **REPORTS-MONITORING.md** | Cross-validation of advisory/audit reports vs codebase; invite-3, K-factor, trainers. |
| **TELEGRAM-APPS-MODERATION-ADVISORY.md** | Telegram Apps Moderation Center: approval probability, position in Apps Center, submission checklist, implementation status. |
| **PRIVACY-POLICY.md** | Privacy policy: data collection, use, storage, rights. In-app at `/privacy`. |
| **TERMS-OF-SERVICE.md** | Terms of service: acceptance, no guaranteed profits, eligibility, conduct. In-app at `/terms`. |
| **INNOVATIONS-100X-ADVISORY.md** | Innovations to strike the game: tournaments, streaks, creator economy, predict/bet, subscription, rental, raid, breeding. 100× calculations for users, AIBA, founders. |
| **API-CONTRACT.md** | API contract: Core (Economy, Vault, Wallet, Battle), Realms, Missions, Mentors, Assets, DAO (staking requirement), Staking, Treasury, Trainers, Oracle, P2P AIBA, Gifts, Donate, Announcements, Support. |
| **SUPER-ADMIN-WALLETS.md** | Complete reference: all Super Admin wallets (P2P AIBA send, AIBA in gifts, Buy AIBA with TON, Donate broker/car/bike/gifts, **CANCELLED_STAKES_WALLET** for early stake cancel fee), env vars, config keys, APIs. |
| **ORACLE-AIBA-TON.md** | Holistic automated AIBA/TON oracle: formula, config, cron, admin API. |
| **CONTRACT-DEPLOYMENT-ORDER.md** | Contract deployment order. |
| **UNIVERSAL-SPEC.md** | Universal spec (if present). |
| **CONNECT-WALLET-TON-SCAN.md** | Connect wallet, TON Scan. |
| **MIGRATIONS.md** | Data migrations. |
| **TELEGRAM-MINI-APP-UI-UX-AUDIT.md** | Telegram miniapp UI/UX audit. |
| **DOCS-STRUCTURE.md** | Why `.html` vs `.md`; source of truth, build process, orphan HTML files. |
| **UNIFIED-COMMS-ECOSYSTEM.md** | Unified comms: announcements, status, support; Phases 1–4 (read/unread, support form) done. |
| **PRINT.md** | Print/export. |
| **VISION-3D-ARENAS-STATUS.md** | 3D arenas: what exists vs vision. Can you see them? Roadmap. |
| **TRAINERS-MANUAL.md** | Exhaustive trainer guide: product, journeys, scripts, influencer angles. |
| **marketing/** | Marketing materials: influencer kit, ad templates, post bank, customizable HTML banners. |

**Deep feature docs** (per-feature deep dives):

| Doc | Contents |
|-----|----------|
| **BROKERS-DEEP-EXPLANATION.md** | Brokers: stats, creation, listing, buying, system catalog. |
| **ARENAS-DEEP-EXPLANATION.md** | Arenas, leagues, battle flow, scoring. |
| **CAR-RACING-DEEP-EXPLANATION.md** | Car racing: config, tracks, cars, races, enter, buy, leaderboard. |
| **MARKETPLACE-DEEP-EXPLANATION.md** | Unified marketplace: brokers, assets, rentals, boosts, system shop. |

**Gaps and audits:** [GAP-AUDIT.md](GAP-AUDIT.md), [GAPS-SCAN-REPORT.md](GAPS-SCAN-REPORT.md) (full app & docs gap scan), [APP-SCAN-REPORT.md](APP-SCAN-REPORT.md) (issues/errors scan). **Deep assessment (API 404/508, backend URL, console errors):** [DEEP-ASSESSMENT-APP.md](DEEP-ASSESSMENT-APP.md).

**UI & updatedness:** [UI-DESIGN-PRINCIPLES.md](UI-DESIGN-PRINCIPLES.md) (nav, card-based, responsive). [DOCS-UPDATEDNESS.md](DOCS-UPDATEDNESS.md) (code, .md, .html refresh status).

**Print folder:** `print/` contains HTML exports of docs. Run `npm run build:print-docs` to regenerate from `.md` sources. See [DOCS-STRUCTURE.md](DOCS-STRUCTURE.md).

---

## Recent documentation updates

- **Unified Comms (Phases 3–4):** Read/unread announcements (`lastSeenAnnouncementId`, `POST /api/announcements/seen`); in-app support form (`POST /api/support/request` with subject: question, bug, feature, account, other). See [UNIFIED-COMMS-ECOSYSTEM.md](UNIFIED-COMMS-ECOSYSTEM.md).
- **DAO:** Added to Home grid; create-proposal staking requirement (e.g. ≥ 10,000 AIBA for ≥ 30 days). See [API-CONTRACT.md](API-CONTRACT.md) §4.
- **Staking:** Full locked staking UI (periods 30/90/180/365 days, APY, reward preview, countdown). Cancel early with 5% fee → CANCELLED_STAKES_WALLET / Treasury. See [API-CONTRACT.md](API-CONTRACT.md) §5d, [SUPER-ADMIN-WALLETS.md](SUPER-ADMIN-WALLETS.md).
- **Charity:** Max NEUR/AIBA, presets, optional message, anonymous toggle. See [FEATURE-PLANS.md](FEATURE-PLANS.md) §3, [USER-GUIDE.md](USER-GUIDE.md) §16.
- **Trainer button:** Coloured styling on Home grid. See `miniapp/src/config/navigation.js` (`gridStyle: 'trainers'`).
- **API-CONTRACT audit:** §0 Core (Economy, Vault, Wallet, Battle) added; duplicate §5e fixed (Predict → 5e.2); Trainers claim-rewards requestId documented.
- **Gaps scan:** [GAPS-SCAN-REPORT.md](GAPS-SCAN-REPORT.md) — full app & docs gap scan; README deep-feature-docs index and GAME-FUNCTIONALITY §12 API mapping extended (broker-rental, predict, trainers, donate, premium, etc.).
- **Updatedness:** Code, .md, and print HTML kept in sync. Run `npm run build:print-docs` after doc edits. See [DOCS-UPDATEDNESS.md](DOCS-UPDATEDNESS.md).
- **Deep assessment (Feb 2026):** [DEEP-ASSESSMENT-APP.md](DEEP-ASSESSMENT-APP.md) — console/network errors (ERR_NETWORK_CHANGED, extension export, API 404s, 508), where the miniapp sends requests, backend route audit, fix (NEXT_PUBLIC_BACKEND_URL on Vercel miniapp), references to runtime errors and deployment docs.