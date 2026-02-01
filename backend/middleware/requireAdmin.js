const jwt = require('jsonwebtoken');

function requireAdmin(requiredRole = null) {
    return function (req, res, next) {
        try {
            const secret = String(process.env.ADMIN_JWT_SECRET || '').trim();
            if (!secret) return res.status(500).json({ error: 'ADMIN_JWT_SECRET not configured' });

            const auth = String(req.headers.authorization || '');
            const token =
                auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : String(req.headers['x-admin-token'] || '');

            if (!token) return res.status(401).json({ error: 'admin auth required' });

            const decoded = jwt.verify(token, secret);
            req.admin = {
                email: decoded.sub,
                role: decoded.role,
            };

            if (requiredRole && req.admin.role !== requiredRole) {
                return res.status(403).json({ error: 'insufficient role' });
            }

            return next();
        } catch (err) {
            return res.status(401).json({ error: 'invalid admin token' });
        }
    };
}

module.exports = { requireAdmin };

