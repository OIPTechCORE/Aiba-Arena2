function getIdempotencyKey(req) {
    const fromBody = req?.body?.requestId !== undefined ? String(req.body.requestId).trim() : '';
    if (fromBody) return fromBody;

    const fromHeader = req?.headers?.['x-request-id'] ? String(req.headers['x-request-id']).trim() : '';
    if (fromHeader) return fromHeader;

    const fromReq = req?.requestId ? String(req.requestId).trim() : '';
    if (fromReq) return fromReq;

    return '';
}

module.exports = { getIdempotencyKey };

