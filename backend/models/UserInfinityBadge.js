const mongoose = require('mongoose');

// User's Infinity Badge Collection Schema
const UserInfinityBadgeSchema = new mongoose.Schema({
    // User reference
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        index: true 
    },
    
    // Badge reference
    badgeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'InfinityBadge', 
        required: true, 
        index: true 
    },
    
    // Acquisition details
    earnedAt: { type: Date, default: Date.now, required: true },
    earnedFrom: { 
        type: String, 
        enum: ['achievement', 'purchase', 'gift', 'event', 'rank_promotion', 'streak_bonus', 'referral_reward'],
        default: 'achievement' 
    },
    
    // Progress for incomplete badges
    progress: {
        current: { type: Number, default: 0 },
        max: { type: Number, default: 1 },
        percentage: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now }
    },
    
    // Badge level and evolution
    level: { type: Number, default: 1, min: 1, max: 10 },
    evolution: {
        currentTier: { type: String, default: 'base' },
        nextTier: { type: String, default: '' },
        evolutionProgress: { type: Number, default: 0 },
        canEvolve: { type: Boolean, default: false }
    },
    
    // Display preferences
    display: {
        isEquipped: { type: Boolean, default: false },
        isFavorite: { type: Boolean, default: false },
        isHidden: { type: Boolean, default: false },
        displayOrder: { type: Number, default: 0 },
        showOnProfile: { type: Boolean, default: true },
        showInLeaderboard: { type: Boolean, default: true }
    },
    
    // Rarity and special attributes
    specialAttributes: [{
        type: { type: String, enum: ['glow', 'animated', 'special_effect', 'unique_trait', 'bonus'] },
        value: { type: String },
        isActive: { type: Boolean, default: true }
    }],
    
    // Trading and gifting
    trading: {
        isTradable: { type: Boolean, default: false },
        isGifted: { type: Boolean, default: false },
        giftedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        giftedAt: { type: Date, default: null },
        tradeCount: { type: Number, default: 0 },
        lastTradedAt: { type: Date, default: null }
    },
    
    // Usage statistics
    usage: {
        timesDisplayed: { type: Number, default: 0 },
        profileViews: { type: Number, default: 0 },
        leaderboardAppearances: { type: Number, default: 0 },
        socialShares: { type: Number, default: 0 },
        lastUsedAt: { type: Date, default: null }
    },
    
    // Blockchain/NFT details
    blockchain: {
        isNFT: { type: Boolean, default: false },
        contractAddress: { type: String, default: '' },
        tokenId: { type: String, default: '' },
        owner: { type: String, default: '' },
        metadataUri: { type: String, default: '' }
    },
    
    // Status
    status: { 
        type: String, 
        enum: ['active', 'inactive', 'expired', 'evolved', 'traded'], 
        default: 'active',
        index: true 
    },
    
    // Expiration (for time-limited badges)
    expiration: {
        isExpirable: { type: Boolean, default: false },
        expiresAt: { type: Date, default: null },
        gracePeriod: { type: Number, default: 0 }, // Days
        expirationNotified: { type: Boolean, default: false }
    }
}, {
    timestamps: true,
    collection: 'user_infinity_badges'
});

// Compound indexes for performance
UserInfinityBadgeSchema.index({ userId: 1, earnedAt: -1 });
UserInfinityBadgeSchema.index({ userId: 1, status: 1 });
UserInfinityBadgeSchema.index({ badgeId: 1, 'blockchain.isNFT': 1 });
UserInfinityBadgeSchema.index({ 'display.isEquipped': 1, 'display.displayOrder': 1 });

module.exports = mongoose.model('UserInfinityBadge', UserInfinityBadgeSchema);
