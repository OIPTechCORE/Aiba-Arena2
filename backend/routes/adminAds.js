const router = require('express').Router();
const Ad = require('../models/Ad');
const { requireAdmin } = require('../middleware/requireAdmin');
const { validateBody, validateParams } = require('../middleware/validate');

router.use(requireAdmin());

// GET /api/admin/ads
router.get('/', async (_req, res) => {
    const ads = await Ad.find().sort({ createdAt: -1 }).lean();
    res.json(ads);
});

// POST /api/admin/ads
router.post(
    '/',
    validateBody({
        imageUrl: { type: 'string', trim: true, minLength: 1, maxLength: 500, required: true },
        linkUrl: { type: 'string', trim: true, maxLength: 500 },
        placement: { type: 'string', trim: true, maxLength: 50 },
        weight: { type: 'number', min: 0.0001 },
        active: { type: 'boolean' },
        startsAt: { type: 'string', trim: true, maxLength: 50 },
        endsAt: { type: 'string', trim: true, maxLength: 50 },
    }),
    async (req, res) => {
    const imageUrl = String(req.validatedBody?.imageUrl || '').trim();
    const linkUrl = String(req.validatedBody?.linkUrl || '').trim();
    const placement = String(req.validatedBody?.placement || 'between_battles').trim();
    const weight = Number(req.validatedBody?.weight ?? 1);
    const active = req.validatedBody?.active === undefined ? true : Boolean(req.validatedBody.active);
    const startsAt = req.validatedBody?.startsAt ? new Date(req.validatedBody.startsAt) : null;
    const endsAt = req.validatedBody?.endsAt ? new Date(req.validatedBody.endsAt) : null;

    if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' });
    if (Number.isNaN(weight) || weight <= 0) return res.status(400).json({ error: 'weight must be > 0' });

    const ad = await Ad.create({ imageUrl, linkUrl, placement, weight, active, startsAt, endsAt });
    res.status(201).json(ad);
    },
);

// PATCH /api/admin/ads/:id
router.patch(
    '/:id',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({
        imageUrl: { type: 'string', trim: true, maxLength: 500 },
        linkUrl: { type: 'string', trim: true, maxLength: 500 },
        placement: { type: 'string', trim: true, maxLength: 50 },
        weight: { type: 'number', min: 0.0001 },
        active: { type: 'boolean' },
        startsAt: { type: 'string', trim: true, maxLength: 50 },
        endsAt: { type: 'string', trim: true, maxLength: 50 },
    }),
    async (req, res) => {
    const update = {};
    if (req.validatedBody?.imageUrl !== undefined) update.imageUrl = String(req.validatedBody.imageUrl || '').trim();
    if (req.validatedBody?.linkUrl !== undefined) update.linkUrl = String(req.validatedBody.linkUrl || '').trim();
    if (req.validatedBody?.placement !== undefined)
        update.placement = String(req.validatedBody.placement || '').trim();
    if (req.validatedBody?.weight !== undefined) update.weight = Number(req.validatedBody.weight);
    if (req.validatedBody?.active !== undefined) update.active = Boolean(req.validatedBody.active);
    if (req.validatedBody?.startsAt !== undefined)
        update.startsAt = req.validatedBody.startsAt ? new Date(req.validatedBody.startsAt) : null;
    if (req.validatedBody?.endsAt !== undefined)
        update.endsAt = req.validatedBody.endsAt ? new Date(req.validatedBody.endsAt) : null;

    if (update.imageUrl !== undefined && !update.imageUrl)
        return res.status(400).json({ error: 'imageUrl cannot be empty' });
    if (update.weight !== undefined && (Number.isNaN(update.weight) || update.weight <= 0))
        return res.status(400).json({ error: 'weight must be > 0' });

    const ad = await Ad.findByIdAndUpdate(req.validatedParams.id, update, { new: true }).lean();
    if (!ad) return res.status(404).json({ error: 'not found' });
    res.json(ad);
    },
);

// DELETE /api/admin/ads/:id
router.delete(
    '/:id',
    validateParams({ id: { type: 'objectId', required: true } }),
    async (req, res) => {
    const deleted = await Ad.findByIdAndDelete(req.validatedParams.id).lean();
    if (!deleted) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: true });
    },
);

module.exports = router;
