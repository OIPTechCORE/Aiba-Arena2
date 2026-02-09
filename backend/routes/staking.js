const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Staking = require('../models/Staking');
const { getConfig, debitAibaFromUser, creditAibaNoCap } = require('../engine/economy');
const { getIdempotencyKey } = require('../engine/idempotencyKey');
const { validateBody } = require('../middleware/validate');

async function getStakingSummary(telegramId) {
    const cfg = await getConfig();
    const apyPercent = Math.max(0, Math.min(100, Number(cfg.stakingApyPercent ?? 15) || 15));
    const staking = await Staking.findOne({ telegramId }).lean();
    const amount = staking ? Number(staking.amount ?? 0) : 0;
    const lastClaimedAt = staking?.lastClaimedAt ? new Date(staking.lastClaimedAt) : null;
    const lockedAt = staking?.lockedAt ? new Date(staking.lockedAt) : null;
    const now = new Date();
    const from = lastClaimedAt || lockedAt || now;
    const daysElapsed = (now.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
    const pendingReward =
        amount > 0 && daysElapsed >= 0 ? Math.floor((amount * (apyPercent / 100) * daysElapsed) / 365) : 0;
    return {
        stakedAmount: amount,
        apyPercent,
        lastClaimedAt: lastClaimedAt ? lastClaimedAt.toISOString() : null,
        lockedAt: lockedAt ? lockedAt.toISOString() : null,
        pendingReward,
    };
}

router.get('/summary', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const summary = await getStakingSummary(telegramId);
        res.json(summary);
    } catch (err) {
        console.error('Staking summary error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.post(
    '/stake',
    requireTelegram,
    validateBody({
        amount: { type: 'integer', min: 1, required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });
        const amount = Math.floor(Number(req.validatedBody?.amount ?? 0));
        if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'amount must be positive' });
        const debit = await debitAibaFromUser(amount, {
            telegramId,
            reason: 'staking_lock',
            arena: 'staking',
            league: 'global',
            sourceType: 'staking',
            sourceId: requestId,
            requestId,
            meta: { action: 'stake' },
        });
        if (!debit.ok) return res.status(403).json({ error: 'insufficient AIBA' });
        let staking = await Staking.findOne({ telegramId });
        if (!staking) staking = await Staking.create({ telegramId, amount: 0 });
        staking.amount = Number(staking.amount ?? 0) + amount;
        if (!staking.lockedAt) staking.lockedAt = new Date();
        await staking.save();
        const summary = await getStakingSummary(telegramId);
        res.json({ ok: true, stakedAmount: staking.amount, summary });
    } catch (err) {
        console.error('Staking stake error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

router.post(
    '/unstake',
    requireTelegram,
    validateBody({
        requestId: { type: 'string', trim: true, minLength: 1, maxLength: 128, required: true },
        amount: { type: 'integer', min: 1, required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });
        const amount = Math.floor(Number(req.validatedBody?.amount ?? 0));
        if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'amount must be positive' });
        const staking = await Staking.findOne({ telegramId });
        if (!staking || Number(staking.amount ?? 0) < amount)
            return res.status(403).json({ error: 'insufficient staked amount' });
        staking.amount = Math.max(0, Number(staking.amount ?? 0) - amount);
        await staking.save();
        await creditAibaNoCap(amount, {
            telegramId,
            reason: 'staking_unlock',
            arena: 'staking',
            league: 'global',
            sourceType: 'staking',
            sourceId: requestId,
            requestId,
            meta: { action: 'unstake' },
        });
        const summary = await getStakingSummary(telegramId);
        res.json({ ok: true, unstakedAmount: amount, summary });
    } catch (err) {
        console.error('Staking unstake error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

router.post(
    '/claim',
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
        const summary = await getStakingSummary(telegramId);
        const reward = Math.floor(Number(summary.pendingReward ?? 0));
        if (reward <= 0) return res.json({ ok: true, claimed: 0, summary });
        const staking = await Staking.findOne({ telegramId });
        if (!staking) return res.json({ ok: true, claimed: 0, summary });
        await creditAibaNoCap(reward, {
            telegramId,
            reason: 'staking_reward',
            arena: 'staking',
            league: 'global',
            sourceType: 'staking',
            sourceId: requestId,
            requestId,
            meta: { stakedAmount: staking.amount },
        });
        staking.lastClaimedAt = new Date();
        await staking.save();
        const newSummary = await getStakingSummary(telegramId);
        res.json({ ok: true, claimed: reward, summary: newSummary });
    } catch (err) {
        console.error('Staking claim error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
