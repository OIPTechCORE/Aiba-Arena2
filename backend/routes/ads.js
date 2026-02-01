const router = require('express').Router();
const Ad = require('../models/Ad');

// Public ads endpoint for miniapp
// GET /api/ads?placement=between_battles
router.get('/', async (req, res) => {
    try {
        const placement = String(req.query?.placement || 'between_battles').trim();
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
});

module.exports = router;

