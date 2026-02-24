/**
 * Secret Management Configuration
 * Provides secure handling of sensitive configuration values
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Encryption utilities for sensitive data
 */
class SecretManager {
    constructor(encryptionKey = null) {
        this.encryptionKey = encryptionKey || this.getOrCreateEncryptionKey();
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32;
        this.ivLength = 16;
        this.tagLength = 16;
    }

    /**
     * Gets or creates encryption key from environment
     */
    getOrCreateEncryptionKey() {
        // Try to get from environment first
        const envKey = process.env.SECRET_ENCRYPTION_KEY;
        if (envKey) {
            return Buffer.from(envKey, 'hex');
        }

        // Create a new key and warn user
        const key = crypto.randomBytes(this.keyLength || 32);
        console.warn('[SECURITY] SECRET_ENCRYPTION_KEY not set. Generated temporary key.');
        console.warn('[SECURITY] Set SECRET_ENCRYPTION_KEY in your environment to persist secrets.');
        console.log(`[SECURITY] Generated key: ${key.toString('hex')}`);
        return key;
    }

    /**
     * Encrypts a secret value
     */
    encrypt(text) {
        if (!text) return null;

        const iv = crypto.randomBytes(this.ivLength || 16);
        const cipher = crypto.createCipher(this.algorithm, this.encryptionKey, { ivLength: this.ivLength });
        cipher.setAAD(Buffer.from('additional-data'));

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const tag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex'),
        };
    }

    /**
     * Decrypts a secret value
     */
    decrypt(encryptedData) {
        if (!encryptedData || !encryptedData.encrypted) return null;

        const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey, { ivLength: this.ivLength });
        decipher.setAAD(Buffer.from('additional-data'));
        decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Validates secret strength
     */
    validateSecretStrength(secret, name) {
        const issues = [];

        if (!secret || secret.length < 16) {
            issues.push(`${name} must be at least 16 characters long`);
        }

        if (secret === 'dev-secret-change-me' || secret === 'change-me' || secret === 'default') {
            issues.push(`${name} appears to be a default/placeholder value`);
        }

        if (/^[a-zA-Z]+$/.test(secret)) {
            issues.push(`${name} should contain numbers and special characters`);
        }

        if (secret.toLowerCase().includes('password') || secret.toLowerCase().includes('secret')) {
            issues.push(`${name} should not contain dictionary words like 'password' or 'secret'`);
        }

        return issues;
    }

    /**
     * Masks sensitive values for logging
     */
    maskSecret(secret, showFirst = 3, showLast = 3) {
        if (!secret || secret.length <= showFirst + showLast) {
            return '***';
        }

        const start = secret.substring(0, showFirst);
        const end = secret.substring(secret.length - showLast);
        const middle = '*'.repeat(secret.length - showFirst - showLast);

        return start + middle + end;
    }
}

/**
 * Configuration validator for sensitive values
 */
class ConfigValidator {
    constructor() {
        this.secretManager = new SecretManager();
    }

    /**
     * Validates all critical secrets
     */
    validateCriticalSecrets() {
        const errors = [];
        const warnings = [];

        // JWT Secret
        const jwtSecret = process.env.ADMIN_JWT_SECRET;
        if (jwtSecret) {
            const jwtIssues = this.secretManager.validateSecretStrength(jwtSecret, 'ADMIN_JWT_SECRET');
            errors.push(...jwtIssues);
        } else {
            errors.push('ADMIN_JWT_SECRET is required');
        }

        // Battle Seed Secret
        const battleSecret = process.env.BATTLE_SEED_SECRET;
        if (battleSecret) {
            const battleIssues = this.secretManager.validateSecretStrength(battleSecret, 'BATTLE_SEED_SECRET');
            errors.push(...battleIssues);
        } else {
            errors.push('BATTLE_SEED_SECRET is required');
        }

        // Oracle Private Key
        const oracleKey = process.env.ORACLE_PRIVATE_KEY_HEX;
        if (oracleKey) {
            if (!/^[0-9a-fA-F]{64}$/.test(oracleKey)) {
                errors.push('ORACLE_PRIVATE_KEY_HEX must be exactly 64 hexadecimal characters');
            }
        }

        // Admin Mnemonic
        const mnemonic = process.env.ADMIN_MNEMONIC;
        if (mnemonic) {
            const words = mnemonic.trim().split(/\s+/);
            if (words.length < 12 || words.length > 24) {
                errors.push('ADMIN_MNEMONIC must be 12-24 words');
            }

            // Check for common test phrases
            const testPhrases = ['test', 'demo', 'example', 'sample'];
            if (testPhrases.some((phrase) => mnemonic.toLowerCase().includes(phrase))) {
                warnings.push('ADMIN_MNEMONIC appears to be a test phrase');
            }
        }

        // Telegram Bot Token
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
            if (!/^\d+:[a-zA-Z0-9_-]+$/.test(botToken)) {
                errors.push('TELEGRAM_BOT_TOKEN format appears invalid');
            }
        } else {
            errors.push('TELEGRAM_BOT_TOKEN is required');
        }

