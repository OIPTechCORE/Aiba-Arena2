const mongoose = require('mongoose');

const BrokerSchema = new mongoose.Schema(
    {
        ownerTelegramId: { type: String, index: true, required: true },

        // Core traits
        risk: { type: Number, default: 50 }, // 0-100
        intelligence: { type: Number, default: 50 }, // 0-100
        speed: { type: Number, default: 50 }, // 0-100
        specialty: { type: String, default: 'crypto', trim: true },

        // Progression
        level: { type: Number, default: 1 },
        xp: { type: Number, default: 0 },

        // Battle resources / anti-spam
        energy: { type: Number, default: 10 },
        lastBattleAt: { type: Date, default: null },

        // Idempotency / replay protection
        lastRequestId: { type: String, default: '', trim: true },

        // Hybrid on-chain representation (optional)
        nftCollectionAddress: { type: String, default: '', trim: true },
        nftItemAddress: { type: String, default: '', trim: true },
        nftItemIndex: { type: Number, default: null },
        metadataUri: { type: String, default: '', trim: true },
    },
    { timestamps: true }
);

BrokerSchema.index({ ownerTelegramId: 1, createdAt: -1 });

module.exports = mongoose.model('Broker', BrokerSchema);

