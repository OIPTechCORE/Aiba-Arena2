const mongoose = require('mongoose');

// User's Infinity Item Collection Schema
const UserInfinityItemSchema = new mongoose.Schema({
    // User reference
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        index: true 
    },
    
    // Item reference
    itemId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'InfinityItem', 
        required: true, 
        index: true 
    },
    
    // Unique instance identifier
    instanceId: { type: String, required: true, unique: true, index: true },
    
    // Acquisition details
    acquiredAt: { type: Date, default: Date.now, required: true },
    acquiredFrom: { 
        type: String, 
        enum: ['purchase', 'craft', 'gift', 'trade', 'drop', 'quest_reward', 'achievement'],
        default: 'purchase' 
    },
    acquisitionCost: {
        currency: { type: String, enum: ['AIBA', 'NEUR', 'STARS', 'DIAMONDS', 'TON'] },
        amount: { type: Number, default: 0 }
    },
    
    // Item condition and quality
    condition: {
        quality: { type: String, enum: ['pristine', 'excellent', 'good', 'fair', 'poor'], default: 'pristine' },
        durability: { type: Number, default: 100, min: 0, max: 100 },
        wear: { type: Number, default: 0, min: 0, max: 100 },
        lastRepairedAt: { type: Date, default: null }
    },
    
    // Usage tracking
    usage: {
        totalUses: { type: Number, default: 0 },
        remainingUses: { type: Number, default: -1 }, // -1 = unlimited
        lastUsedAt: { type: Date, default: null },
        timesUsed: [{
            usedAt: { type: Date, default: Date.now },
            context: { type: String, default: '' }, // battle, profile, trade, etc.
            effect: { type: String, default: '' }
        }]
    },
    
    // Equipping and display
    equip: {
        isEquipped: { type: Boolean, default: false },
        equippedSlot: { type: String, default: '' }, // avatar, frame, background, etc.
        equippedAt: { type: Date, default: null },
        autoEquip: { type: Boolean, default: false }
    },
    
    // Display preferences
    display: {
        isFavorite: { type: Boolean, default: false },
        isHidden: { type: Boolean, default: false },
        displayOrder: { type: Number, default: 0 },
        showInProfile: { type: Boolean, default: true },
        showInInventory: { type: Boolean, default: true }
    },
    
    // Customization and personalization
    customization: {
        customName: { type: String, default: '', trim: true },
        customDescription: { type: String, default: '', trim: true },
        colorOverrides: [{
            property: { type: String }, // primary, secondary, accent
            color: { type: String }
        }],
        effectIntensity: { type: Number, default: 1.0, min: 0.1, max: 2.0 },
        personalNote: { type: String, default: '', trim: true }
    },
    
    // Trading and marketplace
    trading: {
        isTradable: { type: Boolean, default: false },
        isListed: { type: Boolean, default: false },
        listingPrice: {
            currency: { type: String, enum: ['AIBA', 'NEUR', 'STARS', 'DIAMONDS', 'TON'] },
            amount: { type: Number, default: 0 }
        },
        listingExpiresAt: { type: Date, default: null },
        tradeHistory: [{
            type: { type: String, enum: ['listed', 'sold', 'gifted', 'traded'] },
            price: { type: Number, default: 0 },
            to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            at: { type: Date, default: Date.now }
        }]
    },
    
    // Gifting
    gifting: {
        isGifted: { type: Boolean, default: false },
        giftedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        giftedAt: { type: Date, default: null },
        giftMessage: { type: String, default: '', trim: true },
        isWrapped: { type: Boolean, default: false }
    },
    
    // Blockchain/NFT details
    blockchain: {
        isNFT: { type: Boolean, default: false },
        contractAddress: { type: String, default: '' },
        tokenId: { type: String, default: '' },
        owner: { type: String, default: '' },
        metadataUri: { type: String, default: '' },
        transferHistory: [{
            from: { type: String },
            to: { type: String },
            at: { type: Date, default: Date.now },
            transactionHash: { type: String }
        }]
    },
    
    // Expiration and time-based features
    expiration: {
        isExpirable: { type: Boolean, default: false },
        expiresAt: { type: Date, default: null },
        gracePeriod: { type: Number, default: 0 }, // Days
        expirationNotified: { type: Boolean, default: false },
        autoRenew: { type: Boolean, default: false }
    },
    
    // Cooldowns and restrictions
    restrictions: {
        cooldownUntil: { type: Date, default: null },
        levelRequirement: { type: Number, default: 1 },
        badgeRequirements: [String],
        regionLock: { type: String, default: '' }
    },
    
    // Status
    status: { 
        type: String, 
        enum: ['active', 'inactive', 'expired', 'broken', 'traded', 'consumed'], 
        default: 'active',
        index: true 
    },
    
    // Special properties and enchantments
    enchantments: [{
        type: { type: String, enum: ['bonus', 'effect', 'protection', 'enhancement'] },
        value: { type: Number, default: 0 },
        duration: { type: Number, default: 0 }, // 0 = permanent
        isActive: { type: Boolean, default: true },
        appliedAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true,
    collection: 'user_infinity_items'
});

// Compound indexes for performance
UserInfinityItemSchema.index({ userId: 1, acquiredAt: -1 });
UserInfinityItemSchema.index({ userId: 1, status: 1 });
UserInfinityItemSchema.index({ itemId: 1, 'blockchain.isNFT': 1 });
UserInfinityItemSchema.index({ 'equip.isEquipped': 1, 'equip.equippedSlot': 1 });
UserInfinityItemSchema.index({ 'trading.isListed': 1, 'trading.listingExpiresAt': 1 });

module.exports = mongoose.model('UserInfinityItem', UserInfinityItemSchema);
