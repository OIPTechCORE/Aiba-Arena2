const express = require('express');
const cors = require('cors');

const { enforceProductionReadiness } = require('./security/productionReadiness');
const { requestId } = require('./middleware/requestId');
const { rateLimit } = require('./middleware/rateLimit');
const { metricsMiddleware, metricsHandler } = require('./metrics');

function createApp() {
    // Fail fast in production if critical env/security settings are missing or unsafe.
    enforceProductionReadiness(process.env);

    const app = express();
    app.set('trust proxy', 1);
    app.use(requestId);
    app.use(metricsMiddleware);
    app.use(
        cors({
            origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : true,
            credentials: true,
        }),
    );
    app.use(express.json());

    // Basic global rate limit (IP-based). More specific per-route limits can be layered on top.
    app.use(rateLimit({ windowMs: 60_000, max: Number(process.env.RATE_LIMIT_PER_MINUTE || 600) || 600 }));

    app.use('/api/wallet', require('./routes/wallet'));
    app.use('/api/game', require('./routes/game'));
    app.use('/api/tasks', require('./routes/tasks'));
    app.use('/api/ads', require('./routes/ads'));
    app.use('/api/economy', require('./routes/economy'));
    app.use('/api/game-modes', require('./routes/gameModes'));
    app.use('/api/guilds', require('./routes/guilds'));
    app.use('/api/referrals', require('./routes/referrals'));
    app.use('/api/metadata', require('./routes/metadata'));

    app.use('/api/admin/auth', require('./routes/adminAuth'));
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/admin/brokers', require('./routes/adminBrokers'));
    app.use('/api/admin/ads', require('./routes/adminAds'));
    app.use('/api/admin/game-modes', require('./routes/adminGameModes'));
    app.use('/api/admin/economy', require('./routes/adminEconomy'));
    app.use('/api/admin/mod', require('./routes/adminModeration'));
    app.use('/api/battle', require('./routes/battle'));
    app.use('/api/brokers', require('./routes/brokers'));
    app.use('/api/vault', require('./routes/vault'));

    // Prometheus metrics endpoint (for monitoring/alerting)
    app.get('/metrics', metricsHandler);
    app.get('/health', (_req, res) => res.json({ ok: true }));

    // Last-resort error handler (keeps responses consistent)
    // NOTE: Most routes already use try/catch; this catches sync errors + next(err) flows.
    app.use((err, req, res, _next) => {
        console.error('Unhandled error:', { requestId: req.requestId, err });
        res.status(500).json({ error: 'internal server error', requestId: req.requestId || '' });
    });

    return app;
}

module.exports = { createApp };
