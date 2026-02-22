/**
 * Structured Logging System
 * Provides consistent, structured logging with different levels and contexts
 */

const fs = require('fs');
const path = require('path');

// Log levels in order of severity
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
};

// Default configuration
const config = {
    level: process.env.LOG_LEVEL || 'INFO',
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
    logDir: process.env.LOG_DIR || './logs',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    enableConsoleColors: process.env.NODE_ENV !== 'production',
};

/**
 * Gets the current log level number
 */
function getLevelNumber(level) {
    return LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
}

/**
 * Formats timestamp
 */
function getTimestamp() {
    return new Date().toISOString();
}

/**
 * Formats log message for console output
 */
function formatConsoleMessage(level, message, meta = {}) {
    const timestamp = getTimestamp();
    const levelStr = level.padEnd(5);
    const context = meta.context ? `[${meta.context}]` : '';
    const metaStr =
        Object.keys(meta).length > 1
            ? ' ' + JSON.stringify(Object.fromEntries(Object.entries(meta).filter(([k]) => k !== 'context')))
            : '';

    if (config.enableConsoleColors) {
        const colors = {
            ERROR: '\x1b[31m', // red
            WARN: '\x1b[33m', // yellow
            INFO: '\x1b[36m', // cyan
            DEBUG: '\x1b[37m', // white
            RESET: '\x1b[0m',
        };
        return `${colors[level]}${timestamp} ${levelStr}${colors.RESET}${context} ${message}${metaStr}`;
    }

    return `${timestamp} ${levelStr}${context} ${message}${metaStr}`;
}

/**
 * Formats log message for file output (JSON)
 */
function formatFileMessage(level, message, meta = {}) {
    return JSON.stringify({
        timestamp: getTimestamp(),
        level,
        message,
        ...meta,
    });
}

/**
 * Writes to log file with rotation
 */
function writeToFile(level, formattedMessage) {
    if (!config.enableFileLogging) return;

    try {
        // Ensure log directory exists
        if (!fs.existsSync(config.logDir)) {
            fs.mkdirSync(config.logDir, { recursive: true });
        }

        const logFile = path.join(config.logDir, 'app.log');

        // Simple log rotation (would be enhanced with a proper library in production)
        if (fs.existsSync(logFile)) {
            const stats = fs.statSync(logFile);
            if (stats.size > config.maxFileSize) {
                // Rotate files
                for (let i = config.maxFiles - 1; i > 0; i--) {
                    const oldFile = path.join(config.logDir, `app.${i}.log`);
                    const newFile = path.join(config.logDir, `app.${i + 1}.log`);
                    if (fs.existsSync(oldFile)) {
                        if (i === config.maxFiles - 1) {
                            fs.unlinkSync(oldFile);
                        } else {
                            fs.renameSync(oldFile, newFile);
                        }
                    }
                }
                fs.renameSync(logFile, path.join(config.logDir, 'app.1.log'));
            }
        }

        fs.appendFileSync(logFile, formattedMessage + '\n');
    } catch (err) {
        // Fallback to console if file logging fails
        console.error('Failed to write to log file:', err);
    }
}

/**
 * Core logging function
 */
function log(level, message, meta = {}) {
    const currentLevel = getLevelNumber(config.level);
    const messageLevel = getLevelNumber(level);

    if (messageLevel > currentLevel) {
        return; // Skip if below configured level
    }

    const consoleMessage = formatConsoleMessage(level, message, meta);
    const fileMessage = formatFileMessage(level, message, meta);

    // Output to console
    if (level === 'ERROR') {
        console.error(consoleMessage);
    } else if (level === 'WARN') {
        console.warn(consoleMessage);
    } else {
        console.log(consoleMessage);
    }

    // Output to file
    writeToFile(level, fileMessage);
}

/**
 * Logger interface
 */
const logger = {
    error: (message, meta = {}) => log('ERROR', message, meta),
    warn: (message, meta = {}) => log('WARN', message, meta),
    info: (message, meta = {}) => log('INFO', message, meta),
    debug: (message, meta = {}) => log('DEBUG', message, meta),

    // Context-specific loggers
    child: (context) => ({
        error: (message, meta = {}) => log('ERROR', message, { ...meta, context }),
        warn: (message, meta = {}) => log('WARN', message, { ...meta, context }),
        info: (message, meta = {}) => log('INFO', message, { ...meta, context }),
        debug: (message, meta = {}) => log('DEBUG', message, { ...meta, context }),
    }),

    // Utility methods
    setLevel: (level) => {
        if (LOG_LEVELS.hasOwnProperty(level.toUpperCase())) {
            config.level = level.toUpperCase();
        } else {
            throw new Error(`Invalid log level: ${level}. Valid levels: ${Object.keys(LOG_LEVELS).join(', ')}`);
        }
    },

    enableFileLogging: (enabled = true) => {
        config.enableFileLogging = enabled;
    },

    setLogDir: (dir) => {
        config.logDir = dir;
    },
};

/**
 * Express middleware for request logging
 */
logger.requestMiddleware = () => {
    return (req, res, next) => {
        const start = Date.now();
        const context = 'HTTP';

        // Log request
        logger.info(`${req.method} ${req.path}`, {
            context,
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            telegramId: req.telegramId,
        });

        // Log response
        res.on('finish', () => {
            const duration = Date.now() - start;
            const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
            log(level, `${req.method} ${req.path} ${res.statusCode}`, {
                context,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                ip: req.ip,
                telegramId: req.telegramId,
            });
        });

        next();
    };
};

/**
 * Error logging utility
 */
logger.logError = (err, context = {}) => {
    logger.error(err.message, {
        context: context.context || 'ERROR',
        stack: err.stack,
        ...context,
    });
};

module.exports = logger;
