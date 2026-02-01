const { mulberry32 } = require('./deterministicRandom');

function clamp01(x) {
    return Math.max(0, Math.min(1, x));
}

function simulateBattle({ broker, seed, arena, league }) {
    const rand = mulberry32(seed);

    const intelligence = clamp01(Number(broker.intelligence) / 100);
    const speed = clamp01(Number(broker.speed) / 100);
    const risk = clamp01(Number(broker.risk) / 100);

    // Arena affects weights (MVP)
    const arenaWeights =
        arena === 'prediction'
            ? { intelligence: 0.7, speed: 0.2, risk: 0.1 }
            : arena === 'simulation'
              ? { intelligence: 0.5, speed: 0.3, risk: 0.2 }
              : arena === 'strategyWars'
                ? { intelligence: 0.6, speed: 0.1, risk: 0.3 }
                : arena === 'guildWars'
                  ? { intelligence: 0.4, speed: 0.3, risk: 0.3 }
              : { intelligence: 0.5, speed: 0.3, risk: 0.2 };

    const leagueMul = league === 'elite' ? 1.2 : league === 'pro' ? 1.1 : 1.0;

    const base =
        100 *
        leagueMul *
        (arenaWeights.intelligence * intelligence + arenaWeights.speed * speed + arenaWeights.risk * risk);

    // risk adds variance
    const variance = 30 * leagueMul * (0.2 + risk);
    const noise = (rand() - 0.5) * 2 * variance;

    // outcome score is deterministic for (broker stats + seed + arena)
    const score = Math.max(0, Math.round(base + noise));
    return { score };
}

module.exports = { simulateBattle };

