const express = require('express');
const Realm = require('../models/Realm');
const { requireAdmin } = require('../middleware/requireAdmin');
const { validateBody, validateParams } = require('../middleware/validate');

const router = express.Router();

router.get('/', async (_req, res) => {
    const realms = await Realm.find({ active: true }).sort({ level: 1, order: 1 }).lean();
    res.json({ realms });
});

router.get(
    '/:key',
    validateParams({ key: { type: 'string', trim: true, minLength: 1, maxLength: 100, required: true } }),
    async (req, res) => {
    const realm = await Realm.findOne({ key: req.validatedParams.key }).lean();
    if (!realm) return res.status(404).json({ error: 'Realm not found' });
    res.json({ realm });
    },
);

// Admin seed/upsert (optional)
router.post(
    '/seed',
    requireAdmin(),
    validateBody({
        realms: { type: 'array', itemType: 'object', required: true },
    }),
    async (req, res) => {
    const realms = Array.isArray(req.validatedBody?.realms) ? req.validatedBody.realms : [];
    const ops = realms.map((r) => ({
        updateOne: {
            filter: { key: r.key },
            update: { $set: r },
            upsert: true,
        },
    }));
    if (ops.length) await Realm.bulkWrite(ops, { ordered: false });
    res.json({ ok: true, count: ops.length });
    },
);

module.exports = router;
