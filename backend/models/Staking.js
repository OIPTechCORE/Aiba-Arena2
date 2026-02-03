const mongoose = require('mongoose');

const StakingSchema = new mongoose.Schema(
    {
        telegramId: { type: String, required: true, index: true },
        amount: { type: Number, required: true, min: 0 },
        lockedAt: { type: Date, default: Date.now },
        lastClaimedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

StakingSchema.index({ telegramId: 1 });

module.exports = mongoose.model('Staking', StakingSchema);
