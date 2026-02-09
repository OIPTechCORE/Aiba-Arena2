const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Gift = require('../models/Gift');
const User = require('../models/User');
const { getConfig } = require('../engine/economy');
const { verifyTonPayment } = require('../util/tonVerify');
const UsedTonTxHash = require('../models/UsedTonTxHash');
const { getLimit } = require('../util/pagination');
const { validateBody, validateQuery } = require('../middleware/validate');

router.use(requireTelegram);

// POST /api/gifts/send — Send a gift to another user. Pay TON 1–10 → GIFTS_WALLET.
// Body: { txHash, toTelegramId or toUsername, message? }
router.post(
    '/send',
    validateBody({
        txHash: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
        toTelegramId: { type: 'string', trim: true, maxLength: 50 },
        toUsername: { type: 'string', trim: true, maxLength: 50 },
        message: { type: 'string', trim: true, maxLength: 200 },
    }),
    async (req, res) => {
    try {
        const fromTelegramId = String(req.telegramId || '');
        const txHash = String(req.validatedBody?.txHash || '').trim();
        const toTelegramId = String(req.validatedBody?.toTelegramId || '').trim();
        let toUsername = String(req.validatedBody?.toUsername || '').trim();
        const message = String(req.validatedBody?.message || '').trim();

        if (!txHash) return res.status(400).json({ error: 'txHash required' });

        let recipientId = toTelegramId;
        if (!recipientId && toUsername) {
            toUsername = toUsername.replace(/^@/, '');
            const u = await User.findOne({
                $or: [{ username: toUsername }, { 'telegram.username': toUsername }],
            }).select({ telegramId: 1 }).lean();
            if (!u) return res.status(404).json({ error: 'recipient not found' });
            recipientId = u.telegramId;
        }
        if (!recipientId) return res.status(400).json({ error: 'toTelegramId or toUsername required' });
        if (recipientId === fromTelegramId) return res.status(400).json({ error: 'cannot send gift to yourself' });

        const cfg = await getConfig();
        const costNano = Math.max(0, Number(cfg.giftCostTonNano ?? 1_000_000_000));
        const giftsWallet = (process.env.GIFTS_WALLET || '').trim();
        if (costNano <= 0 || !giftsWallet)
            return res.status(503).json({ error: 'Gifts not configured' });

        const verified = await verifyTonPayment(txHash, giftsWallet, costNano);
        if (!verified) return res.status(400).json({ error: 'TON payment verification failed' });

        try {
            await UsedTonTxHash.create({ txHash, purpose: 'gift', ownerTelegramId: fromTelegramId });
        } catch (e) {
            if (String(e?.code) === '11000') return res.status(409).json({ error: 'txHash already used' });
            throw e;
        }

        const gift = await Gift.create({
            fromTelegramId,
            toTelegramId: recipientId,
            amountNano: costNano,
            txHash,
            message: message.slice(0, 200),
        });

        res.status(201).json({
            ok: true,
            gift: gift.toObject(),
            message: 'Gift sent.',
        });
    } catch (err) {
        console.error('Gifts send error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// GET /api/gifts/received — Gifts received by current user
router.get(
    '/received',
    validateQuery({ limit: { type: 'integer', min: 1, max: 50 } }),
    async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 20, maxLimit: 50 },
        );
        const list = await Gift.find({ toTelegramId: telegramId }).sort({ createdAt: -1 }).limit(limit).lean();
        res.json(list);
    } catch (err) {
        console.error('Gifts received error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// GET /api/gifts/sent — Gifts sent by current user
router.get(
    '/sent',
    validateQuery({ limit: { type: 'integer', min: 1, max: 50 } }),
    async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 20, maxLimit: 50 },
        );
        const list = await Gift.find({ fromTelegramId: telegramId }).sort({ createdAt: -1 }).limit(limit).lean();
        res.json(list);
    } catch (err) {
        console.error('Gifts sent error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
