require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');

// Import intro screen routes
const adminIntroScreensRoutes = require('./routes/adminIntroScreens');
const introScreensRoutes = require('./routes/introScreens');

const app = express();

// Basic middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : true,
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/admin/intro-screens', adminIntroScreensRoutes);
app.use('/api/intro-screens', introScreensRoutes);

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
        });
    } catch (err) {
        console.error('Test server startup failed', { error: err.message });
        process.exit(1);
    }
})();
