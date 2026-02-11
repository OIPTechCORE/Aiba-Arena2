const test = require('node:test');
const assert = require('node:assert/strict');
const { getApp } = require('../helpers/appForTests');
const http = require('http');

function withServer(app, fn) {
    return async () => {
        const server = http.createServer(app);
        const port = await new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));
        try {
            return await fn(port);
        } finally {
            await new Promise((resolve) => server.close(resolve));
        }
    };
}

test('GET /api/marketplace/system-brokers returns array of brokers with id, name, priceAiba', withServer(getApp(), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/marketplace/system-brokers`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    const list = body.data;
    assert.ok(Array.isArray(list), 'system-brokers should be array');
    assert.ok(list.length >= 1, 'at least one system broker');
    const first = list[0];
    assert.ok(first.id, 'broker has id');
    assert.ok(first.name, 'broker has name');
    assert.equal(typeof first.priceAiba, 'number', 'broker has priceAiba');
    assert.equal(typeof first.intelligence, 'number');
    assert.equal(typeof first.speed, 'number');
    assert.equal(typeof first.risk, 'number');
}));

test('GET /api/car-racing/system-cars returns array of cars with id, name, priceAiba', withServer(getApp(), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/car-racing/system-cars`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    const list = body.data;
    assert.ok(Array.isArray(list), 'system-cars should be array');
    assert.ok(list.length >= 1);
    const first = list[0];
    assert.ok(first.id);
    assert.ok(first.name);
    assert.equal(typeof first.priceAiba, 'number');
    assert.ok(['topSpeed', 'acceleration', 'handling', 'durability'].every((k) => typeof first[k] === 'number'));
}));

test('GET /api/bike-racing/system-bikes returns array of bikes with id, name, priceAiba', withServer(getApp(), async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/bike-racing/system-bikes`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    const list = body.data;
    assert.ok(Array.isArray(list));
    assert.ok(list.length >= 1);
    const first = list[0];
    assert.ok(first.id);
    assert.ok(first.name);
    assert.equal(typeof first.priceAiba, 'number');
}));
