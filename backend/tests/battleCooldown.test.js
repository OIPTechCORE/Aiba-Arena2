const test = require('node:test');
const assert = require('node:assert/strict');

const { getBattleCooldownKey } = require('../engine/battleCooldown');

test('getBattleCooldownKey prefers modeKey', () => {
    assert.equal(getBattleCooldownKey({ modeKey: 'prediction-pro', arena: 'prediction' }), 'prediction-pro');
});

test('getBattleCooldownKey falls back to arena when modeKey missing', () => {
    assert.equal(getBattleCooldownKey({ modeKey: '', arena: 'prediction' }), 'prediction');
    assert.equal(getBattleCooldownKey({ arena: 'prediction' }), 'prediction');
});
