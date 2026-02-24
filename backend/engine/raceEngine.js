const { mulberry32, hmacSha256Hex, seedFromHex } = require('./deterministicRandom');

function clamp01(x) {
    return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * Deterministic race simulation. Vehicles compete on a track; seed fixes outcome.
 * @param {Object} opts
 * @param {Array<{ entryId: string, topSpeed: number, acceleration: number, handling: number, durability: number, level?: number }>} opts.vehicles
 * @param {number} opts.trackLength - virtual track length (e.g. 1-10)
 * @param {number} opts.trackDifficulty - 0-100, affects handling weight
 * @param {string} opts.seed - hex or string seed for RNG
 * @returns {Array<{ entryId: string, position: number, finishTime: number, points: number }>} ordered by position 1, 2, 3...
 */
function simulateRace({ vehicles, trackLength = 1, trackDifficulty = 50, seed = '' }) {
    const seedHex =
        typeof seed === 'string' && /^[0-9a-fA-F]+$/.test(seed)
            ? seed
            : require('crypto').createHash('sha256').update(String(seed)).digest('hex');
    const seedNum = seedFromHex(seedHex);
    const rand = mulberry32(seedNum);

    const difficulty = clamp01(trackDifficulty / 100);
    const length = Math.max(0.1, Number(trackLength) || 1);

    // Weights: speed and acceleration for straight; handling for difficulty (turns)
    const speedWeight = 0.35;
    const accelWeight = 0.35;
    const handlingWeight = 0.15 + difficulty * 0.2;
    const durabilityWeight = 0.15;

    const results = vehicles.map((v, idx) => {
        const topSpeed = clamp01((v.topSpeed ?? 50) / 100);
        const acceleration = clamp01((v.acceleration ?? 50) / 100);
        const handling = clamp01((v.handling ?? 50) / 100);
        const durability = clamp01((v.durability ?? 50) / 100);
        const level = Math.max(1, Math.min(1000, Number(v.level) ?? 1));
        const levelBonus = 1 + (level - 1) * 0.01; // +1% per level, cap implicit

        const base =
            (speedWeight * topSpeed +
                accelWeight * acceleration +
                handlingWeight * handling +
                durabilityWeight * durability) *
            levelBonus *
            length;

        const variance = 0.1 * (1 - durability * 0.5);
        const noise = (rand() - 0.5) * 2 * variance * base;
        const performance = Math.max(0.01, base + noise);

        return {
            entryId: v.entryId,
            finishTime: 1000 / performance,
            rawPerformance: performance,
        };
    });

    results.sort((a, b) => b.rawPerformance - a.rawPerformance);

    const pointsMap = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

    return results.map((r, idx) => ({
        entryId: r.entryId,
        position: idx + 1,
        finishTime: Math.round(r.finishTime * 100) / 100,
        points: pointsMap[idx] ?? 0,
    }));
}

module.exports = { simulateRace };
