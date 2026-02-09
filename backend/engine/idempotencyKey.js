function normalizeKey(value) {
    const s = value !== undefined && value !== null ? String(value).trim() : '';
    if (!s) return '';
    if (s.length > 128) return '';
    if (!/^[a-zA-Z0-9._:-]+$/.test(s)) return '';
    return s;
}

function getIdempotencyKey(req) {
    const fromBody = normalizeKey(req?.body?.requestId);
    if (fromBody) return fromBody;

    const fromHeader = normalizeKey(req?.headers?.['x-request-id']);
    if (fromHeader) return fromHeader;

    const fromReq = normalizeKey(req?.requestId);
    if (fromReq) return fromReq;

    return '';
}

module.exports = { getIdempotencyKey };
