const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const NftUniverse = require('../models/NftUniverse');
const NftStake = require('../models/NftStake');
const { getLimit } = require('../util/pagination');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');
const { adminAudit } = require('../middleware/adminAudit');

router.use(requireAdmin(), adminAudit());

// GET /api/admin/multiverse/universes
router.get('/universes', async (req, res) => {
    try {
        const list = await NftUniverse.find({}).sort({ order: 1 }).lean();
        res.json(list);
    } catch (err) {
        console.error('Admin multiverse universes error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// PATCH /api/admin/multiverse/universes/:slug
router.patch(
    '/universes/:slug',
    validateParams({ slug: { type: 'string', trim: true, minLength: 1, maxLength: 50, required: true } }),
    validateBody({
        name: { type: 'string', trim: true, maxLength: 200 },
        description: { type: 'string', trim: true, maxLength: 2000 },
        mintCostAiba: { type: 'number', min: 0 },
        mintCostTonNano: { type: 'number', min: 0 },
        feeBps: { type: 'number', min: 0, max: 10000 },
        burnBps: { type: 'number', min: 0, max: 10000 },
        stakingEnabled: { type: 'boolean' },
        active: { type: 'boolean' },
        order: { type: 'number' },
    }),
    async (req, res) => {
    try {
        const slug = String(req.validatedParams.slug || '').trim();
        if (!slug) return res.status(400).json({ error: 'slug required' });
        const body = req.validatedBody && typeof req.validatedBody === 'object' ? req.validatedBody : {};
        const update = {};
        if (body.name !== undefined) update.name = String(body.name).trim();
        if (body.description !== undefined) update.description = String(body.description).trim();
        if (body.mintCostAiba !== undefined) {
            const v = Number(body.mintCostAiba);
            if (Number.isFinite(v) && v >= 0) update.mintCostAiba = v;
        }
        if (body.mintCostTonNano !== undefined) {
            const v = Number(body.mintCostTonNano);
            if (Number.isFinite(v) && v >= 0) update.mintCostTonNano = v;
        }
        if (body.feeBps !== undefined) {
            const v = Number(body.feeBps);
            if (Number.isFinite(v) && v >= 0 && v <= 10000) update.feeBps = v;
        }
        if (body.burnBps !== undefined) {
            const v = Number(body.burnBps);
            if (Number.isFinite(v) && v >= 0 && v <= 10000) update.burnBps = v;
        }
        if (body.stakingEnabled !== undefined) update.stakingEnabled = !!body.stakingEnabled;
        if (body.active !== undefined) update.active = !!body.active;
        if (body.order !== undefined) {
            const v = Number(body.order);
            if (Number.isFinite(v)) update.order = v;
        }
        const u = await NftUniverse.findOneAndUpdate({ slug }, { $set: update }, { new: true }).lean();
        if (!u) return res.status(404).json({ error: 'universe not found' });
        res.json(u);
    } catch (err) {
        console.error('Admin multiverse patch error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// GET /api/admin/multiverse/stakes — list all NFT stakes (optional: telegramId, universeSlug)
router.get(
    '/stakes',
    validateQuery({
        telegramId: { type: 'string', trim: true, maxLength: 50 },
        universeSlug: { type: 'string', trim: true, maxLength: 50 },
        limit: { type: 'integer', min: 1, max: 100 },
    }),
    async (req, res) => {
    try {
        const telegramId = req.validatedQuery?.telegramId ? String(req.validatedQuery.telegramId).trim() : null;
        const universeSlug = req.validatedQuery?.universeSlug ? String(req.validatedQuery.universeSlug).trim() : null;
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 50, maxLimit: 100 },
        );
        const q = {};
        if (telegramId) q.telegramId = telegramId;
        if (universeSlug) q.universeSlug = universeSlug;
        const list = await NftStake.find(q).populate('brokerId', 'ownerTelegramId level nftItemAddress').sort({ stakedAt: -1 }).limit(limit).lean();
        res.json({ stakes: list });
    } catch (err) {
        console.error('Admin multiverse stakes error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
