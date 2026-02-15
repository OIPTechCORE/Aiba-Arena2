const mongoose = require('mongoose');

const NftStakeSchema = new mongoose.Schema(
    {
        telegramId: { type: String, required: true },
        universeSlug: { type: String, required: true, index: true },
        // Broker NFT: we use brokerId to identify the staked NFT (broker must have nftItemAddress)
        brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true },
        stakedAt: { type: Date, default: Date.now },
        lastRewardAt: { type: Date, default: Date.now },
    },
    { timestamps: true },
);

// One stake per broker (one NFT per broker)
NftStakeSchema.index({ brokerId: 1 }, { unique: true });
NftStakeSchema.index({ telegramId: 1, universeSlug: 1 });

module.exports = mongoose.model('NftStake', NftStakeSchema);
