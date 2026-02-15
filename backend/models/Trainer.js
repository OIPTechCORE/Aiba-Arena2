const mongoose = require('mongoose');

const TrainerSchema = new mongoose.Schema(
    {
        telegramId: { type: String, required: true, unique: true },
        username: { type: String, default: '', trim: true },
        displayName: { type: String, default: '', trim: true },
        bio: { type: String, default: '', trim: true, maxlength: 500 },
        specialty: { type: String, default: 'general', trim: true },
        region: { type: String, default: '', trim: true },
        code: { type: String, required: true, unique: true, trim: true },
        invitedByTrainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', default: null },
        status: { type: String, enum: ['pending', 'approved', 'suspended'], default: 'pending' },
        referredUserCount: { type: Number, default: 0 },
        recruitedTrainerCount: { type: Number, default: 0 },
        referredUsersWithBattles: { type: Number, default: 0 },
        totalImpactScore: { type: Number, default: 0 },
        rewardsEarnedAiba: { type: Number, default: 0 },
        rewardsEarnedNeur: { type: Number, default: 0 },
        lastRewardClaimedAt: { type: Date, default: null },
        // Viral / deepest: share tracking + milestones
        shareCount: { type: Number, default: 0 },
        lastSharedAt: { type: Date, default: null },
        milestonesUnlocked: { type: [String], default: [] },
        // Seasonal: running period counters (reset when period rolls)
        periodWeekStart: { type: Date, default: null },
        periodWeekReferred: { type: Number, default: 0 },
        periodWeekRecruited: { type: Number, default: 0 },
        periodMonthStart: { type: Date, default: null },
        periodMonthReferred: { type: Number, default: 0 },
        periodMonthRecruited: { type: Number, default: 0 },
    },
    { timestamps: true },
);

/* code: unique: true on field already creates unique index */
TrainerSchema.index({ status: 1 });
TrainerSchema.index({ totalImpactScore: -1 });
TrainerSchema.index({ referredUserCount: -1 });
TrainerSchema.index({ status: 1, totalImpactScore: -1 });
TrainerSchema.index({ status: 1, referredUserCount: -1 });
TrainerSchema.index({ status: 1, recruitedTrainerCount: -1 });

module.exports = mongoose.model('Trainer', TrainerSchema);
