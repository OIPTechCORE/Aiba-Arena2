const express = require('express');
const router = express.Router();
const IntroScreen = require('../models/IntroScreen');
const { requireAdmin } = require('../middleware/requireAdmin');

// Apply admin authentication to all routes
router.use(requireAdmin());

// GET /api/admin/intro-screens - List all intro screens
router.get('/', async (req, res) => {
    try {
        const { screenType, active } = req.query;
        const filter = {};
        
        if (screenType) {
            filter.screenType = screenType;
        }
        
        if (active !== undefined) {
            filter.active = active === 'true';
        }

        const screens = await IntroScreen.find(filter)
            .sort({ screenType: 1, order: 1, createdAt: -1 })
            .select('screenType title description backgroundImageUrl mobileBackgroundImageUrl overlayOpacity textColor buttonColor active order displayDuration showSkipButton autoAdvance createdAt updatedAt');

        res.json({
            screens,
            total: screens.length
        });
    } catch (error) {
        console.error('Error fetching intro screens:', error);
        res.status(500).json({
            error: 'Failed to fetch intro screens'
        });
    }
});

// GET /api/admin/intro-screens/:id - Get single intro screen
router.get('/:id', async (req, res) => {
    try {
        const screen = await IntroScreen.findById(req.params.id);
        
        if (!screen) {
            return res.status(404).json({
                error: 'Intro screen not found'
            });
        }

        res.json({
            screen
        });
    } catch (error) {
        console.error('Error fetching intro screen:', error);
        res.status(500).json({
            error: 'Failed to fetch intro screen'
        });
    }
});

// POST /api/admin/intro-screens - Create new intro screen
router.post('/', async (req, res) => {
    try {
        const {
            screenType,
            title,
            description,
            backgroundImageUrl,
            mobileBackgroundImageUrl,
            overlayOpacity = 0.3,
            textColor = '#ffffff',
            buttonColor = '#007bff',
            active = true,
            order = 0,
            displayDuration = 5000,
            showSkipButton = true,
            autoAdvance = true
        } = req.body;

        // Validation
        if (!screenType || !title || !backgroundImageUrl) {
            return res.status(400).json({
                error: 'Missing required fields: screenType, title, backgroundImageUrl'
            });
        }

        // Validate screen type
        const validTypes = ['welcome', 'onboarding', 'tutorial', 'loading'];
        if (!validTypes.includes(screenType)) {
            return res.status(400).json({
                error: `Invalid screen type. Must be one of: ${validTypes.join(', ')}`
            });
        }

        // Validate URLs
        try {
            new URL(backgroundImageUrl);
            if (mobileBackgroundImageUrl) {
                new URL(mobileBackgroundImageUrl);
            }
        } catch {
            return res.status(400).json({
                error: 'Invalid background image URL format'
            });
        }

        const screen = new IntroScreen({
            screenType,
            title: title.trim(),
            description: description?.trim() || '',
            backgroundImageUrl: backgroundImageUrl.trim(),
            mobileBackgroundImageUrl: mobileBackgroundImageUrl?.trim() || '',
            overlayOpacity: Number(overlayOpacity) || 0.3,
            textColor: textColor.trim() || '#ffffff',
            buttonColor: buttonColor.trim() || '#007bff',
            active,
            order: Number(order) || 0,
            displayDuration: Number(displayDuration) || 5000,
            showSkipButton,
            autoAdvance
        });

        await screen.save();

        res.status(201).json({
            message: 'Intro screen created successfully',
            screen
        });
    } catch (error) {
        console.error('Error creating intro screen:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                error: errors.join(', ')
            });
        }

        res.status(500).json({
            error: 'Failed to create intro screen'
        });
    }
});

