function makeId() {
    try {
        // Node 18+ has crypto.randomUUID, but keep fallback.
        const crypto = require('crypto');
        if (crypto.randomUUID) return crypto.randomUUID();
        return crypto.randomBytes(16).toString('hex');
    } catch {
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}

function requestId(req, res, next) {
    const incoming = req.headers['x-request-id'] ? String(req.headers['x-request-id']).trim() : '';
    const id = incoming || makeId();
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
    return next();
}

module.exports = { requestId };
