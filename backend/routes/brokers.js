const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Broker = require('../models/Broker');

// Create a starter broker (server-side)
router.post('/starter', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramUser?.id ? String(req.telegramUser.id) : '';
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
        const telegramId = req.telegramUser?.id ? String(req.telegramUser.id) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const brokers = await Broker.find({ ownerTelegramId: telegramId }).sort({ createdAt: -1 }).lean();
        res.json(brokers);
    } catch (err) {
        console.error('Error listing brokers:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;

