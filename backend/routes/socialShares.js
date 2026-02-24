const express = require('express');
const router = express.Router();
const SocialShare = require('../models/SocialShare');

// GET /api/social-shares - Get social shares feed
router.get('/', async (req, res) => {
    try {
        const { shareType, isTrending, visibility, page = 1, limit = 20 } = req.query;
        const filter = { isActive: true };
        
        if (shareType) filter.shareType = shareType;
        if (isTrending === 'true') filter.isTrending = true;
        if (visibility) filter.visibility = visibility;
        
        const shares = await SocialShare.find(filter)
            .populate('userId', 'telegramId username telegram.firstName telegram.lastName')
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

// GET /api/social-shares/:id - Get specific social share
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

// POST /api/social-shares/:id/like - Like a social share
router.post('/:id/like', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        
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
        
        // Update trending score
        share.trendingScore += 5;
        if (share.trendingScore > 100) {
            share.isTrending = true;
        }
        
        await share.save();
        
        res.json({
            message: 'Share liked successfully',
            totalLikes: share.totalLikes,
            trendingScore: share.trendingScore
        });
    } catch (error) {
        console.error('Error liking share:', error);
        res.status(500).json({ error: 'Failed to like share' });
    }
});

// POST /api/social-shares/:id/comment - Comment on a social share
router.post('/:id/comment', async (req, res) => {
    try {
        const { userId, content } = req.body;
        
        if (!userId || !content) {
            return res.status(400).json({ error: 'userId and content are required' });
        }
        
        const share = await SocialShare.findById(req.params.id);
        if (!share) {
            return res.status(404).json({ error: 'Social share not found' });
        }
        
        if (!share.allowComments) {
            return res.status(400).json({ error: 'Comments not allowed on this share' });
        }
        
        const comment = share.addComment(userId, content);
        
        // Update trending score
        share.trendingScore += 3;
        if (share.trendingScore > 100) {
            share.isTrending = true;
        }
        
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

// POST /api/social-shares/:id/reshare - Reshare a social share
router.post('/:id/reshare', async (req, res) => {
    try {
        const { userId, platform, shareUrl } = req.body;
        
        if (!userId || !platform || !shareUrl) {
            return res.status(400).json({ error: 'userId, platform, and shareUrl are required' });
        }
        
        const originalShare = await SocialShare.findById(req.params.id);
        if (!originalShare) {
            return res.status(404).json({ error: 'Original social share not found' });
        }
        
        // Create new share as reshare
        const reshareData = {
            userId,
            shareType: 'custom',
            title: `Reshared: ${originalShare.title}`,
            description: originalShare.description,
            imageUrl: originalShare.imageUrl,
            videoUrl: originalShare.videoUrl,
            relatedEntity: {
                entityType: 'custom',
                entityId: originalShare._id,
                entityData: { originalShareId: originalShare._id }
            },
            resharedFrom: originalShare._id,
            visibility: originalShare.visibility,
            allowComments: originalShare.allowComments,
            allowReactions: originalShare.allowReactions
        };
        
        const reshare = new SocialShare(reshareData);
        await reshare.save();
        
        // Update original share's reshare count
        originalShare.reshareCount++;
        originalShare.trendingScore += 10;
        if (originalShare.trendingScore > 100) {
            originalShare.isTrending = true;
        }
        await originalShare.save();
        
        res.status(201).json({
            message: 'Shared successfully',
            share: {
                ...reshare.toJSON(),
                totalLikes: reshare.totalLikes,
                totalComments: reshare.totalComments,
                totalShares: reshare.totalShares,
                engagementRate: reshare.engagementRate,
                emotionalImpact: reshare.emotionalImpact,
                viralPotential: reshare.viralPotential
            }
        });
    } catch (error) {
        console.error('Error resharing:', error);
        res.status(500).json({ error: 'Failed to reshare' });
    }
});

// GET /api/social-shares/user/:userId - Get user's social shares
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { shareType, page = 1, limit = 20 } = req.query;
        
        const filter = { userId, isActive: true };
        if (shareType) filter.shareType = shareType;
        
        const shares = await SocialShare.find(filter)
            .sort({ createdAt: -1 })
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
        console.error('Error fetching user social shares:', error);
        res.status(500).json({ error: 'Failed to fetch user social shares' });
    }
});

// GET /api/social-shares/trending - Get trending shares
router.get('/trending', async (req, res) => {
    try {
        const { timeRange = '24h', page = 1, limit = 20 } = req.query;
        
        // Calculate time filter
        const now = new Date();
        let timeFilter;
        switch (timeRange) {
            case '1h':
                timeFilter = new Date(now - 60 * 60 * 1000);
                break;
            case '6h':
                timeFilter = new Date(now - 6 * 60 * 60 * 1000);
                break;
            case '24h':
            default:
                timeFilter = new Date(now - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                timeFilter = new Date(now - 7 * 24 * 60 * 60 * 1000);
                break;
        }
        
        const filter = {
            isTrending: true,
            isActive: true,
            createdAt: { $gte: timeFilter }
        };
        
        const shares = await SocialShare.find(filter)
            .populate('userId', 'telegramId username telegram.firstName telegram.lastName')
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
            },
            timeRange
        });
    } catch (error) {
        console.error('Error fetching trending shares:', error);
        res.status(500).json({ error: 'Failed to fetch trending shares' });
    }
});

module.exports = router;
