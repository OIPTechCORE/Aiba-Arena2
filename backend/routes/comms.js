/**
 * Unified Comms: status + config (Phase 4 — supportLink, supportTelegramGroup).
 * GET /api/comms/status — operational status
 * GET /api/comms/config — supportLink, supportTelegramGroup for miniapp
 */
const router = require('express').Router();
const { getConfig } = require('../engine/economy');

router.get('/status', (_req, res) =>
    res.json({ status: 'operational', updatedAt: new Date().toISOString() }));

router.get('/config', async (_req, res) => {
    try {
        const cfg = await getConfig();
        res.json({
            supportLink: String(cfg?.supportLink ?? '').trim() || null,
            supportTelegramGroup: String(cfg?.supportTelegramGroup ?? '').trim() || null,
        });
    } catch (err) {
        console.error('Comms config error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
