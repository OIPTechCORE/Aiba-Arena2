const express = require('express');
const Mentor = require('../models/Mentor');
const User = require('../models/User');
const EconomyConfig = require('../models/EconomyConfig');
const MentorStake = require('../models/MentorStake');
const { requireTelegram } = require('../middleware/requireTelegram');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

router.get('/', async (_req, res) => {
    const mentors = await Mentor.find({ active: true }).sort({ realmKey: 1, tier: 1 }).lean();
    res.json({ mentors });
});

router.post(
    '/assign',
    requireTelegram,
    validateBody({
        mentorId: { type: 'objectId', required: true },
    }),
    async (req, res) => {
    const mentorId = String(req.body?.mentorId || '').trim();
    const mentor = await Mentor.findById(mentorId).lean();
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    const user = await User.findOne({ telegramId: req.telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.mentorId = mentor._id;
    await user.save();
    res.json({ ok: true });
    },
);

router.post(
    '/upgrade',
    requireTelegram,
    validateBody({
        mentorId: { type: 'objectId', required: true },
    }),
    async (req, res) => {
    const mentorId = String(req.body?.mentorId || '').trim();
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    const user = await User.findOne({ telegramId: req.telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const cfg = (await EconomyConfig.findOne().sort({ createdAt: -1 })) || new EconomyConfig();
    const tierCost = Number(cfg.mentorTierStakeAiba?.get?.(mentor.tier) || mentor.stakingRequiredAiba || 0);
    if (tierCost > 0 && user.aibaBalance < tierCost) {
        return res.status(400).json({ error: 'Insufficient AIBA' });
    }
    user.aibaBalance -= tierCost;
    await user.save();

    res.json({ ok: true, costAiba: tierCost });
    },
);

// Off-chain staking (AIBA balance)
router.post(
    '/stake',
    requireTelegram,
    validateBody({
        mentorId: { type: 'objectId' },
        amountAiba: { type: 'integer', min: 1, required: true },
    }),
    async (req, res) => {
    const { mentorId, amountAiba } = req.body || {};
    const amount = Math.floor(Number(amountAiba) || 0);
    if (!amount) return res.status(400).json({ error: 'Amount required' });

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    const user = await User.findOne({ telegramId: req.telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.aibaBalance < amount) return res.status(400).json({ error: 'Insufficient AIBA' });

    user.aibaBalance -= amount;
    await user.save();

    const stake = await MentorStake.create({
        userId: user._id,
        mentorId: mentor._id,
        amountAiba: amount,
    });
    res.json({ stake });
    },
);

router.post(
    '/unstake',
    requireTelegram,
    validateBody({
        stakeId: { type: 'objectId', required: true },
    }),
    async (req, res) => {
    const { stakeId } = req.body || {};
    const stake = await MentorStake.findById(stakeId);
    if (!stake || stake.status !== 'active') return res.status(404).json({ error: 'Stake not found' });

    const user = await User.findOne({ telegramId: req.telegramId });
    if (!user || String(stake.userId) !== String(user._id)) return res.status(403).json({ error: 'Not owner' });

    const amount = Number(stake.amountAiba || 0) + Number(stake.rewardAccruedAiba || 0);
    user.aibaBalance += amount;
    await user.save();

    stake.status = 'unstaked';
    await stake.save();

    res.json({ ok: true, amount });
    },
);

router.get('/stakes', requireTelegram, async (req, res) => {
    const user = await User.findOne({ telegramId: req.telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const stakes = await MentorStake.find({ userId: user._id }).lean();
    res.json({ stakes });
});

router.get('/stake-info', async (_req, res) => {
    res.json({
        vaultAddress: process.env.MENTOR_STAKING_VAULT_ADDRESS || '',
        vaultJettonWallet: process.env.MENTOR_STAKING_VAULT_JETTON_WALLET || '',
        jettonMaster: process.env.AIBA_JETTON_MASTER || '',
    });
});

module.exports = router;
