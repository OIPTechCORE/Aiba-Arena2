const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const { maybeAdjustDailyCap, getAllocationStrategy } = require('../engine/economyAutomation');

// POST /api/admin/economy-automation/run — trigger dynamic cap adjustment (admin)
router.post('/run', requireAdmin(), async (req, res) => {
    try {
        const result = await maybeAdjustDailyCap();
        res.json(result);
    } catch (err) {
        console.error('Economy automation run error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/admin/economy-automation/allocation — get allocation strategy
router.get('/allocation', requireAdmin(), async (req, res) => {
    try {
        const strategy = await getAllocationStrategy();
        res.json(strategy);
    } catch (err) {
        console.error('Allocation strategy error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
