const router = require('express').Router();
const User = require('../models/User');
const { requireTelegram } = require('../middleware/requireTelegram');

// Exported handler for easier testing
async function postScoreHandler(req, res) {
    try {
        const telegramId = req.telegramId ? String(req.telegramId).trim() : '';
        if (!telegramId) return res.status(400).json({ error: 'telegramId required' });

        const numericScore = Number(req.body?.score);
        if (!Number.isFinite(numericScore) || numericScore < 0) {
            return res.status(400).json({ error: 'score must be a non-negative number' });
        }

        // Keep rewards integer to avoid floating-point issues in token accounting
        if (!Number.isInteger(numericScore)) {
            return res.status(400).json({ error: 'score must be an integer' });
        }

        const reward = numericScore * 2;

        const user = await User.findOneAndUpdate(
            { telegramId },
            { $inc: { pendingAIBA: reward }, $setOnInsert: { telegramId } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean();

        res.json({ reward, pendingAIBA: user?.pendingAIBA ?? reward });
    } catch (err) {
        console.error('Error in /api/game/score:', err);
        res.status(500).json({ error: 'internal server error' });
    }
}

router.post('/score', requireTelegram, postScoreHandler);

module.exports = router;
module.exports.postScoreHandler = postScoreHandler;