const router = require('express').Router();
const { getConfig } = require('../engine/economy');

// GET /api/oracle/price — price oracle (AIBA/NEUR per TON, etc.; from config or future feed)
router.get('/price', async (_req, res) => {
    try {
        const cfg = await getConfig();
        res.json({
            aibaPerTon: Number(cfg?.oracleAibaPerTon ?? 0),
            neurPerAiba: Number(cfg?.oracleNeurPerAiba ?? 0),
            updatedAt: cfg?.oracleLastUpdatedAt
                ? new Date(cfg.oracleLastUpdatedAt).toISOString()
                : new Date().toISOString(),
        });
    } catch (err) {
        console.error('Oracle price error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
