const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const { getConfig, debitAibaFromUser, creditStarsNoCap } = require('../engine/economy');
const { getIdempotencyKey } = require('../engine/idempotencyKey');
const { verifyTonPayment } = require('../util/tonVerify');
const UsedTonTxHash = require('../models/UsedTonTxHash');
const User = require('../models/User');
const { validateBody } = require('../middleware/validate');

// GET /api/stars-store/config — pack size, price in AIBA, price in TON (nano), wallet for TON (if set)
router.get('/config', async (req, res) => {
    try {
        const cfg = await getConfig();
        const packStars = Math.max(1, Math.floor(Number(cfg.starsStorePackStars ?? 10)));
        const packPriceAiba = Math.max(0, Math.floor(Number(cfg.starsStorePackPriceAiba ?? 50)));
        const packPriceTonNano = Math.max(0, Number(cfg.starsStorePackPriceTonNano ?? 1_000_000_000));
        const wallet = (process.env.STARS_STORE_WALLET || '').trim();
        res.json({
            packStars,
            packPriceAiba,
            packPriceTonNano,
            packPriceTonFormatted: (packPriceTonNano / 1e9).toFixed(2),
            walletForTon: wallet || null,
            enabled: packPriceAiba > 0 || packPriceTonNano > 0,
        });
    } catch (err) {
        console.error('Stars store config error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/stars-store/buy-with-aiba — buy one pack of Stars with AIBA
router.post(
    '/buy-with-aiba',
    requireTelegram,
    validateBody({
        requestId: { type: 'string', trim: true, minLength: 1, maxLength: 128, required: true },
    }),
    async (req, res) => {
        try {
            const telegramId = req.telegramId ? String(req.telegramId) : '';
            if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

            const requestId = getIdempotencyKey(req);
            if (!requestId) return res.status(400).json({ error: 'requestId required' });

            const cfg = await getConfig();
            const packStars = Math.max(1, Math.floor(Number(cfg.starsStorePackStars ?? 10)));
            const packPriceAiba = Math.max(0, Math.floor(Number(cfg.starsStorePackPriceAiba ?? 50)));
            if (packPriceAiba <= 0) return res.status(400).json({ error: 'Stars store (AIBA) not configured' });

            const debit = await debitAibaFromUser(packPriceAiba, {
                telegramId,
                reason: 'stars_store_buy',
                arena: 'stars_store',
                league: 'global',
                sourceType: 'stars_store',
                sourceId: requestId,
                requestId,
                meta: { packStars },
            });
            if (!debit.ok) {
                return res.status(403).json({
                    error: debit.reason === 'insufficient' ? 'insufficient AIBA' : 'debit failed',
                    aibaBalance: debit.user?.aibaBalance,
                });
            }

            await creditStarsNoCap(packStars, {
                telegramId,
                reason: 'stars_store_buy',
                arena: 'stars_store',
                league: 'global',
                sourceType: 'stars_store',
                sourceId: requestId,
                requestId,
                meta: { packPriceAiba, packStars },
            });

            res.json({
                ok: true,
                starsReceived: packStars,
                aibaSpent: packPriceAiba,
                starsBalance: (debit.user?.starsBalance ?? 0) + packStars,
                aibaBalance: debit.user?.aibaBalance ?? 0,
            });
        } catch (err) {
            console.error('Stars store buy-with-aiba error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// POST /api/stars-store/buy-with-ton — buy one pack of Stars with TON (txHash). TON goes to STARS_STORE_WALLET.
router.post(
    '/buy-with-ton',
    requireTelegram,
    validateBody({
        txHash: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
    }),
    async (req, res) => {
        try {
            const telegramId = req.telegramId ? String(req.telegramId) : '';
            if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

            const txHash = String(req.body?.txHash ?? '').trim();
            if (!txHash) return res.status(400).json({ error: 'txHash required' });

            const wallet = (process.env.STARS_STORE_WALLET || '').trim();
            if (!wallet)
                return res.status(503).json({ error: 'Stars store TON wallet not configured (STARS_STORE_WALLET)' });

            const cfg = await getConfig();
            const packStars = Math.max(1, Math.floor(Number(cfg.starsStorePackStars ?? 10)));
            const packPriceTonNano = Math.max(0, Number(cfg.starsStorePackPriceTonNano ?? 1_000_000_000));
            if (packPriceTonNano <= 0) return res.status(400).json({ error: 'Stars store (TON) not configured' });

            const existing = await UsedTonTxHash.findOne({ txHash, purpose: 'stars_store' }).lean();
            if (existing)
                return res.status(409).json({ error: 'this transaction was already used for a Stars purchase' });

            const verified = await verifyTonPayment(txHash, wallet, packPriceTonNano);
            if (!verified) return res.status(400).json({ error: 'invalid or insufficient TON payment' });

            await UsedTonTxHash.create({ txHash, purpose: 'stars_store', ownerTelegramId: telegramId });

            const userBefore = await User.findOne({ telegramId }).select('starsBalance').lean();
            const prevStars = userBefore?.starsBalance ?? 0;

            await creditStarsNoCap(packStars, {
                telegramId,
                reason: 'stars_store_buy_ton',
                arena: 'stars_store',
                league: 'global',
                sourceType: 'stars_store',
                sourceId: txHash,
                requestId: txHash,
                meta: { packStars, packPriceTonNano },
            });

            const updated = await User.findOne({ telegramId }).select('starsBalance').lean();

            res.json({
                ok: true,
                starsReceived: packStars,
                starsBalance: updated?.starsBalance ?? prevStars + packStars,
            });
        } catch (err) {
            console.error('Stars store buy-with-ton error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

module.exports = router;
