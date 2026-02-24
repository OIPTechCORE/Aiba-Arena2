const express = require('express');
const router = express.Router();
const ExternalApp = require('../models/ExternalApp');
const { requireAdmin } = require('../middleware/requireAdmin');

// Apply admin authentication to all routes
router.use(requireAdmin());

// GET /api/admin/external-apps - List all external apps
router.get('/', async (req, res) => {
    try {
        const { active = null } = req.query;
        const filter = {};
        
        if (active !== null) {
            filter.active = active === 'true';
        }

        const apps = await ExternalApp.find(filter)
            .sort({ order: 1, name: 1 })
            .select('id name description url active order icon badge createdAt updatedAt');

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

// POST /api/admin/external-apps - Create new external app
router.post('/', async (req, res) => {
    try {
        const { id, name, description, url, active = true, order = 0, icon = 'games', badge } = req.body;

        // Validation
        if (!id || !name || !url) {
            return res.status(400).json({
                error: 'Missing required fields: id, name, url'
            });
        }

        // Check if ID already exists
        const existingApp = await ExternalApp.findOne({ id });
        if (existingApp) {
            return res.status(400).json({
                error: 'App with this ID already exists'
            });
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return res.status(400).json({
                error: 'Invalid URL format'
            });
        }

        const app = new ExternalApp({
            id: id.trim().toLowerCase(),
            name: name.trim(),
            description: description?.trim() || '',
            url: url.trim(),
            active,
            order: Number(order) || 0,
            icon: icon?.trim() || 'games',
            badge: badge?.trim() || ''
        });

        await app.save();

        res.status(201).json({
            message: 'External app created successfully',
            app
        });
    } catch (error) {
        console.error('Error creating external app:', error);
        res.status(500).json({
            error: 'Failed to create external app'
        });
    }
});

// PATCH /api/admin/external-apps/:id - Update external app
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Validate URL if provided
        if (updates.url) {
            try {
                new URL(updates.url);
            } catch {
                return res.status(400).json({
                    error: 'Invalid URL format'
                });
            }
        }

        // Don't allow changing the ID
        delete updates.id;

        const app = await ExternalApp.findOneAndUpdate(
            { id },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!app) {
            return res.status(404).json({
                error: 'External app not found'
            });
        }

        res.json({
            message: 'External app updated successfully',
            app
        });
    } catch (error) {
        console.error('Error updating external app:', error);
        res.status(500).json({
            error: 'Failed to update external app'
        });
    }
});

// DELETE /api/admin/external-apps/:id - Delete external app
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const app = await ExternalApp.findOneAndDelete({ id });

        if (!app) {
            return res.status(404).json({
                error: 'External app not found'
            });
        }

        res.json({
            message: 'External app deleted successfully',
            app
        });
    } catch (error) {
        console.error('Error deleting external app:', error);
        res.status(500).json({
            error: 'Failed to delete external app'
        });
    }
});

// POST /api/admin/external-apps/reorder - Reorder apps
router.post('/reorder', async (req, res) => {
    try {
        const { appOrders } = req.body; // Array of { id, order }

        if (!Array.isArray(appOrders)) {
            return res.status(400).json({
                error: 'appOrders must be an array'
            });
        }

        const bulkOps = appOrders.map(({ id, order }) => ({
            updateOne: { filter: { id }, update: { $set: { order: Number(order) } } }
        }));

        await ExternalApp.bulkWrite(bulkOps);

        res.json({
            message: 'Apps reordered successfully'
        });
    } catch (error) {
        console.error('Error reordering external apps:', error);
        res.status(500).json({
            error: 'Failed to reorder external apps'
        });
    }
});

module.exports = router;
