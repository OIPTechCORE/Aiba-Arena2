const express = require('express');
const router = express.Router();
const SocialShare = require('../models/SocialShare');
const { requireAdmin } = require('../middleware/requireAdmin');

// Apply admin authentication to all routes
router.use(requireAdmin());

// GET /api/admin/social-shares - List all social shares
router.get('/', async (req, res) => {
    try {
        const { userId, shareType, isTrending, visibility, page = 1, limit = 50 } = req.query;
        const filter = {};
        
        if (userId) filter.userId = userId;
        if (shareType) filter.shareType = shareType;
        if (isTrending !== undefined) filter.isTrending = isTrending === 'true';
        if (visibility) filter.visibility = visibility;
        
        const shares = await SocialShare.find(filter)
            .populate('userId', 'telegramId username telegram.firstName telegram.lastName')
            .populate('likes.userId', 'telegramId username telegram.firstName telegram.lastName')
            .populate('comments.userId', 'telegramId username telegram.firstName telegram.lastName')
            .populate('resharedFrom', 'title description')
            .sort({ trendingScore: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await SocialShare.countDocuments(filter);
        
        res.json({
            shares: shares.map(share => ({
                ...share.toJSON(),
                totalLikes: share.totalLikes,
                totalComments: share.totalComments,
                totalShares: share.totalShares,
                engagementRate: share.engagementRate,
                emotionalImpact: share.emotionalImpact,
                viralPotential: share.viralPotential
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching social shares:', error);
        res.status(500).json({ error: 'Failed to fetch social shares' });
    }
});

// POST /api/admin/social-shares - Create new social share
router.post('/', async (req, res) => {
    try {
        const shareData = {
            ...req.body,
            userId: req.admin.id // Use admin ID for now, should be req.body.userId
        };
        
        const share = new SocialShare(shareData);
        await share.save();
        
        res.status(201).json({
            message: 'Social share created successfully',
            share: {
                ...share.toJSON(),
                totalLikes: share.totalLikes,
                totalComments: share.totalComments,
                totalShares: share.totalShares,
                engagementRate: share.engagementRate,
                emotionalImpact: share.emotionalImpact,
                viralPotential: share.viralPotential
            }
        });
    } catch (error) {
        console.error('Error creating social share:', error);
        res.status(500).json({ error: 'Failed to create social share' });
    }
});

// GET /api/admin/social-shares/:id - Get specific social share
router.get('/:id', async (req, res) => {
    try {
        const share = await SocialShare.findById(req.params.id)
            .populate('userId', 'telegramId username telegram.firstName telegram.lastName')
            .populate('likes.userId', 'telegramId username telegram.firstName telegram.lastName')
            .populate('comments.userId', 'telegramId username telegram.firstName telegram.lastName')
            .populate('comments.replies.userId', 'telegramId username telegram.firstName telegram.lastName')
            .populate('resharedFrom', 'title description');
            
        if (!share) {
            return res.status(404).json({ error: 'Social share not found' });
        }
        
        res.json({ 
            share: {
                ...share.toJSON(),
                totalLikes: share.totalLikes,
                totalComments: share.totalComments,
                totalShares: share.totalShares,
                engagementRate: share.engagementRate,
                emotionalImpact: share.emotionalImpact,
                viralPotential: share.viralPotential
            }
        });
    } catch (error) {
        console.error('Error fetching social share:', error);
        res.status(500).json({ error: 'Failed to fetch social share' });
    }
});

// POST /api/admin/social-shares/:id/like - Like a social share
router.post('/:id/like', async (req, res) => {
    try {
        const { userId } = req.body;
        
        const share = await SocialShare.findById(req.params.id);
        if (!share) {
            return res.status(404).json({ error: 'Social share not found' });
        }
        
        if (!share.allowReactions) {
            return res.status(400).json({ error: 'Reactions not allowed on this share' });
        }
        
        const success = share.addLike(userId);
        if (!success) {
            return res.status(400).json({ error: 'Already liked' });
        }
        
        await share.save();
        
        res.json({
            message: 'Share liked successfully',
            totalLikes: share.totalLikes
        });
    } catch (error) {
        console.error('Error liking share:', error);
        res.status(500).json({ error: 'Failed to like share' });
    }
});

// POST /api/admin/social-shares/:id/comment - Comment on a social share
router.post('/:id/comment', async (req, res) => {
    try {
        const { userId, content } = req.body;
        
        const share = await SocialShare.findById(req.params.id);
        if (!share) {
            return res.status(404).json({ error: 'Social share not found' });
        }
        
        if (!share.allowComments) {
            return res.status(400).json({ error: 'Comments not allowed on this share' });
        }
        
        const comment = share.addComment(userId, content);
        await share.save();
        
        res.status(201).json({
            message: 'Comment added successfully',
            comment
        });
    } catch (error) {
        console.error('Error commenting on share:', error);
        res.status(500).json({ error: 'Failed to comment on share' });
    }
});

// POST /api/admin/social-shares/:id/share-platform - Share to external platform
router.post('/:id/share-platform', async (req, res) => {
    try {
        const { platform, shareUrl } = req.body;
        
        const share = await SocialShare.findById(req.params.id);
        if (!share) {
            return res.status(404).json({ error: 'Social share not found' });
        }
        
        const platformShare = share.addShare(platform, shareUrl);
        await share.save();
        
        // Update trending score based on share activity
        share.trendingScore += 10;
        if (share.trendingScore > 100) {
            share.isTrending = true;
        }
        
        await share.save();
        
        res.status(201).json({
            message: 'Shared to platform successfully',
            platformShare
        });
    } catch (error) {
        console.error('Error sharing to platform:', error);
        res.status(500).json({ error: 'Failed to share to platform' });
    }
});

// POST /api/admin/social-shares/:id/calculate-rewards - Calculate and distribute rewards
router.post('/:id/calculate-rewards', async (req, res) => {
    try {
        const share = await SocialShare.findById(req.params.id);
        if (!share) {
            return res.status(404).json({ error: 'Social share not found' });
        }
        
        const rewards = share.calculateRewards();
        
        // Update reward earned
        share.rewardEarned.aiba += rewards.totalReward;
        
        // Check for achievements
        if (share.totalLikes >= 10 && !share.achievements.some(a => a.achievementType === 'most_liked')) {
            share.achievements.push({
                achievementType: 'most_liked',
                earnedAt: new Date(),
                rewardBonus: 50
            });
            share.rewardEarned.aiba += 50;
        }
        
        if (share.isTrending && !share.achievements.some(a => a.achievementType === 'trending_share')) {
            share.achievements.push({
                achievementType: 'trending_share',
                earnedAt: new Date(),
                rewardBonus: 100
            });
            share.rewardEarned.aiba += 100;
        }
        
        await share.save();
        
        res.json({
            message: 'Rewards calculated successfully',
            rewards,
            totalEarned: share.rewardEarned.aiba
        });
    } catch (error) {
        console.error('Error calculating rewards:', error);
        res.status(500).json({ error: 'Failed to calculate rewards' });
    }
});

module.exports = router;
