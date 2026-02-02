const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        telegramId: { type: String },
        username: { type: String, default: '', trim: true },
        telegram: {
            username: { type: String, default: '', trim: true },
            firstName: { type: String, default: '', trim: true },
            lastName: { type: String, default: '', trim: true },
            languageCode: { type: String, default: '', trim: true },
            photoUrl: { type: String, default: '', trim: true },
        },
        lastSeenAt: { type: Date, default: null },
        wallet: { type: String, default: '', trim: true },
        aibaBalance: { type: Number, default: 0 },
        pendingAIBA: { type: Number, default: 0 },
        neurBalance: { type: Number, default: 0 },

        // Moderation
        bannedUntil: { type: Date, default: null },
        bannedReason: { type: String, default: '', trim: true },
        anomalyFlags: { type: Number, default: 0 },

        // On-chain claim replay protection (matches ArenaRewardVault per-recipient seqno)
        vaultClaimSeqno: { type: Number, default: 0 },
    },
    { timestamps: true },
);

UserSchema.index({ telegramId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', UserSchema);
