const express = require('express');
const router = express.Router();
const InfinityBadgeSystem = require('../engine/infinityBadgeSystem');
const InfinityBadge = require('../models/InfinityBadge');
const UserInfinityBadge = require('../models/UserInfinityBadge');
const InfinityItem = require('../models/InfinityItem');
const UserInfinityItem = require('../models/UserInfinityItem');
const User = require('../models/User');
const logger = require('../utils/logger');

// Middleware for authentication
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        // For now, use Telegram auth (in production, implement proper JWT)
        const user = await User.findOne({ telegramId: '123456789' }); // Placeholder
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        logger.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
};

// Initialize Infinity Badge System
const badgeSystem = new InfinityBadgeSystem();

// GET /api/infinity-badges/initialize - Initialize the system
router.post('/initialize', async (req, res) => {
    try {
        const result = await badgeSystem.initialize();
        res.json(result);
    } catch (error) {
        logger.error('Error initializing Infinity Badge System:', error);
        res.status(500).json({ error: 'Failed to initialize system' });
    }
});

// GET /api/infinity-badges/user - Get user's badges
router.get('/user', authMiddleware, async (req, res) => {
    try {
        const { category, rarity, limit = 50, skip = 0 } = req.query;
        
        const userBadges = await badgeSystem.getUserBadges(req.user._id, {
            category,
            rarity,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
        
        res.json({
            success: true,
            data: userBadges,
            total: userBadges.length
        });
    } catch (error) {
        logger.error('Error getting user badges:', error);
        res.status(500).json({ error: 'Failed to get user badges' });
    }
});

// GET /api/infinity-badges/available - Get available badges for user
router.get('/available', authMiddleware, async (req, res) => {
    try {
        const availableBadges = await badgeSystem.getAvailableBadges(req.user._id);
        
        res.json({
            success: true,
            data: availableBadges,
            total: availableBadges.length
        });
    } catch (error) {
        logger.error('Error getting available badges:', error);
        res.status(500).json({ error: 'Failed to get available badges' });
    }
});

// POST /api/infinity-badges/award - Award a badge to user
router.post('/award', authMiddleware, async (req, res) => {
    try {
        const { badgeId, source = 'manual' } = req.body;
        
        if (!badgeId) {
            return res.status(400).json({ error: 'Badge ID is required' });
        }
        
        const result = await badgeSystem.awardBadge(req.user._id, badgeId, source);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        logger.error('Error awarding badge:', error);
        res.status(500).json({ error: 'Failed to award badge' });
    }
});

// POST /api/infinity-badges/check-unlock - Check and unlock badges
router.post('/check-unlock', authMiddleware, async (req, res) => {
    try {
        const result = await badgeSystem.checkAndUnlockBadges(req.user._id);
        
        res.json({
            success: true,
            data: result,
            message: `Unlocked ${result.unlockedBadges.length} new badges`
        });
    } catch (error) {
        logger.error('Error checking badge unlocks:', error);
        res.status(500).json({ error: 'Failed to check badge unlocks' });
    }
});

// GET /api/infinity-badges/stats - Get badge statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await badgeSystem.getBadgeStats();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error getting badge stats:', error);
        res.status(500).json({ error: 'Failed to get badge stats' });
    }
});

// GET /api/infinity-badges/catalog - Get all badges catalog
router.get('/catalog', async (req, res) => {
    try {
        const { category, rarity, status = 'active', limit = 100, skip = 0 } = req.query;
        
        const query = { status };
        if (category) {
            query.category = category;
        }
        if (rarity) {
            query.rarity = rarity;
        }
        
        const badges = await InfinityBadge.find(query)
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .sort({ rarity: -1, createdAt: -1 });
        
        const total = await InfinityBadge.countDocuments(query);
        
        res.json({
            success: true,
            data: badges,
            total,
            pagination: {
                limit: parseInt(limit),
                skip: parseInt(skip),
                hasMore: (parseInt(skip) + parseInt(limit)) < total
            }
        });
    } catch (error) {
        logger.error('Error getting badge catalog:', error);
        res.status(500).json({ error: 'Failed to get badge catalog' });
    }
});

// GET /api/infinity-badges/categories - Get badge categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await InfinityBadge.distinct('category');
        
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        logger.error('Error getting badge categories:', error);
        res.status(500).json({ error: 'Failed to get badge categories' });
    }
});

// POST /api/infinity-badges/equip - Equip a badge
router.post('/equip', authMiddleware, async (req, res) => {
    try {
        const { badgeInstanceId } = req.body;
        
        if (!badgeInstanceId) {
            return res.status(400).json({ error: 'Badge instance ID is required' });
        }
        
        // First, unequip all badges in the same category
        const badgeToEquip = await UserInfinityBadge.findById(badgeInstanceId);
        if (!badgeToEquip) {
            return res.status(404).json({ error: 'Badge not found' });
        }
        
        const badgeInfo = await InfinityBadge.findById(badgeToEquip.badgeId);
        await UserInfinityBadge.updateMany(
            { 
                userId: req.user._id,
                'badgeId.category': badgeInfo.category 
            },
            { 'display.isEquipped': false }
        );
        
        // Equip the selected badge
        await UserInfinityBadge.findByIdAndUpdate(
            badgeInstanceId,
            { 
                'display.isEquipped': true,
                'display.displayOrder': 1
            }
        );
        
        res.json({
            success: true,
            message: 'Badge equipped successfully'
        });
    } catch (error) {
        logger.error('Error equipping badge:', error);
        res.status(500).json({ error: 'Failed to equip badge' });
    }
});

