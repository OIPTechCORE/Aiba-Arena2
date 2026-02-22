const router = require('express').Router();
const MemeFiConfig = require('../models/MemeFiConfig');
const MemeAppeal = require('../models/MemeAppeal');
const Meme = require('../models/Meme');
const MemeTemplate = require('../models/MemeTemplate');
const User = require('../models/User');
const { requireAdmin } = require('../middleware/requireAdmin');
const { adminAudit } = require('../middleware/adminAudit');
const { validateBody, validateParams } = require('../middleware/validate');

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

// PATCH /api/admin/memefi/config — full extension fields (educationWeights, autoHide, categoryPools, weekly, caps, reactionWeights, educationCreatorBadge)
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
        educationWeights: { type: 'object' },
        autoHideReportThreshold: { type: 'number', min: 0 },
        categoryPools: { type: 'object' },
        weeklyPoolAiba: { type: 'number', min: 0 },
        weeklyPoolNeur: { type: 'number', min: 0 },
        weeklyTopN: { type: 'integer', min: 1, max: 50 },
        maxAibaPerUserPerDay: { type: 'number', min: 0 },
        maxNeurPerUserPerDay: { type: 'number', min: 0 },
        reactionWeights: { type: 'object' },
        educationCreatorBadgeMinMemeCount: { type: 'integer', min: 1 },
        educationCreatorBadgeMinScore: { type: 'number', min: 0 },
        creatorTiers: {
            type: 'array',
            items: { type: 'object', keys: ['tier', 'minMemes', 'minTotalScore', 'rewardMultiplier'] },
        },
    }),
    async (req, res) => {
        try {
            let cfg = await MemeFiConfig.findOne();
            if (!cfg) cfg = await MemeFiConfig.create({});

            const body = req.validatedBody || {};
            const upd = {};
            const numKeys = [
                'weightLike',
                'weightComment',
                'weightInternalShare',
                'weightExternalShare',
                'boostMultiplierPerUnit',
                'timeDecayHalfLifeHours',
                'dailyPoolAiba',
                'dailyPoolNeur',
                'poolPctTop10',
                'poolPctBoosters',
                'poolPctLottery',
                'poolPctMining',
                'topN',
                'lotteryWinnersCount',
                'boostLockHours',
                'boostMinAiba',
                'autoHideReportThreshold',
                'weeklyPoolAiba',
                'weeklyPoolNeur',
                'weeklyTopN',
                'maxAibaPerUserPerDay',
                'maxNeurPerUserPerDay',
                'educationCreatorBadgeMinMemeCount',
                'educationCreatorBadgeMinScore',
            ];
            for (const k of numKeys) {
                if (body[k] !== undefined && body[k] !== null) upd[k] = Number(body[k]);
            }
            if (Array.isArray(body.educationCategories)) upd.educationCategories = body.educationCategories;
            if (body.educationWeights !== undefined && typeof body.educationWeights === 'object')
                upd.educationWeights = body.educationWeights;
            if (body.categoryPools !== undefined && typeof body.categoryPools === 'object')
                upd.categoryPools = body.categoryPools;
            if (body.reactionWeights !== undefined && typeof body.reactionWeights === 'object')
                upd.reactionWeights = body.reactionWeights;
            if (Array.isArray(body.creatorTiers)) upd.creatorTiers = body.creatorTiers;

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

// GET /api/admin/memefi/appeals — list appeals (?status=pending|approved|rejected or omit for all)
router.get('/appeals', async (req, res) => {
    try {
        const status = (req.query.status || '').trim();
        const query = status ? { status } : {};
        const list = await MemeAppeal.find(query).sort({ createdAt: -1 }).limit(200).lean();
        res.json(list);
    } catch (err) {
        console.error('Admin MemeFi appeals list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// PATCH /api/admin/memefi/appeals/:id — resolve appeal (approved → set Meme.hidden = false; rejected → no change)
router.patch(
    '/appeals/:id',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({ status: { type: 'string', enum: ['approved', 'rejected'], required: true } }),
    async (req, res) => {
        try {
            const appealId = req.validatedParams.id;
            const newStatus = req.validatedBody.status;
            const appeal = await MemeAppeal.findById(appealId);
            if (!appeal) return res.status(404).json({ error: 'appeal not found' });
            if (appeal.status !== 'pending') return res.status(400).json({ error: 'appeal already resolved' });

            await MemeAppeal.updateOne(
                { _id: appealId },
                {
                    $set: {
                        status: newStatus,
                        reviewedAt: new Date(),
                        reviewedBy: (req.admin && (req.admin.id || req.admin.telegramId || req.admin.email)) || 'admin',
                    },
                },
            );
            if (newStatus === 'approved') {
                await Meme.updateOne({ _id: appeal.memeId }, { $set: { hidden: false, hiddenReason: '' } });
            }
            const updated = await MemeAppeal.findById(appealId).lean();
            res.json(updated);
        } catch (err) {
            console.error('Admin MemeFi appeal resolve error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// PATCH /api/admin/memefi/users/:telegramId/trusted — set memefiTrusted (P5)
router.patch(
    '/users/:telegramId/trusted',
    validateParams({ telegramId: { type: 'string', minLength: 1, required: true } }),
    validateBody({ trusted: { type: 'boolean', required: true } }),
    async (req, res) => {
        try {
            const telegramId = String(req.validatedParams.telegramId).trim();
            const trusted = !!req.validatedBody.trusted;
            await User.updateOne({ telegramId }, { $set: { memefiTrusted: trusted } });
            const user = await User.findOne({ telegramId }).select('telegramId memefiTrusted').lean();
            if (!user) return res.status(404).json({ error: 'user not found' });
            res.json(user);
        } catch (err) {
            console.error('Admin MemeFi trusted patch error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// --- Meme templates (for create picker) ---

// GET /api/admin/memefi/templates
router.get('/templates', async (_req, res) => {
    try {
        const list = await MemeTemplate.find().sort({ sortOrder: 1, name: 1 }).lean();
        res.json(list);
    } catch (err) {
        console.error('Admin MemeFi templates list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/admin/memefi/templates
router.post(
    '/templates',
    validateBody({
        name: { type: 'string', trim: true, minLength: 1, maxLength: 100, required: true },
        imageUrl: { type: 'string', trim: true, minLength: 1, maxLength: 2048, required: true },
        category: { type: 'string', trim: true, maxLength: 50 },
        sortOrder: { type: 'number', min: 0 },
        enabled: { type: 'boolean' },
    }),
    async (req, res) => {
        try {
            const body = req.validatedBody || {};
            const t = await MemeTemplate.create({
                name: body.name.trim(),
                imageUrl: body.imageUrl.trim(),
                category: (body.category || 'general').trim(),
                sortOrder: Math.max(0, Number(body.sortOrder) || 0),
                enabled: body.enabled !== false,
            });
            res.status(201).json(t);
        } catch (err) {
            console.error('Admin MemeFi template create error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// PATCH /api/admin/memefi/templates/:id
router.patch(
    '/templates/:id',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({
        name: { type: 'string', trim: true, maxLength: 100 },
        imageUrl: { type: 'string', trim: true, maxLength: 2048 },
        category: { type: 'string', trim: true, maxLength: 50 },
        sortOrder: { type: 'number', min: 0 },
        enabled: { type: 'boolean' },
    }),
    async (req, res) => {
        try {
            const upd = {};
            const body = req.validatedBody || {};
            if (body.name !== undefined) upd.name = body.name.trim();
            if (body.imageUrl !== undefined) upd.imageUrl = body.imageUrl.trim();
            if (body.category !== undefined) upd.category = body.category.trim();
            if (body.sortOrder !== undefined) upd.sortOrder = Math.max(0, Number(body.sortOrder));
            if (body.enabled !== undefined) upd.enabled = !!body.enabled;
            const t = await MemeTemplate.findByIdAndUpdate(req.validatedParams.id, { $set: upd }, { new: true }).lean();
            if (!t) return res.status(404).json({ error: 'template not found' });
            res.json(t);
        } catch (err) {
            console.error('Admin MemeFi template patch error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// DELETE /api/admin/memefi/templates/:id
router.delete('/templates/:id', validateParams({ id: { type: 'objectId', required: true } }), async (req, res) => {
    try {
        const t = await MemeTemplate.findByIdAndDelete(req.validatedParams.id);
        if (!t) return res.status(404).json({ error: 'template not found' });
        res.json({ ok: true });
    } catch (err) {
        console.error('Admin MemeFi template delete error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
