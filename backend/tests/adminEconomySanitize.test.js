const test = require('node:test');
const assert = require('node:assert/strict');

const {
    getAllowedArenaKeysFromModes,
    sanitizeCapMap,
    sanitizeEmissionWindowsUtc,
} = require('../engine/adminEconomySanitize');

test('getAllowedArenaKeysFromModes includes arenas/leagues and system arenas', () => {
    const allowed = getAllowedArenaKeysFromModes([
        { arena: 'prediction', league: 'rookie' },
        { arena: 'simulation', league: 'pro' },
    ]);

    assert.equal(allowed.arenas.has('prediction'), true);
    assert.equal(allowed.arenas.has('simulation'), true);
    assert.equal(allowed.arenaLeague.has('prediction:rookie'), true);
    assert.equal(allowed.arenaLeague.has('simulation:pro'), true);

    // system
    assert.equal(allowed.arenas.has('vault'), true);
    assert.equal(allowed.arenaLeague.has('vault:global'), true);
});

test('sanitizeCapMap drops arena:league keys and unknown arenas', () => {
    const allowedArenas = new Set(['prediction']);
    const out = sanitizeCapMap(
        {
            prediction: 100,
            'prediction:rookie': 999,
            unknown: 50,
            bad: -1,
        },
        allowedArenas,
    );

    assert.deepEqual(out, { prediction: 100 });
});

test('sanitizeEmissionWindowsUtc allows * plus allowed arenas and arena:league', () => {
    const allowed = {
        arenas: new Set(['prediction']),
        arenaLeague: new Set(['prediction:rookie']),
    };

    const out = sanitizeEmissionWindowsUtc(
        {
            '*': { startHourUtc: 0, endHourUtc: 24 },
            prediction: { startHourUtc: 8, endHourUtc: 9 },
            'prediction:rookie': { startHourUtc: 10, endHourUtc: 11 },
            unknown: { startHourUtc: 1, endHourUtc: 2 },
            'prediction:pro': { startHourUtc: 3, endHourUtc: 4 },
        },
        allowed,
    );

    assert.deepEqual(out, {
        '*': { startHourUtc: 0, endHourUtc: 24 },
        prediction: { startHourUtc: 8, endHourUtc: 9 },
        'prediction:rookie': { startHourUtc: 10, endHourUtc: 11 },
    });
});
