const mongoose = require('mongoose');

const BrokerMintJobSchema = new mongoose.Schema(
    {
        brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true, index: true },
        telegramId: { type: String, required: true, index: true },
        status: { type: String, enum: ['pending', 'minting', 'completed', 'failed'], default: 'pending', index: true },
        aibaPaid: { type: Number, required: true },
        nftItemAddress: { type: String, default: '', trim: true },
        nftCollectionAddress: { type: String, default: '', trim: true },
        errorMessage: { type: String, default: '', trim: true },
        completedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

BrokerMintJobSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('BrokerMintJob', BrokerMintJobSchema);
