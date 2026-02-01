const router = require('express').Router();
const Ad = require('../models/Ad');
const { requireAdmin } = require('../middleware/requireAdmin');

router.use(requireAdmin());

// GET /api/admin/ads
router.get('/', async (_req, res) => {
    const ads = await Ad.find().sort({ createdAt: -1 }).lean();
    res.json(ads);
});

// POST /api/admin/ads
router.post('/', async (req, res) => {
    const imageUrl = String(req.body?.imageUrl || '').trim();
    const linkUrl = String(req.body?.linkUrl || '').trim();
    const placement = String(req.body?.placement || 'between_battles').trim();
    const weight = Number(req.body?.weight ?? 1);
    const active = req.body?.active === undefined ? true : Boolean(req.body.active);
    const startsAt = req.body?.startsAt ? new Date(req.body.startsAt) : null;
    const endsAt = req.body?.endsAt ? new Date(req.body.endsAt) : null;

    if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' });
    if (Number.isNaN(weight) || weight <= 0) return res.status(400).json({ error: 'weight must be > 0' });

    const ad = await Ad.create({ imageUrl, linkUrl, placement, weight, active, startsAt, endsAt });
    res.status(201).json(ad);
});

// PATCH /api/admin/ads/:id
router.patch('/:id', async (req, res) => {
    const update = {};
    if (req.body?.imageUrl !== undefined) update.imageUrl = String(req.body.imageUrl || '').trim();
    if (req.body?.linkUrl !== undefined) update.linkUrl = String(req.body.linkUrl || '').trim();
    if (req.body?.placement !== undefined) update.placement = String(req.body.placement || '').trim();
    if (req.body?.weight !== undefined) update.weight = Number(req.body.weight);
    if (req.body?.active !== undefined) update.active = Boolean(req.body.active);
    if (req.body?.startsAt !== undefined) update.startsAt = req.body.startsAt ? new Date(req.body.startsAt) : null;
    if (req.body?.endsAt !== undefined) update.endsAt = req.body.endsAt ? new Date(req.body.endsAt) : null;

    if (update.imageUrl !== undefined && !update.imageUrl)
        return res.status(400).json({ error: 'imageUrl cannot be empty' });
    if (update.weight !== undefined && (Number.isNaN(update.weight) || update.weight <= 0))
        return res.status(400).json({ error: 'weight must be > 0' });

    const ad = await Ad.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!ad) return res.status(404).json({ error: 'not found' });
    res.json(ad);
});

// DELETE /api/admin/ads/:id
router.delete('/:id', async (req, res) => {
    const deleted = await Ad.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: true });
});

module.exports = router;
