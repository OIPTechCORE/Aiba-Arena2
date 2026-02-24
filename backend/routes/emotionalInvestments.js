const express = require('express');
const router = express.Router();
const EmotionalInvestment = require('../models/EmotionalInvestment');

// GET /api/emotional-investments - Get user's emotional investments
router.get('/', async (req, res) => {
    try {
        const { userId, investmentType, purpose, status } = req.query;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        
        const filter = { userId };
        if (investmentType) filter.investmentType = investmentType;
        if (purpose) filter.purpose = purpose;
        if (status) filter['finalOutcome.status'] = status;
        
        const investments = await EmotionalInvestment.find(filter)
            .populate('supporters.userId', 'telegramId username telegram.firstName telegram.lastName')
            .sort({ emotionalValue: -1, createdAt: -1 });
            
        res.json({
            investments: investments.map(investment => ({
                ...investment.toJSON(),
                timeInvested: investment.timeInvested,
                totalResourceValue: investment.totalResourceValue,
                emotionalROI: investment.emotionalROI,
                supportNetwork: investment.supportNetwork,
                isOnTrack: investment.isOnTrack
            }))
        });
    } catch (error) {
        console.error('Error fetching emotional investments:', error);
        res.status(500).json({ error: 'Failed to fetch emotional investments' });
    }
});

// GET /api/emotional-investments/:id - Get specific emotional investment
router.get('/:id', async (req, res) => {
    try {
        const investment = await EmotionalInvestment.findById(req.params.id)
            .populate('userId', 'telegramId username telegram.firstName telegram.lastName')
            .populate('supporters.userId', 'telegramId username telegram.firstName telegram.lastName')
            .populate('investmentChain.investmentId', 'title description');
            
        if (!investment) {
            return res.status(404).json({ error: 'Emotional investment not found' });
        }
        
        // Check if user has access (owner or supporter)
        const userId = req.query.userId; // Would come from authentication
        const isOwner = investment.userId._id.toString() === userId;
        const isSupporter = investment.supporters.some(s => s.userId.toString() === userId);
        
        if (!isOwner && !isSupporter && investment.visibility === 'private') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        res.json({ 
            investment: {
                ...investment.toJSON(),
                timeInvested: investment.timeInvested,
                totalResourceValue: investment.totalResourceValue,
                emotionalROI: investment.emotionalROI,
                supportNetwork: investment.supportNetwork,
                isOnTrack: investment.isOnTrack
            }
        });
    } catch (error) {
        console.error('Error fetching emotional investment:', error);
        res.status(500).json({ error: 'Failed to fetch emotional investment' });
    }
});

// POST /api/emotional-investments - Create new emotional investment
router.post('/', async (req, res) => {
    try {
        const investmentData = req.body;
        
        if (!investmentData.userId || !investmentData.title || !investmentData.investmentType) {
            return res.status(400).json({ error: 'userId, title, and investmentType are required' });
        }
        
        const investment = new EmotionalInvestment(investmentData);
        await investment.save();
        
        res.status(201).json({
            message: 'Emotional investment created successfully',
            investment: {
                ...investment.toJSON(),
                timeInvested: investment.timeInvested,
                totalResourceValue: investment.totalResourceValue,
                emotionalROI: investment.emotionalROI,
                supportNetwork: investment.supportNetwork,
                isOnTrack: investment.isOnTrack
            }
        });
    } catch (error) {
        console.error('Error creating emotional investment:', error);
        res.status(500).json({ error: 'Failed to create emotional investment' });
    }
});

// POST /api/emotional-investments/:id/add-checkpoint - Add emotional checkpoint
router.post('/:id/add-checkpoint', async (req, res) => {
    try {
        const { userId, emotions, insights, triggers } = req.body;
        
        if (!userId || !emotions) {
            return res.status(400).json({ error: 'userId and emotions are required' });
        }
        
        const investment = await EmotionalInvestment.findById(req.params.id);
        if (!investment) {
            return res.status(404).json({ error: 'Emotional investment not found' });
        }
        
        // Check if user has access
        const isOwner = investment.userId.toString() === userId;
        const isSupporter = investment.supporters.some(s => s.userId.toString() === userId);
        
        if (!isOwner && !isSupporter) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const checkpoint = investment.addEmotionalCheckpoint(emotions, insights, triggers);
        await investment.save();
        
        res.status(201).json({
            message: 'Emotional checkpoint added successfully',
            checkpoint
        });
    } catch (error) {
        console.error('Error adding emotional checkpoint:', error);
        res.status(500).json({ error: 'Failed to add emotional checkpoint' });
    }
});

