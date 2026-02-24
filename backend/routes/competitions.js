const express = require('express');
const router = express.Router();
const Competition = require('../models/Competition');

// GET /api/competitions - Get available competitions
router.get('/', async (req, res) => {
    try {
        const { category, status, competitionType, isEndless, page = 1, limit = 20 } = req.query;
        const filter = { isPublic: true };
        
        if (category) filter.category = category;
        if (status) filter.status = status;
        if (competitionType) filter.competitionType = competitionType;
        if (isEndless !== undefined) filter.isEndless = isEndless === 'true';
        
        const competitions = await Competition.find(filter)
            .select('-participants -results') // Exclude large arrays for list view
            .sort({ startsAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await Competition.countDocuments(filter);
        
        res.json({
            competitions: competitions.map(competition => ({
                ...competition.toJSON(),
                timeRemaining: competition.timeRemaining,
                isActive: competition.isActive,
                participationRate: competition.participationRate
            })),
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

// GET /api/competitions/:id - Get specific competition details
router.get('/:id', async (req, res) => {
    try {
        const competition = await Competition.findById(req.params.id)
            .populate('participants.userId', 'telegramId username telegram.firstName telegram.lastName');
            
        if (!competition) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        
        // Check if user is already a participant
        const userId = req.query.userId; // Would come from authentication in real app
        let userParticipant = null;
        if (userId) {
            userParticipant = competition.participants.find(p => p.userId.toString() === userId);
        }
        
        res.json({ 
            competition: {
                ...competition.toJSON(),
                timeRemaining: competition.timeRemaining,
                isActive: competition.isActive,
                participationRate: competition.participationRate,
                currentLevelConfig: competition.currentLevelConfig
            },
            userParticipant
        });
    } catch (error) {
        console.error('Error fetching competition:', error);
        res.status(500).json({ error: 'Failed to fetch competition' });
    }
});

// POST /api/competitions/:id/join - Join competition
router.post('/:id/join', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        
        const competition = await Competition.findById(req.params.id);
        if (!competition) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        
        if (!competition.isPublic) {
            return res.status(403).json({ error: 'This competition is private' });
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

// GET /api/competitions/:id/leaderboard - Get competition leaderboard
router.get('/:id/leaderboard', async (req, res) => {
    try {
        const competition = await Competition.findById(req.params.id)
            .populate('participants.userId', 'telegramId username telegram.firstName telegram.lastName');
            
        if (!competition) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        
        if (!competition.leaderboardEnabled) {
            return res.status(403).json({ error: 'Leaderboard is disabled for this competition' });
        }
        
        // Sort participants by score, then by best score
        const sortedParticipants = competition.participants
            .filter(p => p.score > 0)
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return b.bestScore - a.bestScore;
            })
            .slice(0, 100); // Top 100
        
        const leaderboard = sortedParticipants.map((participant, index) => ({
            rank: index + 1,
            userId: participant.userId,
            score: participant.score,
            bestScore: participant.bestScore,
            currentLevel: participant.currentLevel,
            attempts: participant.attempts,
            status: participant.status
        }));
        
        res.json({ leaderboard });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// GET /api/competitions/user/:userId - Get user's competition history
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { status, page = 1, limit = 20 } = req.query;
        
        const competitions = await Competition.find({
            'participants.userId': userId,
            isPublic: true
        })
        .select('title category status startsAt endsAt currentLevel maxLevel participants')
        .sort({ startsAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
        
        const total = await Competition.countDocuments({
            'participants.userId': userId,
            isPublic: true
        });
        
        // Extract user's participation data
        const userCompetitions = competitions.map(competition => {
            const participant = competition.participants.find(p => p.userId.toString() === userId);
            return {
                ...competition.toJSON(),
                userParticipant: participant,
                timeRemaining: competition.timeRemaining,
                isActive: competition.isActive
            };
        });
        
        res.json({
            competitions: userCompetitions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching user competitions:', error);
        res.status(500).json({ error: 'Failed to fetch user competitions' });
    }
});

module.exports = router;
