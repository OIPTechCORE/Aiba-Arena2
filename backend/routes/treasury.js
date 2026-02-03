const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Treasury = require('../models/Treasury');

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

module.exports = router;
