const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const TreasuryOp = require('../models/TreasuryOp');
const { adminAudit } = require('../middleware/adminAudit');

router.use(requireAdmin(), adminAudit());

router.get('/metrics', async (_req, res) => {
    const ops = await TreasuryOp.find({}).lean();
    const summary = ops.reduce(
        (acc, o) => {
            acc[o.type] = (acc[o.type] || 0) + Number(o.amountAiba || 0);
            return acc;
        },
        {},
    );
    res.json({ summary });
});

module.exports = router;