// POST /api/infinity-badges/unequip - Unequip a badge
router.post('/unequip', authMiddleware, async (req, res) => {
    try {
        const { badgeInstanceId } = req.body;
        
        if (!badgeInstanceId) {
            return res.status(400).json({ error: 'Badge instance ID is required' });
        }
        
        await UserInfinityBadge.findByIdAndUpdate(
            badgeInstanceId,
            { 'display.isEquipped': false }
        );
        
        res.json({
            success: true,
            message: 'Badge unequipped successfully'
        });
    } catch (error) {
        logger.error('Error unequipping badge:', error);
        res.status(500).json({ error: 'Failed to unequip badge' });
    }
});

// POST /api/infinity-badges/favorite - Mark badge as favorite
router.post('/favorite', authMiddleware, async (req, res) => {
    try {
        const { badgeInstanceId, isFavorite } = req.body;
        
        if (!badgeInstanceId) {
            return res.status(400).json({ error: 'Badge instance ID is required' });
        }
        
        await UserInfinityBadge.findByIdAndUpdate(
            badgeInstanceId,
            { 'display.isFavorite': isFavorite }
        );
        
        res.json({
            success: true,
            message: `Badge ${isFavorite ? 'favorited' : 'unfavorited'} successfully`
        });
    } catch (error) {
        logger.error('Error updating badge favorite:', error);
        res.status(500).json({ error: 'Failed to update badge favorite' });
    }
});

// POST /api/infinity-badges/trade - Trade a badge
router.post('/trade', authMiddleware, async (req, res) => {
    try {
        const { badgeInstanceId, targetUserId, price } = req.body;
        
        if (!badgeInstanceId || !targetUserId || !price) {
            return res.status(400).json({ error: 'All trade parameters are required' });
        }
        
        const badge = await UserInfinityBadge.findById(badgeInstanceId);
        if (!badge || badge.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ error: 'Badge not found or not owned' });
        }
        
        if (!badge.trading.isTradable) {
            return res.status(400).json({ error: 'Badge is not tradable' });
        }
        
        // Execute trade logic
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ error: 'Target user not found' });
        }
        
        // Transfer badge ownership
        await UserInfinityBadge.findByIdAndUpdate(
            badgeInstanceId,
            { 
                userId: targetUserId,
                'trading.isGifted': true,
                'trading.giftedBy': req.user._id,
                'trading.giftedAt': new Date(),
                'trading.tradeCount': badge.trading.tradeCount + 1
            }
        );
        
        res.json({
            success: true,
            message: 'Badge traded successfully'
        });
    } catch (error) {
        logger.error('Error trading badge:', error);
        res.status(500).json({ error: 'Failed to trade badge' });
    }
});

// GET /api/infinity-badges/leaderboard - Badge leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const { category, rarity, limit = 50, skip = 0 } = req.query;
        
        const matchStage = { $match: { status: 'active' } };
        if (category) {
            matchStage.$match['badgeId.category'] = category;
        }
        if (rarity) {
            matchStage.$match['badgeId.rarity'] = rarity;
        }
        
        const leaderboard = await UserInfinityBadge.aggregate([
            matchStage,
            {
                $group: {
                    _id: '$badgeId',
                    count: { $sum: 1 },
                    users: { $push: '$userId' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: parseInt(limit) },
            { $skip: parseInt(skip) },
            {
                $lookup: {
                    from: 'infinity_badges',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'badge'
                }
            },
            { $unwind: '$badge' }
        ]);
        
        res.json({
            success: true,
            data: leaderboard,
            total: leaderboard.length
        });
    } catch (error) {
        logger.error('Error getting badge leaderboard:', error);
        res.status(500).json({ error: 'Failed to get badge leaderboard' });
    }
});

// Infinity Items Routes
// GET /api/infinity-items/user - Get user's items
router.get('/items/user', authMiddleware, async (req, res) => {
    try {
        const { category, itemType, rarity, limit = 50, skip = 0 } = req.query;
        
        const query = { userId: req.user._id, status: 'active' };
        if (category) {
            query['itemId.category'] = category;
        }
        if (itemType) {
            query['itemId.itemType'] = itemType;
        }
        if (rarity) {
            query['itemId.rarity'] = rarity;
        }
        
        const userItems = await UserInfinityItem.find(query)
            .populate('itemId')
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .sort({ acquiredAt: -1 });
        
        const total = await UserInfinityItem.countDocuments(query);
        
        res.json({
            success: true,
            data: userItems,
            total,
            pagination: {
                limit: parseInt(limit),
                skip: parseInt(skip),
                hasMore: (parseInt(skip) + parseInt(limit)) < total
            }
        });
    } catch (error) {
        logger.error('Error getting user items:', error);
        res.status(500).json({ error: 'Failed to get user items' });
    }
});

