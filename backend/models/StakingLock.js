/**
 * Period-based staking locks. Advisory: 1T AIBA, 20% staking rewards.
 * User stakes for a period (30/90/180/365 days), earns APY. Cancel early = fee to Super Admin.
 */
const mongoose = require('mongoose');

const StakingLockSchema = new mongoose.Schema(
    {
        telegramId: { type: String, required: true, index: true },
        amount: { type: Number, required: true, min: 1 },
        periodDays: { type: Number, required: true },
        apyPercent: { type: Number, required: true },
        lockedAt: { type: Date, required: true, default: Date.now },
        unlocksAt: { type: Date, required: true },
        status: { type: String, default: 'active', enum: ['active', 'unlocked', 'cancelled_early'] },
        lastClaimedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

StakingLockSchema.index({ telegramId: 1, status: 1 });
StakingLockSchema.index({ unlocksAt: 1 });

module.exports = mongoose.model('StakingLock', StakingLockSchema);
