# Vision vs Codebase — Deepest Check

This document compares the **AI Broker Battle Arena** product vision against the **current Aiba-Arena2 codebase**. Each claim is verifiable by route, model, or UI presence. Status: **Implemented**, **Partial**, **Different**, or **Not implemented**.

---

## 1. Core Game Concept

| Vision | Codebase | Status |
|--------|----------|--------|
| Players own AI-powered broker agents | Broker model: intelligence, speed, risk, specialty, level, energy, cooldowns. Owned by `ownerTelegramId`. | **Implemented** |
| Analyze simulated & real market data | Battles use **deterministic formula** (broker stats + server seed + arena weights). No live market data. | **Different** — simulated only |
| Compete in trading leagues | GameMode (arena + league), arenas: prediction, simulation, strategyWars, **arbitrage**, guildWars; leagues: rookie, pro, elite. | **Implemented** |
| Missions: arbitrage, prediction, strategy battles | Arenas include arbitrage; “missions” = battle runs (POST /api/battle/run). | **Implemented** |
| Earn rewards by performance | Score → NEUR + AIBA (emission caps, windows); on-chain AIBA claim via signed vault. | **Implemented** |
| Fantasy trading league / AI pet / strategy game | Own brokers → pick arena → run battle → earn; guilds, marketplace, staking, DAO. | **Aligned** |

**Summary:** Core loop is implemented. Battles are **deterministic simulation** (stats + seed), not “AI analyzing live markets.”

---

## 2. Core Mechanics

### 2.1 AI Brokers

| Vision | Codebase | Status |
|--------|----------|--------|
| Traits: Risk, Intelligence, Speed, Specialty | Broker: risk, intelligence, speed, specialty (default crypto). Arena weights favor int/speed/risk per mode. | **Implemented** |
| Upgrade brokers | POST /api/brokers/upgrade (AIBA cost, +1 stat, level). upgradeAibaCost in EconomyConfig. | **Implemented** |
| Train brokers | POST /api/brokers/train (NEUR, +1 to one stat). | **Implemented** |
| Combine brokers | POST /api/brokers/combine (base + sacrifice → blended stats; NEUR cost). | **Implemented** |
| Create broker with TON (auto-listed) | POST /api/brokers/create-with-ton (txHash); CREATED_BROKERS_WALLET; createBrokerCostTonNano (1–10 TON); broker + Listing created; miniapp Market “Create your broker (pay TON)”. | **Implemented** |
| Sell brokers on marketplace | Listing model; POST /api/marketplace/list, /buy; miniapp Market tab (list/buy). Off-chain only; on-chain escrow contract exists (BrokerMarketplaceEscrow). | **Implemented** (off-chain); on-chain settlement partial |
| Broker as NFT on-chain | Broker.nftItemAddress, nftCollectionAddress; POST /api/brokers/mint-nft (AIBA); BrokerMintJob; admin mint-jobs complete. | **Implemented** (in-app mint flow) |

### 2.2 Arenas

| Vision | Codebase | Status |
|--------|----------|--------|
| Prediction Arena | arena = prediction, GameMode defaults. | **Implemented** |
| Trading Simulation | arena = simulation. | **Implemented** |
| Strategy Wars | arena = strategyWars. | **Implemented** |
| Arbitrage | arena = arbitrage (db.js default modes; admin Game modes dropdown; miniapp arena select). | **Implemented** |
| Guild Wars | arena = guildWars; guild membership; reward split to guild treasury; deposit/withdraw broker. | **Implemented** |

### 2.3 Gameplay Loop

| Vision | Codebase | Status |
|--------|----------|--------|
| Assign broker → arena → compete → earn → upgrade / higher leagues | Assign broker + arena → Run battle (immediate result). NEUR + AIBA + broker XP. Energy + cooldown. Leagues + level. | **Implemented** |

---

## 3. Tokenomics

