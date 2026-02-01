const mongoose = require('mongoose');

const GameModeSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, trim: true }, // e.g. "prediction"
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        enabled: { type: Boolean, default: true },
        arena: { type: String, required: true, trim: true }, // arena bucket
        league: { type: String, default: 'rookie', trim: true },

        energyCost: { type: Number, default: 10 },
        cooldownSeconds: { type: Number, default: 30 },

        rewardMultiplierAiba: { type: Number, default: 1.0 },
        rewardMultiplierNeur: { type: Number, default: 1.0 },

        rules: { type: Object, default: {} },
    },
    { timestamps: true }
);

GameModeSchema.index({ enabled: 1, arena: 1, league: 1 });

module.exports = mongoose.model('GameMode', GameModeSchema);

