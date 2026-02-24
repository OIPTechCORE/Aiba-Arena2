const express = require('express');
const router = express.Router();
const Competition = require('../models/Competition');
const { requireAdmin } = require('../middleware/requireAdmin');

// Apply admin authentication to all routes
router.use(requireAdmin());

// GET /api/admin/competitions - List all competitions
router.get('/', async (req, res) => {
    try {
        const { category, status, competitionType, isEndless, page = 1, limit = 50 } = req.query;
        const filter = {};
        
        if (category) filter.category = category;
        if (status) filter.status = status;
        if (competitionType) filter.competitionType = competitionType;
        if (isEndless !== undefined) filter.isEndless = isEndless === 'true';
        
        const competitions = await Competition.find(filter)
            .populate('participants.userId', 'telegramId username telegram.firstName telegram.lastName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await Competition.countDocuments(filter);
        
        res.json({
            competitions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching competitions:', error);
        res.status(500).json({ error: 'Failed to fetch competitions' });
    }
});

// POST /api/admin/competitions - Create new competition
router.post('/', async (req, res) => {
    try {
        const competitionData = {
            ...req.body,
            currentParticipants: 0
        };
        
        const competition = new Competition(competitionData);
        await competition.save();
        
        res.status(201).json({
            message: 'Competition created successfully',
            competition
        });
    } catch (error) {
        console.error('Error creating competition:', error);
        res.status(500).json({ error: 'Failed to create competition' });
    }
});

// GET /api/admin/competitions/:id - Get specific competition
router.get('/:id', async (req, res) => {
    try {
        const competition = await Competition.findById(req.params.id)
            .populate('participants.userId', 'telegramId username telegram.firstName telegram.lastName')
            .populate('results.topParticipants.userId', 'telegramId username telegram.firstName telegram.lastName');
            
        if (!competition) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        
        res.json({ 
            competition: {
                ...competition.toJSON(),
                timeRemaining: competition.timeRemaining,
                isActive: competition.isActive,
                participationRate: competition.participationRate
            }
        });
    } catch (error) {
        console.error('Error fetching competition:', error);
        res.status(500).json({ error: 'Failed to fetch competition' });
    }
});

// PUT /api/admin/competitions/:id - Update competition
router.put('/:id', async (req, res) => {
    try {
        const competition = await Competition.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!competition) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        
        res.json({
            message: 'Competition updated successfully',
            competition
        });
    } catch (error) {
        console.error('Error updating competition:', error);
        res.status(500).json({ error: 'Failed to update competition' });
    }
});

// DELETE /api/admin/competitions/:id - Delete competition
router.delete('/:id', async (req, res) => {
    try {
        const competition = await Competition.findByIdAndDelete(req.params.id);
        
        if (!competition) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        
        res.json({
            message: 'Competition deleted successfully',
            competition
        });
    } catch (error) {
        console.error('Error deleting competition:', error);
        res.status(500).json({ error: 'Failed to delete competition' });
    }
});

// POST /api/admin/competitions/:id/join - Join competition
router.post('/:id/join', async (req, res) => {
    try {
        const { userId } = req.body;
        
        const competition = await Competition.findById(req.params.id);
        if (!competition) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        
        if (competition.currentParticipants >= competition.maxParticipants) {
            return res.status(400).json({ error: 'Competition is full' });
        }
        
        if (competition.status !== 'upcoming' && competition.status !== 'active') {
            return res.status(400).json({ error: 'Competition is not accepting participants' });
        }
        
        // Check if user already joined
        const existingParticipant = competition.participants.find(p => p.userId.toString() === userId);
        if (existingParticipant) {
            return res.status(400).json({ error: 'User already joined this competition' });
        }
        
        // Add participant
        competition.participants.push({
            userId,
            joinedAt: new Date(),
            currentLevel: 1,
            score: 0,
            bestScore: 0,
            attempts: 0,
            status: 'registered'
        });
        
        competition.currentParticipants++;
        
        await competition.save();
        
        res.status(201).json({
            message: 'Joined competition successfully',
            participant: competition.participants[competition.participants.length - 1]
        });
    } catch (error) {
        console.error('Error joining competition:', error);
        res.status(500).json({ error: 'Failed to join competition' });
    }
});

// POST /api/admin/competitions/:id/update-score - Update participant score
router.post('/:id/update-score', async (req, res) => {
    try {
        const { userId, score, level = null } = req.body;
        
        const competition = await Competition.findById(req.params.id);
        if (!competition) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        
        const participant = competition.participants.find(p => p.userId.toString() === userId);
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        
        // Update score and stats
        participant.score = score;
        participant.attempts++;
        participant.lastPlayedAt = new Date();
        participant.status = 'playing';
        
        if (score > participant.bestScore) {
            participant.bestScore = score;
        }
        
        // Update level if provided
        if (level !== null && level > participant.currentLevel) {
            participant.currentLevel = level;
            participant.progress.levelsCompleted++;
        }
        
        await competition.save();
        
        res.json({
            message: 'Score updated successfully',
            participant
        });
    } catch (error) {
        console.error('Error updating score:', error);
        res.status(500).json({ error: 'Failed to update score' });
    }
});

// POST /api/admin/competitions/:id/complete - Complete competition and calculate results
router.post('/:id/complete', async (req, res) => {
    try {
        const { winnerId, topParticipants } = req.body;
        
        const competition = await Competition.findById(req.params.id);
        if (!competition) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        
        // Update competition status
        competition.status = 'completed';
        competition.results.winner = winnerId;
        competition.results.topParticipants = topParticipants;
        competition.results.totalParticipants = competition.currentParticipants;
        
        // Calculate statistics
        const scores = competition.participants.map(p => p.score).filter(s => s > 0);
        competition.results.averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        competition.results.completionRate = (competition.participants.filter(p => p.score > 0).length / competition.currentParticipants) * 100;
        
        await competition.save();
        
        res.json({
            message: 'Competition completed successfully',
            results: competition.results
        });
    } catch (error) {
        console.error('Error completing competition:', error);
        res.status(500).json({ error: 'Failed to complete competition' });
    }
});

module.exports = router;
