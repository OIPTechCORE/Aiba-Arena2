function clampInt(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    const i = Math.floor(n);
    if (i < min) return min;
    if (i > max) return max;
    return i;
}

function getLimit(req, { defaultLimit = 20, maxLimit = 100 } = {}) {
    return clampInt(req?.query?.limit, 1, maxLimit, defaultLimit);
}

module.exports = { getLimit };
