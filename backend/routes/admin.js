const router = require('express').Router();
const Task = require('../models/Task');
const { requireAdmin } = require('../middleware/requireAdmin');
const { validateBody, validateParams } = require('../middleware/validate');
const { adminAudit } = require('../middleware/adminAudit');

router.use(requireAdmin(), adminAudit());

// Minimal endpoints for the admin panel

// GET /api/admin/tasks
router.get('/tasks', async (_req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 }).lean();
        res.json(tasks);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/admin/tasks
router.post(
    '/tasks',
    validateBody({
        title: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
        description: { type: 'string', trim: true, maxLength: 2000 },
        enabled: { type: 'boolean' },
        category: {
            type: 'string',
            trim: true,
            enum: ['onboarding', 'core', 'economy', 'racing', 'social', 'learning', 'advanced'],
        },
        userKinds: { type: 'array' },
        ctaLabel: { type: 'string', trim: true, maxLength: 100 },
        ctaTab: { type: 'string', trim: true, maxLength: 60 },
        rewardAiba: { type: 'number', min: 0 },
        rewardNeur: { type: 'number', min: 0 },
        sortOrder: { type: 'number' },
    }),
    async (req, res) => {
        try {
            const title = String(req.validatedBody?.title ?? '').trim();
            const description = String(req.validatedBody?.description ?? '').trim();
            const enabled = req.validatedBody?.enabled === undefined ? true : Boolean(req.validatedBody.enabled);
            const category = String(req.validatedBody?.category || 'core').trim();
            const rawKinds = Array.isArray(req.validatedBody?.userKinds) ? req.validatedBody.userKinds : ['all'];
            const userKinds = rawKinds.map((k) => String(k || '').trim()).filter(Boolean);
            const ctaLabel = String(req.validatedBody?.ctaLabel || 'Open').trim();
            const ctaTab = String(req.validatedBody?.ctaTab || '').trim();
            const rewardAiba = Math.max(0, Number(req.validatedBody?.rewardAiba || 0));
            const rewardNeur = Math.max(0, Number(req.validatedBody?.rewardNeur || 0));
            const sortOrder = Number.isFinite(Number(req.validatedBody?.sortOrder))
                ? Number(req.validatedBody.sortOrder)
                : 100;

            if (!title) return res.status(400).json({ error: 'title required' });

            const task = await Task.create({
                title,
                description,
                enabled,
                category,
                userKinds: userKinds.length ? userKinds : ['all'],
                ctaLabel,
                ctaTab,
                rewardAiba,
                rewardNeur,
                sortOrder,
            });
            res.status(201).json(task);
        } catch (err) {
            console.error('Error creating task:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// PATCH /api/admin/tasks/:id
router.patch(
    '/tasks/:id',
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({
        title: { type: 'string', trim: true, maxLength: 200 },
        description: { type: 'string', trim: true, maxLength: 2000 },
        enabled: { type: 'boolean' },
        category: {
            type: 'string',
            trim: true,
            enum: ['onboarding', 'core', 'economy', 'racing', 'social', 'learning', 'advanced'],
        },
        userKinds: { type: 'array' },
        ctaLabel: { type: 'string', trim: true, maxLength: 100 },
        ctaTab: { type: 'string', trim: true, maxLength: 60 },
        rewardAiba: { type: 'number', min: 0 },
        rewardNeur: { type: 'number', min: 0 },
        sortOrder: { type: 'number' },
    }),
    async (req, res) => {
        try {
            const { id } = req.validatedParams;
            const update = {};

            if (req.validatedBody?.title !== undefined) update.title = String(req.validatedBody.title).trim();
            if (req.validatedBody?.description !== undefined)
                update.description = String(req.validatedBody.description).trim();
            if (req.validatedBody?.enabled !== undefined) update.enabled = Boolean(req.validatedBody.enabled);
            if (req.validatedBody?.category !== undefined) update.category = String(req.validatedBody.category).trim();
            if (req.validatedBody?.userKinds !== undefined) {
                const kinds = Array.isArray(req.validatedBody.userKinds)
                    ? req.validatedBody.userKinds.map((k) => String(k || '').trim()).filter(Boolean)
                    : [];
                update.userKinds = kinds.length ? kinds : ['all'];
            }
            if (req.validatedBody?.ctaLabel !== undefined) update.ctaLabel = String(req.validatedBody.ctaLabel).trim();
            if (req.validatedBody?.ctaTab !== undefined) update.ctaTab = String(req.validatedBody.ctaTab).trim();
            if (req.validatedBody?.rewardAiba !== undefined)
                update.rewardAiba = Math.max(0, Number(req.validatedBody.rewardAiba || 0));
            if (req.validatedBody?.rewardNeur !== undefined)
                update.rewardNeur = Math.max(0, Number(req.validatedBody.rewardNeur || 0));
            if (req.validatedBody?.sortOrder !== undefined)
                update.sortOrder = Number(req.validatedBody.sortOrder || 100);

            if (update.title !== undefined && !update.title) {
                return res.status(400).json({ error: 'title cannot be empty' });
            }

            const task = await Task.findByIdAndUpdate(id, update, { new: true }).lean();
            if (!task) return res.status(404).json({ error: 'not found' });
            res.json(task);
        } catch (err) {
            console.error('Error updating task:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// DELETE /api/admin/tasks/:id
router.delete('/tasks/:id', validateParams({ id: { type: 'objectId', required: true } }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const deleted = await Task.findByIdAndDelete(id).lean();
        if (!deleted) return res.status(404).json({ error: 'not found' });
        res.json({ deleted: true });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
