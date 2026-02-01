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

        // Broker sinks
        upgradeAibaCost: { type: Number, default: 50 },
        trainNeurCost: { type: Number, default: 25 },

        // Marketplace knobs (tracking + future on-chain settlement)
        marketplaceFeeBps: { type: Number, default: 300 }, // 3%
        marketplaceBurnBps: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('EconomyConfig', EconomyConfigSchema);

