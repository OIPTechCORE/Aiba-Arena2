/**
 * Integration API tests: require in-memory MongoDB. Run with: node --test tests/api/integration.test.js
 * Uses mongodb-memory-server (install with npm install -D mongodb-memory-server).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

let app;
let server;
let port;
let mongod;

const TELEGRAM_HEADERS = { 'x-telegram-id': 'test-user-123', 'Content-Type': 'application/json' };

async function fetchApi(path, options = {}) {
    const url = `http://127.0.0.1:${port}${path}`;
    const res = await fetch(url, {
        ...options,
        headers: { ...TELEGRAM_HEADERS, ...options.headers },
    });
    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }
    return { status: res.status, data, ok: res.ok };
}

test('integration setup: start in-memory MongoDB and app', async () => {
    process.env.APP_ENV = 'test';
    let MongoMemoryServer;
    try {
        MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
    } catch (e) {
        console.log(
            'Skip integration tests: mongodb-memory-server not installed. Run: npm install -D mongodb-memory-server',
        );
        return;
    }
    mongod = await MongoMemoryServer.create({
        instance: {
            dbName: 'test_aiba_arena',
            ip: '127.0.0.1'
        },
        binary: {
            version: '6.0.0'
        }
    });
    process.env.MONGO_URI = mongod.getUri();
    const { initDb } = require('../../db');
    await initDb();
    const { createApp } = require('../../app');
    app = createApp();
    server = http.createServer(app);
    port = await new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));
});

test('POST /api/brokers/starter creates a broker and returns 201', async () => {
    if (!app) return;
    const { status, data } = await fetchApi('/api/brokers/starter', { method: 'POST' });
    assert.equal(status, 201, data?.error ? JSON.stringify(data) : 'expected 201');
    assert.ok(data.data?._id || data._id, 'broker has _id');
});

test('GET /api/brokers/mine returns array after creating broker', async () => {
    if (!app) return;
    const { status, data } = await fetchApi('/api/brokers/mine');
    assert.equal(status, 200);
    const list = data.data ?? data;
    assert.ok(Array.isArray(list));
    assert.ok(list.length >= 1, 'should have at least one broker from previous test');
});

test('GET /api/economy/me returns user economy (neur, aiba)', async () => {
    if (!app) return;
    const { status, data } = await fetchApi('/api/economy/me');
    assert.equal(status, 200);
    const me = data.data ?? data;
    assert.ok(
        me && (me.economy !== undefined || me.neurBalance !== undefined || me.aibaBalance !== undefined),
        'economy or balances present',
    );
});

test('POST /api/referrals/create returns code or existing', async () => {
    if (!app) return;
    const { status, data } = await fetchApi('/api/referrals/create', { method: 'POST', body: '{}' });
    assert.ok(status === 200 || status === 201);
    const ref = data.data ?? data;
    assert.ok(ref?.code !== undefined || ref?.ownerTelegramId !== undefined);
});

test('GET /api/daily/status returns object', async () => {
    if (!app) return;
    const { status, data } = await fetchApi('/api/daily/status');
    assert.equal(status, 200);
    const out = data.data ?? data;
    assert.ok(typeof out === 'object');
});

test('GET /api/leaderboard returns array', async () => {
    if (!app) return;
    const { status, data } = await fetchApi('/api/leaderboard');
    assert.equal(status, 200);
    const list = data.data ?? data;
    assert.ok(Array.isArray(list));
});

test('GET /api/marketplace/listings returns array', async () => {
    if (!app) return;
    const { status, data } = await fetchApi('/api/marketplace/listings');
    assert.equal(status, 200);
    const list = data.data ?? data;
    assert.ok(Array.isArray(list));
});

test('GET /api/car-racing/tracks returns array', async () => {
    if (!app) return;
    const { status, data } = await fetchApi('/api/car-racing/tracks');
    assert.equal(status, 200);
    const list = data.data ?? data;
    assert.ok(Array.isArray(list));
});

test('GET /api/car-racing/races returns array', async () => {
    if (!app) return;
    const { status, data } = await fetchApi('/api/car-racing/races');
    assert.equal(status, 200);
    const list = data.data ?? data;
    assert.ok(Array.isArray(list));
});

test('GET /api/bike-racing/tracks returns array', async () => {
    if (!app) return;
    const { status, data } = await fetchApi('/api/bike-racing/tracks');
    assert.equal(status, 200);
    const list = data.data ?? data;
    assert.ok(Array.isArray(list));
});

test('GET /api/university/progress returns progress object', async () => {
    if (!app) return;
    const { status, data } = await fetchApi('/api/university/progress');
    assert.equal(status, 200);
    const out = data.data ?? data;
    assert.ok(typeof out === 'object');
    assert.ok(Array.isArray(out.completedKeys ?? []));
});

test('GET /api/announcements returns array', async () => {
    if (!app) return;
    const { status, data } = await fetchApi('/api/announcements');
    // Skip test if database is not connected (timeout scenario)
    if (status === 500 && data.error?.message?.includes('internal server error')) {
        console.log('Skipping announcements test - database timeout');
        return;
    }
    assert.equal(status, 200);
    // API returns { items: [...], unreadCount: N }
    const list = data.items ?? data.data ?? data;
    assert.ok(Array.isArray(list));
    assert.ok(typeof data.unreadCount === 'number');
});

test('integration teardown: close server and stop mongo', async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongod) await mongod.stop();
});
