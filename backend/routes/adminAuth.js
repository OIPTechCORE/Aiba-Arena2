const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { requireAdmin } = require('../middleware/requireAdmin');
const { validateBody } = require('../middleware/validate');
const { rateLimit } = require('../middleware/rateLimit');

router.post(
    '/login',
    rateLimit({
        windowMs: 15 * 60_000,
        max: 5,
        keyFn: (req) => {
            const email = String(req.body?.email || '').trim().toLowerCase();
            const ip = req.headers['x-forwarded-for']
                ? String(req.headers['x-forwarded-for']).split(',')[0].trim()
                : req.ip || req.connection?.remoteAddress || 'unknown';
            return `admin-login:${email || 'unknown'}:${ip}`;
        },
    }),
    validateBody({
        email: { type: 'string', trim: true, minLength: 3, maxLength: 200, required: true },
        password: { type: 'string', minLength: 1, maxLength: 200, required: true },
    }),
    async (req, res) => {
    try {
        const email = String(req.validatedBody?.email || '')
            .trim()
            .toLowerCase();
        const password = String(req.validatedBody?.password || '');

        const adminEmail = String(process.env.ADMIN_EMAIL || '')
            .trim()
            .toLowerCase();
        const passwordHash = String(process.env.ADMIN_PASSWORD_HASH || '').trim();
        const passwordPlain = String(process.env.ADMIN_PASSWORD || '');
        const secret = String(process.env.ADMIN_JWT_SECRET || '').trim();

        if (!adminEmail || !secret) return res.status(500).json({ error: 'admin auth not configured' });
        if (!email || !password) return res.status(400).json({ error: 'email and password required' });

        if (email !== adminEmail) return res.status(401).json({ error: 'invalid credentials' });

        let ok = false;
        if (passwordHash) ok = await bcrypt.compare(password, passwordHash);
        else ok = passwordPlain && password === passwordPlain;

        if (!ok) return res.status(401).json({ error: 'invalid credentials' });

        const token = jwt.sign({ role: 'superadmin' }, secret, { subject: adminEmail, expiresIn: '12h' });
        res.json({ token });
    } catch (err) {
        console.error('Error in admin login:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

router.get('/me', requireAdmin(), async (req, res) => {
    res.json({ email: req.admin.email, role: req.admin.role });
});

module.exports = router;
