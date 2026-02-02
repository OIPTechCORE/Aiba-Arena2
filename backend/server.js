require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

const { enforceProductionReadiness } = require('./security/productionReadiness');
const { requestId } = require('./middleware/requestId');
const { rateLimit } = require('./middleware/rateLimit');
const { metricsMiddleware, metricsHandler } = require('./metrics');
const GameMode = require('./models/GameMode');

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

// Fail fast in production if critical env/security settings are missing or unsafe.
try {
    enforceProductionReadiness(process.env);
} catch (err) {
    console.error('Startup blocked by production readiness checks:', err?.message || err);
    process.exit(1);
}

async function ensureDefaultGameModes() {
    // Idempotent: only inserts missing keys, never overwrites admin-tuned settings.
    const arenas = ['prediction', 'simulation', 'strategyWars', 'guildWars'];
    const leagues = ['rookie', 'pro', 'elite'];

    const defaults = [];
    for (const arena of arenas) {
        for (const league of leagues) {
            const key = league === 'rookie' ? arena : `${arena}-${league}`;
            const baseEnergy = league === 'elite' ? 20 : league === 'pro' ? 15 : 10;
            const baseCooldown = league === 'elite' ? 60 : league === 'pro' ? 45 : 30;

            defaults.push({
                key,
                name: `${arena} (${league})`,
                description: 'Auto-generated default game mode',
                enabled: true,
                arena,
                league,
                energyCost: arena === 'guildWars' ? baseEnergy + 5 : baseEnergy,
                cooldownSeconds: arena === 'guildWars' ? baseCooldown + 15 : baseCooldown,
                entryNeurCost: 0,
                entryAibaCost: 0,
                rewardMultiplierAiba: 1.0,
                rewardMultiplierNeur: 1.0,
                rules: arena === 'guildWars' ? { requiresGuild: true } : {},
            });
        }
    }

    if (!defaults.length) return;
    await GameMode.bulkWrite(
        defaults.map((m) => ({
            updateOne: {
                filter: { key: m.key },
                update: { $setOnInsert: m },
                upsert: true,
            },
        })),
        { ordered: false },
    );
}

// Connect with error handling
mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');
        try {
            await ensureDefaultGameModes();
        } catch (err) {
            console.error('Failed to ensure default game modes:', err);
        }
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

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

// Legacy auto-dispatch (deprecated): the mainnet/hardened flow uses AIBA credits + signed vault claims.
// Keep this OFF by default; only enable for legacy migrations/debugging.
const enableLegacyPendingAibaDispatch = String(process.env.ENABLE_LEGACY_PENDING_AIBA_DISPATCH || '').toLowerCase() === 'true';
if (enableLegacyPendingAibaDispatch) {
    const sendAIBA = require('./ton/sendAiba');
    const User = require('./models/User');

    // Run hourly, process each user safely, per-user try/catch and retries
    cron.schedule('0 * * * *', async () => {
        console.log('Cron: starting pendingAIBA dispatch');
        try {
            const users = await User.find({ pendingAIBA: { $gt: 0 } });
            for (const user of users) {
                if (!user.wallet) {
                    console.warn(`Skipping user ${user._id} — no wallet set`);
                    continue;
                }

                const amount = user.pendingAIBA;
                let attempts = 0;
                const maxAttempts = 3;
                let sent = false;

                while (attempts < maxAttempts && !sent) {
                    attempts++;
                    try {
                        console.log(`Sending ${amount} to ${user.wallet} (user ${user._id}), attempt ${attempts}`);
                        await sendAIBA(user.wallet, amount);
                        user.pendingAIBA = 0;
                        await user.save();
                        sent = true;
                        console.log(`Sent AIBA to ${user._id}`);
                    } catch (err) {
                        console.error(`Failed to send AIBA to ${user._id} (attempt ${attempts}):`, err);
                        await new Promise((r) => setTimeout(r, 2000 * attempts));
                    }
                }

                if (!sent) {
                    console.error(`Giving up sending to ${user._id} after ${maxAttempts} attempts`);
                }
            }
        } catch (err) {
            console.error('Cron: unexpected error:', err);
        }
    });
}

app.get('/health', (_req, res) => res.json({ ok: true }));

// Last-resort error handler (keeps responses consistent)
// NOTE: Most routes already use try/catch; this catches sync errors + next(err) flows.
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', { requestId: req.requestId, err });
    res.status(500).json({ error: 'internal server error', requestId: req.requestId || '' });
});

app.listen(process.env.PORT || 5000, () => console.log('Server listening'));
