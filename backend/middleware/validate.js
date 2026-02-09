function asString(v) {
    return v === undefined || v === null ? '' : String(v);
}

function normalizeValue(raw, rules, errors, key) {
    const type = rules.type || 'string';

    if (type === 'string') {
        let s = asString(raw);
        if (rules.trim) s = s.trim();
        if (rules.minLength !== undefined && s.length < rules.minLength) {
            errors[key] = `minLength:${rules.minLength}`;
            return;
        }
        if (rules.maxLength !== undefined && s.length > rules.maxLength) {
            errors[key] = `maxLength:${rules.maxLength}`;
            return;
        }
        if (rules.pattern && !rules.pattern.test(s)) {
            errors[key] = 'pattern';
            return;
        }
        if (rules.enum && !rules.enum.includes(s)) {
            errors[key] = 'enum';
            return;
        }
        return s;
    }

    if (type === 'number' || type === 'integer') {
        const n = Number(raw);
        if (!Number.isFinite(n)) {
            errors[key] = 'number';
            return;
        }
        const v = type === 'integer' ? Math.floor(n) : n;
        if (rules.min !== undefined && v < rules.min) {
            errors[key] = `min:${rules.min}`;
            return;
        }
        if (rules.max !== undefined && v > rules.max) {
            errors[key] = `max:${rules.max}`;
            return;
        }
        return v;
    }

    if (type === 'boolean') {
        if (raw === true || raw === false) return raw;
        if (raw === 'true') return true;
        if (raw === 'false') return false;
        errors[key] = 'boolean';
        return;
    }

    if (type === 'objectId') {
        const s = asString(raw).trim();
        if (!/^[a-fA-F0-9]{24}$/.test(s)) {
            errors[key] = 'objectId';
            return;
        }
        return s;
    }

    if (type === 'array') {
        const arr = Array.isArray(raw) ? raw : [];
        if (!Array.isArray(raw)) {
            errors[key] = 'array';
            return;
        }
        if (rules.maxLength !== undefined && arr.length > rules.maxLength) {
            errors[key] = `maxLength:${rules.maxLength}`;
            return;
        }
        if (rules.itemType) {
            const out = [];
            for (let i = 0; i < arr.length; i += 1) {
                const v = normalizeValue(arr[i], { type: rules.itemType }, errors, `${key}[${i}]`);
                if (v !== undefined) out.push(v);
            }
            return out;
        }
        return arr;
    }

    if (type === 'object') {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            errors[key] = 'object';
            return;
        }
        return raw;
    }

    errors[key] = `unsupported_type:${type}`;
}

function validateSource(sourceKey, targetKey, schema) {
    return function validateMiddleware(req, res, next) {
        const src = req[sourceKey] || {};
        const out = {};
        const errors = {};

        for (const [key, rules] of Object.entries(schema || {})) {
            const raw = src[key];
            const required = Boolean(rules.required);

            if (raw === undefined || raw === null || raw === '') {
                if (required) errors[key] = 'required';
                continue;
            }

            const value = normalizeValue(raw, rules, errors, key);
            if (value !== undefined) out[key] = value;
        }

        if (Object.keys(errors).length) return res.status(400).json({ error: 'validation_error', fields: errors });

        req[targetKey] = out;
        return next();
    };
}

function validateBody(schema) {
    return validateSource('body', 'validatedBody', schema);
}

function validateQuery(schema) {
    return validateSource('query', 'validatedQuery', schema);
}

function validateParams(schema) {
    return validateSource('params', 'validatedParams', schema);
}

module.exports = { validateBody, validateQuery, validateParams };
