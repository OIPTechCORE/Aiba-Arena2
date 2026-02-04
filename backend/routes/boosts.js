const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Boost = require('../models/Boost');
const User = require('../models/User');
const UsedTonTxHash = require('../models/UsedTonTxHash');
const { getConfig, debitNeurFromUser } = require('../engine/economy');
const { getIdempotencyKey } = require('../engine/idempotencyKey');
const { verifyTonPayment } = require('../util/tonVerify');

// GET /api/boosts/mine — active boosts for current user
router.get('/mine', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const now = new Date();
        const list = await Boost.find({ telegramId, expiresAt: { $gt: now } }).sort({ expiresAt: 1 }).lean();
        res.json(list);
    } catch (err) {
        console.error('Boosts mine error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/boosts/buy — buy boost with NEUR (MVP: in-app currency)
router.post('/buy', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });

        const cfg = await getConfig();
        const cost = Math.max(0, Math.floor(Number(cfg.boostCostNeur ?? 100)));
        const durationHours = Math.max(1, Math.min(168, Math.floor(Number(cfg.boostDurationHours ?? 24))));
        const multiplier = Math.max(1, Math.min(3, Number(cfg.boostMultiplier ?? 1.2) || 1.2));

        if (cost <= 0) return res.status(500).json({ error: 'boost not configured' });

        const spend = await debitNeurFromUser(cost, {
            telegramId,
            reason: 'boost_purchase',
            arena: 'boosts',
            league: 'global',
            sourceType: 'boost',
            sourceId: requestId,
            requestId,
            meta: { durationHours, multiplier },
        });
        if (!spend.ok) return res.status(403).json({ error: 'insufficient NEUR' });

        const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
        const boost = await Boost.create({
            telegramId,
            type: 'score_multiplier',
            multiplier,
            expiresAt,
        });
        res.status(201).json(boost);
    } catch (err) {
        console.error('Boosts buy error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/boosts/buy-with-ton — buy boost with TON (verify tx and grant boost)
router.post('/buy-with-ton', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });

        const txHash = String(req.body?.txHash || '').trim();
        const amountNano = req.body?.amountNano != null ? String(req.body.amountNano) : null;
        if (!txHash) return res.status(400).json({ error: 'txHash required' });

        const cfg = await getConfig();
        const costNano = Math.max(0, Number(cfg.boostCostTonNano ?? 0));
        if (costNano <= 0) return res.status(503).json({ error: 'boost TON payment not configured' });

        const boostWallet = (process.env.BOOST_TON_WALLET || '').trim();
        if (!boostWallet) return res.status(503).json({ error: 'BOOST_TON_WALLET not configured' });

        // Idempotency: same txHash = same boost (allow only once)
        const existing = await Boost.findOne({ telegramId, 'meta.txHash': txHash }).lean();
        if (existing) return res.status(409).json({ error: 'txHash already used' });

        // Verify TON transaction (simplified: optional integration; if no API, require admin to grant)
        let verified = false;
        const tonApiUrl = process.env.TON_PROVIDER_URL || process.env.TON_API_URL || '';
        const tonApiKey = process.env.TON_API_KEY || '';
        if (tonApiUrl || tonApiKey) {
            try {
                const base = (tonApiUrl || 'https://toncenter.com/api/v2').replace(/\/+$/, '');
                const url = `${base}/getTransactionByHash?hash=${encodeURIComponent(txHash)}`;
                const opts = { headers: tonApiKey ? { 'X-API-Key': tonApiKey } : {} };
                const txRes = await fetch(url, opts);
                const txData = await txRes.json().catch(() => ({}));
                const tx = txData?.result || txData;
                const inMsg = tx?.in_msg;
                const value = inMsg?.value ? BigInt(inMsg.value) : 0n;
                const toAddr = (inMsg?.destination || '').toString();
                if (value >= BigInt(costNano) && toAddr && boostWallet && toAddr === boostWallet) verified = true;
            } catch {
                // verification failed
            }
        }
        // If no API or verification failed: allow admin to have granted via manual flow; for MVP we require verification
        if (!verified) return res.status(400).json({ error: 'TON payment verification failed or not configured' });

        const durationHours = Math.max(1, Math.min(168, Math.floor(Number(cfg.boostDurationHours ?? 24))));
        const multiplier = Math.max(1, Math.min(3, Number(cfg.boostMultiplier ?? 1.2) || 1.2));
        const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
        const boost = await Boost.create({
            telegramId,
            type: 'score_multiplier',
            multiplier,
            expiresAt,
            meta: { txHash, amountNano: amountNano || costNano.toString() },
        });
        res.status(201).json(boost);
    } catch (err) {
        console.error('Boosts buy-with-ton error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/boosts/buy-profile-with-ton — Boost your profile (visibility). Pay TON 1–10 → BOOST_PROFILE_WALLET.
router.post('/buy-profile-with-ton', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const txHash = String(req.body?.txHash || '').trim();
        if (!txHash) return res.status(400).json({ error: 'txHash required' });

        const cfg = await getConfig();
        const costNano = Math.max(0, Number(cfg.boostProfileCostTonNano ?? 1_000_000_000));
        const boostProfileWallet = (process.env.BOOST_PROFILE_WALLET || '').trim();
        if (costNano <= 0 || !boostProfileWallet)
            return res.status(503).json({ error: 'Profile boost with TON not configured' });

        const verified = await verifyTonPayment(txHash, boostProfileWallet, costNano);
        if (!verified) return res.status(400).json({ error: 'TON payment verification failed' });

        try {
            await UsedTonTxHash.create({ txHash, purpose: 'profile_boost', ownerTelegramId: telegramId });
        } catch (e) {
            if (String(e?.code) === '11000') return res.status(409).json({ error: 'txHash already used' });
            throw e;
        }

        const durationDays = Math.max(1, Math.min(365, Number(cfg.boostProfileDurationDays ?? 7) || 7));
        const boostedUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

        const user = await User.findOneAndUpdate(
            { telegramId },
            { $set: { profileBoostedUntil: boostedUntil } },
            { new: true },
        ).lean();
        if (!user) return res.status(404).json({ error: 'user not found' });

        res.json({
            ok: true,
            profileBoostedUntil: boostedUntil,
            durationDays,
            message: 'Profile boosted. You now have boosted visibility.',
        });
    } catch (err) {
        console.error('Boosts buy-profile-with-ton error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
