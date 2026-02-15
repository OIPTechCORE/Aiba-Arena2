/**
 * Admin: list and update support requests.
 * GET /api/admin/support — list (paginated)
 * PATCH /api/admin/support/:id — update status, adminNote
 */
const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const { adminAudit } = require('../middleware/adminAudit');
const SupportRequest = require('../models/SupportRequest');
const { getLimit } = require('../util/pagination');
const { validateQuery, validateParams, validateBody } = require('../middleware/validate');

router.use(requireAdmin(), adminAudit());

router.get(
    '/',
    validateQuery({
        status: { type: 'string', trim: true, maxLength: 30 },
        limit: { type: 'integer', min: 1, max: 200 },
    }),
    async (req, res) => {
        try {
            const status = String(req.validatedQuery?.status ?? '').trim();
            const limit = getLimit({ query: { limit: req.validatedQuery?.limit } }, { defaultLimit: 50, maxLimit: 200 });

            const query = status ? { status } : {};
            const items = await SupportRequest.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();
            res.json(items);
        } catch (err) {
            console.error('Admin support list error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

router.patch(
    '/:id',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({
        status: { type: 'string', trim: true, maxLength: 30 },
        adminNote: { type: 'string', trim: true, maxLength: 1000 },
    }),
    async (req, res) => {
        try {
            const id = req.validatedParams?.id;
            const update = {};
            if (req.validatedBody?.status !== undefined) {
                const s = String(req.validatedBody.status).trim();
                if (['open', 'in_progress', 'resolved', 'closed'].includes(s)) update.status = s;
            }
            if (req.validatedBody?.adminNote !== undefined) update.adminNote = String(req.validatedBody.adminNote).trim();

            const doc = await SupportRequest.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
            if (!doc) return res.status(404).json({ error: 'not found' });
            res.json(doc);
        } catch (err) {
            console.error('Admin support update error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

module.exports = router;
