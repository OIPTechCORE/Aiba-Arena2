const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const Tournament = require('../models/Tournament');
const { validateBody } = require('../middleware/validate');

// POST /api/admin/tournaments — create a tournament
router.post(
    '/',
    requireAdmin(),
    validateBody({
        name: { type: 'string', trim: true, minLength: 1, maxLength: 100, required: true },
        arena: { type: 'string', trim: true, minLength: 1, required: true },
        league: { type: 'string', trim: true, maxLength: 32 },
        maxEntries: { type: 'integer', min: 2, max: 128 },
        entryCostAiba: { type: 'number', min: 0 },
    }),
    async (req, res) => {
        try {
            const t = await Tournament.create({
                name: req.validatedBody?.name,
                arena: req.validatedBody?.arena,
                league: req.validatedBody?.league ?? 'rookie',
                maxEntries: req.validatedBody?.maxEntries ?? 16,
                entryCostAiba: Math.max(0, Math.floor(Number(req.validatedBody?.entryCostAiba ?? 0))),
                status: 'open',
            });
            res.status(201).json(t);
        } catch (err) {
            console.error('Admin tournament create error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

module.exports = router;
