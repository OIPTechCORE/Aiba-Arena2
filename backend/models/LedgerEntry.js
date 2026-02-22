const mongoose = require('mongoose');

const LedgerEntrySchema = new mongoose.Schema(
    {
        telegramId: { type: String, index: true, required: true },

        currency: { type: String, enum: ['NEUR', 'AIBA', 'STARS', 'DIAMONDS'], required: true, index: true },
        direction: { type: String, enum: ['credit', 'debit'], required: true, index: true },
        amount: { type: Number, required: true, min: 0 },

        reason: { type: String, default: '', trim: true, index: true }, // e.g. "battle_reward", "entry", "train", "upgrade", "referral"
        arena: { type: String, default: '', trim: true, index: true },
        league: { type: String, default: '', trim: true, index: true },

        // Idempotency / provenance
        sourceType: { type: String, default: null, trim: true, index: true }, // e.g. "battle", "broker_train", "referral", "admin"
        sourceId: { type: String, default: null, trim: true, index: true }, // requestId, referralUseId, etc.
        requestId: { type: String, default: null, trim: true },
        battleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle', default: null, index: true },

        // Apply-state for crash-safe idempotency:
        // - applied=true: balance/counters updated
        // - applied=false: ledger row exists but mutation not fully applied yet
        applied: { type: Boolean, default: true, index: true },

        meta: { type: Object, default: {} },
    },
    { timestamps: true },
);

// Ensure we can safely retry the same economic mutation without duplicating ledger rows.
LedgerEntrySchema.index(
    { sourceType: 1, sourceId: 1, telegramId: 1, currency: 1, direction: 1, reason: 1 },
    {
        unique: true,
        partialFilterExpression: {
            sourceType: { $type: 'string' },
            sourceId: { $type: 'string' },
        },
    },
);

LedgerEntrySchema.index({ createdAt: -1 });

module.exports = mongoose.model('LedgerEntry', LedgerEntrySchema);
