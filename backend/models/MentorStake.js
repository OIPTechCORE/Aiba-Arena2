const mongoose = require('mongoose');

const MentorStakeSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor', required: true, index: true },
        amountAiba: { type: Number, default: 0 },
        stakedAt: { type: Date, default: Date.now },
        rewardAccruedAiba: { type: Number, default: 0 },
        status: { type: String, default: 'active', trim: true }, // active, unstaked
    },
    { timestamps: true },
);

MentorStakeSchema.index({ userId: 1, mentorId: 1 });

module.exports = mongoose.model('MentorStake', MentorStakeSchema);
