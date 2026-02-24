const express = require('express');
const cors = require('cors');

// Enable production readiness for security
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

    // Enable rate limiting for security
    app.use(rateLimit);
    // app.use(rateLimit({ windowMs: 60_000, max: Number(process.env.RATE_LIMIT_PER_MINUTE || 600) || 600 }));

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
    app.use('/api/admin/audit', require('./routes/adminAudit'));
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/admin/brokers', require('./routes/adminBrokers'));
    app.use('/api/admin/ads', require('./routes/adminAds'));
    app.use('/api/admin/game-modes', require('./routes/adminGameModes'));
    app.use('/api/admin/economy', require('./routes/adminEconomy'));
    app.use('/api/admin/economy-automation', require('./routes/economyAutomation'));
    app.use('/api/admin/oracle', require('./routes/adminOracle'));
    app.use('/api/admin/tournaments', require('./routes/adminTournaments'));
    app.use('/api/admin/global-boss', require('./routes/adminGlobalBoss'));
    app.use('/api/admin/mod', require('./routes/adminModeration'));
    app.use('/api/admin/treasury', require('./routes/adminTreasury'));
    app.use('/api/admin/governance', require('./routes/adminGovernance'));
    app.use('/api/admin/dao', require('./routes/adminDao'));
    app.use('/api/admin/realms', require('./routes/adminRealms'));
    app.use('/api/admin/marketplace', require('./routes/adminMarketplace'));
    app.use('/api/admin/treasury-ops', require('./routes/adminTreasuryOps'));
    app.use('/api/admin/stats', require('./routes/adminStats'));
    app.use('/api/admin/memefi', require('./routes/adminMemefi'));
    app.use('/api/admin/redemption', require('./routes/adminRedemption'));
    app.use('/api/admin', require('./routes/adminSchools'));
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
    app.use('/api/comms', require('./routes/comms'));
    app.use('/api/support', require('./routes/support'));
    app.use('/api/admin/support', require('./routes/adminSupport'));
    app.use('/api/admin/referrals', require('./routes/adminReferrals'));
    app.use('/api/university', require('./routes/university'));
    app.use('/api/admin/university', require('./routes/adminUniversity'));
    app.use('/api/admin/multiverse', require('./routes/adminMultiverse'));
    app.use('/api/multiverse', require('./routes/multiverse'));
    app.use('/api/stars-store', require('./routes/starsStore'));
    app.use('/api/car-racing', require('./routes/carRacing'));
    app.use('/api/bike-racing', require('./routes/bikeRacing'));
    app.use('/api/tournaments', require('./routes/tournaments'));
    app.use('/api/global-boss', require('./routes/globalBoss'));
    app.use('/api/premium', require('./routes/premium'));
    app.use('/api/broker-rental', require('./routes/brokerRental'));
    app.use('/api/breeding', require('./routes/breeding'));
    app.use('/api/trainers', require('./routes/trainers'));
    app.use('/api/admin/trainers', require('./routes/adminTrainers'));
    app.use('/api/admin/external-apps', require('./routes/adminExternalApps'));
    app.use('/api/admin/intro-screens', require('./routes/adminIntroScreens'));
    app.use('/api/admin/daily-habits', require('./routes/adminDailyHabits'));
    app.use('/api/admin/competitions', require('./routes/adminCompetitions'));
    app.use('/api/admin/social-shares', require('./routes/adminSocialShares'));
    app.use('/api/admin/emotional-investments', require('./routes/adminEmotionalInvestments'));
    
    // Public API routes
    app.use('/api/daily-habits', require('./routes/dailyHabits'));
    app.use('/api/competitions', require('./routes/competitions'));
    app.use('/api/social-shares', require('./routes/socialShares'));
    app.use('/api/emotional-investments', require('./routes/emotionalInvestments'));

    app.use('/api/p2p-aiba', require('./routes/p2pAiba'));
    app.use('/api/donate', require('./routes/donate'));
    app.use('/api/predict', require('./routes/predict'));
    app.use('/api/admin/predict', require('./routes/adminPredict'));
    app.use('/api/schools', require('./routes/schools'));
    app.use('/api/memefi', require('./routes/memefi'));
    app.use('/api/redemption', require('./routes/redemption'));
    app.use('/api/partner', require('./routes/partnerRedemption'));

    // Comms status moved to /api/comms router

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
