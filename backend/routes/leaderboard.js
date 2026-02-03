const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Battle = require('../models/Battle');
const User = require('../models/User');

// GET /api/leaderboard?by=score|aiba|neur|battles&limit=50
// Global leaderboard: all users worldwide, no country filter. Any authenticated user can see it.
router.get('/', requireTelegram, async (req, res) => {
    try {
        const by = String(req.query?.by || 'score').trim().toLowerCase();
        const limit = Math.min(500, Math.max(1, parseInt(req.query?.limit, 10) || 50));

        const allowed = ['score', 'aiba', 'neur', 'battles'];
        if (!allowed.includes(by)) {
            return res.status(400).json({ error: 'invalid by', allowed });
        }

        const agg = await Battle.aggregate([
            { $match: {} },
            {
                $group: {
                    _id: '$ownerTelegramId',
                    totalScore: { $sum: '$score' },
                    totalAiba: { $sum: '$rewardAiba' },
                    totalNeur: { $sum: '$rewardNeur' },
                    battles: { $sum: 1 },
                },
            },
            { $sort: by === 'score' ? { totalScore: -1 } : by === 'aiba' ? { totalAiba: -1 } : by === 'neur' ? { totalNeur: -1 } : { battles: -1 } },
            { $limit: limit },
            { $lookup: { from: 'users', localField: '_id', foreignField: 'telegramId', as: 'user' } },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    telegramId: '$_id',
                    username: { $ifNull: ['$user.username', '$user.telegram.username', ''] },
                    badges: { $ifNull: ['$user.badges', []] },
                    totalScore: 1,
                    totalAiba: 1,
                    totalNeur: 1,
                    battles: 1,
                },
            },
        ]);

        agg.forEach((row, i) => {
            row.rank = i + 1;
        });

        res.json(agg);
    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/leaderboard/my-rank — current user's rank (by score) for "top leaders create group free" logic
router.get('/my-rank', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const Battle = require('../models/Battle');
        const userScore = await Battle.aggregate([
            { $match: { ownerTelegramId: telegramId } },
            { $group: { _id: null, totalScore: { $sum: '$score' }, totalAiba: { $sum: '$rewardAiba' }, totalNeur: { $sum: '$rewardNeur' }, battles: { $sum: 1 } } },
        ]);
        const totalScore = userScore[0]?.totalScore ?? 0;
        const betterCount = await Battle.aggregate([
            { $group: { _id: '$ownerTelegramId', totalScore: { $sum: '$score' } } },
            { $match: { totalScore: { $gt: totalScore } } },
            { $count: 'n' },
        ]);
        const rank = (betterCount[0]?.n ?? 0) + 1;
        res.json({
            rank,
            totalScore,
            totalAiba: userScore[0]?.totalAiba ?? 0,
            totalNeur: userScore[0]?.totalNeur ?? 0,
            battles: userScore[0]?.battles ?? 0,
        });
    } catch (err) {
        console.error('Leaderboard my-rank error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