| Vision | Codebase | Status |
|--------|----------|--------|
| $AIBA — value token, rewards | Jetton (AibaToken), off-chain credits, on-chain claim (ArenaRewardVault, signed claims). | **Implemented** |
| $NEUR — gameplay fuel | Off-chain ledger; battle, daily, referrals; train/repair/combine/entry costs. | **Implemented** |
| Entry fees (high-level) | entryNeurCost / entryAibaCost per GameMode (admin). | **Implemented** |
| Governance / voting | Off-chain DAO: Proposal, Vote; POST /api/dao/proposals, /vote; close + execute (treasury payout). | **Implemented** (off-chain) |
| Staking for yield | Off-chain Staking model; POST /api/staking/stake, unstake, claim; APY in config. | **Implemented** (off-chain) |
| Marketplace fees | marketplaceFeeBps, marketplaceBurnBps (config). List/buy in app. | **Implemented** |
| Deflation (burn) | upgradeAibaCost (upgrade debits AIBA); EconomyDay burn tracking; Treasury, StabilityReserve, BuybackPool models. No on-chain burn contract. | **Partial** (ledger + admin treasury) |

---

## 4. Reward System

| Vision | Codebase | Status |
|--------|----------|--------|
| Arenas → AIBA + NEUR | Battle → score → tryEmitAiba + tryEmitNeur (caps, emission windows). | **Implemented** |
| League ranking → AIBA | Reward multipliers by league/mode. | **Implemented** |
| Daily activity → NEUR | GET/POST /api/daily (claim daily NEUR); dailyRewardNeur; lastDailyClaimAt on User. | **Implemented** |
| Referrals → NEUR + AIBA | referralRewardNeur/Aiba (referrer + referee); POST /api/referrals/use credits both. | **Implemented** |
| Guild victories → pool share | Guild wars NEUR split to guild vault. | **Implemented** |
| Push “Your AI just won” | telegramNotify.notifyBattleWin (TELEGRAM_BOT_TOKEN) after battle. | **Implemented** |
| Skill-based earning | Score = f(stats, arena weights, league, level). | **Implemented** |

---

## 5. UX (Telegram Mini App)

| Vision | Codebase | Status |
|--------|----------|--------|
| Cinematic intro + guided tutorial | showCinematicIntro (localStorage aiba_cinematic_seen); tutorial steps (aiba_tutorial_done); Skip/Next/Done. | **Implemented** |
| Main tabs: Home, Brokers, Market, Racing, Arenas, Guilds, etc. | Tab bar: home, brokers, market, carRacing, bikeRacing, multiverse, arenas, guilds, charity, university, updates, wallet (12 tabs). Tab panels; only active panel visible. | **Implemented** |
| Push “Your AI just won” | Backend calls notifyBattleWin on battle success. | **Implemented** |
| Global player leaderboard | GET /api/leaderboard (by=score|aiba|neur|battles, limit up to 500). GET /api/leaderboard/my-rank. Global, no country filter. | **Implemented** |
| Shareable victory cards | Victory card + Share button (Web Share / clipboard). | **Implemented** |
| TonConnect wallet | TonConnectButton; POST /api/wallet/connect; used for on-chain claim. | **Implemented** |
| Futuristic 3D UI, multi-card, modular | globals.css: glass, glow, Orbitron/Exo 2, cards, tabs, icons, guide tips, balance strip. | **Implemented** |

---

## 6. Groups (Guilds) & Leaderboard (Vision Extensions)

| Vision | Codebase | Status |
|--------|----------|--------|
| All users see global leaderboard | GET /api/leaderboard; miniapp Home + Leaderboard card; limit 100 in UI, 500 server. | **Implemented** |
| Top leaders can create groups free | leaderboardTopFreeCreate (default 50); rank from GET /api/leaderboard/my-rank; create free if rank ≤ N. | **Implemented** |
| Pay TON to create group (1–10 TON) | createGroupCostTonNano; LEADER_BOARD_WALLET; POST /api/guilds/create with txHash when not top N; TON verify. | **Implemented** |
| Groups visible globally | GET /api/guilds/list (all active, limit 200–300). Miniapp “Discover all”. | **Implemented** |
| Anyone can join any group | POST /api/guilds/join (guildId). | **Implemented** |
| Boost group with TON (1–10 TON) | boostGroupCostTonNano; BOOST_GROUP_WALLET; POST /api/guilds/:guildId/boost (txHash); Guild.boostCount, boostedUntil. | **Implemented** |
| Super Admin: adjustable costs + wallets | Admin Economy: createGroupCostTonNano, boostGroupCostTonNano, leaderboardTopFreeCreate. Env: LEADER_BOARD_WALLET, BOOST_GROUP_WALLET. | **Implemented** |

---

## 6b. Boost profile & Gifts (Vision Extensions)

