const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const EconomyConfig = require('../models/EconomyConfig');
const EconomyDay = require('../models/EconomyDay');
const { getConfig } = require('../engine/economy');

router.use(requireAdmin());

// GET /api/admin/economy/config
router.get('/config', async (_req, res) => {
    const cfg = await getConfig();
    res.json(cfg);
});

// PATCH /api/admin/economy/config
router.patch('/config', async (req, res) => {
    const update = {};

    const maybeNum = (k) => {
        if (req.body?.[k] === undefined) return;
        const v = Number(req.body[k]);
        if (!Number.isFinite(v) || v < 0) return;
        update[k] = v;
    };

    maybeNum('dailyCapAiba');
    maybeNum('dailyCapNeur');
    maybeNum('baseRewardAibaPerScore');
    maybeNum('baseRewardNeurPerScore');
    maybeNum('upgradeAibaCost');
    maybeNum('trainNeurCost');
    maybeNum('marketplaceFeeBps');
    maybeNum('marketplaceBurnBps');

    if (req.body?.dailyCapAibaByArena && typeof req.body.dailyCapAibaByArena === 'object') {
        update.dailyCapAibaByArena = req.body.dailyCapAibaByArena;
    }
    if (req.body?.dailyCapNeurByArena && typeof req.body.dailyCapNeurByArena === 'object') {
        update.dailyCapNeurByArena = req.body.dailyCapNeurByArena;
    }

    const cfg = await EconomyConfig.findOneAndUpdate({}, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    res.json(cfg);
});

// GET /api/admin/economy/day?day=YYYY-MM-DD
router.get('/day', async (req, res) => {
    const day = String(req.query?.day || '').trim();
    if (!day) return res.status(400).json({ error: 'day required (YYYY-MM-DD)' });

    const doc = await EconomyDay.findOne({ day }).lean();
    res.json(doc || { day, emittedAiba: 0, emittedNeur: 0, burnedAiba: 0, spentNeur: 0 });
});

module.exports = router;

