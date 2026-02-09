const mongoose = require('mongoose');

const BattleSchema = new mongoose.Schema(
    {
        requestId: { type: String, required: true, unique: true, index: true },

        ownerTelegramId: { type: String, required: true, index: true },
        brokerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true, index: true },

        arena: { type: String, required: true, trim: true },
        league: { type: String, default: 'rookie', trim: true },
        modeKey: { type: String, default: '', trim: true },

        seedHex: { type: String, required: true, trim: true },

        score: { type: Number, required: true },
        rewardAiba: { type: Number, default: 0 },
        rewardNeur: { type: Number, default: 0 },

        // Guild wars (optional)
        guildId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild', default: null, index: true },
        opponentGuildId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild', default: null },
        guildShareNeur: { type: Number, default: 0 },

        anomaly: { type: Boolean, default: false },
        anomalyReason: { type: String, default: '', trim: true },

        // Claim payload returned to client (signature-based)
        claim: {
            vaultAddress: { type: String, default: '', trim: true },
            toAddress: { type: String, default: '', trim: true },
            amount: { type: String, default: '', trim: true }, // integer string (jetton smallest units)
            seqno: { type: Number, default: 0 },
            validUntil: { type: Number, default: 0 },
            signatureBase64: { type: String, default: '', trim: true },
            payloadBocBase64: { type: String, default: '', trim: true },
        },
    },
    { timestamps: true },
);

BattleSchema.index({ ownerTelegramId: 1, createdAt: -1 });

module.exports = mongoose.model('Battle', BattleSchema);