// PATCH /api/admin/intro-screens/:id - Update intro screen
router.patch('/:id', async (req, res) => {
    try {
        const updates = req.body;
        const allowedFields = [
            'screenType', 'title', 'description', 'backgroundImageUrl', 
            'mobileBackgroundImageUrl', 'overlayOpacity', 'textColor', 
            'buttonColor', 'active', 'order', 'displayDuration', 
            'showSkipButton', 'autoAdvance'
        ];
        
        // Filter only allowed fields
        const filteredUpdates = {};
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                if (field === 'screenType') {
                    const validTypes = ['welcome', 'onboarding', 'tutorial', 'loading'];
                    if (!validTypes.includes(updates[field])) {
                        return res.status(400).json({
                            error: `Invalid screen type. Must be one of: ${validTypes.join(', ')}`
                        });
                    }
                    filteredUpdates[field] = updates[field];
                } else if (field === 'backgroundImageUrl' || field === 'mobileBackgroundImageUrl') {
                    if (updates[field]) {
                        try {
                            new URL(updates[field]);
                            filteredUpdates[field] = updates[field].trim();
                        } catch {
                            return res.status(400).json({
                                error: `Invalid ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} format`
                            });
                        }
                    }
                } else if (field === 'overlayOpacity' || field === 'order' || field === 'displayDuration') {
                    filteredUpdates[field] = Number(updates[field]) || 0;
                } else if (field === 'title' || field === 'description' || field === 'textColor' || field === 'buttonColor') {
                    filteredUpdates[field] = updates[field]?.trim() || '';
                } else {
                    filteredUpdates[field] = updates[field];
                }
            }
        }

        const screen = await IntroScreen.findByIdAndUpdate(
            req.params.id,
            { $set: filteredUpdates },
            { new: true, runValidators: true }
        );

        if (!screen) {
            return res.status(404).json({
                error: 'Intro screen not found'
            });
        }

        res.json({
            message: 'Intro screen updated successfully',
            screen
        });
    } catch (error) {
        console.error('Error updating intro screen:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                error: errors.join(', ')
            });
        }

        res.status(500).json({
            error: 'Failed to update intro screen'
        });
    }
});

// DELETE /api/admin/intro-screens/:id - Delete intro screen
router.delete('/:id', async (req, res) => {
    try {
        const screen = await IntroScreen.findByIdAndDelete(req.params.id);

        if (!screen) {
            return res.status(404).json({
                error: 'Intro screen not found'
            });
        }

        res.json({
            message: 'Intro screen deleted successfully',
            screen
        });
    } catch (error) {
        console.error('Error deleting intro screen:', error);
        res.status(500).json({
            error: 'Failed to delete intro screen'
        });
    }
});

// POST /api/admin/intro-screens/:id/toggle - Toggle active status
router.post('/:id/toggle', async (req, res) => {
    try {
        const screen = await IntroScreen.findById(req.params.id);

        if (!screen) {
            return res.status(404).json({
                error: 'Intro screen not found'
            });
        }

        screen.active = !screen.active;
        await screen.save();

        res.json({
            message: 'Intro screen status toggled successfully',
            screen
        });
    } catch (error) {
        console.error('Error toggling intro screen:', error);
        res.status(500).json({
            error: 'Failed to toggle intro screen'
        });
    }
});

// POST /api/admin/intro-screens/reorder - Reorder screens
router.post('/reorder', async (req, res) => {
    try {
        const { screenOrders } = req.body; // Array of { id, order }

        if (!Array.isArray(screenOrders)) {
            return res.status(400).json({
                error: 'screenOrders must be an array'
            });
        }

        const bulkOps = screenOrders.map(({ id, order }) => ({
            updateOne: { filter: { _id: id }, update: { $set: { order: Number(order) } } }
        }));

        await IntroScreen.bulkWrite(bulkOps);

        res.json({
            message: 'Intro screens reordered successfully'
        });
    } catch (error) {
        console.error('Error reordering intro screens:', error);
        res.status(500).json({
            error: 'Failed to reorder intro screens'
        });
    }
});

module.exports = router;
