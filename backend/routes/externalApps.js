const express = require('express');
const router = express.Router();
const ExternalApp = require('../models/ExternalApp');

// GET /api/external-apps - Get all active external apps for public use
router.get('/', async (req, res) => {
    try {
        const apps = await ExternalApp.find({ active: true })
            .sort({ order: 1, name: 1 })
            .select('id name description url icon badge');

        res.json({
            apps,
            total: apps.length
        });
    } catch (error) {
        console.error('Error fetching external apps:', error);
        res.status(500).json({
            error: 'Failed to fetch external apps'
        });
    }
});

module.exports = router;
