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

        // Groups (guilds): pay TON to create or boost. 1–10 TON = 1e9–10e9 nano. Wallets: env LEADER_BOARD_WALLET, BOOST_GROUP_WALLET
        createGroupCostTonNano: { type: Number, default: 1_000_000_000 }, // 1 TON default
        boostGroupCostTonNano: { type: Number, default: 1_000_000_000 },  // 1 TON default
        leaderboardTopFreeCreate: { type: Number, default: 50 },          // top N by score can create group for free

        // Oracle / reserve (display only; admin can set)
        oracleAibaPerTon: { type: Number, default: 0 },
        oracleNeurPerAiba: { type: Number, default: 0 },

        // Boosts (pay NEUR for temporary reward multiplier)
        boostCostNeur: { type: Number, default: 100 },
        boostDurationHours: { type: Number, default: 24 },
        boostMultiplier: { type: Number, default: 1.2 },

        // Staking (off-chain: lock AIBA, earn APY)
        stakingApyPercent: { type: Number, default: 15 },

        // Battle hardening knobs (server-enforced)
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
        // Diamonds: one-time reward on first battle win (TON/Telegram premium)
        diamondRewardFirstWin: { type: Number, default: 1 },

        // Auto-award top_leader badge: top N users by total score get this badge (synced by cron or admin)
        topLeaderBadgeTopN: { type: Number, default: 10 },

        // Course completion badge: mintable with TON once at least one course is completed (adjustable from Super Admin)
        courseCompletionBadgeMintCostTonNano: { type: Number, default: 10_000_000_000 }, // 10 TON default
        // Full course completion certificate: mintable with TON when all courses completed (adjustable from Super Admin)
        fullCourseCompletionCertificateMintCostTonNano: { type: Number, default: 15_000_000_000 }, // 15 TON default
    },
    { timestamps: true },
);

module.exports = mongoose.model('EconomyConfig', EconomyConfigSchema);
