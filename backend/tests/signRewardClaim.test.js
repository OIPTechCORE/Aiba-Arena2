const test = require('node:test');
const assert = require('node:assert/strict');

const { createSignedClaim } = require('../ton/signRewardClaim');

function baseClaim() {
    return {
        vaultAddress: '0:' + '11'.repeat(32),
        jettonMaster: '0:' + '22'.repeat(32),
        to: '0:' + '33'.repeat(32),
        amount: '1000',
        seqno: '1',
        validUntil: 1700000000,
    };
}

test('createSignedClaim is deterministic for same inputs', () => {
    const env = { ORACLE_PRIVATE_KEY_HEX: 'aa'.repeat(32) };
    const a = createSignedClaim(baseClaim(), env);
    const b = createSignedClaim(baseClaim(), env);
    assert.deepEqual(a, b);
    assert.ok(a.payloadBocBase64.length > 0);
    assert.ok(a.signatureBase64.length > 0);
});

test('createSignedClaim changes signature when payload changes', () => {
    const env = { ORACLE_PRIVATE_KEY_HEX: 'aa'.repeat(32) };
    const a = createSignedClaim(baseClaim(), env);
    const b = createSignedClaim({ ...baseClaim(), amount: '1001' }, env);
    assert.notEqual(a.payloadBocBase64, b.payloadBocBase64);
    assert.notEqual(a.signatureBase64, b.signatureBase64);
});

test('createSignedClaim throws if ORACLE_PRIVATE_KEY_HEX missing', () => {
    assert.throws(() => createSignedClaim(baseClaim(), {}), /ORACLE_PRIVATE_KEY_HEX missing/);
});

test('createSignedClaim throws if ORACLE_PRIVATE_KEY_HEX wrong length', () => {
    assert.throws(() => createSignedClaim(baseClaim(), { ORACLE_PRIVATE_KEY_HEX: 'ab' }), /must be 32 bytes/);
});
