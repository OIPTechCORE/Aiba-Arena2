const express = require('express');
const router = express.Router();
const EmotionalInvestment = require('../models/EmotionalInvestment');
const { requireAdmin } = require('../middleware/requireAdmin');

// Apply admin authentication to all routes
router.use(requireAdmin());

// GET /api/admin/emotional-investments - List all emotional investments
router.get('/', async (req, res) => {
    try {
        const { userId, investmentType, purpose, status, emotionalStakes, page = 1, limit = 50 } = req.query;
        const filter = {};
        
        if (userId) filter.userId = userId;
        if (investmentType) filter.investmentType = investmentType;
        if (purpose) filter.purpose = purpose;
        if (status) filter['finalOutcome.status'] = status;
        if (emotionalStakes) filter.emotionalStakes = emotionalStakes;
        
        const investments = await EmotionalInvestment.find(filter)
            .populate('userId', 'telegramId username telegram.firstName telegram.lastName')
            .populate('supporters.userId', 'telegramId username telegram.firstName telegram.lastName')
            .sort({ emotionalValue: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await EmotionalInvestment.countDocuments(filter);
        
        res.json({
            investments: investments.map(investment => ({
                ...investment.toJSON(),
                timeInvested: investment.timeInvested,
                totalResourceValue: investment.totalResourceValue,
                emotionalROI: investment.emotionalROI,
                supportNetwork: investment.supportNetwork,
                isOnTrack: investment.isOnTrack
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching emotional investments:', error);
        res.status(500).json({ error: 'Failed to fetch emotional investments' });
    }
});

// POST /api/admin/emotional-investments - Create new emotional investment
router.post('/', async (req, res) => {
    try {
        const investmentData = {
            ...req.body,
            userId: req.admin.id // Use admin ID for now, should be req.body.userId
        };
        
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

// GET /api/admin/emotional-investments/:id - Get specific emotional investment
router.get('/:id', async (req, res) => {
    try {
        const investment = await EmotionalInvestment.findById(req.params.id)
            .populate('userId', 'telegramId username telegram.firstName telegram.lastName')
            .populate('supporters.userId', 'telegramId username telegram.firstName telegram.lastName')
            .populate('investmentChain.investmentId', 'title description');
            
        if (!investment) {
            return res.status(404).json({ error: 'Emotional investment not found' });
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

// PUT /api/admin/emotional-investments/:id - Update emotional investment
router.put('/:id', async (req, res) => {
    try {
        const investment = await EmotionalInvestment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!investment) {
            return res.status(404).json({ error: 'Emotional investment not found' });
        }
        
        res.json({
            message: 'Emotional investment updated successfully',
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
        console.error('Error updating emotional investment:', error);
        res.status(500).json({ error: 'Failed to update emotional investment' });
    }
});

// DELETE /api/admin/emotional-investments/:id - Delete emotional investment
router.delete('/:id', async (req, res) => {
    try {
        const investment = await EmotionalInvestment.findByIdAndDelete(req.params.id);
        
        if (!investment) {
            return res.status(404).json({ error: 'Emotional investment not found' });
        }
        
        res.json({
            message: 'Emotional investment deleted successfully',
            investment
        });
    } catch (error) {
        console.error('Error deleting emotional investment:', error);
        res.status(500).json({ error: 'Failed to delete emotional investment' });
    }
});

// POST /api/admin/emotional-investments/:id/add-checkpoint - Add emotional checkpoint
router.post('/:id/add-checkpoint', async (req, res) => {
    try {
        const { emotions, insights, triggers } = req.body;
        
        const investment = await EmotionalInvestment.findById(req.params.id);
        if (!investment) {
            return res.status(404).json({ error: 'Emotional investment not found' });
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

// POST /api/admin/emotional-investments/:id/add-supporter - Add supporter to investment
router.post('/:id/add-supporter', async (req, res) => {
    try {
        const { userId, supportType } = req.body;
        
        const investment = await EmotionalInvestment.findById(req.params.id);
        if (!investment) {
            return res.status(404).json({ error: 'Emotional investment not found' });
        }
        
        const success = investment.addSupporter(userId, supportType);
        if (!success) {
            return res.status(400).json({ error: 'User already supporting this investment' });
        }
        
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

// POST /api/admin/emotional-investments/:id/add-support-message - Add support message
router.post('/:id/add-support-message', async (req, res) => {
    try {
        const { supporterId, content, emotionalImpact } = req.body;
        
        const investment = await EmotionalInvestment.findById(req.params.id);
        if (!investment) {
            return res.status(404).json({ error: 'Emotional investment not found' });
        }
        
        const message = investment.addSupportMessage(supporterId, content, emotionalImpact);
        if (!message) {
            return res.status(404).json({ error: 'Supporter not found' });
        }
        
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

// POST /api/admin/emotional-investments/:id/update-progress - Update investment progress
router.post('/:id/update-progress', async (req, res) => {
    try {
        const { percentage, milestonesCompleted } = req.body;
        
        const investment = await EmotionalInvestment.findById(req.params.id);
        if (!investment) {
            return res.status(404).json({ error: 'Emotional investment not found' });
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

// POST /api/admin/emotional-investments/:id/complete - Complete emotional investment
router.post('/:id/complete', async (req, res) => {
    try {
        const { finalEmotions, satisfaction, growth, lessons, achievements, unexpectedOutcomes } = req.body;
        
        const investment = await EmotionalInvestment.findById(req.params.id);
        if (!investment) {
            return res.status(404).json({ error: 'Emotional investment not found' });
        }
        
        // Update final outcome
        investment.finalOutcome.status = 'completed';
        investment.finalOutcome.completionDate = new Date();
        investment.finalOutcome.finalEmotions = {
            primary: finalEmotions.primary,
            satisfaction: parseInt(satisfaction),
            growth: parseInt(growth)
        };
        investment.finalOutcome.lessons = lessons;
        investment.finalOutcome.achievements = achievements || [];
        investment.finalOutcome.unexpectedOutcomes = unexpectedOutcomes || [];
        
        // Calculate emotional returns
        const returns = investment.calculateEmotionalReturns();
        
        // Update legacy score based on impact
        investment.legacyScore += Math.floor(returns.totalReturn * 0.1);
        investment.inspirationCount += investment.supporters.length;
        
        await investment.save();
        
        res.json({
            message: 'Emotional investment completed successfully',
            investment: {
                ...investment.toJSON(),
                timeInvested: investment.timeInvested,
                totalResourceValue: investment.totalResourceValue,
                emotionalROI: investment.emotionalROI,
                supportNetwork: investment.supportNetwork,
                isOnTrack: investment.isOnTrack
            },
            returns
        });
    } catch (error) {
        console.error('Error completing investment:', error);
        res.status(500).json({ error: 'Failed to complete investment' });
    }
});

module.exports = router;
