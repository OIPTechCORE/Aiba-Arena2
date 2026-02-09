function normalizeErrorPayload(body) {
    if (!body || typeof body !== 'object') {
        return {
            code: 'error',
            message: typeof body === 'string' && body ? body : 'error',
        };
    }

    if (body.error && typeof body.error === 'object') {
        return {
            code: body.error.code || body.error.message || 'error',
            message: body.error.message || body.error.code || 'error',
            details: body.error.details,
        };
    }

    const code = body.code || body.error || 'error';
    const message = body.message || body.error || 'error';
    const details = body.details || body.detail || body.fields;
    return { code, message, details };
}

function responseEnvelope(req, res, next) {
    const originalJson = res.json.bind(res);

    res.json = (body) => {
        if (body && typeof body === 'object' && body.ok === false && body.error) {
            return originalJson({
                ok: false,
                error: normalizeErrorPayload(body),
                requestId: req.requestId || '',
            });
        }

        if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'error')) {
            return originalJson({
                ok: false,
                error: normalizeErrorPayload(body),
                requestId: req.requestId || '',
            });
        }

        if (body && typeof body === 'object' && body.ok === true) {
            if (!Object.prototype.hasOwnProperty.call(body, 'requestId')) {
                return originalJson({ ...body, requestId: req.requestId || '' });
            }
            return originalJson(body);
        }

        return originalJson({
            ok: true,
            data: body,
            requestId: req.requestId || '',
        });
    };

    res.fail = (status, code, message, details) => {
        return res.status(status).json({
            ok: false,
            error: { code, message, details },
        });
    };

    return next();
}

module.exports = { responseEnvelope };
