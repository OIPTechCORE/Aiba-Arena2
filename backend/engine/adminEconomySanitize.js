function clampHour(n, fallback) {
    const x = Number(n);
    if (!Number.isFinite(x)) return fallback;
    return Math.max(0, Math.min(24, Math.floor(x)));
}

function getAllowedArenaKeysFromModes(modes) {
    const arenas = new Set();
    const arenaLeague = new Set();

    const list = Array.isArray(modes) ? modes : [];
    for (const m of list) {
        const a = String(m?.arena || '').trim();
        const l = String(m?.league || '').trim();
        if (a) arenas.add(a);
        if (a && l) arenaLeague.add(`${a}:${l}`);
    }

    // System arenas used for sinks/admin tracking.
    for (const a of ['training', 'repairs', 'upgrades', 'referrals', 'admin', 'vault']) {
        arenas.add(a);
        arenaLeague.add(`${a}:global`);
    }

    return { arenas, arenaLeague };
}

function sanitizeCapMap(obj, allowedArenas) {
    const out = {};
    if (!obj || typeof obj !== 'object') return out;
    for (const [k, v] of Object.entries(obj)) {
        const key = String(k || '').trim();
        if (!key) continue;
        const num = Number(v);
        if (!Number.isFinite(num) || num < 0) continue;
        if (key.includes(':')) {
            // arena:league keys allowed in emission windows, but caps are arena-only.
            continue;
        }
        if (allowedArenas && allowedArenas.size > 0 && !allowedArenas.has(key)) continue;
        out[key] = Math.floor(num);
    }
    return out;
}

function sanitizeEmissionWindowsUtc(obj, allowed) {
    const out = {};
    if (!obj || typeof obj !== 'object') return out;

    for (const [k, v] of Object.entries(obj)) {
        const key = String(k || '').trim();
        if (!key) continue;
        if (key === '*') {
            // allow
        } else if (key.includes(':')) {
            if (allowed?.arenaLeague && allowed.arenaLeague.size > 0 && !allowed.arenaLeague.has(key)) continue;
        } else {
            if (allowed?.arenas && allowed.arenas.size > 0 && !allowed.arenas.has(key)) continue;
        }

        if (!v || typeof v !== 'object') continue;
        const startHourUtc = clampHour(v.startHourUtc, null);
        const endHourUtc = clampHour(v.endHourUtc, null);
        if (startHourUtc === null || endHourUtc === null) continue;

        out[key] = { startHourUtc, endHourUtc };
    }

    return out;
}

module.exports = {
    clampHour,
    getAllowedArenaKeysFromModes,
    sanitizeCapMap,
    sanitizeEmissionWindowsUtc,
};

