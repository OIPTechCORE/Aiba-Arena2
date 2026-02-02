const { createApp } = require('../app');
const { initDb } = require('../db');

let app = null;
let appInitError = null;
try {
    app = createApp();
} catch (err) {
    appInitError = err;
    console.error('Backend app init failed:', err);
}

module.exports = async (req, res) => {
    try {
        if (appInitError) {
            return res.status(500).json({
                error: 'backend misconfigured',
                code: appInitError.code || '',
                detail: appInitError.message || String(appInitError),
                details: Array.isArray(appInitError.details) ? appInitError.details : undefined,
            });
        }

        await initDb();
        return app(req, res);
    } catch (err) {
        console.error('Request failed (db/init):', err);
        return res.status(500).json({ error: 'backend init failed', detail: err?.message || String(err) });
    }
};
