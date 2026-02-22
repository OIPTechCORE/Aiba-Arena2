const router = require('express').Router();
const AdminAudit = require('../models/AdminAudit');
const { requireAdmin } = require('../middleware/requireAdmin');
const { adminAudit } = require('../middleware/adminAudit');
const { validateQuery } = require('../middleware/validate');
const { getLimit } = require('../util/pagination');

router.use(requireAdmin(), adminAudit());

function clampOffset(value, max = 10_000) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(Math.floor(n), max);
}

// GET /api/admin/audit — list audit log entries (admin only)
router.get(
    '/',
    validateQuery({
        adminEmail: { type: 'string', trim: true, maxLength: 200 },
        path: { type: 'string', trim: true, maxLength: 500 },
        from: { type: 'string', trim: true, maxLength: 50 },
        to: { type: 'string', trim: true, maxLength: 50 },
        limit: { type: 'integer', min: 1, max: 200 },
        offset: { type: 'integer', min: 0, max: 10000 },
    }),
    async (req, res) => {
        try {
            const limit = getLimit(
                { query: { limit: req.validatedQuery?.limit } },
                { defaultLimit: 50, maxLimit: 200 },
            );
            const offset = clampOffset(req.validatedQuery?.offset);

            const q = {};
            if (req.validatedQuery?.adminEmail) {
                q.adminEmail = { $regex: req.validatedQuery.adminEmail, $options: 'i' };
            }
            if (req.validatedQuery?.path) {
                q.path = { $regex: req.validatedQuery.path, $options: 'i' };
            }
            if (req.validatedQuery?.from || req.validatedQuery?.to) {
                q.createdAt = {};
                if (req.validatedQuery.from) {
                    const from = new Date(req.validatedQuery.from);
                    if (!Number.isNaN(from.getTime())) q.createdAt.$gte = from;
                }
                if (req.validatedQuery.to) {
                    const to = new Date(req.validatedQuery.to);
                    if (!Number.isNaN(to.getTime())) q.createdAt.$lte = to;
                }
            }

            const [rows, total] = await Promise.all([
                AdminAudit.find(q).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
                AdminAudit.countDocuments(q),
            ]);

            res.json({ items: rows, total, limit, offset });
        } catch (err) {
            console.error('Error in /api/admin/audit:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

module.exports = router;
