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
        energyUpdatedAt: { type: Date, default: () => new Date() },
        lastBattleAt: { type: Date, default: null },
        cooldowns: { type: Map, of: Date, default: {} }, // arenaKey -> lastBattleAt

        // Flags / moderation
        anomalyFlags: { type: Number, default: 0 },
        banned: { type: Boolean, default: false },
        banReason: { type: String, default: '', trim: true },

        // Idempotency / replay protection
        lastRequestId: { type: String, default: '', trim: true },

        // Hybrid on-chain representation (optional)
        nftCollectionAddress: { type: String, default: '', trim: true },
        nftItemAddress: { type: String, default: '', trim: true },
        nftItemIndex: { type: Number, default: null },
        metadataUri: { type: String, default: '', trim: true },

        // Guild pool (optional)
        guildId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild', default: null, index: true },

        // Create-with-TON idempotency: one broker per txHash
        createdWithTonTxHash: { type: String, default: '', trim: true, sparse: true, index: true },
    },
    { timestamps: true },
);

BrokerSchema.index({ ownerTelegramId: 1, createdAt: -1 });

module.exports = mongoose.model('Broker', BrokerSchema);
