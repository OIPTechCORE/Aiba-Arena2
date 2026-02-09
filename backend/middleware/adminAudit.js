const AdminAudit = require('../models/AdminAudit');

function sanitizeBody(body) {
    if (!body || typeof body !== 'object') return {};
    const out = Array.isArray(body) ? [] : {};
    const entries = Object.entries(body);
    for (const [key, value] of entries) {
        if (/password|secret|token|key|authorization|cookie/i.test(key)) {
            out[key] = '[redacted]';
            continue;
        }
        if (value && typeof value === 'object') {
            out[key] = '[object]';
            continue;
        }
        out[key] = value;
    }
    return out;
}

function getIp(req) {
    const xff = req.headers['x-forwarded-for'];
    if (xff) return String(xff).split(',')[0].trim();
    return req.ip || req.connection?.remoteAddress || 'unknown';
}

function adminAudit() {
    return function adminAuditMiddleware(req, res, next) {
        const start = Date.now();
        res.on('finish', () => {
            try {
                const admin = req.admin || {};
                AdminAudit.create({
                    adminEmail: String(admin.email || '').trim(),
                    adminRole: String(admin.role || '').trim(),
                    method: req.method,
                    path: req.originalUrl || req.url || '',
                    status: res.statusCode || 0,
                    ip: getIp(req),
                    requestId: req.requestId || '',
                    durationMs: Date.now() - start,
                    query: req.query || {},
                    params: req.params || {},
                    body: sanitizeBody(req.body),
                }).catch(() => {});
            } catch (err) {
                console.error('Admin audit log error:', err?.message || err);
            }
        });
        return next();
    };
}

module.exports = { adminAudit };
