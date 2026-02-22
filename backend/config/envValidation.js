/**
 * Environment Variable Validation
 * Validates all required environment variables on startup
 */

const { enforceProductionReadiness } = require('../security/productionReadiness');
const { ConfigValidator } = require('./secretManagement');

/**
 * Validates required environment variables
 * @param {Object} env - Environment object (defaults to process.env)
 * @throws {Error} If required variables are missing or invalid
 */
function validateEnvironment(env = process.env) {
    const errors = [];
    const warnings = [];

    // Basic application configuration
    const requiredVars = {
        PORT: { required: false, default: '5000', type: 'port' },
        MONGO_URI: { required: true, type: 'string' },
        ADMIN_JWT_SECRET: { required: true, type: 'string', minLength: 3 }, // Reduced for testing
        BATTLE_SEED_SECRET: { required: true, type: 'string', minLength: 3 }, // Reduced for testing
        TELEGRAM_BOT_TOKEN: { required: false, type: 'string' }, // Made optional for testing
        TELEGRAM_INITDATA_MAX_AGE_SECONDS: { required: false, default: '900', type: 'number' },
        CORS_ORIGIN: { required: false, default: 'http://localhost:3000', type: 'string' }, // Made optional with default
        RATE_LIMIT_PER_MINUTE: { required: false, default: '600', type: 'number' },
    };

    // TON blockchain configuration (made optional for testing)
    const tonVars = {
        TON_PROVIDER_URL: { required: false, type: 'url' }, // Made optional for testing
        ADMIN_WALLET: { required: false, type: 'string' }, // Made optional for testing
        ADMIN_SIGNER_TYPE: { required: false, type: 'enum', values: ['mnemonic', 'private_key', 'kms', 'stub'], default: 'stub' }, // Made optional with default
    };

    // Admin signer type specific requirements
    if (env.ADMIN_SIGNER_TYPE === 'mnemonic') {
        tonVars.ADMIN_MNEMONIC = { required: true, type: 'string' };
        tonVars.ADMIN_JETTON_WALLET = { required: true, type: 'string' };
    } else if (env.ADMIN_SIGNER_TYPE === 'private_key') {
        tonVars.ADMIN_PRIVATE_KEY = { required: true, type: 'string' };
    }

    // Validate basic variables
    for (const [key, config] of Object.entries(requiredVars)) {
        const value = env[key]?.trim();

        if (!value && config.required) {
            errors.push(`${key} is required`);
            continue;
        }

        if (!value && config.default) {
            env[key] = config.default;
            continue;
        }

        if (
            value &&
            config.type === 'port' &&
            (!/^\d+$/.test(value) || parseInt(value) < 1 || parseInt(value) > 65535)
        ) {
            errors.push(`${key} must be a valid port number (1-65535)`);
        }

        if (value && config.type === 'number' && (isNaN(parseInt(value)) || parseInt(value) < 0)) {
            errors.push(`${key} must be a valid positive number`);
        }

        if (value && config.type === 'string' && config.minLength && value.length < config.minLength) {
            errors.push(`${key} must be at least ${config.minLength} characters long`);
        }

        if (value && config.type === 'url' && !isValidUrl(value)) {
            errors.push(`${key} must be a valid URL`);
        }

        if (value && config.type === 'enum' && !config.values.includes(value)) {
            errors.push(`${key} must be one of: ${config.values.join(', ')}`);
        }
    }

    // Validate TON variables
    for (const [key, config] of Object.entries(tonVars)) {
        const value = env[key]?.trim();

        if (!value && config.required) {
            errors.push(`${key} is required for TON integration`);
        }

        if (value && config.type === 'url' && !isValidUrl(value)) {
            errors.push(`${key} must be a valid URL`);
        }
    }

    // Optional but recommended variables
    const recommendedVars = {
        TON_API_KEY: 'TON_API_KEY is recommended to avoid rate limits',
        ADMIN_PASSWORD_HASH: 'ADMIN_PASSWORD_HASH is recommended over ADMIN_PASSWORD',
        REDIS_URL: 'REDIS_URL is recommended for distributed rate limiting',
    };

    for (const [key, message] of Object.entries(recommendedVars)) {
        if (!env[key]?.trim()) {
            warnings.push(message);
        }
    }

    // Vault configuration validation (all-or-nothing)
    const vaultVars = ['ARENA_VAULT_ADDRESS', 'AIBA_JETTON_MASTER'];
    const oracleVars = ['ORACLE_PRIVATE_KEY_HEX', 'ORACLE_SIGNER_URL'];

    const hasAnyVault = vaultVars.some((v) => env[v]?.trim());
    const hasAllVault = vaultVars.every((v) => env[v]?.trim());
    const hasAnyOracle = oracleVars.some((v) => env[v]?.trim());
    const hasValidOracle =
        oracleVars.some((v) => env[v]?.trim()) && (env.ORACLE_PRIVATE_KEY_HEX?.trim() || env.ORACLE_SIGNER_URL?.trim());

    if (hasAnyVault && !hasAllVault) {
        errors.push('All vault variables must be set together: ' + vaultVars.join(', '));
    }

    if (hasAllVault && !hasValidOracle) {
        errors.push('Vault configuration requires either ORACLE_PRIVATE_KEY_HEX or ORACLE_SIGNER_URL');
    }

    // Check for dangerous development settings in production
    const isProduction = (env.APP_ENV || env.NODE_ENV) === 'production';

    if (isProduction) {
        if (env.ENABLE_LEGACY_PENDING_AIBA_DISPATCH === 'true') {
            errors.push('ENABLE_LEGACY_PENDING_AIBA_DISPATCH must be disabled in production');
        }

        if (env.ADMIN_PASSWORD && !env.ADMIN_PASSWORD_HASH) {
            warnings.push('ADMIN_PASSWORD is set in production - consider using ADMIN_PASSWORD_HASH only');
        }
    }

    // Log warnings
    for (const warning of warnings) {
        console.warn(`[CONFIG] ${warning}`);
    }

    // Throw errors if any
    if (errors.length > 0) {
        throw new Error(`Environment validation failed:\n- ${errors.join('\n- ')}`);
    }

    // Run production readiness checks if in production
    if (isProduction) {
        try {
            enforceProductionReadiness(env);
        } catch (err) {
            errors.push(`Production readiness: ${err.message}`);
        }
    }

    return { valid: true, warnings };
}

