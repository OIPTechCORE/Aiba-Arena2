const router = require('express').Router();
const Task = require('../models/Task');
const { requireAdmin } = require('../middleware/requireAdmin');

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
router.post('/tasks', requireAdmin(), async (req, res) => {
    try {
        const title = String(req.body?.title ?? '').trim();
        const description = String(req.body?.description ?? '').trim();
        const enabled = req.body?.enabled === undefined ? true : Boolean(req.body.enabled);

        if (!title) return res.status(400).json({ error: 'title required' });

        const task = await Task.create({ title, description, enabled });
        res.status(201).json(task);
    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// PATCH /api/admin/tasks/:id
router.patch('/tasks/:id', requireAdmin(), async (req, res) => {
    try {
        const { id } = req.params;
        const update = {};

        if (req.body?.title !== undefined) update.title = String(req.body.title).trim();
        if (req.body?.description !== undefined) update.description = String(req.body.description).trim();
        if (req.body?.enabled !== undefined) update.enabled = Boolean(req.body.enabled);

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
});

// DELETE /api/admin/tasks/:id
router.delete('/tasks/:id', requireAdmin(), async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Task.findByIdAndDelete(id).lean();
        if (!deleted) return res.status(404).json({ error: 'not found' });
        res.json({ deleted: true });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;

