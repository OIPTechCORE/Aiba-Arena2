/**
 * Public schools list (for MemeFi/LMS school selector in miniapp).
 * Admin CRUD remains in adminSchools.
 */
const router = require('express').Router();
const School = require('../models/School');

// GET /api/schools — list all schools (id, name, slug) for dropdown
router.get('/', async (_req, res) => {
    try {
        const list = await School.find().sort({ name: 1 }).select('_id name slug').lean();
        res.json(list);
    } catch (err) {
        console.error('Schools list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
