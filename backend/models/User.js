const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        telegramId: { type: String, index: true },
        username: { type: String, default: '', trim: true },
        wallet: { type: String, default: '', trim: true },
        aibaBalance: { type: Number, default: 0 },
        pendingAIBA: { type: Number, default: 0 },

        // Moderation
        bannedUntil: { type: Date, default: null },
        bannedReason: { type: String, default: '', trim: true },

        // On-chain claim replay protection (matches ArenaRewardVault per-recipient seqno)
        vaultClaimSeqno: { type: Number, default: 0 },
    },
    { timestamps: true }
);

UserSchema.index({ telegramId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', UserSchema);
