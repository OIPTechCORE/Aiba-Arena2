const express = require('express');
const Mentor = require('../models/Mentor');
const User = require('../models/User');
const EconomyConfig = require('../models/EconomyConfig');
const { requireTelegram } = require('../middleware/requireTelegram');

const router = express.Router();

router.get('/', async (_req, res) => {
    const mentors = await Mentor.find({ active: true }).sort({ realmKey: 1, tier: 1 }).lean();
    res.json({ mentors });
});

router.post('/assign', requireTelegram, async (req, res) => {
    const mentorId = String(req.body?.mentorId || '').trim();
    const mentor = await Mentor.findById(mentorId).lean();
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    const user = await User.findOne({ telegramId: req.telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.mentorId = mentor._id;
    await user.save();
    res.json({ ok: true });
});

router.post('/upgrade', requireTelegram, async (req, res) => {
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
});

module.exports = router;
