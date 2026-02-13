const mongoose = require('mongoose');

const TrainerSchema = new mongoose.Schema(
    {
        telegramId: { type: String, required: true, unique: true, index: true },
        username: { type: String, default: '', trim: true },
        displayName: { type: String, default: '', trim: true },
        bio: { type: String, default: '', trim: true, maxlength: 500 },
        specialty: { type: String, default: 'general', trim: true },
        region: { type: String, default: '', trim: true },
        code: { type: String, required: true, unique: true, trim: true, index: true },
        invitedByTrainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', default: null },
        status: { type: String, enum: ['pending', 'approved', 'suspended'], default: 'pending' },
        referredUserCount: { type: Number, default: 0 },
        recruitedTrainerCount: { type: Number, default: 0 },
        referredUsersWithBattles: { type: Number, default: 0 },
        totalImpactScore: { type: Number, default: 0 },
        rewardsEarnedAiba: { type: Number, default: 0 },
        rewardsEarnedNeur: { type: Number, default: 0 },
        lastRewardClaimedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

TrainerSchema.index({ code: 1 });
TrainerSchema.index({ status: 1 });
TrainerSchema.index({ totalImpactScore: -1 });
TrainerSchema.index({ referredUserCount: -1 });

module.exports = mongoose.model('Trainer', TrainerSchema);
