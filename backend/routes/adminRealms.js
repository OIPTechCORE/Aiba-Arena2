const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const Realm = require('../models/Realm');
const { validateBody } = require('../middleware/validate');

router.use(requireAdmin());

router.get('/', async (_req, res) => {
    const realms = await Realm.find({}).sort({ level: 1, order: 1 }).lean();
    res.json({ realms });
});

router.post(
    '/',
    validateBody({
        key: { type: 'string', trim: true, minLength: 1, maxLength: 100, required: true },
        name: { type: 'string', trim: true, maxLength: 200 },
        description: { type: 'string', trim: true, maxLength: 2000 },
        level: { type: 'integer', min: 1, max: 100 },
        order: { type: 'integer', min: 0 },
        active: { type: 'boolean' },
        unlockCriteria: { type: 'object' },
        tracks: { type: 'array', itemType: 'string' },
    }),
    async (req, res) => {
    const body = req.validatedBody || {};
    if (!body.key) return res.status(400).json({ error: 'key required' });
    const realm = {
        key: body.key,
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.level !== undefined ? { level: body.level } : {}),
        ...(body.order !== undefined ? { order: body.order } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.unlockCriteria !== undefined ? { unlockCriteria: body.unlockCriteria } : {}),
        ...(body.tracks !== undefined ? { tracks: body.tracks } : {}),
    };
    const updated = await Realm.findOneAndUpdate({ key: realm.key }, { $set: realm }, { upsert: true, new: true });
    res.json({ realm: updated });
    },
);

module.exports = router;
