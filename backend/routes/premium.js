const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const User = require('../models/User');
const { getConfig } = require('../engine/economy');
const { verifyTonPayment } = require('../util/tonVerify');
const { validateBody } = require('../middleware/validate');

const PREMIUM_WALLET_ENV = 'PREMIUM_WALLET';

// GET /api/premium/status — whether user has premium
router.get('/status', requireTelegram, async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.telegramId }).lean();
        const hasPremium = !!(user?.premiumUntil && new Date(user.premiumUntil) > new Date());
        const cfg = await getConfig();
        res.json({
            hasPremium,
            premiumUntil: user?.premiumUntil || null,
            costTonNano: cfg.premiumCostTonNano ?? 5_000_000_000,
            durationDays: cfg.premiumDurationDays ?? 30,
            multiplier: cfg.premiumRewardMultiplier ?? 2,
        });
    } catch (err) {
        console.error('Premium status error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/premium/buy — buy premium with TON (txHash)
router.post(
    '/buy',
    requireTelegram,
    validateBody({ txHash: { type: 'string', trim: true, minLength: 1, maxLength: 128, required: true } }),
    async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const wallet = (process.env[PREMIUM_WALLET_ENV] || '').trim();
        if (!wallet) return res.status(503).json({ error: 'premium not configured (PREMIUM_WALLET)' });
        const cfg = await getConfig();
        const costNano = Math.max(0, Number(cfg.premiumCostTonNano ?? 5_000_000_000));
        const durationDays = Math.max(1, Number(cfg.premiumDurationDays ?? 30));
        if (costNano <= 0) return res.status(400).json({ error: 'premium cost not configured' });
        const verified = await verifyTonPayment(req.validatedBody?.txHash, wallet, costNano);
        if (!verified) return res.status(400).json({ error: 'invalid or insufficient payment' });
        const user = await User.findOne({ telegramId });
        if (!user) return res.status(404).json({ error: 'user not found' });
        const now = new Date();
        let until = user.premiumUntil && new Date(user.premiumUntil) > now ? new Date(user.premiumUntil) : now;
        until.setDate(until.getDate() + durationDays);
        await User.updateOne({ telegramId }, { $set: { premiumUntil: until } });
        res.json({
            ok: true,
            premiumUntil: until,
            durationDays,
        });
    } catch (err) {
        console.error('Premium buy error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
