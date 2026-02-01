const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Broker = require('../models/Broker');
const User = require('../models/User');
const { getConfig, recordSpendNeur } = require('../engine/economy');

// Create a starter broker (server-side)
router.post('/starter', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const broker = await Broker.create({
            ownerTelegramId: telegramId,
            risk: 50,
            intelligence: 50,
            speed: 50,
            specialty: 'crypto',
            energy: 10,
        });

        res.status(201).json(broker);
    } catch (err) {
        console.error('Error creating starter broker:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// List my brokers
router.get('/mine', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const brokers = await Broker.find({ ownerTelegramId: telegramId }).sort({ createdAt: -1 }).lean();
        res.json(brokers);
    } catch (err) {
        console.error('Error listing brokers:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// Train a broker (NEUR sink)
// POST /api/brokers/train { brokerId, stat: "intelligence"|"speed"|"risk" }
router.post('/train', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramUser?.id ? String(req.telegramUser.id) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const brokerId = String(req.body?.brokerId || '').trim();
        const stat = String(req.body?.stat || '').trim();
        if (!brokerId) return res.status(400).json({ error: 'brokerId required' });
        if (!['intelligence', 'speed', 'risk'].includes(stat)) return res.status(400).json({ error: 'invalid stat' });

        const broker = await Broker.findById(brokerId);
        if (!broker) return res.status(404).json({ error: 'broker not found' });
        if (String(broker.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your broker' });

        const cfg = await getConfig();
        const cost = Math.max(0, Math.floor(Number(cfg.trainNeurCost ?? 0)));
        if (cost <= 0) return res.status(500).json({ error: 'trainNeurCost not configured' });

        // Atomic NEUR spend
        const user = await User.findOneAndUpdate(
            { telegramId, neurBalance: { $gte: cost } },
            { $inc: { neurBalance: -cost }, $setOnInsert: { telegramId } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean();

        if (!user) return res.status(403).json({ error: 'insufficient NEUR' });

        await recordSpendNeur(cost, { reason: 'train', arena: 'training' });

        // Apply training effect
        broker[stat] = Math.max(0, Math.min(100, Number(broker[stat] ?? 0) + 1));
        broker.xp = Number(broker.xp ?? 0) + 5;
        await broker.save();

        res.json({ ok: true, broker: broker.toObject(), neurBalance: user.neurBalance });
    } catch (err) {
        console.error('Error training broker:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;

