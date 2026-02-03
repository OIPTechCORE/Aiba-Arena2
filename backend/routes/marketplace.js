const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Listing = require('../models/Listing');
const Broker = require('../models/Broker');
const { getConfig, debitAibaFromUser, creditAibaNoCap } = require('../engine/economy');
const { getIdempotencyKey } = require('../engine/idempotencyKey');

// GET /api/marketplace/listings — active listings (with broker snapshot)
router.get('/listings', requireTelegram, async (req, res) => {
    try {
        const limit = Math.min(50, Math.max(1, parseInt(req.query?.limit, 10) || 20));
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
});

// POST /api/marketplace/list — list a broker for sale
router.post('/list', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const brokerId = String(req.body?.brokerId ?? '').trim();
        const priceAIBA = Math.floor(Number(req.body?.priceAIBA ?? 0));
        const priceNEUR = Math.floor(Number(req.body?.priceNEUR ?? 0));

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
});

// POST /api/marketplace/delist — cancel listing (seller only)
router.post('/delist', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const listingId = String(req.body?.listingId ?? '').trim();
        if (!listingId) return res.status(400).json({ error: 'listingId required' });

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
});

// POST /api/marketplace/buy — purchase a listed broker (off-chain: transfer ownership, debit buyer, credit seller minus fee)
router.post('/buy', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });

        const listingId = String(req.body?.listingId ?? '').trim();
        if (!listingId) return res.status(400).json({ error: 'listingId required' });

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
});

module.exports = router;
