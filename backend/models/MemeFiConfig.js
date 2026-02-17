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
    },
    { timestamps: true },
);

module.exports = mongoose.model('MemeFiConfig', MemeFiConfigSchema);
