const { getTelegramInitDataMaxAgeSeconds } = require('./telegramPolicy');

function isProduction(env = process.env) {
    const appEnv = String(env?.APP_ENV || '')
        .trim()
        .toLowerCase();
    const nodeEnv = String(env?.NODE_ENV || '')
        .trim()
        .toLowerCase();
    return appEnv === 'prod' || nodeEnv === 'production';
}

function requireNonEmpty(name, env) {
    const v = String(env?.[name] ?? '').trim();
    if (!v) throw new Error(`${name} missing`);
    return v;
}

function isProbablyTestnetTonProvider(url) {
    const s = String(url || '').toLowerCase();
    return s.includes('testnet') || s.includes('sandbox');
}

function enforceProductionReadiness(env = process.env, { logger = console } = {}) {
    const prod = isProduction(env);
    if (!prod) return { ok: true, prod: false, warnings: [] };

    const errors = [];
    const warnings = [];

    const appEnv = String(env?.APP_ENV || '')
        .trim()
        .toLowerCase();
    if (appEnv === 'dev' || appEnv === 'test') {
        errors.push(`APP_ENV must not be "${appEnv}" in production`);
    }

    // CORS: default is allow-all when unset; production should pin this down.
    if (!String(env?.CORS_ORIGIN ?? '').trim()) {
        errors.push('CORS_ORIGIN must be set in production (comma-separated allow-list)');
    }

    // Telegram auth: required for production.
    try {
        requireNonEmpty('TELEGRAM_BOT_TOKEN', env);
    } catch (e) {
        errors.push(e.message);
    }

    // Replay/age check should be explicitly configured for mainnet.
    const rawMaxAge = String(env?.TELEGRAM_INITDATA_MAX_AGE_SECONDS ?? '').trim();
    if (!rawMaxAge) {
        errors.push('TELEGRAM_INITDATA_MAX_AGE_SECONDS must be set explicitly in production');
    } else {
        const maxAge = getTelegramInitDataMaxAgeSeconds(env);
        if (!Number.isFinite(maxAge)) {
            errors.push('TELEGRAM_INITDATA_MAX_AGE_SECONDS must be a number');
        } else if (maxAge <= 0) {
            errors.push('TELEGRAM_INITDATA_MAX_AGE_SECONDS must be > 0 in production');
        } else if (maxAge > 24 * 60 * 60) {
            warnings.push(`TELEGRAM_INITDATA_MAX_AGE_SECONDS is very high (${maxAge}); recommended 300–900 seconds`);
        }
    }

    // Admin auth: forbid dev defaults and plaintext password in production.
    try {
        const jwt = requireNonEmpty('ADMIN_JWT_SECRET', env);
        if (jwt === 'dev-change-me' || jwt.length < 32) {
            errors.push('ADMIN_JWT_SECRET must be a strong secret (>= 32 chars), not the dev placeholder');
        }
    } catch (e) {
        errors.push(e.message);
    }
    try {
        requireNonEmpty('ADMIN_EMAIL', env);
    } catch (e) {
        errors.push(e.message);
    }
    const adminHash = String(env?.ADMIN_PASSWORD_HASH ?? '').trim();
    if (!adminHash) {
        errors.push('ADMIN_PASSWORD_HASH is required in production (do not use ADMIN_PASSWORD)');
    }
    if (String(env?.ADMIN_PASSWORD ?? '').trim()) {
        warnings.push('ADMIN_PASSWORD is set; prefer removing it in production and only using ADMIN_PASSWORD_HASH');
    }

    // Determinism secret: forbid dev placeholder.
    try {
        const seed = requireNonEmpty('BATTLE_SEED_SECRET', env);
        if (seed === 'dev-secret-change-me' || seed.length < 32) {
            errors.push('BATTLE_SEED_SECRET must be a strong secret (>= 32 chars), not the dev placeholder');
        }
    } catch (e) {
        errors.push(e.message);
    }

    // Vault/claim config: enforce all-or-nothing, validate oracle key shape, and require explicit TON provider.
    const vaultAddress = String(env?.ARENA_VAULT_ADDRESS ?? '').trim();
    const jettonMaster = String(env?.AIBA_JETTON_MASTER ?? '').trim();
    const oracleHex = String(env?.ORACLE_PRIVATE_KEY_HEX ?? '').trim();
    const anyVault = Boolean(vaultAddress || jettonMaster || oracleHex);

    if (anyVault) {
        if (!vaultAddress || !jettonMaster || !oracleHex) {
            errors.push(
                'ARENA_VAULT_ADDRESS, AIBA_JETTON_MASTER, and ORACLE_PRIVATE_KEY_HEX must all be set together (or all empty)',
            );
        }
        if (oracleHex && !/^[0-9a-fA-F]{64}$/.test(oracleHex)) {
            errors.push('ORACLE_PRIVATE_KEY_HEX must be 32 bytes (64 hex chars)');
        }

        const tonProviderUrl = String(env?.TON_PROVIDER_URL ?? '').trim();
        if (!tonProviderUrl) {
            errors.push('TON_PROVIDER_URL must be set explicitly in production when vault/claims are configured');
        } else if (isProbablyTestnetTonProvider(tonProviderUrl)) {
            errors.push('TON_PROVIDER_URL appears to be a testnet endpoint; set a mainnet endpoint');
        }
        if (!String(env?.TON_API_KEY ?? '').trim()) {
            warnings.push('TON_API_KEY is not set; toncenter may rate-limit or reject calls in production');
        }
    }

    // Legacy auto-dispatch is dangerous on mainnet; the production flow uses signed claims.
    if (String(env?.ENABLE_LEGACY_PENDING_AIBA_DISPATCH ?? '').trim().toLowerCase() === 'true') {
        errors.push('ENABLE_LEGACY_PENDING_AIBA_DISPATCH must not be enabled in production');
    }

    if (errors.length > 0) {
        const err = new Error(`Production readiness checks failed:\n- ${errors.join('\n- ')}`);
        err.code = 'PROD_READINESS_FAILED';
        err.details = errors;
        throw err;
    }

    for (const w of warnings) {
        logger?.warn?.('[prod-readiness]', w);
    }

    return { ok: true, prod: true, warnings };
}

module.exports = { enforceProductionReadiness, isProduction };
