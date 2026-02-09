const express = require('express');
const Mission = require('../models/Mission');
const User = require('../models/User');
const TreasuryOp = require('../models/TreasuryOp');
const { requireTelegram } = require('../middleware/requireTelegram');
const { validateBody, validateQuery } = require('../middleware/validate');

const router = express.Router();

router.get(
    '/',
    validateQuery({
        realmKey: { type: 'string', trim: true, maxLength: 50 },
    }),
    async (req, res) => {
    const realmKey = String(req.validatedQuery?.realmKey || '').trim();
    const query = realmKey ? { realmKey, active: true } : { active: true };
    const missions = await Mission.find(query).sort({ order: 1 }).lean();
    res.json({ missions });
    },
);

router.post(
    '/complete',
    requireTelegram,
    validateBody({
        missionId: { type: 'objectId', required: true },
    }),
    async (req, res) => {
    const missionId = String(req.validatedBody?.missionId || '').trim();
    const mission = await Mission.findById(missionId).lean();
    if (!mission || !mission.active) return res.status(404).json({ error: 'Mission not found' });

    const user = await User.findOne({ telegramId: req.telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.aibaBalance += Number(mission.rewardAiba || 0);
    user.neurBalance += Number(mission.rewardNeur || 0);
    await user.save();

    if (mission.rewardAiba) {
        await TreasuryOp.create({
            type: 'rewards',
            amountAiba: Number(mission.rewardAiba || 0),
            source: 'mission',
            refId: String(mission._id),
        });
    }

    res.json({
        ok: true,
        rewardAiba: mission.rewardAiba || 0,
        rewardNeur: mission.rewardNeur || 0,
        xp: mission.xp || 0,
    });
    },
);

module.exports = router;
