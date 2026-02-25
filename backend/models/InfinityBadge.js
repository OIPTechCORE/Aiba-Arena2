const mongoose = require('mongoose');

// Infinity Badge System Schema
const InfinityBadgeSchema = new mongoose.Schema({
    // Core identification
    badgeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    
    // Badge categorization
    category: { 
        type: String, 
        required: true, 
        enum: ['leadership', 'organizer', 'rank', 'profile', 'achievement', 'item'],
        index: true 
    },
    
    // Visual design
    icon: { type: String, required: true }, // URL or emoji
    rarity: { 
        type: String, 
        required: true, 
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'infinity'],
        index: true 
    },
    
    // Visual effects and animations
    visualEffects: {
        glow: { type: Boolean, default: false },
        animated: { type: Boolean, default: false },
        particleEffect: { type: String, default: '' }, // sparkle, pulse, wave, etc.
        backgroundColor: { type: String, default: '#1a1a2e' },
        borderColor: { type: String, default: '#00d4ff' },
        gradient: { type: String, default: '' }, // CSS gradient string
    },
    
    // Badge requirements and unlocking
    requirements: {
        type: { type: String, enum: ['automatic', 'manual', 'achievement', 'streak', 'rank', 'special'] },
        conditions: [{
            type: { type: String, enum: ['balance', 'battles', 'wins', 'streak', 'referrals', 'level', 'date', 'custom'] },
            value: { type: mongoose.Schema.Types.Mixed },
            operator: { type: String, enum: ['>=', '<=', '=', '>', '<'], default: '>=' }
        }],
        autoUnlock: { type: Boolean, default: true }
    },
    
    // Progress tracking
    progress: {
        current: { type: Number, default: 0 },
        max: { type: Number, default: 1 },
        percentage: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now }
    },
    
    // Badge rewards and benefits
    rewards: {
        aibaReward: { type: Number, default: 0 },
        neurReward: { type: Number, default: 0 },
        starsReward: { type: Number, default: 0 },
        diamondReward: { type: Number, default: 0 },
        xpBonus: { type: Number, default: 0 },
        multiplier: { type: Number, default: 1.0 }, // Reward multiplier
        exclusiveAccess: [String], // Special features, areas, or roles
        profileBoost: { type: Number, default: 0 }, // Days of profile boost
    },
    
    // Social and display features
    social: {
        showOnProfile: { type: Boolean, default: true },
        showInLeaderboard: { type: Boolean, default: true },
        shareable: { type: Boolean, default: true },
        tradable: { type: Boolean, default: false },
        stackable: { type: Boolean, default: false }, // Can show multiple badges
        priority: { type: Number, default: 0 } // Display order
    },
    
    // Blockchain/NFT integration
    blockchain: {
        isNFT: { type: Boolean, default: false },
        contractAddress: { type: String, default: '' },
        tokenId: { type: String, default: '' },
        metadata: {
            name: { type: String, default: '' },
            description: { type: String, default: '' },
            image: { type: String, default: '' },
            attributes: [{
                trait_type: { type: String },
                value: { type: String }
            }]
        }
    },
    
    // Time-based features
    timeBased: {
        isLimited: { type: Boolean, default: false },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        seasonal: { type: Boolean, default: false },
        recurring: { type: Boolean, default: false }
    },
    
    // Status and availability
    status: { 
        type: String, 
        enum: ['active', 'inactive', 'hidden', 'deprecated', 'coming_soon'], 
        default: 'active',
        index: true 
    },
    
    // Statistics and analytics
    stats: {
        totalEarned: { type: Number, default: 0 },
        currentlyHeld: { type: Number, default: 0 },
        averageUnlockTime: { type: Number, default: 0 }, // Days
        rarityDistribution: {
            common: { type: Number, default: 0 },
            uncommon: { type: Number, default: 0 },
            rare: { type: Number, default: 0 },
            epic: { type: Number, default: 0 },
            legendary: { type: Number, default: 0 },
            mythic: { type: Number, default: 0 },
            infinity: { type: Number, default: 0 }
        }
    },
    
    // Metadata
    tags: [String],
    createdBy: { type: String, default: 'system' }, // admin, system, event
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    collection: 'infinity_badges'
});

// Indexes for performance
InfinityBadgeSchema.index({ category: 1, rarity: 1 });
InfinityBadgeSchema.index({ status: 1, createdAt: -1 });
InfinityBadgeSchema.index({ 'requirements.type': 1, 'requirements.value': 1 });
InfinityBadgeSchema.index({ 'blockchain.isNFT': 1 });

module.exports = mongoose.model('InfinityBadge', InfinityBadgeSchema);
