const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const User = require('../models/User');
const { getConfig, tryEmitNeur, creditNeurNoCap } = require('../engine/economy');

function utcDayKey(date = new Date()) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// POST /api/daily/claim — claim daily login NEUR (once per UTC day)
router.post('/claim', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const today = utcDayKey();
        const user = await User.findOne({ telegramId });
        if (!user) return res.status(404).json({ error: 'user not found' });

        const last = user.lastDailyClaimAt ? utcDayKey(new Date(user.lastDailyClaimAt)) : null;
        if (last === today) {
            return res.json({ ok: true, alreadyClaimed: true, neurReward: 0, nextClaim: 'tomorrow' });
        }

        const cfg = await getConfig();
        const reward = Math.max(0, Math.floor(Number(cfg.dailyRewardNeur ?? 0)));
        if (reward <= 0) {
            return res.json({ ok: true, neurReward: 0, message: 'daily reward not configured' });
        }

        const emit = await tryEmitNeur(reward, { arena: 'daily_login', league: 'global' });
        if (!emit.ok) {
            return res.status(503).json({ error: 'daily cap reached', retryLater: true });
        }

        await creditNeurNoCap(reward, {
            telegramId,
            reason: 'daily_login',
            arena: 'daily_login',
            league: 'global',
            sourceType: 'daily_claim',
            sourceId: today,
            requestId: today,
            meta: { day: today },
        });

        await User.updateOne(
            { telegramId },
            { $set: { lastDailyClaimAt: new Date(), lastSeenAt: new Date() } },
        );

        const updated = await User.findOne({ telegramId }).lean();
        res.json({
            ok: true,
            alreadyClaimed: false,
            neurReward: reward,
            neurBalance: updated?.neurBalance ?? 0,
            nextClaim: 'tomorrow',
        });
    } catch (err) {
        console.error('Daily claim error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/daily/status — whether user can claim today
router.get('/status', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const user = await User.findOne({ telegramId }).lean();
        const today = utcDayKey();
        const last = user?.lastDailyClaimAt ? utcDayKey(new Date(user.lastDailyClaimAt)) : null;
        const canClaim = last !== today;
        const cfg = await getConfig();
        const reward = Math.max(0, Math.floor(Number(cfg.dailyRewardNeur ?? 0)));

        res.json({
            canClaim,
            alreadyClaimedToday: !canClaim,
            dailyRewardNeur: reward,
            lastClaimedAt: user?.lastDailyClaimAt || null,
        });
    } catch (err) {
        console.error('Daily status error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