// POST /api/emotional-investments/:id/add-supporter - Add supporter to investment
router.post('/:id/add-supporter', async (req, res) => {
    try {
        const { userId, supportType } = req.body;
        
        if (!userId || !supportType) {
            return res.status(400).json({ error: 'userId and supportType are required' });
        }
        
        const investment = await EmotionalInvestment.findById(req.params.id);
        if (!investment) {
            return res.status(404).json({ error: 'Emotional investment not found' });
        }
        
        const success = investment.addSupporter(userId, supportType);
        if (!success) {
            return res.status(400).json({ error: 'User already supporting this investment' });
        }
        
        // Update inspiration count
        investment.inspirationCount++;
        investment.rippleEffect += 0.1;
        
        await investment.save();
        
        res.status(201).json({
            message: 'Supporter added successfully',
            supporter: investment.supporters[investment.supporters.length - 1]
        });
    } catch (error) {
        console.error('Error adding supporter:', error);
        res.status(500).json({ error: 'Failed to add supporter' });
    }
});

// POST /api/emotional-investments/:id/add-support-message - Add support message
router.post('/:id/add-support-message', async (req, res) => {
    try {
        const { userId, content, emotionalImpact } = req.body;
        
        if (!userId || !content) {
            return res.status(400).json({ error: 'userId and content are required' });
        }
        
        const investment = await EmotionalInvestment.findById(req.params.id);
        if (!investment) {
            return res.status(404).json({ error: 'Emotional investment not found' });
        }
        
        // Check if user is a supporter
        const isSupporter = investment.supporters.some(s => s.userId.toString() === userId);
        if (!isSupporter) {
            return res.status(403).json({ error: 'Only supporters can add messages' });
        }
        
        const message = investment.addSupportMessage(userId, content, emotionalImpact);
        await investment.save();
        
        res.status(201).json({
            message: 'Support message added successfully',
            message
        });
    } catch (error) {
        console.error('Error adding support message:', error);
        res.status(500).json({ error: 'Failed to add support message' });
    }
});

// POST /api/emotional-investments/:id/update-progress - Update investment progress
router.post('/:id/update-progress', async (req, res) => {
    try {
        const { userId, percentage, milestonesCompleted } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        
        const investment = await EmotionalInvestment.findById(req.params.id);
        if (!investment) {
            return res.status(404).json({ error: 'Emotional investment not found' });
        }
        
        // Check if user is owner
        if (investment.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Only investment owner can update progress' });
        }
        
        investment.updateProgress(percentage, milestonesCompleted);
        await investment.save();
        
        res.json({
            message: 'Progress updated successfully',
            investment: {
                ...investment.toJSON(),
                timeInvested: investment.timeInvested,
                totalResourceValue: investment.totalResourceValue,
                emotionalROI: investment.emotionalROI,
                supportNetwork: investment.supportNetwork,
                isOnTrack: investment.isOnTrack
            }
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// GET /api/emotional-investments/stats/:userId - Get user's emotional investment statistics
router.get('/stats/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const investments = await EmotionalInvestment.find({ userId });
        
        const stats = {
            totalInvestments: investments.length,
            activeInvestments: investments.filter(i => i.finalOutcome.status === 'in_progress').length,
            completedInvestments: investments.filter(i => i.finalOutcome.status === 'completed').length,
            totalEmotionalValue: investments.reduce((sum, i) => sum + i.emotionalValue, 0),
            totalLegacyScore: investments.reduce((sum, i) => sum + i.legacyScore, 0),
            totalSupporters: investments.reduce((sum, i) => sum + i.supporters.length, 0),
            averageEmotionalROI: investments.length > 0 ? 
                Math.round(investments.reduce((sum, i) => sum + (i.emotionalROI || 0), 0) / investments.length) : 0,
            investmentTypeBreakdown: investments.reduce((acc, i) => {
                acc[i.investmentType] = (acc[i.investmentType] || 0) + 1;
                return acc;
            }, {}),
            purposeBreakdown: investments.reduce((acc, i) => {
                acc[i.purpose] = (acc[i.purpose] || 0) + 1;
                return acc;
            }, {}),
            emotionalStakesBreakdown: investments.reduce((acc, i) => {
                acc[i.emotionalStakes] = (acc[i.emotionalStakes] || 0) + 1;
                return acc;
            }, {})
        };
        
        res.json({ stats });
    } catch (error) {
        console.error('Error fetching emotional investment stats:', error);
        res.status(500).json({ error: 'Failed to fetch emotional investment stats' });
    }
});

module.exports = router;
