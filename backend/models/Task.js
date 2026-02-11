const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        enabled: { type: Boolean, default: true },
        category: {
            type: String,
            enum: ['onboarding', 'core', 'economy', 'racing', 'social', 'learning', 'advanced'],
            default: 'core',
            trim: true,
            index: true,
        },
        userKinds: { type: [String], default: ['all'] }, // all, newcomer, fighter, trader, racer, social, scholar, investor
        ctaLabel: { type: String, default: 'Open', trim: true },
        ctaTab: { type: String, default: '', trim: true },
        rewardAiba: { type: Number, default: 0 },
        rewardNeur: { type: Number, default: 0 },
        sortOrder: { type: Number, default: 100 },
    },
    { timestamps: true },
);

module.exports = mongoose.model('Task', TaskSchema);
