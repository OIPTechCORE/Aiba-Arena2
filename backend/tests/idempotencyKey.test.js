const test = require('node:test');
const assert = require('node:assert/strict');

const { getIdempotencyKey } = require('../engine/idempotencyKey');

test('getIdempotencyKey prefers body.requestId over header and req.requestId', () => {
    const req = {
        body: { requestId: '  body-key  ' },
        headers: { 'x-request-id': 'header-key' },
        requestId: 'req-key',
    };
    assert.equal(getIdempotencyKey(req), 'body-key');
});

test('getIdempotencyKey uses x-request-id header when body missing', () => {
    const req = {
        body: {},
        headers: { 'x-request-id': '  header-key  ' },
        requestId: 'req-key',
    };
    assert.equal(getIdempotencyKey(req), 'header-key');
});

test('getIdempotencyKey falls back to req.requestId when body and header missing', () => {
    const req = { body: {}, headers: {}, requestId: '  req-key  ' };
    assert.equal(getIdempotencyKey(req), 'req-key');
});

test('getIdempotencyKey returns empty string if none present', () => {
    assert.equal(getIdempotencyKey({}), '');
});
