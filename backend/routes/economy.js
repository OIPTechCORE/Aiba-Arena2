const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const User = require('../models/User');
const { getConfig } = require('../engine/economy');

router.use(requireTelegram);

// GET /api/economy/me
router.get('/me', async (req, res) => {
    const telegramId = req.telegramId ? String(req.telegramId) : '';
    if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

    const user = req.user || (await User.findOne({ telegramId }).lean());
    const cfg = await getConfig();
    res.json({
        telegramId,
        wallet: user?.wallet || '',
        neurBalance: user?.neurBalance ?? 0,
        aibaBalance: user?.aibaBalance ?? 0,
        economy: {
            baseRewardAibaPerScore: cfg.baseRewardAibaPerScore,
            baseRewardNeurPerScore: cfg.baseRewardNeurPerScore,
            trainNeurCost: cfg.trainNeurCost,
            upgradeAibaCost: cfg.upgradeAibaCost,
        },
    });
});

module.exports = router;

