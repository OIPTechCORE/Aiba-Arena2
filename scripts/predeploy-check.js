const fs = require('fs');
const path = require('path');

const { enforceProductionReadiness } = require('../backend/security/productionReadiness');

const args = new Set(process.argv.slice(2));
const requireProd = args.has('--prod');

const env = { ...process.env };
if (requireProd) {
    env.APP_ENV = 'prod';
}

const errors = [];
const warnings = [];

function warn(msg) {
    warnings.push(msg);
}

function fail(msg) {
    errors.push(msg);
}

function requireEnv(name) {
    const v = String(env[name] ?? '').trim();
    if (!v) fail(`${name} is required`);
    return v;
}

function checkEnvFile(name, filePath) {
    if (fs.existsSync(filePath)) {
        const msg = `${name} exists at ${filePath}`;
        if (requireProd) fail(`${msg} (do not deploy with secrets on disk)`);
        else warn(`${msg} (ensure it is not committed)`);
    }
}

const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
checkEnvFile('backend .env', backendEnvPath);

if (requireProd) {
    requireEnv('MONGO_URI');
    requireEnv('CORS_ORIGIN');
    requireEnv('TELEGRAM_BOT_TOKEN');
    requireEnv('TELEGRAM_INITDATA_MAX_AGE_SECONDS');
    requireEnv('ADMIN_JWT_SECRET');
    requireEnv('ADMIN_EMAIL');
    requireEnv('ADMIN_PASSWORD_HASH');
    requireEnv('BATTLE_SEED_SECRET');

    // Frontend build envs (Vercel)
    requireEnv('NEXT_PUBLIC_BACKEND_URL');
}

try {
    enforceProductionReadiness(env, { logger: console });
} catch (err) {
    fail(err.message || 'Production readiness checks failed');
}

if (warnings.length) {
    console.warn('\nPredeploy warnings:');
    for (const w of warnings) console.warn(`- ${w}`);
}

if (errors.length) {
    console.error('\nPredeploy checks failed:');
    for (const e of errors) console.error(`- ${e}`);
    process.exit(1);
}

console.log('Predeploy checks passed.');
