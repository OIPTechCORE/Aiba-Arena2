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
        lastDailyClaimAt: { type: Date, default: null },
        // Streaks (innovations): login streak for battle reward multiplier
        loginStreakDays: { type: Number, default: 0 },
        lastLoginStreakDate: { type: String, default: '', trim: true }, // YYYY-MM-DD
        battleWinStreak: { type: Number, default: 0 },
        lastBattleWinAt: { type: Date, default: null },
        // Daily combo: spend X AIBA today → claim bonus once
        dailyComboSpentTodayAiba: { type: Number, default: 0 },
        dailyComboSpentDate: { type: String, default: '', trim: true },
        dailyComboClaimedAt: { type: Date, default: null },
        // Premium subscription (5 TON/mo = 2x rewards)
        premiumUntil: { type: Date, default: null },
        wallet: { type: String, default: '', trim: true },
        aibaBalance: { type: Number, default: 0 },
        pendingAIBA: { type: Number, default: 0 },
        neurBalance: { type: Number, default: 0 },

        // Stars (Telegram Stars–style in-app recognition / tips)
        starsBalance: { type: Number, default: 0 },
        // Diamonds (TON/Telegram premium; rare, e.g. first win)
        diamondsBalance: { type: Number, default: 0 },
        firstWinDiamondAwardedAt: { type: Date, default: null },
        // Profile badges (X-style: verified, early_adopter, top_donor, etc.)
        badges: { type: [String], default: [] },
        roles: { type: [String], default: [] }, // user, mentor, council, admin
        reputation: { type: Number, default: 0 },
        mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor', default: null },
        realmProgress: { type: Map, of: Number, default: {} }, // realmKey -> progress score
        assetCount: { type: Number, default: 0 },

        // Moderation
        bannedUntil: { type: Date, default: null },
        bannedReason: { type: String, default: '', trim: true },
        anomalyFlags: { type: Number, default: 0 },

        // On-chain claim replay protection (matches ArenaRewardVault per-recipient seqno)
        vaultClaimSeqno: { type: Number, default: 0 },

        // Profile boost (pay TON): visibility/recognition until this date
        profileBoostedUntil: { type: Date, default: null },
    },
    { timestamps: true },
);

UserSchema.index({ telegramId: 1 }, { unique: true, sparse: true });
UserSchema.index({ wallet: 1 }, { sparse: true });

module.exports = mongoose.model('User', UserSchema);
