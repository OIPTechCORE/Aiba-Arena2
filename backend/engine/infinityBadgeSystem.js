const InfinityBadge = require('../models/InfinityBadge');
const UserInfinityBadge = require('../models/UserInfinityBadge');
const InfinityItem = require('../models/InfinityItem');
const UserInfinityItem = require('../models/UserInfinityItem');
const User = require('../models/User');
const logger = require('../utils/logger');

class InfinityBadgeSystem {
    constructor() {
        this.badgeCategories = ['leadership', 'organizer', 'rank', 'profile', 'achievement', 'item'];
        this.rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'infinity'];
        this.visualEffects = ['glow', 'pulse', 'sparkle', 'wave', 'particle', 'gradient'];
    }

    // Initialize the Infinity Badge System
    async initialize() {
        try {
            logger.info('Initializing Infinity Badge System...');
            
            // Create default badges if they don't exist
            await this.createDefaultBadges();
            await this.createDefaultItems();
            
            logger.info('Infinity Badge System initialized successfully');
            return { success: true, message: 'Infinity Badge System initialized' };
        } catch (error) {
            logger.error('Error initializing Infinity Badge System:', error);
            throw error;
        }
    }

    // Create default badges for the system
    async createDefaultBadges() {
        const defaultBadges = [
            // Leadership Badges
            {
                badgeId: 'leadership_pioneer',
                name: 'Leadership Pioneer',
                description: 'First to lead a guild to victory',
                category: 'leadership',
                icon: '👑',
                rarity: 'legendary',
                visualEffects: {
                    glow: true,
                    animated: true,
                    particleEffect: 'sparkle',
                    backgroundColor: '#FFD700',
                    borderColor: '#FF6B6B'
                },
                requirements: {
                    type: 'achievement',
                    conditions: [{
                        type: 'custom',
                        value: 'guild_leadership_first_victory',
                        operator: '='
                    }],
                    autoUnlock: true
                },
                rewards: {
                    aibaReward: 1000,
                    neurReward: 500,
                    xpBonus: 100,
                    multiplier: 1.5,
                    exclusiveAccess: ['guild_leader_lounge', 'priority_battles']
                }
            },
            {
                badgeId: 'leadership_visionary',
                name: 'Leadership Visionary',
                description: 'Achieved 100% guild participation rate',
                category: 'leadership',
                icon: '🔮',
                rarity: 'mythic',
                visualEffects: {
                    glow: true,
                    animated: true,
                    particleEffect: 'wave',
                    backgroundColor: '#9B59B6',
                    borderColor: '#E74C3C'
                },
                requirements: {
                    type: 'achievement',
                    conditions: [{
                        type: 'custom',
                        value: 'guild_100_percent_participation',
                        operator: '='
                    }],
                    autoUnlock: true
                },
                rewards: {
                    aibaReward: 2000,
                    neurReward: 1000,
                    diamondReward: 5,
                    multiplier: 2.0,
                    exclusiveAccess: ['visionary_council', 'special_events']
                }
            },
            
            // Organizer Badges
            {
                badgeId: 'organizer_master',
                name: 'Master Organizer',
                description: 'Successfully organized 10 tournaments',
                category: 'organizer',
                icon: '📋',
                rarity: 'epic',
                visualEffects: {
                    glow: true,
                    particleEffect: 'pulse',
                    backgroundColor: '#3498DB',
                    borderColor: '#2ECC71'
                },
                requirements: {
                    type: 'achievement',
                    conditions: [{
                        type: 'custom',
                        value: 'tournaments_organized',
                        operator: '>='
                    }],
                    autoUnlock: true
                },
                rewards: {
                    aibaReward: 750,
                    neurReward: 300,
                    xpBonus: 75,
                    exclusiveAccess: ['organizer_tools', 'tournament_insights']
                }
            },
            {
                badgeId: 'organizer_community',
                name: 'Community Builder',
                description: 'Brought 50+ active members to the community',
                category: 'organizer',
                icon: '🤝',
                rarity: 'rare',
                visualEffects: {
                    glow: true,
                    backgroundColor: '#E67E22',
                    borderColor: '#F39C12'
                },
                requirements: {
                    type: 'referrals',
                    conditions: [{
                        type: 'referrals',
                        value: 50,
                        operator: '>='
                    }],
                    autoUnlock: true
                },
                rewards: {
                    aibaReward: 500,
                    neurReward: 200,
                    xpBonus: 50,
                    profileBoost: 7
                }
            },
            
            // Rank Badges
            {
                badgeId: 'rank_bronze',
                name: 'Bronze Rank',
                description: 'Achieved Bronze rank in the arena',
                category: 'rank',
                icon: '🥉',
                rarity: 'common',
                visualEffects: {
                    backgroundColor: '#CD7F32',
                    borderColor: '#8B4513'
                },
                requirements: {
                    type: 'level',
                    conditions: [{
                        type: 'level',
                        value: 10,
                        operator: '>='
                    }],
                    autoUnlock: true
                },
                rewards: {
                    aibaReward: 100,
                    xpBonus: 10
                }
            },
            {
                badgeId: 'rank_silver',
                name: 'Silver Rank',
                description: 'Achieved Silver rank in the arena',
                category: 'rank',
                icon: '🥈',
                rarity: 'uncommon',
                visualEffects: {
                    glow: true,
                    backgroundColor: '#C0C0C0',
                    borderColor: '#808080'
                },
                requirements: {
                    type: 'level',
                    conditions: [{
                        type: 'level',
                        value: 25,
                        operator: '>='
                    }],
                    autoUnlock: true
                },
                rewards: {
                    aibaReward: 250,
                    neurReward: 100,
                    xpBonus: 25
                }
            },
            {
                badgeId: 'rank_gold',
                name: 'Gold Rank',
                description: 'Achieved Gold rank in the arena',
                category: 'rank',
                icon: '🥇',
                rarity: 'rare',
                visualEffects: {
                    glow: true,
                    particleEffect: 'sparkle',
                    backgroundColor: '#FFD700',
                    borderColor: '#FFA500'
                },
                requirements: {
                    type: 'level',
                    conditions: [{
                        type: 'level',
                        value: 50,
                        operator: '>='
                    }],
                    autoUnlock: true
                },
                rewards: {
                    aibaReward: 500,
                    neurReward: 250,
                    starsReward: 10,
                    xpBonus: 50
                }
            },
            {
                badgeId: 'rank_diamond',
                name: 'Diamond Rank',
                description: 'Achieved Diamond rank in the arena',
                category: 'rank',
                icon: '💎',
                rarity: 'epic',
                visualEffects: {
                    glow: true,
                    animated: true,
                    particleEffect: 'pulse',
                    backgroundColor: '#B9F2FF',
                    borderColor: '#00CED1'
                },
                requirements: {
                    type: 'level',
                    conditions: [{
                        type: 'level',
                        value: 100,
                        operator: '>='
                    }],
                    autoUnlock: true
                },
                rewards: {
                    aibaReward: 1000,
                    neurReward: 500,
                    diamondReward: 3,
                    xpBonus: 100,
                    multiplier: 1.25
                }
            },
            {
                badgeId: 'rank_infinity',
                name: 'Infinity Rank',
                description: 'Achieved the legendary Infinity rank',
                category: 'rank',
                icon: '♾️',
                rarity: 'infinity',
                visualEffects: {
                    glow: true,
                    animated: true,
                    particleEffect: 'wave',
                    backgroundColor: '#1a1a2e',
                    borderColor: '#00d4ff',
                    gradient: 'linear-gradient(45deg, #1a1a2e, #00d4ff, #ff6b6b)'
                },
                requirements: {
                    type: 'level',
                    conditions: [{
                        type: 'level',
                        value: 200,
                        operator: '>='
                    }],
                    autoUnlock: true
                },
                rewards: {
                    aibaReward: 5000,
                    neurReward: 2500,
                    diamondReward: 10,
                    xpBonus: 500,
                    multiplier: 2.0,
                    exclusiveAccess: ['infinity_lounge', 'special_tournaments', 'early_access']
                }
            },
            
            // Profile Badges
            {
                badgeId: 'profile_verified',
                name: 'Verified Profile',
                description: 'Profile is verified and authentic',
                category: 'profile',
                icon: '✅',
                rarity: 'uncommon',
                visualEffects: {
                    glow: true,
                    backgroundColor: '#2ECC71',
                    borderColor: '#27AE60'
                },
                requirements: {
                    type: 'manual',
                    conditions: [{
                        type: 'custom',
                        value: 'profile_verification',
                        operator: '='
                    }],
                    autoUnlock: false
                },
                rewards: {
                    profileBoost: 30,
                    exclusiveAccess: ['verified_features']
                }
            },
            {
                badgeId: 'profile_early_adopter',
                name: 'Early Adopter',
                description: 'Joined during the first month of launch',
                category: 'profile',
                icon: '🌟',
                rarity: 'rare',
                visualEffects: {
                    glow: true,
                    particleEffect: 'sparkle',
                    backgroundColor: '#F39C12',
                    borderColor: '#E67E22'
                },
                requirements: {
                    type: 'date',
                    conditions: [{
                        type: 'date',
                        value: '2024-02-24',
                        operator: '<='
                    }],
                    autoUnlock: true
                },
                rewards: {
                    aibaReward: 300,
                    neurReward: 150,
                    xpBonus: 30,
                    profileBoost: 15
                }
            },
            {
                badgeId: 'profile_influencer',
                name: 'Community Influencer',
                description: 'Top 1% most influential community member',
                category: 'profile',
                icon: '🎯',
                rarity: 'legendary',
                visualEffects: {
                    glow: true,
                    animated: true,
                    particleEffect: 'pulse',
                    backgroundColor: '#E74C3C',
                    borderColor: '#C0392B'
                },
                requirements: {
                    type: 'custom',
                    conditions: [{
                        type: 'custom',
                        value: 'top_1_percent_influence',
                        operator: '='
                    }],
                    autoUnlock: true
                },
                rewards: {
                    aibaReward: 1500,
                    neurReward: 750,
                    diamondReward: 2,
                    xpBonus: 150,
                    multiplier: 1.75,
                    exclusiveAccess: ['influencer_program', 'exclusive_content']
                }
            },
            
            // Achievement Badges
            {
                badgeId: 'achievement_first_battle',
                name: 'First Battle',
                description: 'Completed your first battle',
                category: 'achievement',
                icon: '⚔️',
                rarity: 'common',
                visualEffects: {
                    backgroundColor: '#95A5A6',
                    borderColor: '#7F8C8D'
                },
                requirements: {
                    type: 'battles',
                    conditions: [{
                        type: 'battles',
                        value: 1,
                        operator: '>='
                    }],
                    autoUnlock: true
                },
                rewards: {
                    aibaReward: 50,
                    xpBonus: 5
                }
            },
            {
                badgeId: 'achievement_veteran',
                name: 'Battle Veteran',
                description: 'Completed 100 battles',
                category: 'achievement',
                icon: '🛡️',
                rarity: 'uncommon',
                visualEffects: {
                    glow: true,
                    backgroundColor: '#34495E',
                    borderColor: '#2C3E50'
                },
                requirements: {
                    type: 'battles',
                    conditions: [{
                        type: 'battles',
                        value: 100,
                        operator: '>='
                    }],
                    autoUnlock: true
                },
                rewards: {
                    aibaReward: 300,
                    neurReward: 150,
                    xpBonus: 30
                }
            },
            {
                badgeId: 'achievement_champion',
                name: 'Arena Champion',
                description: 'Won 50 battles',
                category: 'achievement',
                icon: '🏆',
                rarity: 'rare',
                visualEffects: {
                    glow: true,
                    particleEffect: 'sparkle',
                    backgroundColor: '#F1C40F',
                    borderColor: '#F39C12'
                },
                requirements: {
                    type: 'wins',
                    conditions: [{
                        type: 'wins',
                        value: 50,
                        operator: '>='
                    }],
                    autoUnlock: true
                },
                rewards: {
                    aibaReward: 500,
                    neurReward: 250,
                    starsReward: 5,
                    xpBonus: 50
                }
            },
            {
                badgeId: 'achievement_undefeated',
                name: 'Undefeated',
                description: 'Achieved a 10-battle win streak',
                category: 'achievement',
                icon: '🔥',
                rarity: 'epic',
                visualEffects: {
                    glow: true,
                    animated: true,
                    particleEffect: 'pulse',
                    backgroundColor: '#E74C3C',
                    borderColor: '#C0392B'
                },
                requirements: {
                    type: 'streak',
                    conditions: [{
                        type: 'streak',
                        value: 10,
                        operator: '>='
                    }],
                    autoUnlock: true
                },
                rewards: {
                    aibaReward: 750,
                    neurReward: 375,
                    diamondReward: 1,
                    xpBonus: 75,
                    multiplier: 1.5
                }
            },
            {
                badgeId: 'achievement_legend',
                name: 'Living Legend',
                description: 'Achieved a 50-battle win streak',
                category: 'achievement',
                icon: '👑',
                rarity: 'mythic',
                visualEffects: {
                    glow: true,
                    animated: true,
                    particleEffect: 'wave',
                    backgroundColor: '#9B59B6',
                    borderColor: '#8E44AD'
                },
                requirements: {
                    type: 'streak',
                    conditions: [{
                        type: 'streak',
                        value: 50,
                        operator: '>='
                    }],
                    autoUnlock: true
                },
                rewards: {
                    aibaReward: 2000,
                    neurReward: 1000,
                    diamondReward: 5,
                    xpBonus: 200,
                    multiplier: 2.0,
                    exclusiveAccess: ['legend_hall', 'special_recognition']
                }
            }
        ];

        for (const badgeData of defaultBadges) {
            const existingBadge = await InfinityBadge.findOne({ badgeId: badgeData.badgeId });
            if (!existingBadge) {
                const badge = new InfinityBadge(badgeData);
                await badge.save();
                logger.info(`Created default badge: ${badgeData.name}`);
            }
        }
    }

    // Create default items for the system
    async createDefaultItems() {
        const defaultItems = [
            // Avatar Items
            {
                itemId: 'avatar_golden_frame',
                name: 'Golden Avatar Frame',
                description: 'A luxurious golden frame for your avatar',
                category: 'avatar',
                itemType: 'cosmetic',
                appearance: {
                    icon: '🖼️',
                    preview: '/items/frames/golden_frame.png',
                    animated: true,
                    colorScheme: {
                        primary: '#FFD700',
                        secondary: '#FFA500',
                        accent: '#FF6347'
                    },
                    visualEffects: [{
                        type: 'glow',
                        intensity: 1.5,
                        color: '#FFD700',
                        duration: 2000
                    }]
                },
                rarity: 'rare',
                acquisition: {
                    methods: [{
                        type: 'purchase',
                        requirements: {
                            currency: 'AIBA',
                            amount: 500
                        }
                    }]
                },
                effects: [{
                    type: 'visual_effect',
                    target: 'profile',
                    value: 1.0,
                    duration: 0
                }]
            },
            {
                itemId: 'avatar_diamond_crown',
                name: 'Diamond Crown',
                description: 'A sparkling diamond crown for your avatar',
                category: 'avatar',
                itemType: 'cosmetic',
                appearance: {
                    icon: '👑',
                    preview: '/items/avatars/diamond_crown.png',
                    animated: true,
                    colorScheme: {
                        primary: '#B9F2FF',
                        secondary: '#00CED1',
                        accent: '#FFFFFF'
                    },
                    visualEffects: [{
                        type: 'sparkle',
                        intensity: 2.0,
                        color: '#FFFFFF',
                        duration: 1500
                    }]
                },
                rarity: 'legendary',
                acquisition: {
                    methods: [{
                        type: 'purchase',
                        requirements: {
                            currency: 'DIAMONDS',
                            amount: 5
                        }
                    }]
                },
                effects: [{
                    type: 'stat_boost',
                    target: 'user',
                    value: 1.1,
                    duration: 0
                }]
            },
            
            // Profile Backgrounds
            {
                itemId: 'bg_cosmic_nebula',
                name: 'Cosmic Nebula Background',
                description: 'A stunning cosmic nebula background',
                category: 'background',
                itemType: 'cosmetic',
                appearance: {
                    icon: '🌌',
                    preview: '/items/backgrounds/cosmic_nebula.png',
                    animated: true,
                    colorScheme: {
                        primary: '#1a1a2e',
                        secondary: '#00d4ff',
                        accent: '#ff6b6b'
                    },
                    visualEffects: [{
                        type: 'particle',
                        intensity: 1.0,
                        color: '#00d4ff',
                        duration: 3000
                    }]
                },
                rarity: 'epic',
                acquisition: {
                    methods: [{
                        type: 'purchase',
                        requirements: {
                            currency: 'NEUR',
                            amount: 300
                        }
                    }]
                }
            },
            {
                itemId: 'bg_infinity_void',
                name: 'Infinity Void Background',
                description: 'The mysterious infinity void background',
                category: 'background',
                itemType: 'cosmetic',
                appearance: {
                    icon: '⚫',
                    preview: '/items/backgrounds/infinity_void.png',
                    animated: true,
                    colorScheme: {
                        primary: '#000000',
                        secondary: '#4B0082',
                        accent: '#00FFFF'
                    },
                    visualEffects: [{
                        type: 'wave',
                        intensity: 1.5,
                        color: '#4B0082',
                        duration: 4000
                    }]
                },
                rarity: 'mythic',
                acquisition: {
                    methods: [{
                        type: 'achievement',
                        requirements: {
                            badges: ['rank_infinity']
                        }
                    }]
                }
            },
            
            // Profile Frames
            {
                itemId: 'frame_neon_blue',
                name: 'Neon Blue Frame',
                description: 'A futuristic neon blue profile frame',
                category: 'profile_frame',
                itemType: 'cosmetic',
                appearance: {
                    icon: '🔷',
                    preview: '/items/frames/neon_blue.png',
                    animated: true,
                    colorScheme: {
                        primary: '#00FFFF',
                        secondary: '#0080FF',
                        accent: '#FFFFFF'
                    },
                    visualEffects: [{
                        type: 'pulse',
                        intensity: 1.2,
                        color: '#00FFFF',
                        duration: 1000
                    }]
                },
                rarity: 'uncommon',
                acquisition: {
                    methods: [{
                        type: 'purchase',
                        requirements: {
                            currency: 'AIBA',
                            amount: 200
                        }
                    }]
                }
            },
            {
                itemId: 'frame_infinity_edge',
                name: 'Infinity Edge Frame',
                description: 'The legendary infinity edge frame',
                category: 'profile_frame',
                itemType: 'cosmetic',
                appearance: {
                    icon: '♾️',
                    preview: '/items/frames/infinity_edge.png',
                    animated: true,
                    colorScheme: {
                        primary: '#1a1a2e',
                        secondary: '#00d4ff',
                        accent: '#ff6b6b'
                    },
                    visualEffects: [{
                        type: 'gradient',
                        intensity: 2.0,
                        color: '#00d4ff',
                        duration: 2500
                    }]
                },
                rarity: 'infinity',
                acquisition: {
                    methods: [{
                        type: 'achievement',
                        requirements: {
                            badges: ['achievement_legend']
                        }
                    }]
                }
            },
            
            // Special Effects
            {
                itemId: 'effect_rainbow_trail',
                name: 'Rainbow Trail Effect',
                description: 'A beautiful rainbow trail effect',
                category: 'effect',
                itemType: 'cosmetic',
                appearance: {
                    icon: '🌈',
                    preview: '/items/effects/rainbow_trail.gif',
                    animated: true,
                    colorScheme: {
                        primary: '#FF0000',
                        secondary: '#00FF00',
                        accent: '#0000FF'
                    },
                    visualEffects: [{
                        type: 'gradient',
                        intensity: 1.8,
                        color: '#FF0000',
                        duration: 2000
                    }]
                },
                rarity: 'rare',
                acquisition: {
                    methods: [{
                        type: 'purchase',
                        requirements: {
                            currency: 'STARS',
                            amount: 50
                        }
                    }]
                },
                usage: {
                    isConsumable: false,
                    maxUses: -1
                }
            },
            {
                itemId: 'effect_phoenix_aura',
                name: 'Phoenix Aura',
                description: 'A mystical phoenix aura effect',
                category: 'effect',
                itemType: 'cosmetic',
                appearance: {
                    icon: '🔥',
                    preview: '/items/effects/phoenix_aura.gif',
                    animated: true,
                    colorScheme: {
                        primary: '#FF6347',
                        secondary: '#FFD700',
                        accent: '#FF4500'
                    },
                    visualEffects: [{
                        type: 'particle',
                        intensity: 2.5,
                        color: '#FF6347',
                        duration: 3000
                    }]
                },
                rarity: 'legendary',
                acquisition: {
                    methods: [{
                        type: 'achievement',
                        requirements: {
                            badges: ['achievement_undefeated']
                        }
                    }]
                }
            },
            
            // Functional Items
            {
                itemId: 'boost_xp_doubler',
                name: 'XP Doubler',
                description: 'Double your XP gains for 24 hours',
                category: 'tool',
                itemType: 'boost',
                appearance: {
                    icon: '⚡',
                    preview: '/items/tools/xp_doubler.png',
                    animated: true,
                    colorScheme: {
                        primary: '#FFD700',
                        secondary: '#FFA500',
                        accent: '#FF6347'
                    },
                    visualEffects: [{
                        type: 'pulse',
                        intensity: 1.5,
                        color: '#FFD700',
                        duration: 500
                    }]
                },
                rarity: 'uncommon',
                acquisition: {
                    methods: [{
                        type: 'purchase',
                        requirements: {
                            currency: 'AIBA',
                            amount: 150
                        }
                    }]
                },
                effects: [{
                    type: 'xp_multiplier',
                    target: 'user',
                    value: 2.0,
                    duration: 86400000 // 24 hours
                }],
                usage: {
                    isConsumable: true,
                    maxUses: 1,
                    cooldown: 0
                }
            },
            {
                itemId: 'boost_lucky_charm',
                name: 'Lucky Charm',
                description: 'Increases your luck in battles for 1 hour',
                category: 'tool',
                itemType: 'boost',
                appearance: {
                    icon: '🍀',
                    preview: '/items/tools/lucky_charm.png',
                    animated: true,
                    colorScheme: {
                        primary: '#2ECC71',
                        secondary: '#27AE60',
                        accent: '#F39C12'
                    },
                    visualEffects: [{
                        type: 'sparkle',
                        intensity: 1.0,
                        color: '#2ECC71',
                        duration: 1000
                    }]
                },
                rarity: 'rare',
                acquisition: {
                    methods: [{
                        type: 'purchase',
                        requirements: {
                            currency: 'NEUR',
                            amount: 100
                        }
                    }]
                },
                effects: [{
                    type: 'stat_boost',
                    target: 'battle',
                    value: 1.15,
                    duration: 3600000 // 1 hour
                }],
                usage: {
                    isConsumable: true,
                    maxUses: 1,
                    cooldown: 1800000 // 30 minutes
                }
            }
        ];

        for (const itemData of defaultItems) {
            const existingItem = await InfinityItem.findOne({ itemId: itemData.itemId });
            if (!existingItem) {
                const item = new InfinityItem(itemData);
                await item.save();
                logger.info(`Created default item: ${itemData.name}`);
            }
        }
    }

    // Award a badge to a user
    async awardBadge(userId, badgeId, source = 'achievement') {
        try {
            const user = await User.findById(userId);
            const badge = await InfinityBadge.findOne({ badgeId });
            
            if (!user || !badge) {
                throw new Error('User or badge not found');
            }

            // Check if user already has this badge
            const existingBadge = await UserInfinityBadge.findOne({ 
                userId, 
                badgeId: badge._id,
                status: 'active' 
            });

            if (existingBadge) {
                return { success: false, message: 'User already has this badge' };
            }

            // Create user badge record
            const userBadge = new UserInfinityBadge({
                userId,
                badgeId: badge._id,
                earnedFrom: source,
                progress: {
                    current: 1,
                    max: 1,
                    percentage: 100
                }
            });

            await userBadge.save();

            // Apply badge rewards
            await this.applyBadgeRewards(user, badge);

            // Update badge statistics
            await this.updateBadgeStats(badge._id);

            logger.info(`Awarded badge ${badge.name} to user ${user.telegramId}`);
            
            return { 
                success: true, 
                message: `Badge ${badge.name} awarded successfully`,
                badge: userBadge
            };
        } catch (error) {
            logger.error('Error awarding badge:', error);
            throw error;
        }
    }

    // Apply badge rewards to user
    async applyBadgeRewards(user, badge) {
        try {
            const rewards = badge.rewards;
            
            // Apply currency rewards
            if (rewards.aibaReward > 0) {
                user.aibaBalance += rewards.aibaReward;
            }
            if (rewards.neurReward > 0) {
                user.neurBalance += rewards.neurReward;
            }
            if (rewards.starsReward > 0) {
                user.starsBalance += rewards.starsReward;
            }
            if (rewards.diamondReward > 0) {
                user.diamondsBalance += rewards.diamondReward;
            }

            // Apply profile boost
            if (rewards.profileBoost > 0) {
                const boostUntil = new Date();
                boostUntil.setDate(boostUntil.getDate() + rewards.profileBoost);
                user.profileBoostedUntil = boostUntil;
            }

            // Add badge to user's badges array
            if (!user.badges.includes(badge.badgeId)) {
                user.badges.push(badge.badgeId);
            }

            await user.save();
            
            logger.info(`Applied rewards for badge ${badge.name} to user ${user.telegramId}`);
        } catch (error) {
            logger.error('Error applying badge rewards:', error);
            throw error;
        }
    }

    // Update badge statistics
    async updateBadgeStats(badgeId) {
        try {
            const badge = await InfinityBadge.findById(badgeId);
            const totalEarned = await UserInfinityBadge.countDocuments({ 
                badgeId, 
                status: 'active' 
            });
            const currentlyHeld = await UserInfinityBadge.countDocuments({ 
                badgeId, 
                status: 'active' 
            });

            badge.stats.totalEarned = totalEarned;
            badge.stats.currentlyHeld = currentlyHeld;
            badge.updatedAt = new Date();

            await badge.save();
        } catch (error) {
            logger.error('Error updating badge stats:', error);
        }
    }

    // Check and unlock badges for user based on criteria
    async checkAndUnlockBadges(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const unlockedBadges = [];
            const availableBadges = await InfinityBadge.find({ 
                status: 'active',
                'requirements.autoUnlock': true 
            });

            for (const badge of availableBadges) {
                // Check if user already has this badge
                const hasBadge = await UserInfinityBadge.findOne({ 
                    userId, 
                    badgeId: badge._id,
                    status: 'active' 
                });

                if (hasBadge) continue;

                // Check if user meets requirements
                const meetsRequirements = await this.checkBadgeRequirements(user, badge);
                
                if (meetsRequirements) {
                    const result = await this.awardBadge(userId, badge.badgeId);
                    if (result.success) {
                        unlockedBadges.push(badge);
                    }
                }
            }

            return { success: true, unlockedBadges };
        } catch (error) {
            logger.error('Error checking and unlocking badges:', error);
            throw error;
        }
    }

    // Check if user meets badge requirements
    async checkBadgeRequirements(user, badge) {
        try {
            const requirements = badge.requirements.conditions;
            
            for (const condition of requirements) {
                let meetsCondition = false;

                switch (condition.type) {
                    case 'level':
                        // This would need to be implemented based on user level system
                        meetsCondition = true; // Placeholder
                        break;
                    
                    case 'battles':
                        meetsCondition = await this.checkUserBattleCount(user._id, condition.value, condition.operator);
                        break;
                    
                    case 'wins':
                        meetsCondition = await this.checkUserWinCount(user._id, condition.value, condition.operator);
                        break;
                    
                    case 'streak':
                        meetsCondition = user.battleWinStreak >= condition.value;
                        break;
                    
                    case 'referrals':
                        meetsCondition = await this.checkUserReferralCount(user._id, condition.value, condition.operator);
                        break;
                    
                    case 'date':
                        const userDate = user.createdAt;
                        const compareDate = new Date(condition.value);
                        meetsCondition = this.compareDates(userDate, compareDate, condition.operator);
                        break;
                    
                    case 'custom':
                        meetsCondition = await this.checkCustomRequirement(user._id, condition.value);
                        break;
                    
                    default:
                        meetsCondition = false;
                }

                if (!meetsCondition) {
                    return false;
                }
            }

            return true;
        } catch (error) {
            logger.error('Error checking badge requirements:', error);
            return false;
        }
    }

    // Helper methods for requirement checking
    async checkUserBattleCount(userId, requiredValue, operator) {
        // This would need to be implemented based on your battle tracking system
        return true; // Placeholder
    }

    async checkUserWinCount(userId, requiredValue, operator) {
        // This would need to be implemented based on your battle tracking system
        return true; // Placeholder
    }

    async checkUserReferralCount(userId, requiredValue, operator) {
        // This would need to be implemented based on your referral tracking system
        return true; // Placeholder
    }

    compareDates(date1, date2, operator) {
        switch (operator) {
            case '<=':
                return date1 <= date2;
            case '>=':
                return date1 >= date2;
            case '<':
                return date1 < date2;
            case '>':
                return date1 > date2;
            case '=':
                return date1.getTime() === date2.getTime();
            default:
                return false;
        }
    }

    async checkCustomRequirement(userId, requirement) {
        // This would need to be implemented based on your custom requirements
        return true; // Placeholder
    }

    // Get user's badges
    async getUserBadges(userId, options = {}) {
        try {
            const {
                category,
                rarity,
                status = 'active',
                limit = 50,
                skip = 0,
                sort = { earnedAt: -1 }
            } = options;

            const query = { userId, status };
            
            if (category) {
                query['badgeId.category'] = category;
            }
            
            if (rarity) {
                query['badgeId.rarity'] = rarity;
            }

            const userBadges = await UserInfinityBadge.find(query)
                .populate('badgeId')
                .sort(sort)
                .limit(limit)
                .skip(skip);

            return userBadges;
        } catch (error) {
            logger.error('Error getting user badges:', error);
            throw error;
        }
    }

    // Get available badges for user
    async getAvailableBadges(userId) {
        try {
            const user = await User.findById(userId);
            const userBadgeIds = await UserInfinityBadge.find({ 
                userId, 
                status: 'active' 
            }).distinct('badgeId');

            const availableBadges = await InfinityBadge.find({
                _id: { $nin: userBadgeIds },
                status: 'active'
            });

            // Filter badges based on user eligibility
            const eligibleBadges = [];
            
            for (const badge of availableBadges) {
                const meetsRequirements = await this.checkBadgeRequirements(user, badge);
                if (meetsRequirements) {
                    eligibleBadges.push(badge);
                }
            }

            return eligibleBadges;
        } catch (error) {
            logger.error('Error getting available badges:', error);
            throw error;
        }
    }

    // Get badge statistics
    async getBadgeStats() {
        try {
            const stats = {
                totalBadges: await InfinityBadge.countDocuments({ status: 'active' }),
                totalEarned: await UserInfinityBadge.countDocuments({ status: 'active' }),
                categoryDistribution: {},
                rarityDistribution: {},
                topEarnedBadges: []
            };

            // Category distribution
            const categories = await InfinityBadge.aggregate([
                { $match: { status: 'active' } },
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]);
            
            categories.forEach(cat => {
                stats.categoryDistribution[cat._id] = cat.count;
            });

            // Rarity distribution
            const rarities = await InfinityBadge.aggregate([
                { $match: { status: 'active' } },
                { $group: { _id: '$rarity', count: { $sum: 1 } } }
            ]);
            
            rarities.forEach(rarity => {
                stats.rarityDistribution[rarity._id] = rarity.count;
            });

            // Top earned badges
            const topBadges = await UserInfinityBadge.aggregate([
                { $match: { status: 'active' } },
                { $group: { _id: '$badgeId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
                { $lookup: { from: 'infinity_badges', localField: '_id', foreignField: '_id', as: 'badge' } },
                { $unwind: '$badge' }
            ]);

            stats.topEarnedBadges = topBadges.map(item => ({
                badgeId: item.badge.badgeId,
                name: item.badge.name,
                count: item.count,
                rarity: item.badge.rarity,
                category: item.badge.category
            }));

            return stats;
        } catch (error) {
            logger.error('Error getting badge stats:', error);
            throw error;
        }
    }
}

module.exports = InfinityBadgeSystem;
