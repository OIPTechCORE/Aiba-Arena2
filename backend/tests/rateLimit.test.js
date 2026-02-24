const test = require('node:test');
const assert = require('node:assert/strict');

// Ensure no Redis so we test in-memory path
const prev = process.env.REDIS_URL;
delete process.env.REDIS_URL;

const { rateLimit } = require('../middleware/rateLimit');

test('rateLimit allows requests under max', async () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2 });
    let nextCalled = 0;
    const next = () => {
        nextCalled++;
    };
    const req = { ip: '1.2.3.4', headers: {} };

    const res = {
        setHeader: () => {},
        status: function (code) {
            this._status = code;
            return this;
        },
        json: function (body) {
            this._body = body;
            return this;
        },
        get: () => undefined,
    };

    await limiter(req, res, next);
    assert.equal(nextCalled, 1);
    await limiter(req, res, next);
    assert.equal(nextCalled, 2);
    process.env.REDIS_URL = prev;
});

test('rateLimit returns 429 when over max', async () => {
    delete process.env.REDIS_URL;
    const limiter = rateLimit({ windowMs: 60_000, max: 2 });
    let nextCalled = 0;
    const next = () => {
        nextCalled++;
    };
    const req = { ip: '9.9.9.9', headers: {} };

    const res = {
        setHeader: () => {},
        status: function (code) {
            this._status = code;
            return this;
        },
        json: function (body) {
            this._body = body;
            return this;
        },
        get: () => undefined,
    };

    await limiter(req, res, next);
    await limiter(req, res, next);
    await limiter(req, res, next); // third request
    assert.equal(nextCalled, 2);
    assert.equal(res._status, 429);
    assert.equal(res._body?.error, 'rate_limited');
    assert.ok(typeof res._body?.retryAfterSec === 'number');
    process.env.REDIS_URL = prev;
});

test('rateLimit sets X-RateLimit-* headers', async () => {
    delete process.env.REDIS_URL;
    const limiter = rateLimit({ windowMs: 60_000, max: 10 });
    const headers = {};
    const req = { ip: '7.7.7.7', headers: {} };
    const res = {
        setHeader: (k, v) => {
            headers[k] = v;
        },
        get: () => undefined,
    };
    const next = () => {};

    await limiter(req, res, next);
    assert.equal(headers['X-RateLimit-Limit'], '10');
    assert.equal(headers['X-RateLimit-Remaining'], '9');
    assert.ok(headers['X-RateLimit-Reset']);
    process.env.REDIS_URL = prev;
});

test('rateLimit keyFn uses telegramId when present', async () => {
    delete process.env.REDIS_URL;
    const keys = [];
    const limiter = rateLimit({
        windowMs: 60_000,
        max: 1,
        keyFn: (r) => {
            keys.push(r._key);
            return r._key;
        },
    });
    const next = () => {};
    const res = {
        setHeader: () => {},
        status: function (c) {
            this._status = c;
            return this;
        },
        json: function (b) {
            this._body = b;
            return this;
        },
        get: () => undefined,
    };

    await limiter({ _key: 'tg:123', ip: '1.1.1.1', headers: {} }, res, next);
    await limiter({ _key: 'tg:123', ip: '2.2.2.2', headers: {} }, res, next);
    assert.equal(keys[0], 'tg:123');
    assert.equal(keys[1], 'tg:123');
    assert.equal(res._status, 429);
    process.env.REDIS_URL = prev;
});
