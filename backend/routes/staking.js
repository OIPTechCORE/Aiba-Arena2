const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Staking = require('../models/Staking');
const StakingLock = require('../models/StakingLock');
const Treasury = require('../models/Treasury');
const TreasuryOp = require('../models/TreasuryOp');
const { getConfig, debitAibaFromUser, creditAibaNoCap } = require('../engine/economy');
const { getIdempotencyKey } = require('../engine/idempotencyKey');
const { validateBody, validateParams } = require('../middleware/validate');

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
        const cfg = await getConfig();
        const minAiba = Math.max(1, Number(cfg.stakingMinAiba ?? 100) || 100);
        if (amount < minAiba) return res.status(400).json({ error: 'min_stake_required', minAiba, message: `Minimum ${minAiba.toLocaleString()} AIBA to stake.` });
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
        const staking = await Staking.findOneAndUpdate(
            { telegramId },
            {
                $inc: { amount },
                $setOnInsert: { telegramId, lockedAt: new Date(), lastClaimedAt: null },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );
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
        const staking = await Staking.findOneAndUpdate(
            { telegramId, amount: { $gte: amount } },
            { $inc: { amount: -amount } },
            { new: true },
        );
        if (!staking) return res.status(403).json({ error: 'insufficient staked amount' });
        const credited = await creditAibaNoCap(amount, {
            telegramId,
            reason: 'staking_unlock',
            arena: 'staking',
            league: 'global',
            sourceType: 'staking',
            sourceId: requestId,
            requestId,
            meta: { action: 'unstake' },
        });
        if (!credited?.ok) {
            await Staking.updateOne({ telegramId }, { $inc: { amount } }).catch(() => {});
            return res.status(500).json({ error: 'unstake_credit_failed' });
        }
        const summary = await getStakingSummary(telegramId);
        res.json({ ok: true, unstakedAmount: amount, summary });
    } catch (err) {
        console.error('Staking unstake error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// GET /api/staking/periods — available staking periods, APY, min amount (Advisory: 1T AIBA, 20% staking)
router.get('/periods', async (_req, res) => {
    try {
        const cfg = await getConfig();
        const periods = Array.isArray(cfg.stakingPeriods) && cfg.stakingPeriods.length > 0
            ? cfg.stakingPeriods
            : [{ days: 30, apyPercent: 10 }, { days: 90, apyPercent: 12 }, { days: 180, apyPercent: 15 }, { days: 365, apyPercent: 18 }];
        const minAiba = Math.max(1, Number(cfg.stakingMinAiba ?? 100) || 100);
        res.json({ periods, minAiba });
    } catch (err) {
        console.error('Staking periods error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/staking/locks — user's period-based locks
router.get('/locks', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const locks = await StakingLock.find({ telegramId }).sort({ lockedAt: -1 }).lean();
        res.json(locks);
    } catch (err) {
        console.error('Staking locks error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/staking/stake-locked — lock AIBA for a period
router.post(
    '/stake-locked',
    requireTelegram,
    validateBody({
        amount: { type: 'integer', min: 1, required: true },
        periodDays: { type: 'integer', min: 1, required: true },
        requestId: { type: 'string', trim: true, minLength: 1, maxLength: 128, required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const amount = Math.floor(Number(req.validatedBody?.amount ?? 0));
        const periodDays = Math.floor(Number(req.validatedBody?.periodDays ?? 0));
        const requestId = req.validatedBody?.requestId || getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });
        if (amount <= 0 || periodDays <= 0) return res.status(400).json({ error: 'amount and periodDays must be positive' });

        const cfg = await getConfig();
        const minAiba = Math.max(1, Number(cfg.stakingMinAiba ?? 100) || 100);
        if (amount < minAiba) return res.status(400).json({ error: 'min_stake_required', minAiba, message: `Minimum ${minAiba.toLocaleString()} AIBA to stake.` });
        const periods = Array.isArray(cfg.stakingPeriods) && cfg.stakingPeriods.length > 0 ? cfg.stakingPeriods : [
            { days: 30, apyPercent: 10 }, { days: 90, apyPercent: 12 }, { days: 180, apyPercent: 15 }, { days: 365, apyPercent: 18 },
        ];
        const period = periods.find((p) => Number(p.days) === periodDays);
        if (!period) return res.status(400).json({ error: 'invalid_period_days' });
        const apyPercent = Number(period.apyPercent);

        const debit = await debitAibaFromUser(amount, {
            telegramId,
            reason: 'staking_lock_period',
            arena: 'staking',
            league: 'locked',
            sourceType: 'staking_lock',
            sourceId: requestId,
            requestId,
            meta: { periodDays, apyPercent },
        });
        if (!debit.ok) return res.status(403).json({ error: debit.reason || 'insufficient AIBA' });

        const lockedAt = new Date();
        const unlocksAt = new Date(lockedAt.getTime() + periodDays * 24 * 60 * 60 * 1000);

        const lock = await StakingLock.create({
            telegramId,
            amount,
            periodDays,
            apyPercent,
            lockedAt,
            unlocksAt,
        });
        res.status(201).json({
            ok: true,
            lock: lock.toObject(),
            expectedRewardAiba: Math.floor((amount * (apyPercent / 100) * periodDays) / 365),
        });
    } catch (err) {
        console.error('Staking stake-locked error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// POST /api/staking/cancel-early — cancel lock before period ends; fee → treasury (Super Admin cancelled stakes)
router.post(
    '/cancel-early',
    requireTelegram,
    validateBody({
        lockId: { type: 'objectId', required: true },
        requestId: { type: 'string', trim: true, minLength: 1, maxLength: 128, required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const lockId = req.validatedBody?.lockId;
        const requestId = req.validatedBody?.requestId || getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });

        const lock = await StakingLock.findById(lockId);
        if (!lock) return res.status(404).json({ error: 'lock not found' });
        if (String(lock.telegramId) !== telegramId) return res.status(403).json({ error: 'not your lock' });
        if (lock.status !== 'active') return res.status(400).json({ error: 'lock not active' });

        const amount = Number(lock.amount ?? 0);
        if (amount <= 0) return res.status(400).json({ error: 'invalid amount' });

        const cfg = await getConfig();
        const feeBps = Math.min(10000, Math.max(0, Number(cfg.stakingCancelEarlyFeeBps ?? 500)));
        const feeAiba = Math.floor((amount * feeBps) / 10000);
        const returnAiba = amount - feeAiba;

        lock.status = 'cancelled_early';
        await lock.save();

        await creditAibaNoCap(returnAiba, {
            telegramId,
            reason: 'staking_cancel_early_return',
            arena: 'staking',
            league: 'locked',
            sourceType: 'staking_cancel',
            sourceId: String(lock._id),
            requestId,
            meta: { lockId: String(lock._id), feeAiba },
        });

        if (feeAiba > 0) {
            let treasury = await Treasury.findOne();
            if (!treasury) treasury = await Treasury.create({});
            await Treasury.updateOne({}, { $inc: { balanceAiba: feeAiba, cancelledStakesAiba: feeAiba } });
            await TreasuryOp.create({
                type: 'staking_cancel_early_fee',
                amountAiba: feeAiba,
                source: 'staking',
                refId: String(lock._id),
            });
        }

        res.json({
            ok: true,
            returnedAiba: returnAiba,
            feeAiba,
            message: `Returned ${returnAiba} AIBA. Fee ${feeAiba} AIBA → Super Admin (cancelled stakes).`,
        });
    } catch (err) {
        console.error('Staking cancel-early error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// POST /api/staking/claim-lock — when lock period ended, claim principal + rewards
router.post(
    '/claim-lock',
    requireTelegram,
    validateBody({
        lockId: { type: 'objectId', required: true },
        requestId: { type: 'string', trim: true, minLength: 1, maxLength: 128, required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const lockId = req.validatedBody?.lockId;
        const requestId = req.validatedBody?.requestId || getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });

        const lock = await StakingLock.findOneAndUpdate(
            {
                _id: lockId,
                telegramId,
                status: 'active',
                unlocksAt: { $lte: new Date() },
            },
            { $set: { status: 'unlocked' } },
            { new: true },
        );
        if (!lock) {
            const exists = await StakingLock.findById(lockId).lean();
            if (!exists) return res.status(404).json({ error: 'lock not found' });
            if (String(exists.telegramId) !== telegramId) return res.status(403).json({ error: 'not your lock' });
            if (exists.status !== 'active') return res.status(400).json({ error: 'lock not active' });
            return res.status(400).json({ error: 'lock not yet matured' });
        }

        const amount = Number(lock.amount ?? 0);
        const apyPercent = Number(lock.apyPercent ?? 15);
        const daysLocked = (new Date(lock.unlocksAt) - new Date(lock.lockedAt)) / (24 * 60 * 60 * 1000);
        const reward = Math.floor((amount * (apyPercent / 100) * daysLocked) / 365);
        const total = amount + reward;

        const credited = await creditAibaNoCap(total, {
            telegramId,
            reason: 'staking_lock_matured',
            arena: 'staking',
            league: 'locked',
            sourceType: 'staking_claim_lock',
            sourceId: String(lock._id),
            requestId,
            meta: { principal: amount, reward },
        });
        if (!credited?.ok) {
            await StakingLock.updateOne({ _id: lock._id, status: 'unlocked' }, { $set: { status: 'active' } }).catch(() => {});
            return res.status(500).json({ error: 'claim_credit_failed' });
        }

        res.json({
            ok: true,
            principal: amount,
            reward,
            total,
        });
    } catch (err) {
        console.error('Staking claim-lock error:', err);
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