| Vision | Codebase | Status |
|--------|----------|--------|
| Boost your profile (pay TON) | POST /api/boosts/buy-profile-with-ton (txHash); BOOST_PROFILE_WALLET; boostProfileCostTonNano (1–10 TON); User.profileBoostedUntil. Miniapp Wallet: “Boost your profile” card. | **Implemented** |
| Gifts (pay TON to send to user) | POST /api/gifts/send (txHash, toTelegramId or toUsername, message); GET /api/gifts/received, /sent; GIFTS_WALLET; giftCostTonNano (1–10 TON); Gift model; UsedTonTxHash idempotency. Miniapp Wallet: Gifts card (send, received, sent). | **Implemented** |
| Super Admin: costs + wallets | Admin Economy: boostProfileCostTonNano, boostProfileDurationDays, giftCostTonNano. Env: BOOST_PROFILE_WALLET, GIFTS_WALLET. | **Implemented** |

---

## 7. Admin Panel

| Vision | Codebase | Status |
|--------|----------|--------|
| Tasks | Admin Tasks tab; create, toggle. | **Implemented** |
| Ads | Admin Ads tab; imageUrl, linkUrl, placement, weight. | **Implemented** |
| Economy / rewards | Admin Economy tab; full JSON config (caps, rewards, costs, referral, daily, boost, group costs). Emission dashboard (today UTC). | **Implemented** |
| Ban users | Admin Moderation; ban/unban by telegramId. | **Implemented** |
| Game modes | Admin Game modes; create, toggle; arena dropdown includes arbitrage; league dropdown. | **Implemented** |
| Stats (DAU, volume) | GET /api/admin/stats (DAU, total users/battles, emitted today). Admin Stats tab. | **Implemented** |
| Treasury | Admin Treasury tab; fund Treasury, Stability Reserve, Buyback Pool; GET /api/treasury/summary. | **Implemented** |
| Economy simulator | GET /api/admin/economy/simulate?days=30. | **Implemented** |
| Mint jobs (broker NFT) | GET/POST /api/admin/brokers/mint-jobs (list, complete). | **Implemented** |

---

## 8. Tech Stack

| Vision | Codebase | Status |
|--------|----------|--------|
| Mini App + Admin: Next.js, Vercel | miniapp, admin-panel (Next.js); Vercel-ready. | **Implemented** |
| Backend: Node + Express | Express (server.js + Vercel serverless api/index.js). | **Implemented** |
| DB: MongoDB | Mongoose, MONGO_URI. | **Implemented** |
| TON: Jetton, NFT, Vault | AibaToken, ArenaRewardVault, broker NFT, BrokerMarketplaceEscrow. | **Implemented** |
| Auth: Telegram | requireTelegram (initData or x-telegram-id dev). | **Implemented** |
| Payments: TON | TonConnect; claim tx to vault; boost/create/boost-group TON verify (getTransactionByHash). | **Implemented** |
| Server-side scoring | battleEngine.simulateBattle (deterministic). | **Implemented** |
| Anti-cheat | Anomaly detection, anomalyFlags, auto-ban, idempotency (requestId, BattleRunKey), rate limit. | **Implemented** |

---

## 9. Deep Verification — Routes & Models

### Backend routes (mounted in app.js)

