const router = require('express').Router();
const Announcement = require('../models/Announcement');
const { requireTelegram } = require('../middleware/requireTelegram');

/**
 * GET /api/announcements?limit=20
 * Public feed: active, published announcements, newest first.
 */
router.get('/', requireTelegram, async (req, res) => {
    try {
        const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || 20));
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
});

module.exports = router;
