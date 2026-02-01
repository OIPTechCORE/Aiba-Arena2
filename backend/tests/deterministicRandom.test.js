const test = require('node:test');
const assert = require('node:assert/strict');

const { hmacSha256Hex, seedFromHex, mulberry32 } = require('../engine/deterministicRandom');

test('hmacSha256Hex is deterministic', () => {
    const a = hmacSha256Hex('secret', 'message');
    const b = hmacSha256Hex('secret', 'message');
    assert.equal(a, b);
    assert.match(a, /^[0-9a-f]{64}$/);
});

test('seedFromHex uses first 32 bits', () => {
    assert.equal(seedFromHex('00000000ffffffff'), 0);
    assert.equal(seedFromHex('00000001ffffffff'), 1);
    assert.equal(seedFromHex('ffffffff00000000') >>> 0, 0xffffffff);
});

test('mulberry32 produces stable sequence for same seed', () => {
    const r1 = mulberry32(123);
    const r2 = mulberry32(123);
    const seq1 = Array.from({ length: 5 }, () => r1());
    const seq2 = Array.from({ length: 5 }, () => r2());
    assert.deepEqual(seq1, seq2);
    for (const x of seq1) {
        assert.ok(x >= 0 && x < 1);
    }
});
