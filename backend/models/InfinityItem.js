const mongoose = require('mongoose');

// Infinity Items Schema (Collectible items beyond badges)
const InfinityItemSchema = new mongoose.Schema({
    // Core identification
    itemId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    
    // Item categorization
    category: { 
        type: String, 
        required: true, 
        enum: ['avatar', 'profile_frame', 'background', 'effect', 'tool', 'consumable', 'decoration', 'special'],
        index: true 
    },
    
    // Item type and functionality
    itemType: { 
        type: String, 
        required: true, 
        enum: ['cosmetic', 'functional', 'boost', 'access_key', 'currency', 'material'],
        index: true 
    },
    
    // Visual design
    appearance: {
        icon: { type: String, required: true }, // URL or emoji
        preview: { type: String, default: '' }, // Preview image URL
        thumbnail: { type: String, default: '' }, // Thumbnail URL
        animated: { type: Boolean, default: false },
        colorScheme: {
            primary: { type: String, default: '#1a1a2e' },
            secondary: { type: String, default: '#00d4ff' },
            accent: { type: String, default: '#ff6b6b' }
        },
        visualEffects: [{
            type: { type: String, enum: ['glow', 'pulse', 'sparkle', 'wave', 'particle', 'gradient'] },
            intensity: { type: Number, default: 1.0, min: 0.1, max: 2.0 },
            color: { type: String, default: '#ffffff' },
            duration: { type: Number, default: 1000 } // milliseconds
        }]
    },
    
    // Rarity and value
    rarity: { 
        type: String, 
        required: true, 
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'infinity'],
        index: true 
    },
    
    // Acquisition methods
    acquisition: {
        methods: [{
            type: { type: String, enum: ['purchase', 'achievement', 'craft', 'trade', 'gift', 'drop', 'quest_reward'] },
            requirements: {
                currency: { type: String, enum: ['AIBA', 'NEUR', 'STARS', 'DIAMONDS', 'TON'] },
                amount: { type: Number, default: 0 },
                level: { type: Number, default: 1 },
                badges: [String],
                achievements: [String]
            },
            availability: { type: String, enum: ['always', 'limited', 'seasonal', 'event'], default: 'always' }
        }],
        dropRate: { type: Number, default: 0 }, // 0-1 probability
        maxSupply: { type: Number, default: -1 }, // -1 = unlimited
        currentSupply: { type: Number, default: 0 }
    },
    
    // Item functionality and effects
    effects: [{
        type: { type: String, enum: ['stat_boost', 'visual_effect', 'access_grant', 'currency_bonus', 'xp_multiplier'] },
        target: { type: String, enum: ['user', 'broker', 'battle', 'profile', 'leaderboard'] },
        value: { type: Number, default: 0 },
        duration: { type: Number, default: 0 }, // 0 = permanent, milliseconds for temporary
        conditions: [String], // Conditions for effect to activate
        isActive: { type: Boolean, default: true }
    }],
    
    // Usage and consumption
    usage: {
        isConsumable: { type: Boolean, default: false },
        maxUses: { type: Number, default: -1 }, // -1 = unlimited
        cooldown: { type: Number, default: 0 }, // milliseconds
        autoConsume: { type: Boolean, default: false },
        consumeOnUse: { type: Boolean, default: false }
    },
    
    // Trading and marketplace
    trading: {
        isTradable: { type: Boolean, default: false },
        isGiftable: { type: Boolean, default: true },
        minTradeLevel: { type: Number, default: 1 },
        tradeFee: { type: Number, default: 0 }, // Percentage
        marketplace: {
            isListable: { type: Boolean, default: false },
            minPrice: { type: Number, default: 0 },
            maxPrice: { type: Number, default: 0 },
            priceHistory: [{
                price: { type: Number },
                date: { type: Date, default: Date.now },
                seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
            }]
        }
    },
    
    // Crafting and recipes
    crafting: {
        isCraftable: { type: Boolean, default: false },
        recipe: {
            materials: [{
                itemId: { type: String },
                quantity: { type: Number, default: 1 },
                rarity: { type: String }
            }],
            skillLevel: { type: Number, default: 1 },
            craftingTime: { type: Number, default: 0 }, // milliseconds
            successRate: { type: Number, default: 1.0 }
        }
    },
    
    // Blockchain/NFT integration
    blockchain: {
        isNFT: { type: Boolean, default: false },
        contractAddress: { type: String, default: '' },
        metadata: {
            name: { type: String, default: '' },
            description: { type: String, default: '' },
            image: { type: String, default: '' },
            animation_url: { type: String, default: '' },
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
        recurring: { type: Boolean, default: false },
        event: { type: String, default: '' }
    },
    
    // Status and availability
    status: { 
        type: String, 
        enum: ['active', 'inactive', 'hidden', 'deprecated', 'coming_soon', 'retired'], 
        default: 'active',
        index: true 
    },
    
    // Statistics and analytics
    stats: {
        totalOwned: { type: Number, default: 0 },
        totalUsed: { type: Number, default: 0 },
        totalTraded: { type: Number, default: 0 },
        totalCrafted: { type: Number, default: 0 },
        averageOwnershipDuration: { type: Number, default: 0 }, // Days
        popularityScore: { type: Number, default: 0 }
    },
    
    // Metadata
    tags: [String],
    version: { type: String, default: '1.0.0' },
    createdBy: { type: String, default: 'system' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    collection: 'infinity_items'
});

// Indexes for performance
InfinityItemSchema.index({ category: 1, rarity: 1 });
InfinityItemSchema.index({ itemType: 1, status: 1 });
InfinityItemSchema.index({ 'acquisition.methods.type': 1 });
InfinityItemSchema.index({ 'blockchain.isNFT': 1 });
InfinityItemSchema.index({ 'trading.marketplace.isListable': 1 });

module.exports = mongoose.model('InfinityItem', InfinityItemSchema);
