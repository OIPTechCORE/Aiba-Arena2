const router = require('express').Router();
const Task = require('../models/Task');

// Public tasks feed for the miniapp
router.get('/', async (_req, res) => {
    try {
        const tasks = await Task.find({ enabled: true }).sort({ createdAt: -1 }).lean();
        res.json(tasks);
    } catch (err) {
        console.error('Error fetching public tasks:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;

