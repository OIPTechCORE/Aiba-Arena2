const router = require('express').Router();
const MemeFiConfig = require('../models/MemeFiConfig');
const { requireAdmin } = require('../middleware/requireAdmin');
const { adminAudit } = require('../middleware/adminAudit');
const { validateBody } = require('../middleware/validate');

router.use(requireAdmin(), adminAudit());

// GET /api/admin/memefi/config
router.get('/config', async (_req, res) => {
    try {
        let cfg = await MemeFiConfig.findOne().lean();
        if (!cfg) {
            const created = await MemeFiConfig.create({});
            cfg = created.toObject();
        }
        res.json(cfg);
    } catch (err) {
        console.error('Admin MemeFi config get error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// PATCH /api/admin/memefi/config
router.patch(
    '/config',
    validateBody({
        weightLike: { type: 'number', min: 0 },
        weightComment: { type: 'number', min: 0 },
        weightInternalShare: { type: 'number', min: 0 },
        weightExternalShare: { type: 'number', min: 0 },
        boostMultiplierPerUnit: { type: 'number', min: 0 },
        timeDecayHalfLifeHours: { type: 'number', min: 0 },
        dailyPoolAiba: { type: 'number', min: 0 },
        dailyPoolNeur: { type: 'number', min: 0 },
        poolPctTop10: { type: 'number', min: 0, max: 100 },
        poolPctBoosters: { type: 'number', min: 0, max: 100 },
        poolPctLottery: { type: 'number', min: 0, max: 100 },
        poolPctMining: { type: 'number', min: 0, max: 100 },
        topN: { type: 'integer', min: 1, max: 100 },
        lotteryWinnersCount: { type: 'integer', min: 1, max: 100 },
        boostLockHours: { type: 'number', min: 0 },
        boostMinAiba: { type: 'number', min: 0 },
        educationCategories: { type: 'array', itemType: 'string' },
    }),
    async (req, res) => {
        try {
            let cfg = await MemeFiConfig.findOne();
            if (!cfg) cfg = await MemeFiConfig.create({});

            const body = req.validatedBody || {};
            const upd = {};
            const numKeys = [
                'weightLike', 'weightComment', 'weightInternalShare', 'weightExternalShare',
                'boostMultiplierPerUnit', 'timeDecayHalfLifeHours', 'dailyPoolAiba', 'dailyPoolNeur',
                'poolPctTop10', 'poolPctBoosters', 'poolPctLottery', 'poolPctMining',
                'topN', 'lotteryWinnersCount', 'boostLockHours', 'boostMinAiba',
            ];
            for (const k of numKeys) {
                if (body[k] !== undefined && body[k] !== null) upd[k] = Number(body[k]);
            }
            if (Array.isArray(body.educationCategories)) upd.educationCategories = body.educationCategories;

            if (Object.keys(upd).length > 0) {
                await MemeFiConfig.updateOne({ _id: cfg._id }, { $set: upd });
            }
            const updated = await MemeFiConfig.findById(cfg._id).lean();
            res.json(updated);
        } catch (err) {
            console.error('Admin MemeFi config patch error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

module.exports = router;
