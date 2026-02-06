const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema(
    {
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        category: { type: String, required: true, trim: true }, // agent, brain, creator, workflow, system
        name: { type: String, required: true, trim: true },
        realmKey: { type: String, default: '', trim: true },
        rarity: { type: String, default: 'common', trim: true },
        level: { type: Number, default: 1 },
        upgradeCount: { type: Number, default: 0 },
        status: { type: String, default: 'owned', trim: true }, // owned, listed, rented
        metadataUri: { type: String, default: '', trim: true },
        stats: {
            arenaWinRate: { type: Number, default: 0 },
            roi: { type: Number, default: 0 },
            usageCount: { type: Number, default: 0 },
            revenueTotal: { type: Number, default: 0 },
            reputationScore: { type: Number, default: 0 },
        },
    },
    { timestamps: true },
);

AssetSchema.index({ ownerId: 1, category: 1 });
AssetSchema.index({ realmKey: 1, rarity: 1 });

module.exports = mongoose.model('Asset', AssetSchema);
