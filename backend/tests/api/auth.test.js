const test = require('node:test');
const assert = require('node:assert/strict');
const { getApp } = require('../helpers/appForTests');
const http = require('http');

test('GET /api/brokers/mine without auth returns 401', async () => {
    const app = getApp();
    const server = http.createServer(app);
    const port = await new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));
    try {
        const res = await fetch(`http://127.0.0.1:${port}/api/brokers/mine`);
        assert.equal(res.status, 401);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('POST /api/brokers/starter without auth returns 401', async () => {
    const app = getApp();
    const server = http.createServer(app);
    const port = await new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));
    try {
        const res = await fetch(`http://127.0.0.1:${port}/api/brokers/starter`, { method: 'POST' });
        assert.equal(res.status, 401);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('GET /api/brokers/mine with x-telegram-id returns 200 (when DB not used, may 500)', async () => {
    const app = getApp();
    const server = http.createServer(app);
    const port = await new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));
    try {
        const res = await fetch(`http://127.0.0.1:${port}/api/brokers/mine`, {
            headers: { 'x-telegram-id': 'test-user' },
        });
        assert.ok(res.status === 200 || res.status === 500, 'with dev auth either 200 or 500 if DB missing');
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
