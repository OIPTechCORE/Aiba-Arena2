const router = require('express').Router();
const Announcement = require('../models/Announcement');
const { requireTelegram } = require('../middleware/requireTelegram');
const { getLimit } = require('../util/pagination');
const { validateQuery } = require('../middleware/validate');

/**
 * GET /api/announcements?limit=20
 * Feed: active, published announcements, newest first (Telegram auth required).
 */
router.get(
    '/',
    requireTelegram,
    validateQuery({
        limit: { type: 'integer', min: 1, max: 100 },
    }),
    async (req, res) => {
    try {
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 20, maxLimit: 100 },
        );
        const now = new Date();

        const items = await Announcement.find({
            active: true,
            $or: [{ publishedAt: null }, { publishedAt: { $lte: now } }],
        })
            .sort({ priority: -1, publishedAt: -1, createdAt: -1 })
            .limit(limit)
            .select('title body type link publishedAt createdAt')
            .lean();

        res.json(items);
    } catch (err) {
        console.error('Announcements list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
