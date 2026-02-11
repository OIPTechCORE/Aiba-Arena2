const test = require('node:test');
const assert = require('node:assert/strict');
const { getApp } = require('../helpers/appForTests');
const http = require('http');

test('GET /health returns 200 and ok: true', async () => {
    const app = getApp();
    const server = http.createServer(app);
    const port = await new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));
    try {
        const res = await fetch(`http://127.0.0.1:${port}/health`);
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.ok, true);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('GET /api/comms/status returns operational', async () => {
    const app = getApp();
    const server = http.createServer(app);
    const port = await new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));
    try {
        const res = await fetch(`http://127.0.0.1:${port}/api/comms/status`);
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.ok, true);
        assert.equal(body.data?.status, 'operational');
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('GET /metrics returns 200 (Prometheus)', async () => {
    const app = getApp();
    const server = http.createServer(app);
    const port = await new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));
    try {
        const res = await fetch(`http://127.0.0.1:${port}/metrics`);
        assert.equal(res.status, 200);
        const text = await res.text();
        assert.ok(text.includes('http_') || text.length > 0);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
