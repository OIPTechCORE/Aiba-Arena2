const test = require('node:test');
const assert = require('node:assert/strict');

const { applyEnergyRegen } = require('../engine/battleEnergy');

test('applyEnergyRegen increases energy and advances energyUpdatedAt', () => {
    const cfg = { battleMaxEnergy: 10, battleEnergyRegenSecondsPerEnergy: 60 };
    const now = new Date(Date.UTC(2026, 0, 1, 0, 10, 0)); // 00:10:00
    const broker = {
        energy: 5,
        energyUpdatedAt: new Date(Date.UTC(2026, 0, 1, 0, 7, 0)), // 3 minutes ago
    };

    applyEnergyRegen(broker, now, cfg);

    assert.equal(broker.energy, 8);
    assert.equal(broker.energyUpdatedAt.toISOString(), new Date(Date.UTC(2026, 0, 1, 0, 10, 0)).toISOString());
});

test('applyEnergyRegen respects max energy cap', () => {
    const cfg = { battleMaxEnergy: 10, battleEnergyRegenSecondsPerEnergy: 60 };
    const now = new Date(Date.UTC(2026, 0, 1, 0, 10, 0));
    const broker = {
        energy: 9,
        energyUpdatedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, 0)), // 10 minutes ago
    };

    applyEnergyRegen(broker, now, cfg);

    assert.equal(broker.energy, 10);
});

test('applyEnergyRegen does nothing if not enough time passed', () => {
    const cfg = { battleMaxEnergy: 10, battleEnergyRegenSecondsPerEnergy: 60 };
    const now = new Date(Date.UTC(2026, 0, 1, 0, 0, 30));
    const broker = {
        energy: 5,
        energyUpdatedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, 0)),
    };

    applyEnergyRegen(broker, now, cfg);

    assert.equal(broker.energy, 5);
    assert.equal(broker.energyUpdatedAt.toISOString(), new Date(Date.UTC(2026, 0, 1, 0, 0, 0)).toISOString());
});

test('applyEnergyRegen falls back to updatedAt if energyUpdatedAt missing', () => {
    const cfg = { battleMaxEnergy: 10, battleEnergyRegenSecondsPerEnergy: 60 };
    const now = new Date(Date.UTC(2026, 0, 1, 0, 10, 0));
    const broker = {
        energy: 0,
        updatedAt: new Date(Date.UTC(2026, 0, 1, 0, 5, 0)),
    };

    applyEnergyRegen(broker, now, cfg);

    assert.equal(broker.energy, 5);
    assert.equal(broker.energyUpdatedAt.toISOString(), new Date(Date.UTC(2026, 0, 1, 0, 10, 0)).toISOString());
});
