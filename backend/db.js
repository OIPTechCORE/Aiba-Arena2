const mongoose = require('mongoose');
const GameMode = require('./models/GameMode');

function getCache() {
    // Persist across serverless invocations when possible.
    const g = global;
    if (!g.__aibaDbCache) {
        g.__aibaDbCache = {
            conn: null,
            promise: null,
            defaultsEnsured: false,
        };
    }
    return g.__aibaDbCache;
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

async function initDb() {
    const cache = getCache();
    if (cache.conn) return cache.conn;

    const uri = String(process.env.MONGO_URI || '').trim();
    if (!uri) throw new Error('MONGO_URI not configured');

    if (!cache.promise) {
        cache.promise = mongoose.connect(uri).then(async (m) => {
            return m;
        });
    }

    cache.conn = await cache.promise;

    if (!cache.defaultsEnsured) {
        try {
            await ensureDefaultGameModes();
            cache.defaultsEnsured = true;
        } catch (err) {
            // Defaults are non-critical; don't block startup.
            console.error('Failed to ensure default game modes:', err);
        }
    }

    return cache.conn;
}

module.exports = { initDb };
