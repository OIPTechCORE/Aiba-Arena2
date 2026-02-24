const test = require('node:test');
const assert = require('node:assert/strict');
const { getApp } = require('../helpers/appForTests');
const http = require('http');

test('POST /api/marketplace/buy-system-broker without body returns 400 or 401', async () => {
    const app = getApp();
    const server = http.createServer(app);
    const port = await new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));
    try {
        const res = await fetch(`http://127.0.0.1:${port}/api/marketplace/buy-system-broker`, {
            method: 'POST',
            headers: { 'x-telegram-id': 'test-user', 'Content-Type': 'application/json' },
            body: '{}',
        });
        assert.ok(
            res.status === 400 || res.status === 401 || res.status === 404,
            'invalid or missing catalogId should yield 400/401/404',
        );
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('POST /api/referrals/use without code returns 400', async () => {
    const app = getApp();
    const server = http.createServer(app);
    const port = await new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));
    try {
        const res = await fetch(`http://127.0.0.1:${port}/api/referrals/use`, {
            method: 'POST',
            headers: { 'x-telegram-id': 'test-user', 'Content-Type': 'application/json' },
            body: '{}',
        });
        assert.ok(res.status === 400 || res.status === 422, 'missing code should yield 400/422');
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