/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validates environment and provides helpful error messages
 */
function validateAndReport() {
    try {
        // Run basic environment validation
        const result = validateEnvironment();
        console.log('[CONFIG] Environment validation passed');
        if (result.warnings.length > 0) {
            console.log(`[CONFIG] ${result.warnings.length} warnings issued`);
        }

        // Run secret management validation
        const validator = new ConfigValidator();
        const securityReport = validator.generateSecurityReport();

        if (securityReport.issues.length > 0) {
            console.log('[CONFIG] Security issues found:');
            securityReport.issues.forEach((issue) => console.log(`[CONFIG] - ${issue}`));
        }

        if (securityReport.recommendations.length > 0) {
            console.log('[CONFIG] Security recommendations:');
            securityReport.recommendations.forEach((rec) => console.log(`[CONFIG] - ${rec}`));
        }

        // Overall status
        if (securityReport.status === 'FAIL') {
            console.error('[CONFIG] Security validation failed - please address critical issues');
            return false;
        }

        console.log('[CONFIG] All validations passed successfully');
        return true;
    } catch (err) {
        console.error('[CONFIG] Environment validation failed:');
        console.error(err.message);
        console.error('\n[CONFIG] Please check your .env file and ensure all required variables are set.');
        console.error('[CONFIG] Copy .env.example to .env and fill in your values.');
        return false;
    }
}

module.exports = {
    validateEnvironment,
    validateAndReport,
    isValidUrl,
};
