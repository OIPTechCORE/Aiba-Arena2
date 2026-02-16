const router = require('express').Router();
const GameMode = require('../models/GameMode');
const { validateQuery } = require('../middleware/validate');

// Public listing for miniapp (no auth required so arena dropdown loads before login)
// GET /api/game-modes?arena=prediction&league=rookie
router.get(
    '/',
    validateQuery({
        arena: { type: 'string', trim: true, maxLength: 50 },
        league: { type: 'string', trim: true, maxLength: 50 },
    }),
    async (req, res) => {
    try {
        const arena = req.validatedQuery?.arena || null;
        const league = req.validatedQuery?.league || null;

        const q = { enabled: true };
        if (arena) q.arena = arena;
        if (league) q.league = league;

        const modes = await GameMode.find(q).sort({ arena: 1, league: 1, key: 1 }).lean();
        res.json(modes);
    } catch (err) {
        console.error('Error fetching game modes:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
