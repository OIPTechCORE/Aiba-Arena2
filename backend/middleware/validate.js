function asString(v) {
    return v === undefined || v === null ? '' : String(v);
}

function validateBody(schema) {
    return function validateBodyMiddleware(req, res, next) {
        const body = req.body || {};
        const out = {};
        const errors = {};

        for (const [key, rules] of Object.entries(schema || {})) {
            const raw = body[key];
            const required = Boolean(rules.required);
            const type = rules.type || 'string';

            if (raw === undefined || raw === null || raw === '') {
                if (required) errors[key] = 'required';
                continue;
            }

            if (type === 'string') {
                let s = asString(raw);
                if (rules.trim) s = s.trim();
                if (rules.minLength !== undefined && s.length < rules.minLength) {
                    errors[key] = `minLength:${rules.minLength}`;
                    continue;
                }
                if (rules.maxLength !== undefined && s.length > rules.maxLength) {
                    errors[key] = `maxLength:${rules.maxLength}`;
                    continue;
                }
                out[key] = s;
                continue;
            }

            if (type === 'number') {
                const n = Number(raw);
                if (!Number.isFinite(n)) {
                    errors[key] = 'number';
                    continue;
                }
                if (rules.min !== undefined && n < rules.min) {
                    errors[key] = `min:${rules.min}`;
                    continue;
                }
                if (rules.max !== undefined && n > rules.max) {
                    errors[key] = `max:${rules.max}`;
                    continue;
                }
                out[key] = n;
                continue;
            }

            errors[key] = `unsupported_type:${type}`;
        }

        if (Object.keys(errors).length) return res.status(400).json({ error: 'validation_error', fields: errors });

        req.validatedBody = out;
        return next();
    };
}

module.exports = { validateBody };
