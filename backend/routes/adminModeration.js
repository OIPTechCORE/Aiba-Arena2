const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const User = require('../models/User');
const Broker = require('../models/Broker');

router.use(requireAdmin());

// POST /api/admin/mod/ban-user
router.post('/ban-user', async (req, res) => {
    const telegramId = String(req.body?.telegramId || '').trim();
    const minutes = Number(req.body?.minutes ?? 60 * 24);
    const reason = String(req.body?.reason || 'banned').trim();

    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });
    if (!Number.isFinite(minutes) || minutes <= 0) return res.status(400).json({ error: 'minutes must be > 0' });

    const bannedUntil = new Date(Date.now() + Math.floor(minutes * 60 * 1000));

    const user = await User.findOneAndUpdate(
        { telegramId },
        { $set: { bannedUntil, bannedReason: reason } },
        { new: true, upsert: true }
    ).lean();

    res.json(user);
});

// POST /api/admin/mod/unban-user
router.post('/unban-user', async (req, res) => {
    const telegramId = String(req.body?.telegramId || '').trim();
    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });

    const user = await User.findOneAndUpdate(
        { telegramId },
        { $set: { bannedUntil: null, bannedReason: '' } },
        { new: true }
    ).lean();
    res.json(user || { ok: true });
});

// POST /api/admin/mod/ban-broker
router.post('/ban-broker', async (req, res) => {
    const brokerId = String(req.body?.brokerId || '').trim();
    const reason = String(req.body?.reason || 'broker banned').trim();
    if (!brokerId) return res.status(400).json({ error: 'brokerId required' });

    const broker = await Broker.findByIdAndUpdate(brokerId, { $set: { banned: true, banReason: reason } }, { new: true }).lean();
    if (!broker) return res.status(404).json({ error: 'not found' });
    res.json(broker);
});

// POST /api/admin/mod/unban-broker
router.post('/unban-broker', async (req, res) => {
    const brokerId = String(req.body?.brokerId || '').trim();
    if (!brokerId) return res.status(400).json({ error: 'brokerId required' });

    const broker = await Broker.findByIdAndUpdate(brokerId, { $set: { banned: false, banReason: '' } }, { new: true }).lean();
    if (!broker) return res.status(404).json({ error: 'not found' });
    res.json(broker);
});

module.exports = router;