| Route prefix | Purpose |
|--------------|--------|
| /api/wallet | Connect wallet |
| /api/game | Game config |
| /api/tasks | Tasks (public) |
| /api/ads | Ads by placement |
| /api/economy | me, claim-aiba |
| /api/game-modes | List modes (public) |
| /api/guilds | create (with optional txHash), join, leave, deposit/withdraw broker, list, top, :guildId/boost |
| /api/referrals | create, use |
| /api/battle | run |
| /api/brokers | mine, starter, **create-with-ton** (txHash → broker + auto-list), train, repair, upgrade, combine, mint-nft |
| /api/vault | inventory, claim-status, last-seqno |
| /api/leaderboard | GET / (global), GET /my-rank |
| /api/marketplace | listings, list, delist, buy |
| /api/car-racing | tracks, races, cars, create, create-with-ton, enter, race/:id, leaderboard, config, listings, list, buy-car |
| /api/bike-racing | tracks, races, bikes, create, create-with-ton, enter, race/:id, leaderboard, config, listings, list, buy-bike |
| /api/boosts | mine, buy, buy-with-ton, **buy-profile-with-ton** (txHash → profileBoostedUntil) |
| /api/gifts | **send** (txHash, toTelegramId or toUsername, message), **received**, **sent** |
| /api/staking | summary, stake, unstake, claim |
| /api/dao | proposals (list, create), vote, close, execute |
| /api/daily | status, claim |
| /api/oracle | price |
| /api/treasury | summary |
| /api/charity | campaigns, campaigns/:id, donate, leaderboard, my-impact, stats |
| /api/announcements | list (active) — Updates tab |
| /api/university | courses, progress (GET/POST), mint-course-badge-info, mint-course-badge, mint-full-certificate-info, mint-full-certificate |
| /api/multiverse | universes, me, stake, unstake, staking/rewards, staking/claim |
| /api/stars-store | config, buy-with-aiba, buy-with-ton |
| /api/admin/charity | manage charity campaigns |
| /api/admin/announcements | manage announcements |
| /api/admin/university | stats, courses, graduates |
| /api/admin/* | auth, tasks, ads, game-modes, economy, mod, treasury, stats, brokers (mint-jobs) |

### Backend models

| Model | Purpose |
|-------|--------|
| User, Broker, Battle, BattleRunKey | Core game; User.profileBoostedUntil; Broker.createdWithTonTxHash |
| GameMode | Arena/league modes |
| LedgerEntry, EconomyConfig, EconomyDay | Economy & caps |
| Guild | Groups; paidCreateTxHash, boostCount, boostedUntil, boostTxHashes |
| Referral, ReferralUse | Referrals |
| Listing | Marketplace (off-chain) |
| Boost | Reward multiplier (NEUR or TON) |
| Gift | fromTelegramId, toTelegramId, amountNano, txHash, message (gifts with TON) |
| UsedTonTxHash | txHash, purpose, ownerTelegramId (idempotency for gift, profile_boost) |
| Staking | Off-chain staking |
| Proposal, Vote | DAO |
| Treasury, StabilityReserve, BuybackPool | Treasury / reserve / buyback |
| BrokerMintJob | NFT mint queue |
| UniversityProgress | University: telegramId, completedKeys[], graduatedAt |
| CharityCampaign, CharityDonation | Charity: campaigns, donations (NEUR/AIBA), impact |
| Announcement | Announcements (Updates tab) |
| Task, Ad | Tasks, ads |
| NftUniverse, NftStake | Multiverse: universes, stake/unstake broker NFT, staking rewards |
| RacingCar, CarTrack, CarRace, CarRaceEntry, CarListing | Autonomous car racing: create car (AIBA or TON), enter races, leaderboard, marketplace |
| RacingMotorcycle, BikeTrack, BikeRace, BikeRaceEntry, BikeListing | Autonomous bike racing: create bike (AIBA or TON), enter races, leaderboard, marketplace |

### Miniapp structure

- **Tabs:** Home, Brokers, Market, Car Racing, Bike Racing, Multiverse, Arenas, Guilds, Charity, University, Updates, Wallet (12 tabs; tab-content + tab-panel).
- **Home:** Actions (New broker, Refresh, Run battle, Vault); Arena & battle card; battle result + victory card; Referrals; Leaderboard.
- **Brokers:** My brokers (combine, mint NFT, select).
- **Arenas:** Arena select; Run battle; battle result.
- **Guilds:** My rank, Discover all, create (with optional pay TON + txHash), join; all groups list with Join + Boost (txHash).
- **Market:** **Create your broker (pay TON)** (cost, txHash → new broker auto-listed); Listings refresh, list broker, buy (AIBA); Boosts (NEUR or TON).
- **Car Racing:** Tracks, races (open/running/completed), my cars, create car (AIBA or TON), enter race, leaderboard, marketplace (list/buy car).
- **Bike Racing:** Tracks, races, my bikes, create bike (AIBA or TON), enter race, leaderboard, marketplace (list/buy bike).
- **Multiverse:** Universes, my NFTs (Broker NFTs), stake/unstake, staking rewards, claim AIBA.
- **Charity:** Unite for Good — campaigns, donate NEUR/AIBA, your impact, charity leaderboard.
- **University:** Hero (progress X / Y modules), expandable courses and modules; POST progress on module expand; graduate badge; optional mint course badge / full certificate (TON).
- **Updates:** Announcements feed (GET /api/announcements); status, support.
- **Wallet:** Profile with badges and **profileBoostedUntil**; **Boost your profile** (pay TON, txHash); **Gifts** (send to Telegram ID/username with TON, view received/sent); Daily claim, Vault, Staking, DAO, on-chain claim (when battle + lastClaim); Stars and Diamonds cards (Telegram Stars–style, TON Diamonds).
- **UI:** globals.css futuristic theme; icons (Home, Brokers, Arena, Guilds, Market, Wallet, University, Run, Refresh, Claim, Mint, Stake, List, Buy, Share, Vault, Star, Diamond); balance strip (NEUR, AIBA, Stars, Diamonds + verified badge); guide tips per tab.

---

## 10. Gaps vs Full Vision (On-Chain / Optional)

| Area | Current | Gap |
|------|---------|-----|
| DAO | Off-chain proposals/votes + treasury execute | No on-chain DAO contract |
| Staking | Off-chain lock + APY in backend | No on-chain staking contract |
| Marketplace | Off-chain list/buy; Listing model | On-chain BrokerMarketplaceEscrow not wired to app flow |
| Burn / buyback | EconomyDay tracking; Treasury/Reserve/BuybackPool (admin fund) | No on-chain burn/buyback execution |
| “Real” AI / market data | Deterministic battle from stats + seed | No live market data or external AI |

---

## 11. Summary Table

| Category | Status |
|----------|--------|
| Core game (brokers, arenas, battles, rewards) | Implemented |
| Dual token (NEUR, AIBA + on-chain claim) | Implemented |
| Arbitrage arena | Implemented |
| Guilds + guild wars + pay-to-create + boost (TON) | Implemented |
| Global leaderboard + my-rank | Implemented |
| Referrals (NEUR + AIBA) | Implemented |
| Daily login NEUR | Implemented |
| Ads, Tasks, Game modes (admin + app) | Implemented |
| Broker train / repair / upgrade / combine | Implemented |
| Marketplace (list/buy/sell brokers, off-chain) | Implemented |
| Create broker with TON (auto-listed, global recognition) | Implemented |
| Boost your profile (pay TON) | Implemented |
| Gifts (pay TON to send to user; received/sent) | Implemented |
| Broker NFT (mint with AIBA, job queue) | Implemented |
| DAO (proposals, votes, treasury execute) | Implemented (off-chain) |
| Staking APY | Implemented (off-chain) |
| Boost (NEUR or TON) | Implemented |
| Push notifications (battle win) | Implemented |
| Cinematic intro + tutorial | Implemented |
| Main tabs (12: Home, Brokers, Market, Car/Bike Racing, Multiverse, Arenas, Guilds, Charity, University, Updates, Wallet) | Implemented |
| Futuristic 3D UI, multi-card, icons, guidance | Implemented |
| Admin: Economy, Stats, Treasury, Game modes, Mint jobs | Implemented |
| Oracle, Treasury, Reserve, Buyback, Simulator | Implemented (backend + admin) |
| On-chain DAO / staking / marketplace settlement | Partial / not wired |
| Real market data / live AI | Not implemented (design: simulated) |

---

## 12. Conclusion

- **The codebase implements the full intended product loop:** own brokers, arenas (including arbitrage), battles, NEUR/AIBA rewards, on-chain AIBA claim, guilds with pay-to-create and boost (TON), global leaderboard, referrals, daily, **unified marketplace** (create broker with TON [auto-listed], list/buy with AIBA), **boost your profile** (TON), **gifts** (TON), staking, DAO, boosts, admin control, and production safeguards.
- **UX:** Modular tabbed miniapp with futuristic 3D styling, icons, and per-tab guidance; cinematic intro and tutorial; shareable victory cards; push notifications on win.
- **Main deliberate difference:** battles are **deterministic simulation** from broker stats and server seed, not “AI analyzing real market data.”
- **Remaining gaps:** on-chain DAO/staking/marketplace settlement and on-chain burn/buyback are not wired; real-time market data is out of scope per current design. **Payment design:** All TON flows (create broker, boost profile, gifts, create/boost group, battle boost) use Super Admin wallets per product; see [MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md](MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md).

Use this document to align product docs with the built product or to prioritize any remaining on-chain or data integrations.
