const router = require('express').Router();
const User = require('../models/User');
const { requireTelegram } = require('../middleware/requireTelegram');
const ActionRunKey = require('../models/ActionRunKey');
const { getIdempotencyKey } = require('../engine/idempotencyKey');
const { tryEmitAiba, creditAibaNoCap } = require('../engine/economy');

// Exported handler for easier testing
async function postScoreHandler(req, res) {
    try {
        // Legacy endpoint: do not allow in production (battle route + economy engine supersede it).
        const strict = process.env.APP_ENV === 'prod' || process.env.NODE_ENV === 'production';
        if (strict) return res.status(410).json({ error: 'deprecated' });

        const telegramId = req.telegramId ? String(req.telegramId).trim() : '';
        if (!telegramId) return res.status(400).json({ error: 'telegramId required' });

        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });

        const numericScore = Number(req.body?.score);
        if (!Number.isFinite(numericScore) || numericScore < 0) {
            return res.status(400).json({ error: 'score must be a non-negative number' });
        }

        // Keep rewards integer to avoid floating-point issues in token accounting
        if (!Number.isInteger(numericScore)) {
            return res.status(400).json({ error: 'score must be an integer' });
        }

        const reward = numericScore * 2;

        // Idempotency lock to avoid double-emissions on retries.
        const lockTtlMs = 5 * 60 * 1000;
        let runKey = null;
        let createdLock = false;
        try {
            runKey = await ActionRunKey.create({
                scope: 'game_score',
                requestId,
                ownerTelegramId: telegramId,
                status: 'in_progress',
                expiresAt: new Date(Date.now() + lockTtlMs),
            });
            createdLock = true;
        } catch (err) {
            if (String(err?.code) !== '11000') throw err;
            runKey = await ActionRunKey.findOne({ scope: 'game_score', requestId, ownerTelegramId: telegramId }).lean();
        }

        if (runKey?.status === 'completed' && runKey?.response) return res.json(runKey.response);
        if (!createdLock && runKey?.status === 'in_progress')
            return res.status(409).json({ error: 'in_progress', retryAfterMs: 1500 });

        // Allow retry after failures.
        if (!createdLock && runKey?.status === 'failed') {
            await ActionRunKey.updateOne(
                { _id: runKey._id },
                {
                    $set: {
                        status: 'in_progress',
                        errorCode: '',
                        errorMessage: '',
                        expiresAt: new Date(Date.now() + lockTtlMs),
                    },
                },
            );
        }

        let credited = 0;
        if (reward > 0) {
            const emit = await tryEmitAiba(reward, { arena: 'game', league: 'global' });
            if (emit.ok) {
                credited = reward;
                await creditAibaNoCap(credited, {
                    telegramId,
                    reason: 'game_reward',
                    arena: 'game',
                    league: 'global',
                    sourceType: 'game_score',
                    sourceId: requestId,
                    requestId,
                    meta: { score: numericScore },
                });
            }
        }

        const user = await User.findOne({ telegramId }).lean();
        const response = { reward: credited, aibaBalance: user?.aibaBalance ?? 0, requestId };
        if (runKey?._id) {
            await ActionRunKey.updateOne(
                { _id: runKey._id },
                {
                    $set: {
                        status: 'completed',
                        response,
                        errorCode: '',
                        errorMessage: '',
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                },
            ).catch(() => {});
        }

        res.json(response);
    } catch (err) {
        console.error('Error in /api/game/score:', err);
        res.status(500).json({ error: 'internal server error' });
    }
}

router.post('/score', requireTelegram, postScoreHandler);

module.exports = router;
module.exports.postScoreHandler = postScoreHandler;
