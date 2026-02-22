const express = require('express');
const router = express.Router();
const IntroScreen = require('../models/IntroScreen');

// GET /api/intro-screens - Get all active intro screens for public use
router.get('/', async (req, res) => {
    try {
        const { screenType } = req.query;
        const filter = { active: true };
        
        if (screenType) {
            filter.screenType = screenType;
        }

        const screens = await IntroScreen.find(filter)
            .sort({ screenType: 1, order: 1 })
            .select('screenType title description backgroundImageUrl mobileBackgroundImageUrl overlayOpacity textColor buttonColor displayDuration showSkipButton autoAdvance');

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

module.exports = router;