        return { errors, warnings };
    }

    /**
     * Validates database and external service connections
     */
    validateConnections() {
        const errors = [];
        const warnings = [];

        // MongoDB URI
        const mongoUri = process.env.MONGO_URI;
        if (mongoUri) {
            if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
                warnings.push('MONGO_URI points to localhost - ensure this is intentional');
            }

            if (mongoUri.includes('password') && !mongoUri.includes('@')) {
                warnings.push('MONGO_URI contains password in plain text - consider using authentication string');
            }
        } else {
            errors.push('MONGO_URI is required');
        }

        // TON Provider URL
        const tonUrl = process.env.TON_PROVIDER_URL;
        if (tonUrl) {
            if (tonUrl.includes('testnet') && process.env.NODE_ENV === 'production') {
                warnings.push('TON_PROVIDER_URL points to testnet in production');
            }
        } else {
            errors.push('TON_PROVIDER_URL is required');
        }

        return { errors, warnings };
    }

    /**
     * Generates security recommendations
     */
    generateSecurityReport() {
        const criticalSecrets = this.validateCriticalSecrets();
        const connections = this.validateConnections();

        const report = {
            timestamp: new Date().toISOString(),
            status: 'PASS',
            issues: [],
            recommendations: [],
        };

        // Combine all errors
        report.issues.push(...criticalSecrets.errors, ...connections.errors);

        // Combine all warnings
        report.issues.push(...criticalSecrets.warnings, ...connections.warnings);

        // Set status
        if (report.issues.length > 0) {
            report.status = 'FAIL';
        }

        // Generate recommendations
        if (criticalSecrets.errors.length > 0) {
            report.recommendations.push('Review and fix critical secret configuration errors');
        }

        if (connections.warnings.length > 0) {
            report.recommendations.push('Review connection configurations for production readiness');
        }

        if (!process.env.SECRET_ENCRYPTION_KEY) {
            report.recommendations.push('Set SECRET_ENCRYPTION_KEY for persistent secret encryption');
        }

        if (!process.env.ENABLE_FILE_LOGGING) {
            report.recommendations.push('Enable file logging for security audit trails');
        }

        return report;
    }
}

/**
 * Middleware to mask secrets in logs
 */
function createSecretMaskingMiddleware() {
    const sensitiveKeys = [
        'ADMIN_JWT_SECRET',
        'BATTLE_SEED_SECRET',
        'ORACLE_PRIVATE_KEY_HEX',
        'ADMIN_PRIVATE_KEY',
        'ADMIN_MNEMONIC',
        'TELEGRAM_BOT_TOKEN',
        'TON_API_KEY',
    ];

    return (req, res, next) => {
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;

        const maskSecrets =
            (func) =>
            (...args) => {
                const maskedArgs = args.map((arg) => {
                    if (typeof arg === 'string') {
                        let masked = arg;
                        for (const key of sensitiveKeys) {
                            const value = process.env[key];
                            if (value && masked.includes(value)) {
                                masked = masked.replace(value, `***MASKED_${key}***`);
                            }
                        }
                        return masked;
                    }
                    return arg;
                });
                return func(...maskedArgs);
            };

        console.log = maskSecrets(originalConsoleLog);
        console.error = maskSecrets(originalConsoleError);
        console.warn = maskSecrets(originalConsoleWarn);

        next();
    };
}

module.exports = {
    SecretManager,
    ConfigValidator,
    createSecretMaskingMiddleware,
};
