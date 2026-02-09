function getIp(req) {
    // Trust proxy setups where x-forwarded-for is set (Render/Vercel/Cloudflare).
    const xff = req.headers['x-forwarded-for'];
    if (xff) return String(xff).split(',')[0].trim();
    return req.ip || req.connection?.remoteAddress || 'unknown';
}

let redisClient;
let redisReady = false;

function getRedisClient() {
    if (redisClient) return redisClient;
    const url = String(process.env.REDIS_URL || '').trim();
    if (!url) return null;
    try {
        const { createClient } = require('redis');
        redisClient = createClient({ url });
        redisClient.on('error', (err) => {
            redisReady = false;
            console.error('Redis error (rate limit):', err?.message || err);
        });
        redisClient.on('ready', () => {
            redisReady = true;
        });
        redisClient.connect().catch((err) => {
            redisReady = false;
            console.error('Redis connect failed (rate limit):', err?.message || err);
        });
        return redisClient;
    } catch (err) {
        console.error('Redis client init failed (rate limit):', err?.message || err);
        return null;
    }
}

// Lightweight in-memory rate limiter (good enough for testnet/dev).
// For production multi-instance, set REDIS_URL to use a shared Redis store.
function rateLimit(options = {}) {
    const windowMs = Number(options.windowMs ?? 60_000);
    const max = Number(options.max ?? 60);
    const keyFn =
        options.keyFn ||
        ((req) => {
            // Prefer telegram identity when available, fallback to IP.
            return req.telegramId ? `tg:${req.telegramId}` : `ip:${getIp(req)}`;
        });

    const store = new Map(); // key -> { resetAt: number, count: number }
    const redis = getRedisClient();

    return async function rateLimitMiddleware(req, res, next) {
        const now = Date.now();
        const key = String(keyFn(req) || 'unknown');
        const windowKey = Math.floor(now / windowMs);
        const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));

        if (redis && redisReady) {
            try {
                const redisKey = `rl:${windowKey}:${key}`;
                const count = await redis.incr(redisKey);
                if (count === 1) {
                    await redis.expire(redisKey, ttlSeconds);
                }
                const remaining = Math.max(0, max - count);
                const resetAt = (windowKey + 1) * windowMs;
                res.setHeader('X-RateLimit-Limit', String(max));
                res.setHeader('X-RateLimit-Remaining', String(remaining));
                res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

                if (count > max) {
                    const retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000));
                    res.setHeader('Retry-After', String(retryAfterSec));
                    return res.status(429).json({ error: 'rate_limited', retryAfterSec });
                }
                return next();
            } catch (err) {
                console.error('Redis rate limit error:', err?.message || err);
            }
        }

        let row = store.get(key);
        if (!row || now >= row.resetAt) {
            row = { resetAt: now + windowMs, count: 0 };
            store.set(key, row);
        }

        row.count += 1;

        const remaining = Math.max(0, max - row.count);
        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(remaining));
        res.setHeader('X-RateLimit-Reset', String(Math.ceil(row.resetAt / 1000)));

        if (row.count > max) {
            const retryAfterSec = Math.max(1, Math.ceil((row.resetAt - now) / 1000));
            res.setHeader('Retry-After', String(retryAfterSec));
            return res.status(429).json({ error: 'rate_limited', retryAfterSec });
        }

        return next();
    };
}

module.exports = { rateLimit };
