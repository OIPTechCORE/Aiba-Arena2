const mongoose = require('mongoose');

const BattleRunKeySchema = new mongoose.Schema(
    {
        requestId: { type: String, required: true, unique: true },
        ownerTelegramId: { type: String, required: true, index: true },

        status: { type: String, enum: ['in_progress', 'completed', 'failed'], default: 'in_progress' },
        errorCode: { type: String, default: '', trim: true },
        errorMessage: { type: String, default: '', trim: true },

        battleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle', default: null, index: true },

        // TTL cleanup. Set short TTL for in_progress, longer TTL for completed/failed.
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true },
);

// TTL index (MongoDB will delete documents after expiresAt)
BattleRunKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('BattleRunKey', BattleRunKeySchema);
