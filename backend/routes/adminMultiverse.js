const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const NftUniverse = require('../models/NftUniverse');
const NftStake = require('../models/NftStake');

router.use(requireAdmin());

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
router.patch('/universes/:slug', async (req, res) => {
    try {
        const slug = String(req.params.slug || '').trim();
        if (!slug) return res.status(400).json({ error: 'slug required' });
        const body = req.body && typeof req.body === 'object' ? req.body : {};
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
});

// GET /api/admin/multiverse/stakes — list all NFT stakes (optional: telegramId, universeSlug)
router.get('/stakes', async (req, res) => {
    try {
        const telegramId = req.query?.telegramId ? String(req.query.telegramId).trim() : null;
        const universeSlug = req.query?.universeSlug ? String(req.query.universeSlug).trim() : null;
        const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || 50));
        const q = {};
        if (telegramId) q.telegramId = telegramId;
        if (universeSlug) q.universeSlug = universeSlug;
        const list = await NftStake.find(q).populate('brokerId', 'ownerTelegramId level nftItemAddress').sort({ stakedAt: -1 }).limit(limit).lean();
        res.json({ stakes: list });
    } catch (err) {
        console.error('Admin multiverse stakes error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
