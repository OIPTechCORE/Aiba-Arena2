const router = require('express').Router();
const GameMode = require('../models/GameMode');

// Public listing for miniapp
// GET /api/game-modes?arena=prediction&league=rookie
router.get('/', async (req, res) => {
    try {
        const arena = req.query?.arena ? String(req.query.arena).trim() : null;
        const league = req.query?.league ? String(req.query.league).trim() : null;

        const q = { enabled: true };
        if (arena) q.arena = arena;
        if (league) q.league = league;

        const modes = await GameMode.find(q).sort({ arena: 1, league: 1, key: 1 }).lean();
        res.json(modes);
    } catch (err) {
        console.error('Error fetching game modes:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;

