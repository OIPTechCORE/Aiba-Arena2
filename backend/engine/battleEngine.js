const { mulberry32 } = require('./deterministicRandom');

function clamp01(x) {
    return Math.max(0, Math.min(1, x));
}

function clampInt(n, min, max) {
    const x = Number(n);
    if (!Number.isFinite(x)) return min;
    return Math.max(min, Math.min(max, Math.floor(x)));
}

function simulateBattle({ broker, seed, arena, league, rules = {} }) {
    const rand = mulberry32(seed);

    const intelligence = clamp01(Number(broker.intelligence) / 100);
    const speed = clamp01(Number(broker.speed) / 100);
    const risk = clamp01(Number(broker.risk) / 100);
    const level = clampInt(broker.level ?? 1, 1, 10_000);

    // Arena affects weights (MVP)
    const defaultArenaWeights =
        arena === 'prediction'
            ? { intelligence: 0.7, speed: 0.2, risk: 0.1 }
            : arena === 'simulation'
              ? { intelligence: 0.5, speed: 0.3, risk: 0.2 }
              : arena === 'strategyWars'
                ? { intelligence: 0.6, speed: 0.1, risk: 0.3 }
                : arena === 'guildWars'
                  ? { intelligence: 0.4, speed: 0.3, risk: 0.3 }
                  : { intelligence: 0.5, speed: 0.3, risk: 0.2 };

    const arenaWeights =
        rules?.arenaWeights && typeof rules.arenaWeights === 'object'
            ? { ...defaultArenaWeights, ...rules.arenaWeights }
            : defaultArenaWeights;

    const leagueMul =
        typeof rules?.leagueMultiplier === 'number'
            ? Number(rules.leagueMultiplier) || 1.0
            : league === 'elite'
              ? 1.2
              : league === 'pro'
                ? 1.1
                : 1.0;

    // Level adds a modest deterministic bonus (prevents "flat" early game).
    const levelMul = 1 + Math.min(0.5, Math.max(0, level - 1) * 0.02); // +2% per level, capped at +50%

    const base =
        100 *
        leagueMul *
        levelMul *
        (arenaWeights.intelligence * intelligence + arenaWeights.speed * speed + arenaWeights.risk * risk);

    // risk adds variance
    const varianceBase = typeof rules?.varianceBase === 'number' ? Number(rules.varianceBase) : 30;
    const variance = varianceBase * leagueMul * (0.2 + risk);
    const noise = (rand() - 0.5) * 2 * variance;

    // outcome score is deterministic for (broker stats + seed + arena)
    const score = Math.max(0, Math.round(base + noise));
    return { score };
}

module.exports = { simulateBattle };
