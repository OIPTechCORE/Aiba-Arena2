function getIp(req) {
    // Trust proxy setups where x-forwarded-for is set (Render/Vercel/Cloudflare).
    const xff = req.headers['x-forwarded-for'];
    if (xff) return String(xff).split(',')[0].trim();
    return req.ip || req.connection?.remoteAddress || 'unknown';
}

// Lightweight in-memory rate limiter (good enough for testnet/dev).
// For production multi-instance, swap to Redis.
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

    return function rateLimitMiddleware(req, res, next) {
        const now = Date.now();
        const key = String(keyFn(req) || 'unknown');

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
