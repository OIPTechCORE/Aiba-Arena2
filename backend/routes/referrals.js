const router = require('express').Router();
const crypto = require('crypto');
const { requireTelegram } = require('../middleware/requireTelegram');
const Referral = require('../models/Referral');
const ReferralUse = require('../models/ReferralUse');
const User = require('../models/User');
const { getConfig, tryEmitNeur, creditNeurNoCap, tryEmitAiba, creditAibaNoCap } = require('../engine/economy');
const { validateBody } = require('../middleware/validate');

// GET /api/referrals/top — public: top referrers by uses (no auth)
router.get('/top', async (_req, res) => {
    try {
        const refs = await Referral.aggregate([
            { $match: { active: true, uses: { $gt: 0 } } },
            { $sort: { uses: -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'ownerTelegramId',
                    foreignField: 'telegramId',
                    as: 'user',
                },
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    telegramId: '$ownerTelegramId',
                    username: '$user.username',
                    uses: 1,
                },
            },
        ]);
        res.json(refs);
    } catch (err) {
        console.error('Referrals top error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.use(requireTelegram);

// GET /api/referrals/me — get current user's referral code (if any) for preloading "Share your link"
router.get('/me', async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const referral = await Referral.findOne({ ownerTelegramId: telegramId, active: true }).lean();
        if (!referral) return res.json(null);
        res.json({ code: referral.code, _id: referral._id });
    } catch (err) {
        console.error('Referrals me error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

function makeCode() {
    return crypto.randomBytes(5).toString('hex'); // 10 chars
}

// POST /api/referrals/create
router.post('/create', async (req, res) => {
    const telegramId = String(req.telegramId || '');

    const existing = await Referral.findOne({ ownerTelegramId: telegramId, active: true }).lean();
    if (existing) return res.json(existing);

    for (let i = 0; i < 5; i++) {
        try {
            const created = await Referral.create({ ownerTelegramId: telegramId, code: makeCode() });
            return res.status(201).json(created);
        } catch (err) {
            if (String(err?.code) === '11000') continue;
            console.error('Error creating referral:', err);
            return res.status(500).json({ error: 'internal server error' });
        }
    }

    return res.status(500).json({ error: 'could not create unique code' });
});

// POST /api/referrals/use
router.post(
    '/use',
    validateBody({
        code: { type: 'string', trim: true, minLength: 1, maxLength: 32, required: true },
    }),
    async (req, res) => {
    const telegramId = String(req.telegramId || ''); // referee
    const code = String(req.validatedBody?.code || '')
        .trim()
        .toLowerCase();
    if (!code) return res.status(400).json({ error: 'code required' });

    const ref = await Referral.findOne({ code, active: true });
    if (!ref) return res.status(404).json({ error: 'invalid code' });
    if (String(ref.ownerTelegramId) === telegramId) return res.status(400).json({ error: 'cannot refer yourself' });
    if (ref.uses >= ref.maxUses) return res.status(400).json({ error: 'code exhausted' });

    // Anti-sybil baseline: require the referee to have connected a wallet.
    const me = req.user || (await User.findOne({ telegramId }).lean());
    if (!me?.wallet) return res.status(403).json({ error: 'wallet_required' });

    // One referral per referee (global)
    let use = null;
    try {
        use = await ReferralUse.create({
            code,
            referrerTelegramId: ref.ownerTelegramId,
            refereeTelegramId: telegramId,
        });
    } catch (err) {
        if (String(err?.code) === '11000') return res.status(409).json({ error: 'already_referred' });
        console.error('Error creating referral use:', err);
        return res.status(500).json({ error: 'internal server error' });
    }

    // Increment usage (bounded)
    const updated = await Referral.findOneAndUpdate(
        { _id: ref._id, uses: { $lt: ref.maxUses }, active: true },
        { $inc: { uses: 1 } },
        { new: true },
    ).lean();
    if (!updated) {
        await ReferralUse.deleteOne({ refereeTelegramId: telegramId }).catch(() => {});
        return res.status(400).json({ error: 'code exhausted' });
    }

    // Reward attribution (NEUR; capped via economy emissions).
    const cfg = await getConfig();
    const rReferrer = Math.max(0, Math.floor(Number(cfg.referralRewardNeurReferrer ?? 0)));
    const rReferee = Math.max(0, Math.floor(Number(cfg.referralRewardNeurReferee ?? 0)));

    let creditedReferrer = 0;
    let creditedReferee = 0;

    const total = rReferrer + rReferee;
    if (total > 0) {
        const emit = await tryEmitNeur(total, { arena: 'referrals', league: 'global' });
        if (emit.ok) {
            creditedReferrer = rReferrer;
            creditedReferee = rReferee;

            if (creditedReferrer > 0) {
                await creditNeurNoCap(creditedReferrer, {
                    telegramId: String(ref.ownerTelegramId),
                    reason: 'referral_reward_referrer',
                    arena: 'referrals',
                    league: 'global',
                    sourceType: 'referral',
                    sourceId: use?._id ? String(use._id) : null,
                    requestId: req.requestId ? String(req.requestId) : null,
                    meta: { code },
                });
            }
            if (creditedReferee > 0) {
                await creditNeurNoCap(creditedReferee, {
                    telegramId,
                    reason: 'referral_reward_referee',
                    arena: 'referrals',
                    league: 'global',
                    sourceType: 'referral',
                    sourceId: use?._id ? String(use._id) : null,
                    requestId: req.requestId ? String(req.requestId) : null,
                    meta: { code },
                });
            }
        }
    }

    // AIBA referral bonuses (vision: Referrals → AIBA bonuses)
    const aReferrer = Math.max(0, Math.floor(Number(cfg.referralRewardAibaReferrer ?? 0)));
    const aReferee = Math.max(0, Math.floor(Number(cfg.referralRewardAibaReferee ?? 0)));
    let creditedAibaReferrer = 0;
    let creditedAibaReferee = 0;
    const totalAiba = aReferrer + aReferee;
    if (totalAiba > 0) {
        const emitAiba = await tryEmitAiba(totalAiba, { arena: 'referrals', league: 'global' });
        if (emitAiba.ok) {
            creditedAibaReferrer = aReferrer;
            creditedAibaReferee = aReferee;
            if (creditedAibaReferrer > 0) {
                await creditAibaNoCap(creditedAibaReferrer, {
                    telegramId: String(ref.ownerTelegramId),
                    reason: 'referral_reward_referrer',
                    arena: 'referrals',
                    league: 'global',
                    sourceType: 'referral',
                    sourceId: use?._id ? String(use._id) : null,
                    requestId: req.requestId ? String(req.requestId) : null,
                    meta: { code },
                });
            }
            if (creditedAibaReferee > 0) {
                await creditAibaNoCap(creditedAibaReferee, {
                    telegramId,
                    reason: 'referral_reward_referee',
                    arena: 'referrals',
                    league: 'global',
                    sourceType: 'referral',
                    sourceId: use?._id ? String(use._id) : null,
                    requestId: req.requestId ? String(req.requestId) : null,
                    meta: { code },
                });
            }
        }
    }

    res.json({
        ok: true,
        referrerTelegramId: ref.ownerTelegramId,
        neurReward: { referrer: creditedReferrer, referee: creditedReferee },
        aibaReward: { referrer: creditedAibaReferrer, referee: creditedAibaReferee },
    });
    },
);

module.exports = router;
