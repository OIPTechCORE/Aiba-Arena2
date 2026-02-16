const mongoose = require('mongoose');

const EconomyConfigSchema = new mongoose.Schema(
    {
        // Daily emission caps (server-enforced)
        dailyCapAiba: { type: Number, default: 1_000_000 },
        dailyCapNeur: { type: Number, default: 10_000_000 },
        dailyCapAibaByArena: { type: Map, of: Number, default: {} },
        dailyCapNeurByArena: { type: Map, of: Number, default: {} },

        // Reward knobs
        baseRewardAibaPerScore: { type: Number, default: 2 },
        baseRewardNeurPerScore: { type: Number, default: 0 },

        // Optional emission windows (UTC). If outside the window, emissions are denied (caps don't increment).
        // You can override per arena or arena:league using `emissionWindowsUtc` (object map).
        emissionStartHourUtc: { type: Number, default: 0 }, // 0-23
        emissionEndHourUtc: { type: Number, default: 24 }, // 1-24; 24 means end-of-day
        emissionWindowsUtc: { type: Object, default: {} }, // { "*": {startHourUtc,endHourUtc}, "prediction": {...}, "prediction:rookie": {...} }

        // Broker sinks
        upgradeAibaCost: { type: Number, default: 50 },
        trainNeurCost: { type: Number, default: 25 },
        repairNeurCost: { type: Number, default: 15 },
        combineNeurCost: { type: Number, default: 50 },

        // Marketplace knobs (tracking + future on-chain settlement)
        marketplaceFeeBps: { type: Number, default: 300 }, // 3%
        marketplaceBurnBps: { type: Number, default: 0 },

        // Economy split (basis points). Should sum to 10000.
        tokenSplitBurnBps: { type: Number, default: 1500 },
        tokenSplitTreasuryBps: { type: Number, default: 2500 },
        tokenSplitRewardsBps: { type: Number, default: 5000 },
        tokenSplitStakingBps: { type: Number, default: 1000 },

        // AI Asset economy
        assetMintFeeAiba: { type: Number, default: 100 },
        assetUpgradeFeeAiba: { type: Number, default: 50 },
        assetRentalFeeBps: { type: Number, default: 500 }, // 5%

        // Governance / mentor access
        governanceStakeMinAiba: { type: Number, default: 1000 },
        mentorTierStakeAiba: { type: Map, of: Number, default: {} }, // tier -> stake requirement
        // DAO: min staked AIBA and days to create proposals (per Advisory: 1T AIBA, 20% staking)
        daoProposalMinStakedAiba: { type: Number, default: 10_000 },
        daoProposalMinStakeDays: { type: Number, default: 30 },

        // Referrals (off-chain rewards)
        referralRewardNeurReferrer: { type: Number, default: 250 },
        referralRewardNeurReferee: { type: Number, default: 150 },
        referralRewardAibaReferrer: { type: Number, default: 10 },
        referralRewardAibaReferee: { type: Number, default: 5 },

        // Daily login reward (NEUR)
        dailyRewardNeur: { type: Number, default: 50 },

        // Broker NFT mint (AIBA cost for in-app mint)
        mintAibaCost: { type: Number, default: 100 },

        // Boost: pay TON (nanoTON)
        boostCostTonNano: { type: Number, default: 0 },

        // Create broker with TON (1–10 TON). Paid TON → CREATED_BROKERS_WALLET. Auto-lists on marketplace.
        createBrokerCostTonNano: { type: Number, default: 1_000_000_000 },
        // Default AIBA price when broker is auto-listed after create-with-TON (so it appears globally)
        marketplaceDefaultNewBrokerPriceAIBA: { type: Number, default: 10 },

        // Boost your profile (visibility): pay TON 1–10. → BOOST_PROFILE_WALLET
        boostProfileCostTonNano: { type: Number, default: 1_000_000_000 },
        boostProfileDurationDays: { type: Number, default: 7 },
        // Gifts: pay TON 1–10 to send a gift to another user. → GIFTS_WALLET
        giftCostTonNano: { type: Number, default: 1_000_000_000 },

        // Groups (guilds): pay TON to create or boost. 1–10 TON = 1e9–10e9 nano. Wallets: env LEADER_BOARD_WALLET, BOOST_GROUP_WALLET
        guildCreatorShareBps: { type: Number, default: 100 }, // INNOVATIONS: guild leader earns 1% of guild war earnings from members
        createGroupCostTonNano: { type: Number, default: 1_000_000_000 }, // 1 TON default
        boostGroupCostTonNano: { type: Number, default: 1_000_000_000 },  // 1 TON default
        leaderboardTopFreeCreate: { type: Number, default: 50 },          // top N by score can create group for free

        // Oracle / reserve (display only; admin can set; automated when oracleAutoUpdateEnabled)
        oracleAibaPerTon: { type: Number, default: 0 },
        oracleNeurPerAiba: { type: Number, default: 0 },
        // Holistic automated AIBA/TON oracle
        oracleAutoUpdateEnabled: { type: Boolean, default: false },
        oracleAibaUsd: { type: Number, default: 0 }, // price of 1 AIBA in USD; used to derive AIBA/TON = TON_USD/AIBA_USD
        oracleMinAibaPerTon: { type: Number, default: 0 }, // clamp min (0 = no min)
        oracleMaxAibaPerTon: { type: Number, default: 0 }, // clamp max (0 = no max)
        oracleFallbackAibaPerTon: { type: Number, default: 0 }, // use when fetch fails
        oracleLastUpdatedAt: { type: Date, default: null },
        oracleTonUsdAtUpdate: { type: Number, default: 0 },
        oracleUpdateIntervalMinutes: { type: Number, default: 15 },

        // Boosts (pay NEUR for temporary reward multiplier)
        boostCostNeur: { type: Number, default: 100 },
        boostDurationHours: { type: Number, default: 24 },
        boostMultiplier: { type: Number, default: 1.2 },

        // Staking (off-chain: lock AIBA, earn APY). Advisory: 1T AIBA, 20% staking allocation.
        stakingMinAiba: { type: Number, default: 100 }, // Min AIBA to stake (flexible + locked). Ecosystem-aligned: broker mint cost (100), 1T AIBA supply.
        stakingApyPercent: { type: Number, default: 15 },
        // Period-based staking: [{ days: 30, apyPercent: 10 }, { days: 90, apyPercent: 12 }, { days: 180, apyPercent: 15 }, { days: 365, apyPercent: 18 }]
        stakingPeriods: {
            type: Array,
            default: [
                { days: 30, apyPercent: 10 },
                { days: 90, apyPercent: 12 },
                { days: 180, apyPercent: 15 },
                { days: 365, apyPercent: 18 },
            ],
        },
        stakingCancelEarlyFeeBps: { type: Number, default: 500 }, // 5% fee for early cancel

        // Battle hardening knobs (server-enforced)
        battleEnergyCost: { type: Number, default: 1 }, // default energy per battle when mode.energyCost not set
        battleMaxEnergy: { type: Number, default: 100 },
        battleEnergyRegenSecondsPerEnergy: { type: Number, default: 60 }, // 1 energy / minute baseline
        battleAnomalyScoreMax: { type: Number, default: 220 },
        battleAutoBanBrokerAnomalyFlags: { type: Number, default: 5 },
        battleAutoBanUserAnomalyFlags: { type: Number, default: 25 },
        battleAutoBanUserMinutes: { type: Number, default: 60 * 24 },

        // Charity (impact score: 1 AIBA = N "impact points" for leaderboard)
        charityImpactAibaMultiplier: { type: Number, default: 10 },

        // Stars: per-battle reward (in-app recognition currency)
        starRewardPerBattle: { type: Number, default: 1 },
        // Stars Store (Marketplace): buy Stars with AIBA or TON. Pack = N Stars for X AIBA or Y TON. TON → STARS_STORE_WALLET.
        starsStorePackStars: { type: Number, default: 10 },
        starsStorePackPriceAiba: { type: Number, default: 50 },
        starsStorePackPriceTonNano: { type: Number, default: 1_000_000_000 }, // 1 TON default (1–10 TON clamp in admin)
        // Diamonds: one-time reward on first battle win (TON/Telegram premium)
        diamondRewardFirstWin: { type: Number, default: 1 },

        // Auto-award top_leader badge: top N users by total score get this badge (synced by cron or admin)
        topLeaderBadgeTopN: { type: Number, default: 10 },

        // Course completion badge: mintable with TON once at least one course is completed (adjustable from Super Admin)
        courseCompletionBadgeMintCostTonNano: { type: Number, default: 10_000_000_000 }, // 10 TON default
        // Full course completion certificate: mintable with TON when all courses completed (adjustable from Super Admin)
        fullCourseCompletionCertificateMintCostTonNano: { type: Number, default: 15_000_000_000 }, // 15 TON default

        // NFT Multiverse: staking NFTs (e.g. Broker NFT) to earn AIBA
        nftStakingApyPercent: { type: Number, default: 12 },
        nftStakingRewardPerDayAiba: { type: Number, default: 5 },
        // Arena Legend universe (future): mint cost in AIBA and unlock condition (battle wins)
        arenaLegendMintCostAiba: { type: Number, default: 500 },
        arenaLegendUnlockWins: { type: Number, default: 100 },

        // Autonomous Car Racing: create with TON (1–10) → CAR_RACING_WALLET or AIBA
        createCarCostTonNano: { type: Number, default: 1_000_000_000 },
        createCarCostAiba: { type: Number, default: 100 },
        carEntryFeeAiba: { type: Number, default: 10 },
        carRacingFeeBps: { type: Number, default: 300 },
        // Autonomous Bike Racing: create with TON (1–10) → MOTORCYCLE_RACING_WALLET or AIBA
        createBikeCostTonNano: { type: Number, default: 1_000_000_000 },
        createBikeCostAiba: { type: Number, default: 100 },
        bikeEntryFeeAiba: { type: Number, default: 10 },
        bikeRacingFeeBps: { type: Number, default: 300 },

        // Innovations: Streaks
        streakMultiplierAt7Days: { type: Number, default: 1.25 },
        streakMultiplierAt30Days: { type: Number, default: 1.5 },
        streakCapMultiplier: { type: Number, default: 2 },
        battleWinStreakBonusBps: { type: Number, default: 100 }, // 1% per win streak, cap 5 wins
        // Innovations: Daily Combo
        dailyComboRequirementAiba: { type: Number, default: 100 },
        dailyComboBonusAiba: { type: Number, default: 500 },
        // Innovations: Premium
        premiumCostTonNano: { type: Number, default: 5_000_000_000 },
        premiumDurationDays: { type: Number, default: 30 },
        premiumRewardMultiplier: { type: Number, default: 2 },
        // Innovations: Creator economy (% of referred user earnings to creator)
        creatorPercentBps: { type: Number, default: 200 }, // 2%
        creatorTier100RefsBps: { type: Number, default: 300 },
        creatorTier1000RefsBps: { type: Number, default: 500 },
        creatorTier10000RefsBps: { type: Number, default: 700 },
        // Innovations: Broker rental platform fee
        brokerRentalFeeBps: { type: Number, default: 2000 }, // 20%
        // Innovations: Tournament fee to treasury
        tournamentFeeBps: { type: Number, default: 2000 }, // 20%
        // Innovations: Predict/bet vig
        predictVigBps: { type: Number, default: 300 }, // 3%
        predictMaxBetAiba: { type: Number, default: 10_000 },
        // Innovations: Breeding
        breedCostAiba: { type: Number, default: 200 },
        // Trainers: rewards from ecosystem
        trainerRewardAibaPerUser: { type: Number, default: 5 }, // AIBA per referred user with 3+ battles
        trainerRewardAibaPerRecruitedTrainer: { type: Number, default: 20 }, // AIBA per trainer you recruited (when approved)
        // Trainer tier multipliers (bps): at least N referred users → reward multiplier. e.g. 10 refs = 110 bps = 1.1x
        trainerTierBpsByReferred: { type: Map, of: Number, default: { '0': 100, '10': 110, '50': 150, '100': 200, '500': 250 } },
        // Milestone definitions: referred [5,10,25,50,100,250,500], recruited [1,3,5,10] (for badges/unlocks)
        trainerMilestonesReferred: { type: [Number], default: [5, 10, 25, 50, 100, 250, 500] },
        trainerMilestonesRecruited: { type: [Number], default: [1, 3, 5, 10] },
        // Invite-3 unlock: BPS bonus on battle rewards when user has 3+ referrals (default 100 = 1%)
        referralUnlock3BonusBps: { type: Number, default: 100 },
        // AIBA self-automation (dynamic caps)
        automationEnabled: { type: Boolean, default: false },
        automationTargetEmissionPercentPerYear: { type: Number, default: 10 },
        automationMinCapAiba: { type: Number, default: 500_000 },
        automationMaxCapAiba: { type: Number, default: 5_000_000 },
        allocationVaultPct: { type: Number, default: 40 },
        allocationTreasuryPct: { type: Number, default: 15 },
        allocationStakingPct: { type: Number, default: 20 },
        allocationTeamPct: { type: Number, default: 10 },
        allocationEcosystemPct: { type: Number, default: 10 },
        allocationCommunityPct: { type: Number, default: 5 },
        // P2P AIBA send: TON fee (nano) required to send AIBA; goes to P2P_AIBA_SEND_WALLET
        p2pAibaSendFeeTonNano: { type: Number, default: 100_000_000 }, // 0.1 TON default
        // AIBA in gifts: cost = amountAiba / rate + fee. TON → AIBA_IN_GIFTS_WALLET
        aibaInGiftsFeeTonNano: { type: Number, default: 100_000_000 }, // 0.1 TON fee on top of amount
        // Buy AIBA with TON: spread (fee). User pays TON, gets AIBA at (oracle - spread).
        buyAibaWithTonFeeBps: { type: Number, default: 500 }, // 5% fee (we give 95% of oracle rate)
        // Donate broker/car/bike/gifts: TON fee to respective wallet
        donateBrokerFeeTonNano: { type: Number, default: 500_000_000 }, // 0.5 TON
        donateCarFeeTonNano: { type: Number, default: 500_000_000 },
        donateBikeFeeTonNano: { type: Number, default: 500_000_000 },
        donateGiftsFeeTonNano: { type: Number, default: 100_000_000 }, // 0.1 TON

        // Unified Comms Phase 4: support link (Telegram group/channel) and optional contact
        supportLink: { type: String, default: '', trim: true },       // e.g. https://t.me/aibaarena_support
        supportTelegramGroup: { type: String, default: '', trim: true }, // e.g. aibaarena_support (for tg://resolve?domain=X)
    },
    { timestamps: true },
);

module.exports = mongoose.model('EconomyConfig', EconomyConfigSchema);
