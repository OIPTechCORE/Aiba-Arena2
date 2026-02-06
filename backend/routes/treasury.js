const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Treasury = require('../models/Treasury');
const TreasuryOp = require('../models/TreasuryOp');

// GET /api/treasury/summary — public treasury balance (for DAO transparency)
router.get('/summary', async (_req, res) => {
    try {
        const t = await Treasury.findOne().lean();
        res.json({
            balanceAiba: t?.balanceAiba ?? 0,
            balanceNeur: t?.balanceNeur ?? 0,
            totalPaidOutAiba: t?.totalPaidOutAiba ?? 0,
            totalPaidOutNeur: t?.totalPaidOutNeur ?? 0,
        });
    } catch (err) {
        console.error('Treasury summary error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/treasury/ops — latest treasury operations (burn/treasury/rewards/staking)
router.get('/ops', async (_req, res) => {
    try {
        const ops = await TreasuryOp.find({}).sort({ createdAt: -1 }).limit(200).lean();
        res.json({ ops });
    } catch (err) {
        console.error('Treasury ops error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
