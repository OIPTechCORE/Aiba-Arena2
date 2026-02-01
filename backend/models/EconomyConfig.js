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

        // Marketplace knobs (tracking + future on-chain settlement)
        marketplaceFeeBps: { type: Number, default: 300 }, // 3%
        marketplaceBurnBps: { type: Number, default: 0 },

        // Referrals (off-chain rewards)
        referralRewardNeurReferrer: { type: Number, default: 250 },
        referralRewardNeurReferee: { type: Number, default: 150 },

        // Battle hardening knobs (server-enforced)
        battleMaxEnergy: { type: Number, default: 100 },
        battleEnergyRegenSecondsPerEnergy: { type: Number, default: 60 }, // 1 energy / minute baseline
        battleAnomalyScoreMax: { type: Number, default: 220 },
        battleAutoBanBrokerAnomalyFlags: { type: Number, default: 5 },
        battleAutoBanUserAnomalyFlags: { type: Number, default: 25 },
        battleAutoBanUserMinutes: { type: Number, default: 60 * 24 },
    },
    { timestamps: true },
);

module.exports = mongoose.model('EconomyConfig', EconomyConfigSchema);
