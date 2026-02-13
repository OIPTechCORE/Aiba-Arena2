const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Broker = require('../models/Broker');
const BrokerRental = require('../models/BrokerRental');
const { getConfig, debitAibaFromUser, creditAibaNoCap } = require('../engine/economy');
const { validateBody } = require('../middleware/validate');

// GET /api/broker-rental — list available rentals
router.get('/', async (req, res) => {
    try {
        const list = await BrokerRental.find({ status: 'listed' })
            .populate('brokerId')
            .sort({ priceAibaPerHour: 1 })
            .limit(50)
            .lean();
        res.json(list);
    } catch (err) {
        console.error('Broker rental list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/broker-rental/list — list your broker for rent
router.post(
    '/list',
    requireTelegram,
    validateBody({
        brokerId: { type: 'objectId', required: true },
        priceAibaPerHour: { type: 'number', min: 1, required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const broker = await Broker.findById(req.validatedBody?.brokerId);
        if (!broker || String(broker.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'invalid broker' });
        if (broker.guildId) return res.status(400).json({ error: 'withdraw from guild first' });
        const existing = await BrokerRental.findOne({ brokerId: broker._id, status: { $in: ['listed', 'rented'] } });
        if (existing) return res.status(409).json({ error: 'broker already listed' });
        const rental = await BrokerRental.create({
            brokerId: broker._id,
            ownerTelegramId: telegramId,
            priceAibaPerHour: Math.floor(Number(req.validatedBody?.priceAibaPerHour) || 1),
            status: 'listed',
        });
        res.status(201).json(rental);
    } catch (err) {
        console.error('Broker rental list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// POST /api/broker-rental/:id/rent — rent a broker (pay for 1 hour)
router.post('/:id/rent', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const rental = await BrokerRental.findById(req.params.id).populate('brokerId');
        if (!rental || rental.status !== 'listed') return res.status(404).json({ error: 'rental not found' });
        const cost = rental.priceAibaPerHour;
        const cfg = await getConfig();
        const feeBps = Math.min(10000, Number(cfg.brokerRentalFeeBps ?? 2000));
        const platformFee = Math.floor((cost * feeBps) / 10000);
        const ownerGets = cost - platformFee;
        const debit = await debitAibaFromUser(cost, {
            telegramId,
            reason: 'broker_rental',
            arena: 'rental',
            league: 'global',
            sourceType: 'broker_rental',
            sourceId: String(rental._id),
            requestId: req.requestId || '',
            meta: { rentalId: String(rental._id), ownerGets },
        });
        if (!debit.ok) return res.status(403).json({ error: 'insufficient AIBA' });
        const returnAt = new Date(Date.now() + 60 * 60 * 1000);
        await BrokerRental.updateOne(
            { _id: rental._id },
            { status: 'rented', rentedByTelegramId: telegramId, rentedAt: new Date(), returnAt },
        );
        await Broker.updateOne({ _id: rental.brokerId._id }, { $set: { rentedByTelegramId: telegramId, rentedUntil: returnAt } });
        await creditAibaNoCap(ownerGets, {
            telegramId: rental.ownerTelegramId,
            reason: 'broker_rental_income',
            arena: 'rental',
            league: 'global',
            sourceType: 'broker_rental',
            sourceId: String(rental._id),
            meta: { fromTelegramId: telegramId },
        });
        res.json({ ok: true, returnAt, brokerId: rental.brokerId._id });
    } catch (err) {
        console.error('Broker rent error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/broker-rental/:id/unlist — unlist your broker
router.post('/:id/unlist', requireTelegram, async (req, res) => {
    try {
        const rental = await BrokerRental.findById(req.params.id);
        if (!rental || String(rental.ownerTelegramId) !== req.telegramId) return res.status(403).json({ error: 'forbidden' });
        if (rental.status === 'rented') return res.status(400).json({ error: 'wait for rental to expire' });
        await BrokerRental.updateOne({ _id: rental._id }, { status: 'unlisted' });
        res.json({ ok: true });
    } catch (err) {
        console.error('Broker unlist error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
