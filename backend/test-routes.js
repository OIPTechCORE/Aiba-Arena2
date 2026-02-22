require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');

// Import intro screen model
const IntroScreen = require('./models/IntroScreen');

const app = express();

// Basic middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : true,
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Admin intro screens routes (without auth for testing)
app.get('/api/admin/intro-screens', async (req, res) => {
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
            ok: false,
            error: {
                code: 'FETCH_FAILED',
                message: 'Failed to fetch intro screens'
            }
        });
    }
});

app.post('/api/admin/intro-screens', async (req, res) => {
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
            order = 0,
            displayDuration = 5000,
            showSkipButton = true,
            autoAdvance = false,
            active = true
        } = req.body;

        if (!screenType || !title || !backgroundImageUrl) {
            return res.status(400).json({
                ok: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'screenType, title, and backgroundImageUrl are required'
                }
            });
        }

        const screen = new IntroScreen({
            screenType,
            title,
            description,
            backgroundImageUrl,
            mobileBackgroundImageUrl,
            overlayOpacity,
            textColor,
            buttonColor,
            order,
            displayDuration,
            showSkipButton,
            autoAdvance,
            active
        });

        await screen.save();

        res.status(201).json({
            ok: true,
            screen
        });
    } catch (error) {
        console.error('Error creating intro screen:', error);
        res.status(500).json({
            ok: false,
            error: {
                code: 'CREATE_FAILED',
                message: 'Failed to create intro screen'
            }
        });
    }
});

// Public intro screens route
app.get('/api/intro-screens', async (req, res) => {
    try {
        const { screenType } = req.query;
        const filter = { active: true };
        
        if (screenType) {
            filter.screenType = screenType;
        }

        const screens = await IntroScreen.find(filter)
            .sort({ order: 1, createdAt: -1 })
            .select('screenType title description backgroundImageUrl mobileBackgroundImageUrl overlayOpacity textColor buttonColor displayDuration showSkipButton autoAdvance');

        res.json({
            screens,
            total: screens.length
        });
    } catch (error) {
        console.error('Error fetching intro screens:', error);
        res.status(500).json({
            ok: false,
            error: {
                code: 'FETCH_FAILED',
                message: 'Failed to fetch intro screens'
            }
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
(async () => {
    try {
        await initDb();
        console.log('MongoDB connected successfully');
        
        app.listen(process.env.PORT || 5000, () => {
            console.log('Test server started', { port: process.env.PORT || 5000 });
            console.log('Intro screen API endpoints:');
            console.log('  GET /api/admin/intro-screens - List all intro screens');
            console.log('  POST /api/admin/intro-screens - Create new intro screen');
            console.log('  GET /api/intro-screens - Get active intro screens (public)');
            console.log('  GET /health - Health check');
        });
    } catch (err) {
        console.error('Test server startup failed', { error: err.message });
        process.exit(1);
    }
})();
