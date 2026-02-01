const test = require('node:test');
const assert = require('node:assert/strict');

const { getTelegramInitDataMaxAgeSeconds } = require('../security/telegramPolicy');

test('getTelegramInitDataMaxAgeSeconds defaults to 15 minutes', () => {
    assert.equal(getTelegramInitDataMaxAgeSeconds({}), 900);
});

test('getTelegramInitDataMaxAgeSeconds parses numeric strings', () => {
    assert.equal(getTelegramInitDataMaxAgeSeconds({ TELEGRAM_INITDATA_MAX_AGE_SECONDS: '600' }), 600);
});

test('getTelegramInitDataMaxAgeSeconds clamps negative to 0 (disable)', () => {
    assert.equal(getTelegramInitDataMaxAgeSeconds({ TELEGRAM_INITDATA_MAX_AGE_SECONDS: '-1' }), 0);
});

test('getTelegramInitDataMaxAgeSeconds falls back on NaN', () => {
    assert.equal(getTelegramInitDataMaxAgeSeconds({ TELEGRAM_INITDATA_MAX_AGE_SECONDS: 'nope' }), 900);
});
