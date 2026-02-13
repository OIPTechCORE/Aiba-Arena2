const mongoose = require('mongoose');

const GlobalBossSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        totalHp: { type: Number, required: true },
        currentHp: { type: Number, required: true },
        status: { type: String, enum: ['active', 'defeated'], default: 'active', index: true },
        rewardPoolAiba: { type: Number, default: 0 },
        startedAt: { type: Date, default: Date.now },
        defeatedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

GlobalBossSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('GlobalBoss', GlobalBossSchema);
