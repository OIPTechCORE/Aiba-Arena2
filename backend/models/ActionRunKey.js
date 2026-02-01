const mongoose = require('mongoose');

// Generic idempotency lock for non-battle mutations (train/repair/upgrade/claims/etc).
// This is intentionally similar to BattleRunKey, but scoped by (scope, requestId, ownerTelegramId).
const ActionRunKeySchema = new mongoose.Schema(
    {
        scope: { type: String, required: true, trim: true, index: true }, // e.g. "broker_train"
        requestId: { type: String, required: true, trim: true, index: true },
        ownerTelegramId: { type: String, required: true, index: true },

        status: { type: String, enum: ['in_progress', 'completed', 'failed'], default: 'in_progress', index: true },
        errorCode: { type: String, default: '', trim: true },
        errorMessage: { type: String, default: '', trim: true },

        response: { type: Object, default: null },

        // TTL cleanup. Set short TTL for in_progress, longer TTL for completed/failed.
        expiresAt: { type: Date, required: true, index: true },
    },
    { timestamps: true },
);

ActionRunKeySchema.index({ scope: 1, requestId: 1, ownerTelegramId: 1 }, { unique: true });
ActionRunKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ActionRunKey', ActionRunKeySchema);
