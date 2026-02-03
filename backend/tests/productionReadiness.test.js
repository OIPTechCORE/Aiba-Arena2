const test = require('node:test');
const assert = require('node:assert/strict');

const { enforceProductionReadiness, isProduction } = require('../security/productionReadiness');

function baseProdEnv(overrides = {}) {
    return {
        APP_ENV: 'prod',
        NODE_ENV: '',
        CORS_ORIGIN: 'https://example.com',
        TELEGRAM_BOT_TOKEN: 'tg-token',
        TELEGRAM_INITDATA_MAX_AGE_SECONDS: '900',
        ADMIN_JWT_SECRET: 'x'.repeat(32),
        ADMIN_EMAIL: 'admin@example.com',
        ADMIN_PASSWORD_HASH: '$2a$10$exampleexampleexampleexampleexampleexampleexampleexampleexamplee',
        BATTLE_SEED_SECRET: 'y'.repeat(32),
        ...overrides,
    };
}

test('enforceProductionReadiness is a no-op outside production', () => {
    const res = enforceProductionReadiness({ APP_ENV: 'dev' });
    assert.deepEqual(res, { ok: true, prod: false, warnings: [] });
});

test('enforceProductionReadiness skips prod checks when APP_ENV=dev (no throw)', () => {
    const res = enforceProductionReadiness({ APP_ENV: 'dev', NODE_ENV: 'production' });
    assert.equal(res.prod, false);
    assert.equal(res.ok, true);
});

test('enforceProductionReadiness requires TELEGRAM_INITDATA_MAX_AGE_SECONDS explicitly in production', () => {
    const env = baseProdEnv({ TELEGRAM_INITDATA_MAX_AGE_SECONDS: '' });
    assert.throws(() => enforceProductionReadiness(env), /TELEGRAM_INITDATA_MAX_AGE_SECONDS must be set explicitly/);
});

test('enforceProductionReadiness rejects disabled telegram age check in production', () => {
    const env = baseProdEnv({ TELEGRAM_INITDATA_MAX_AGE_SECONDS: '0' });
    assert.throws(() => enforceProductionReadiness(env), /must be > 0/);
});

test('enforceProductionReadiness rejects weak or placeholder ADMIN_JWT_SECRET', () => {
    const env1 = baseProdEnv({ ADMIN_JWT_SECRET: 'dev-change-me' });
    assert.throws(() => enforceProductionReadiness(env1), /ADMIN_JWT_SECRET must be a strong secret/);

    const env2 = baseProdEnv({ ADMIN_JWT_SECRET: 'short' });
    assert.throws(() => enforceProductionReadiness(env2), /ADMIN_JWT_SECRET must be a strong secret/);
});

test('enforceProductionReadiness requires ADMIN_PASSWORD_HASH in production', () => {
    const env = baseProdEnv({ ADMIN_PASSWORD_HASH: '', ADMIN_PASSWORD: 'plaintext' });
    assert.throws(() => enforceProductionReadiness(env), /ADMIN_PASSWORD_HASH is required/);
});

test('enforceProductionReadiness rejects dev placeholder BATTLE_SEED_SECRET', () => {
    const env1 = baseProdEnv({ BATTLE_SEED_SECRET: 'dev-secret-change-me' });
    assert.throws(() => enforceProductionReadiness(env1), /BATTLE_SEED_SECRET must be a strong secret/);

    const env2 = baseProdEnv({ BATTLE_SEED_SECRET: 'short' });
    assert.throws(() => enforceProductionReadiness(env2), /BATTLE_SEED_SECRET must be a strong secret/);
});

test('enforceProductionReadiness enforces all-or-nothing vault/claim env', () => {
    const env = baseProdEnv({ ARENA_VAULT_ADDRESS: '0:' + '11'.repeat(32) });
    assert.throws(() => enforceProductionReadiness(env), /must all be set together/);
});

test('enforceProductionReadiness validates ORACLE_PRIVATE_KEY_HEX shape and TON provider', () => {
    const badOracle = baseProdEnv({
        ARENA_VAULT_ADDRESS: '0:' + '11'.repeat(32),
        AIBA_JETTON_MASTER: '0:' + '22'.repeat(32),
        ORACLE_PRIVATE_KEY_HEX: 'abc',
        TON_PROVIDER_URL: 'https://toncenter.com/api/v2/jsonRPC',
    });
    assert.throws(() => enforceProductionReadiness(badOracle), /ORACLE_PRIVATE_KEY_HEX must be 32 bytes/);

    const testnetProvider = baseProdEnv({
        ARENA_VAULT_ADDRESS: '0:' + '11'.repeat(32),
        AIBA_JETTON_MASTER: '0:' + '22'.repeat(32),
        ORACLE_PRIVATE_KEY_HEX: 'aa'.repeat(32),
        TON_PROVIDER_URL: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    });
    assert.throws(() => enforceProductionReadiness(testnetProvider), /testnet endpoint/);
});

test('enforceProductionReadiness passes for a sane production env', () => {
    const env = baseProdEnv({
        TON_PROVIDER_URL: 'https://toncenter.com/api/v2/jsonRPC',
        TON_API_KEY: 'key',
        ARENA_VAULT_ADDRESS: '0:' + '11'.repeat(32),
        AIBA_JETTON_MASTER: '0:' + '22'.repeat(32),
        ORACLE_PRIVATE_KEY_HEX: 'aa'.repeat(32),
    });
    const res = enforceProductionReadiness(env, { logger: { warn() {} } });
    assert.equal(res.ok, true);
    assert.equal(res.prod, true);
});

test('enforceProductionReadiness requires CORS_ORIGIN in production', () => {
    const env = baseProdEnv({ CORS_ORIGIN: '' });
    assert.throws(() => enforceProductionReadiness(env), /CORS_ORIGIN must be set/);
});

test('enforceProductionReadiness blocks ENABLE_LEGACY_PENDING_AIBA_DISPATCH in production', () => {
    const env = baseProdEnv({
        TON_PROVIDER_URL: 'https://toncenter.com/api/v2/jsonRPC',
        ARENA_VAULT_ADDRESS: '0:' + '11'.repeat(32),
        AIBA_JETTON_MASTER: '0:' + '22'.repeat(32),
        ORACLE_PRIVATE_KEY_HEX: 'aa'.repeat(32),
        ENABLE_LEGACY_PENDING_AIBA_DISPATCH: 'true',
    });
    assert.throws(() => enforceProductionReadiness(env), /ENABLE_LEGACY_PENDING_AIBA_DISPATCH must not be enabled/);
});

test('isProduction returns false for APP_ENV=dev or APP_ENV=test', () => {
    assert.equal(isProduction({ APP_ENV: 'dev' }), false);
    assert.equal(isProduction({ APP_ENV: 'test' }), false);
    assert.equal(isProduction({ APP_ENV: 'dev', NODE_ENV: 'production' }), false);
});

test('isProduction returns true for APP_ENV=prod or NODE_ENV=production', () => {
    assert.equal(isProduction({ APP_ENV: 'prod' }), true);
    assert.equal(isProduction({ NODE_ENV: 'production' }), true);
    assert.equal(isProduction({ APP_ENV: '', NODE_ENV: 'production' }), true);
});
