const test = require('node:test');
const assert = require('node:assert/strict');

const { simulateBattle } = require('../engine/battleEngine');

test('simulateBattle is deterministic for same inputs', () => {
    const broker = { intelligence: 60, speed: 40, risk: 20, level: 3 };
    const a = simulateBattle({ broker, seed: 123456, arena: 'prediction', league: 'rookie' }).score;
    const b = simulateBattle({ broker, seed: 123456, arena: 'prediction', league: 'rookie' }).score;
    assert.equal(a, b);
});

test('higher league generally increases score baseline', () => {
    const broker = { intelligence: 80, speed: 80, risk: 10, level: 1 };
    const seed = 42;
    const rookie = simulateBattle({ broker, seed, arena: 'prediction', league: 'rookie' }).score;
    const pro = simulateBattle({ broker, seed, arena: 'prediction', league: 'pro' }).score;
    const elite = simulateBattle({ broker, seed, arena: 'prediction', league: 'elite' }).score;
    assert.ok(pro >= rookie);
    assert.ok(elite >= pro);
});

test('rules can override arena weights and variance', () => {
    const broker = { intelligence: 100, speed: 0, risk: 0, level: 1 };
    const seed = 1;

    const base = simulateBattle({ broker, seed, arena: 'prediction', league: 'rookie' }).score;
    const overridden = simulateBattle({
        broker,
        seed,
        arena: 'prediction',
        league: 'rookie',
        rules: { arenaWeights: { intelligence: 0.0, speed: 1.0, risk: 0.0 }, varianceBase: 0 },
    }).score;

    // With overridden weights, this broker should perform much worse.
    assert.ok(overridden < base);
});
