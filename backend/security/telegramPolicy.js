function getTelegramInitDataMaxAgeSeconds(env = process.env) {
    const raw = env?.TELEGRAM_INITDATA_MAX_AGE_SECONDS;
    if (raw === undefined || raw === null || String(raw).trim() === '') {
        // Conservative default for mainnet (15 minutes)
        return 15 * 60;
    }

    const n = Number(raw);
    if (!Number.isFinite(n)) return 15 * 60;
    if (n < 0) return 0;
    return Math.floor(n);
}

module.exports = { getTelegramInitDataMaxAgeSeconds };
