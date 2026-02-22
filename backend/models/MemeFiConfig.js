const mongoose = require('mongoose');

const MemeFiConfigSchema = new mongoose.Schema(
    {
        // Scoring weights (engagement score formula)
        weightLike: { type: Number, default: 1 },
        weightComment: { type: Number, default: 2 },
        weightInternalShare: { type: Number, default: 3 },
        weightExternalShare: { type: Number, default: 5 },
        boostMultiplierPerUnit: { type: Number, default: 0.1 },
        timeDecayHalfLifeHours: { type: Number, default: 24 },

        // Daily reward pool (Phase 2)
        dailyPoolAiba: { type: Number, default: 5000 },
        dailyPoolNeur: { type: Number, default: 10000 },
        poolPctTop10: { type: Number, default: 40 },
        poolPctBoosters: { type: Number, default: 20 },
        poolPctLottery: { type: Number, default: 10 },
        poolPctMining: { type: Number, default: 30 },
        topN: { type: Number, default: 10 },
        lotteryWinnersCount: { type: Number, default: 20 },

        // Boost stake (off-chain lock)
        boostLockHours: { type: Number, default: 24 },
        boostMinAiba: { type: Number, default: 1 },

        // Categories (LMS / education)
        educationCategories: { type: [String], default: ['study_humor', 'exam_tips', 'school_events', 'general_edu'] },

        // P1 — Education-specific weights (optional overrides per educationCategory)
        educationWeights: { type: Object, default: {} },

        // P1 — Auto-hide when reportCount >= this (0 = off)
        autoHideReportThreshold: { type: Number, default: 0 },

        // P3 — Weekly pool
        weeklyPoolAiba: { type: Number, default: 0 },
        weeklyPoolNeur: { type: Number, default: 0 },
        weeklyTopN: { type: Number, default: 5 },

        // P3 — Cap per user per day (0 = no cap)
        maxAibaPerUserPerDay: { type: Number, default: 0 },
        maxNeurPerUserPerDay: { type: Number, default: 0 },

        // P3 — Per-educationCategory pools: { study_humor: { dailyPoolAiba, dailyPoolNeur, topN }, ... }
        categoryPools: { type: Object, default: {} },

        // P1 — Reaction weights for score (e.g. { fire: 1, funny: 1, edu: 1.2 })
        reactionWeights: { type: Object, default: {} },

        // P5 — Education creator badge: min meme count in education categories + min total engagement score
        educationCreatorBadgeMinMemeCount: { type: Number, default: 5 },
        educationCreatorBadgeMinScore: { type: Number, default: 100 },

        // Creator tiers: reward multiplier for top/mining. Higher tier = higher multiplier.
        // Array of { tier: 'bronze'|'silver'|'gold'|'platinum', minMemes, minTotalScore, rewardMultiplier }
        creatorTiers: {
            type: Array,
            default: [
                { tier: 'bronze', minMemes: 0, minTotalScore: 0, rewardMultiplier: 1 },
                { tier: 'silver', minMemes: 5, minTotalScore: 500, rewardMultiplier: 1.2 },
                { tier: 'gold', minMemes: 20, minTotalScore: 2000, rewardMultiplier: 1.5 },
                { tier: 'platinum', minMemes: 50, minTotalScore: 10000, rewardMultiplier: 2 },
            ],
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('MemeFiConfig', MemeFiConfigSchema);
