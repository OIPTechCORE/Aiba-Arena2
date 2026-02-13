/**
 * Admin Oracle: trigger automated AIBA/TON update, view status.
 */
const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const { getConfig } = require('../engine/economy');
const { runOracleUpdate } = require('../engine/aibaTonOracle');
const { adminAudit } = require('../middleware/adminAudit');

router.use(requireAdmin(), adminAudit());

// GET /api/admin/oracle/status — current oracle config and last update
router.get('/status', async (_req, res) => {
    try {
        const cfg = await getConfig();
        res.json({
            oracleAibaPerTon: Number(cfg?.oracleAibaPerTon ?? 0),
            oracleNeurPerAiba: Number(cfg?.oracleNeurPerAiba ?? 0),
            oracleAutoUpdateEnabled: Boolean(cfg?.oracleAutoUpdateEnabled),
            oracleAibaUsd: Number(cfg?.oracleAibaUsd ?? 0),
            oracleMinAibaPerTon: Number(cfg?.oracleMinAibaPerTon ?? 0),
            oracleMaxAibaPerTon: Number(cfg?.oracleMaxAibaPerTon ?? 0),
            oracleFallbackAibaPerTon: Number(cfg?.oracleFallbackAibaPerTon ?? 0),
            oracleLastUpdatedAt: cfg?.oracleLastUpdatedAt ?? null,
            oracleTonUsdAtUpdate: Number(cfg?.oracleTonUsdAtUpdate ?? 0),
            oracleUpdateIntervalMinutes: Number(cfg?.oracleUpdateIntervalMinutes ?? 15),
        });
    } catch (err) {
        console.error('Admin oracle status error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/admin/oracle/update — run one oracle update cycle
router.post('/update', async (_req, res) => {
    try {
        const result = await runOracleUpdate();
        if (!result.ok) {
            return res.status(400).json({
                error: result.error || 'oracle_update_failed',
                tonUsd: result.tonUsd,
                aibaUsd: result.aibaUsd,
            });
        }
        res.json(result);
    } catch (err) {
        console.error('Admin oracle update error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
