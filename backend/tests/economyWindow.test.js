const test = require('node:test');
const assert = require('node:assert/strict');

const { isEmissionOpenAt } = require('../engine/economy');

test('isEmissionOpenAt respects simple window [start,end)', () => {
    const cfg = { emissionStartHourUtc: 8, emissionEndHourUtc: 20 };
    assert.equal(isEmissionOpenAt(cfg, {}, new Date(Date.UTC(2026, 0, 1, 7, 0, 0))), false);
    assert.equal(isEmissionOpenAt(cfg, {}, new Date(Date.UTC(2026, 0, 1, 8, 0, 0))), true);
    assert.equal(isEmissionOpenAt(cfg, {}, new Date(Date.UTC(2026, 0, 1, 19, 59, 0))), true);
    assert.equal(isEmissionOpenAt(cfg, {}, new Date(Date.UTC(2026, 0, 1, 20, 0, 0))), false);
});

test('isEmissionOpenAt handles wraparound windows (e.g. 22 -> 6)', () => {
    const cfg = { emissionStartHourUtc: 22, emissionEndHourUtc: 6 };
    assert.equal(isEmissionOpenAt(cfg, {}, new Date(Date.UTC(2026, 0, 1, 21, 0, 0))), false);
    assert.equal(isEmissionOpenAt(cfg, {}, new Date(Date.UTC(2026, 0, 1, 22, 0, 0))), true);
    assert.equal(isEmissionOpenAt(cfg, {}, new Date(Date.UTC(2026, 0, 2, 1, 0, 0))), true);
    assert.equal(isEmissionOpenAt(cfg, {}, new Date(Date.UTC(2026, 0, 2, 6, 0, 0))), false);
});

test('isEmissionOpenAt supports per-arena and arena:league overrides', () => {
    const cfg = {
        emissionStartHourUtc: 0,
        emissionEndHourUtc: 24,
        emissionWindowsUtc: {
            '*': { startHourUtc: 0, endHourUtc: 24 },
            prediction: { startHourUtc: 8, endHourUtc: 9 }, // 08:00-09:00
            'prediction:rookie': { startHourUtc: 10, endHourUtc: 11 }, // 10:00-11:00
        },
    };

    // arena:league overrides arena
    assert.equal(
        isEmissionOpenAt(cfg, { arena: 'prediction', league: 'rookie' }, new Date(Date.UTC(2026, 0, 1, 8, 30, 0))),
        false,
    );
    assert.equal(
        isEmissionOpenAt(
            cfg,
            { arena: 'prediction', league: 'rookie' },
            new Date(Date.UTC(2026, 0, 1, 10, 30, 0)),
        ),
        true,
    );

    // arena override applies when no arena:league override
    assert.equal(
        isEmissionOpenAt(cfg, { arena: 'prediction', league: 'pro' }, new Date(Date.UTC(2026, 0, 1, 8, 30, 0))),
        true,
    );
    assert.equal(
        isEmissionOpenAt(cfg, { arena: 'prediction', league: 'pro' }, new Date(Date.UTC(2026, 0, 1, 9, 30, 0))),
        false,
    );

    // '*' override applies when no arena key
    assert.equal(
        isEmissionOpenAt(cfg, { arena: 'simulation', league: 'rookie' }, new Date(Date.UTC(2026, 0, 1, 12, 0, 0))),
        true,
    );
});
