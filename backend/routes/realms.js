const express = require('express');
const Realm = require('../models/Realm');
const { requireAdmin } = require('../middleware/requireAdmin');

const router = express.Router();

router.get('/', async (_req, res) => {
    const realms = await Realm.find({ active: true }).sort({ level: 1, order: 1 }).lean();
    res.json({ realms });
});

router.get('/:key', async (req, res) => {
    const realm = await Realm.findOne({ key: req.params.key }).lean();
    if (!realm) return res.status(404).json({ error: 'Realm not found' });
    res.json({ realm });
});

// Admin seed/upsert (optional)
router.post('/seed', requireAdmin, async (req, res) => {
    const realms = Array.isArray(req.body?.realms) ? req.body.realms : [];
    const ops = realms.map((r) => ({
        updateOne: {
            filter: { key: r.key },
            update: { $set: r },
            upsert: true,
        },
    }));
    if (ops.length) await Realm.bulkWrite(ops, { ordered: false });
    res.json({ ok: true, count: ops.length });
});

module.exports = router;
