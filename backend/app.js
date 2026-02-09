const express = require('express');
const cors = require('cors');

const { enforceProductionReadiness } = require('./security/productionReadiness');
const { requestId } = require('./middleware/requestId');
const { rateLimit } = require('./middleware/rateLimit');
const { responseEnvelope } = require('./middleware/response');
const { metricsMiddleware, metricsHandler } = require('./metrics');

function createApp() {
    // Fail fast in production if critical env/security settings are missing or unsafe.
    enforceProductionReadiness(process.env);

    const app = express();
    app.set('trust proxy', 1);
    app.use(requestId);
    app.use(responseEnvelope);
    app.use(metricsMiddleware);
    app.use(
        cors({
            origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : true,
            credentials: true,
        }),
    );
    app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));

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
    app.use('/api/admin/treasury', require('./routes/adminTreasury'));
    app.use('/api/admin/governance', require('./routes/adminGovernance'));
    app.use('/api/admin/realms', require('./routes/adminRealms'));
    app.use('/api/admin/marketplace', require('./routes/adminMarketplace'));
    app.use('/api/admin/treasury-ops', require('./routes/adminTreasuryOps'));
    app.use('/api/admin/stats', require('./routes/adminStats'));
    app.use('/api/battle', require('./routes/battle'));
    app.use('/api/brokers', require('./routes/brokers'));
    app.use('/api/vault', require('./routes/vault'));
    app.use('/api/leaderboard', require('./routes/leaderboard'));
    app.use('/api/marketplace', require('./routes/marketplace'));
    app.use('/api/realms', require('./routes/realms'));
    app.use('/api/missions', require('./routes/missions'));
    app.use('/api/mentors', require('./routes/mentors'));
    app.use('/api/assets', require('./routes/assets'));
    app.use('/api/asset-marketplace', require('./routes/assetMarketplace'));
    app.use('/api/governance', require('./routes/governance'));
    app.use('/api/boosts', require('./routes/boosts'));
    app.use('/api/staking', require('./routes/staking'));
    app.use('/api/dao', require('./routes/dao'));
    app.use('/api/daily', require('./routes/daily'));
    app.use('/api/gifts', require('./routes/gifts'));
    app.use('/api/oracle', require('./routes/oracle'));
    app.use('/api/treasury', require('./routes/treasury'));
    app.use('/api/charity', require('./routes/charity'));
    app.use('/api/admin/charity', require('./routes/adminCharity'));
    app.use('/api/announcements', require('./routes/announcements'));
    app.use('/api/admin/announcements', require('./routes/adminAnnouncements'));
    app.use('/api/university', require('./routes/university'));
    app.use('/api/admin/university', require('./routes/adminUniversity'));
    app.use('/api/admin/multiverse', require('./routes/adminMultiverse'));
    app.use('/api/multiverse', require('./routes/multiverse'));
    app.use('/api/stars-store', require('./routes/starsStore'));
    app.use('/api/car-racing', require('./routes/carRacing'));
    app.use('/api/bike-racing', require('./routes/bikeRacing'));

    app.get('/api/comms/status', (_req, res) =>
        res.json({ status: 'operational', updatedAt: new Date().toISOString() }));

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
