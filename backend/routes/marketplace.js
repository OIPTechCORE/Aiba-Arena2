const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Listing = require('../models/Listing');
const Broker = require('../models/Broker');
const { getConfig, debitAibaFromUser, creditAibaNoCap } = require('../engine/economy');
const { getIdempotencyKey } = require('../engine/idempotencyKey');
const { getLimit } = require('../util/pagination');
const { validateBody, validateQuery } = require('../middleware/validate');
const { SYSTEM_BROKERS, getSystemBroker } = require('../config/systemShop');

// GET /api/marketplace/system-brokers — catalog of brokers sold by the system (for AIBA)
router.get('/system-brokers', (_req, res) => {
    try {
        res.json(SYSTEM_BROKERS);
    } catch (err) {
        console.error('System brokers catalog error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/marketplace/buy-system-broker — purchase a broker from the system with AIBA
router.post(
    '/buy-system-broker',
    requireTelegram,
    validateBody({ catalogId: { type: 'string', trim: true, minLength: 1, maxLength: 64, required: true } }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const catalogId = String(req.validatedBody?.catalogId ?? '').trim();
        const entry = getSystemBroker(catalogId);
        if (!entry) return res.status(404).json({ error: 'catalog entry not found' });
        const requestId = getIdempotencyKey(req) || `sys-broker-${catalogId}-${Date.now()}`;
        const debit = await debitAibaFromUser(entry.priceAiba, {
            telegramId,
            reason: 'system_broker_buy',
            arena: 'marketplace',
            league: 'global',
            sourceType: 'system_shop',
            sourceId: catalogId,
            requestId,
            meta: { catalogId },
        });
        if (!debit.ok) return res.status(403).json({ error: debit.reason === 'insufficient' ? 'insufficient AIBA' : 'debit failed' });
        const broker = await Broker.create({
            ownerTelegramId: telegramId,
            intelligence: entry.intelligence,
            speed: entry.speed,
            risk: entry.risk,
            energy: 100,
        });
        res.status(201).json({ ok: true, broker: broker.toObject(), aibaBalance: debit.user?.aibaBalance ?? 0 });
    } catch (err) {
        console.error('Buy system broker error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// GET /api/marketplace/listings — active listings (with broker snapshot)
router.get(
    '/listings',
    requireTelegram,
    validateQuery({ limit: { type: 'integer', min: 1, max: 50 } }),
    async (req, res) => {
    try {
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 20, maxLimit: 50 },
        );
        const list = await Listing.find({ status: 'active' })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('brokerId')
            .lean();
        const out = list.map((l) => ({
            _id: l._id,
            brokerId: l.brokerId?._id,
            broker: l.brokerId
                ? {
                      intelligence: l.brokerId.intelligence,
                      speed: l.brokerId.speed,
                      risk: l.brokerId.risk,
                      level: l.brokerId.level,
                  }
                : null,
            sellerTelegramId: l.sellerTelegramId,
            priceAIBA: l.priceAIBA,
            priceNEUR: l.priceNEUR,
            createdAt: l.createdAt,
        }));
        res.json(out);
    } catch (err) {
        console.error('Marketplace listings error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// POST /api/marketplace/list — list a broker for sale
router.post(
    '/list',
    requireTelegram,
    validateBody({
        brokerId: { type: 'objectId', required: true },
        priceAIBA: { type: 'integer', min: 0, required: true },
        priceNEUR: { type: 'integer', min: 0 },
    }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const brokerId = req.validatedBody?.brokerId;
        const priceAIBA = req.validatedBody?.priceAIBA;
        const priceNEUR = req.validatedBody?.priceNEUR ?? 0;

        if (!brokerId) return res.status(400).json({ error: 'brokerId required' });
        if (!Number.isFinite(priceAIBA) || priceAIBA < 0) return res.status(400).json({ error: 'priceAIBA must be non-negative' });

        const broker = await Broker.findById(brokerId);
        if (!broker) return res.status(404).json({ error: 'broker not found' });
        if (String(broker.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your broker' });
        if (broker.guildId) return res.status(400).json({ error: 'withdraw broker from guild first' });

        const existing = await Listing.findOne({ brokerId, status: 'active' });
        if (existing) return res.status(409).json({ error: 'broker already listed' });

        const listing = await Listing.create({
            brokerId,
            sellerTelegramId: telegramId,
            priceAIBA,
            priceNEUR: priceNEUR >= 0 ? priceNEUR : 0,
            status: 'active',
        });
        res.status(201).json(listing);
    } catch (err) {
        console.error('Marketplace list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// POST /api/marketplace/delist — cancel listing (seller only)
router.post(
    '/delist',
    requireTelegram,
    validateBody({
        listingId: { type: 'objectId', required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const listingId = req.validatedBody?.listingId;

        const listing = await Listing.findOne({ _id: listingId, status: 'active' });
        if (!listing) return res.status(404).json({ error: 'listing not found' });
        if (String(listing.sellerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your listing' });

        listing.status = 'cancelled';
        await listing.save();
        res.json({ ok: true, listing });
    } catch (err) {
        console.error('Marketplace delist error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// POST /api/marketplace/buy — purchase a listed broker (off-chain: transfer ownership, debit buyer, credit seller minus fee)
router.post(
    '/buy',
    requireTelegram,
    validateBody({
        listingId: { type: 'objectId', required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });

        const listingId = req.validatedBody?.listingId;

        const listing = await Listing.findOne({ _id: listingId, status: 'active' }).populate('brokerId');
        if (!listing) return res.status(404).json({ error: 'listing not found' });
        if (String(listing.sellerTelegramId) === telegramId) return res.status(400).json({ error: 'cannot buy your own listing' });

        const broker = listing.brokerId;
        if (!broker) return res.status(404).json({ error: 'broker not found' });

        const cfg = await getConfig();
        const feeBps = Math.max(0, Math.min(10000, Number(cfg.marketplaceFeeBps ?? 0)));
        const fee = Math.floor((listing.priceAIBA * feeBps) / 10000);
        const sellerReceives = Math.max(0, listing.priceAIBA - fee);

        const debit = await debitAibaFromUser(listing.priceAIBA, {
            telegramId,
            reason: 'marketplace_buy',
            arena: 'marketplace',
            league: 'global',
            sourceType: 'marketplace',
            sourceId: listingId,
            requestId,
            meta: { listingId, brokerId: String(broker._id), sellerTelegramId: listing.sellerTelegramId },
        });
        if (!debit.ok) {
            return res.status(403).json({ error: debit.reason === 'insufficient' ? 'insufficient AIBA' : 'debit failed' });
        }

        if (sellerReceives > 0) {
            await creditAibaNoCap(sellerReceives, {
                telegramId: listing.sellerTelegramId,
                reason: 'marketplace_sell',
                arena: 'marketplace',
                league: 'global',
                sourceType: 'marketplace',
                sourceId: listingId,
                requestId,
                meta: { listingId, brokerId: String(broker._id), buyerTelegramId: telegramId, fee },
            });
        }

        broker.ownerTelegramId = telegramId;
        broker.guildId = undefined;
        await broker.save();

        listing.status = 'sold';
        await listing.save();

        res.json({ ok: true, broker: broker.toObject(), listingId: listing._id });
    } catch (err) {
        console.error('Marketplace buy error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
