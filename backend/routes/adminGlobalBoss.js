const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const GlobalBoss = require('../models/GlobalBoss');
const { validateBody } = require('../middleware/validate');

// POST /api/admin/global-boss — create a new boss (deactivates previous active)
router.post(
    '/',
    requireAdmin(),
    validateBody({
        name: { type: 'string', trim: true, minLength: 1, maxLength: 100, required: true },
        totalHp: { type: 'integer', min: 1, required: true },
        rewardPoolAiba: { type: 'number', min: 0 },
    }),
    async (req, res) => {
    try {
        await GlobalBoss.updateMany({ status: 'active' }, { status: 'defeated', defeatedAt: new Date() });
        const boss = await GlobalBoss.create({
            name: req.validatedBody?.name,
            totalHp: Math.max(1, Number(req.validatedBody?.totalHp)),
            currentHp: Math.max(1, Number(req.validatedBody?.totalHp)),
            rewardPoolAiba: Math.max(0, Math.floor(Number(req.validatedBody?.rewardPoolAiba ?? 0))),
            status: 'active',
        });
        res.status(201).json(boss);
    } catch (err) {
        console.error('Admin global boss create error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
