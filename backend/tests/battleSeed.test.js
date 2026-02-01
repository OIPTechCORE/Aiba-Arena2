const test = require('node:test');
const assert = require('node:assert/strict');

const { hmacSha256Hex, seedFromHex } = require('../engine/deterministicRandom');
const { buildBattleSeedMessage } = require('../engine/battleSeed');

test('buildBattleSeedMessage is stable and includes modeKey', () => {
    const msg = buildBattleSeedMessage({
        telegramId: 't1',
        brokerId: 'b1',
        modeKey: 'prediction-pro',
        arena: 'prediction',
        league: 'pro',
        requestId: 'r1',
        opponentId: 'g2',
    });

    assert.equal(msg, 't1:b1:prediction-pro:prediction:pro:r1:g2');
});

test('battle seed changes when modeKey changes (prevents cross-mode replay)', () => {
    const secret = 'secret';
    const base = {
        telegramId: 't1',
        brokerId: 'b1',
        arena: 'prediction',
        league: 'rookie',
        requestId: 'same-request',
        opponentId: '',
    };

    const msgA = buildBattleSeedMessage({ ...base, modeKey: 'prediction' });
    const msgB = buildBattleSeedMessage({ ...base, modeKey: 'prediction-pro' });

    const seedA = seedFromHex(hmacSha256Hex(secret, msgA));
    const seedB = seedFromHex(hmacSha256Hex(secret, msgB));

    assert.notEqual(seedA, seedB);
});

