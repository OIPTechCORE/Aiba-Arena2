const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const Realm = require('../models/Realm');

router.use(requireAdmin());

router.get('/', async (_req, res) => {
    const realms = await Realm.find({}).sort({ level: 1, order: 1 }).lean();
    res.json({ realms });
});

router.post('/', async (req, res) => {
    const realm = req.body || {};
    if (!realm.key) return res.status(400).json({ error: 'key required' });
    const updated = await Realm.findOneAndUpdate({ key: realm.key }, { $set: realm }, { upsert: true, new: true });
    res.json({ realm: updated });
});

module.exports = router;
