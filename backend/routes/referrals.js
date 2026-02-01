const router = require('express').Router();
const crypto = require('crypto');
const { requireTelegram } = require('../middleware/requireTelegram');
const Referral = require('../models/Referral');
const ReferralUse = require('../models/ReferralUse');
const User = require('../models/User');
const { getConfig, tryEmitNeur, creditNeurNoCap } = require('../engine/economy');

router.use(requireTelegram);

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
router.post('/use', async (req, res) => {
    const telegramId = String(req.telegramId || ''); // referee
    const code = String(req.body?.code || '')
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

    res.json({
        ok: true,
        referrerTelegramId: ref.ownerTelegramId,
        neurReward: { referrer: creditedReferrer, referee: creditedReferee },
    });
});

module.exports = router;
