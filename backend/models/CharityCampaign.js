const mongoose = require('mongoose');

const CharityCampaignSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        cause: {
            type: String,
            enum: ['education', 'environment', 'health', 'emergency', 'community', 'other'],
            default: 'community',
            trim: true,
        },
        goalNeur: { type: Number, default: 0 },
        goalAiba: { type: Number, default: 0 },
        goalTonNano: { type: Number, default: 0 },
        raisedNeur: { type: Number, default: 0 },
        raisedAiba: { type: Number, default: 0 },
        raisedTonNano: { type: Number, default: 0 },
        donorCount: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['draft', 'active', 'ended', 'funded', 'disbursed'],
            default: 'draft',
            index: true,
        },
        beneficiaryTonAddress: { type: String, default: '', trim: true },
        beneficiaryType: { type: String, enum: ['treasury', 'external'], default: 'treasury' },
        startAt: { type: Date, default: null },
        endAt: { type: Date, default: null },
        disbursedAt: { type: Date, default: null },
        featured: { type: Boolean, default: false, index: true },
        order: { type: Number, default: 0, index: true },
        createdBy: { type: String, default: 'system', trim: true },
    },
    { timestamps: true },
);

CharityCampaignSchema.index({ status: 1, featured: -1, order: 1, createdAt: -1 });
CharityCampaignSchema.index({ cause: 1, status: 1 });

module.exports = mongoose.model('CharityCampaign', CharityCampaignSchema);
