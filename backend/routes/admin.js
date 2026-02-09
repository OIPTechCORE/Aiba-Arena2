const router = require('express').Router();
const Task = require('../models/Task');
const { requireAdmin } = require('../middleware/requireAdmin');
const { validateBody, validateParams } = require('../middleware/validate');

// Minimal endpoints for the admin panel

// GET /api/admin/tasks
router.get('/tasks', requireAdmin(), async (_req, res) => {
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
    requireAdmin(),
    validateBody({
        title: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
        description: { type: 'string', trim: true, maxLength: 2000 },
        enabled: { type: 'boolean' },
    }),
    async (req, res) => {
    try {
        const title = String(req.validatedBody?.title ?? '').trim();
        const description = String(req.validatedBody?.description ?? '').trim();
        const enabled = req.validatedBody?.enabled === undefined ? true : Boolean(req.validatedBody.enabled);

        if (!title) return res.status(400).json({ error: 'title required' });

        const task = await Task.create({ title, description, enabled });
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
    requireAdmin(),
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({
        title: { type: 'string', trim: true, maxLength: 200 },
        description: { type: 'string', trim: true, maxLength: 2000 },
        enabled: { type: 'boolean' },
    }),
    async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const update = {};

        if (req.validatedBody?.title !== undefined) update.title = String(req.validatedBody.title).trim();
        if (req.validatedBody?.description !== undefined)
            update.description = String(req.validatedBody.description).trim();
        if (req.validatedBody?.enabled !== undefined) update.enabled = Boolean(req.validatedBody.enabled);

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
router.delete(
    '/tasks/:id',
    requireAdmin(),
    validateParams({ id: { type: 'objectId', required: true } }),
    async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const deleted = await Task.findByIdAndDelete(id).lean();
        if (!deleted) return res.status(404).json({ error: 'not found' });
        res.json({ deleted: true });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
