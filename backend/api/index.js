const { createApp } = require('../app');
const { initDb } = require('../db');

const app = createApp();

module.exports = async (req, res) => {
    try {
        await initDb();
        return app(req, res);
    } catch (err) {
        console.error('Request failed (db/init):', err);
        return res.status(500).json({ error: 'backend init failed' });
    }
};