// GET /api/infinity-items/catalog - Get items catalog
router.get('/items/catalog', async (req, res) => {
    try {
        const { category, itemType, rarity, status = 'active', limit = 100, skip = 0 } = req.query;
        
        const query = { status };
        if (category) {
            query.category = category;
        }
        if (itemType) {
            query.itemType = itemType;
        }
        if (rarity) {
            query.rarity = rarity;
        }
        
        const items = await InfinityItem.find(query)
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .sort({ rarity: -1, createdAt: -1 });
        
        const total = await InfinityItem.countDocuments(query);
        
        res.json({
            success: true,
            data: items,
            total,
            pagination: {
                limit: parseInt(limit),
                skip: parseInt(skip),
                hasMore: (parseInt(skip) + parseInt(limit)) < total
            }
        });
    } catch (error) {
        logger.error('Error getting items catalog:', error);
        res.status(500).json({ error: 'Failed to get items catalog' });
    }
});

// POST /api/infinity-items/purchase - Purchase an item
router.post('/items/purchase', authMiddleware, async (req, res) => {
    try {
        const { itemId, currency, amount } = req.body;
        
        if (!itemId || !currency || !amount) {
            return res.status(400).json({ error: 'All purchase parameters are required' });
        }
        
        const item = await InfinityItem.findById(itemId);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        // Check if user has sufficient balance
        const user = await User.findById(req.user._id);
        let hasBalance = false;
        
        switch (currency) {
            case 'AIBA':
                hasBalance = user.aibaBalance >= amount;
                break;
            case 'NEUR':
                hasBalance = user.neurBalance >= amount;
                break;
            case 'STARS':
                hasBalance = user.starsBalance >= amount;
                break;
            case 'DIAMONDS':
                hasBalance = user.diamondsBalance >= amount;
                break;
        }
        
        if (!hasBalance) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // Create user item record
        const userItem = new UserInfinityItem({
            userId: req.user._id,
            itemId: itemId,
            instanceId: `${itemId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            acquiredFrom: 'purchase',
            acquisitionCost: { currency, amount }
        });
        
        await userItem.save();
        
        // Deduct from user balance
        switch (currency) {
            case 'AIBA':
                user.aibaBalance -= amount;
                break;
            case 'NEUR':
                user.neurBalance -= amount;
                break;
            case 'STARS':
                user.starsBalance -= amount;
                break;
            case 'DIAMONDS':
                user.diamondsBalance -= amount;
                break;
        }
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Item purchased successfully',
            data: userItem
        });
    } catch (error) {
        logger.error('Error purchasing item:', error);
        res.status(500).json({ error: 'Failed to purchase item' });
    }
});

// POST /api/infinity-items/use - Use an item
router.post('/items/use', authMiddleware, async (req, res) => {
    try {
        const { itemInstanceId, context = 'general' } = req.body;
        
        if (!itemInstanceId) {
            return res.status(400).json({ error: 'Item instance ID is required' });
        }
        
        const userItem = await UserInfinityItem.findById(itemInstanceId);
        if (!userItem || userItem.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ error: 'Item not found or not owned' });
        }
        
        const item = await InfinityItem.findById(userItem.itemId);
        
        // Check if item can be used
        if (!item.usage.isConsumable && userItem.usage.remainingUses !== 0) {
            return res.status(400).json({ error: 'Item cannot be used' });
        }
        
        // Apply item effects
        await this.applyItemEffects(req.user, item, context);
        
        // Update usage tracking
        const newUsage = {
            usedAt: new Date(),
            context,
            effect: 'applied'
        };
        
        userItem.usage.totalUses += 1;
        userItem.usage.lastUsedAt = new Date();
        userItem.usage.timesUsed.push(newUsage);
        
        if (userItem.usage.remainingUses > 0) {
            userItem.usage.remainingUses -= 1;
        }
        
        await userItem.save();
        
        res.json({
            success: true,
            message: 'Item used successfully',
            remainingUses: userItem.usage.remainingUses
        });
    } catch (error) {
        logger.error('Error using item:', error);
        res.status(500).json({ error: 'Failed to use item' });
    }
});

// Apply item effects to user
async function applyItemEffects(user, item, context) {
    for (const effect of item.effects) {
        switch (effect.type) {
            case 'stat_boost':
                // Apply stat boost logic
                break;
            case 'xp_multiplier':
                // Apply XP multiplier logic
                break;
            case 'visual_effect':
                // Apply visual effect logic
                break;
            case 'access_grant':
                // Grant access to features
                break;
            case 'currency_bonus':
                // Add currency bonus
                break;
        }
    }
}

module.exports = router;
