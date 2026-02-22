const router = require('express').Router();
const Ad = require('../models/Ad');
const { requireTelegram } = require('../middleware/requireTelegram');
const { validateQuery } = require('../middleware/validate');
const { getLimit } = require('../util/pagination');

// Ads endpoint for miniapp (Telegram auth required)
// GET /api/ads?placement=between_battles
router.get(
    '/',
    requireTelegram,
    validateQuery({
        placement: { type: 'string', trim: true, maxLength: 50 },
    }),
    async (req, res) => {
        try {
            const placement = req.validatedQuery?.placement || 'between_battles';
            const now = new Date();

            const ads = await Ad.find({
                active: true,
                placement,
                $and: [
                    { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
                    { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
                ],
            })
                .sort({ weight: -1, createdAt: -1 })
                .limit(25)
                .lean();

            res.json(ads);
        } catch (err) {
            console.error('Error fetching ads:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

module.exports = router;
