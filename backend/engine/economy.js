const EconomyDay = require('../models/EconomyDay');
const EconomyConfig = require('../models/EconomyConfig');

function utcDayKey(date = new Date()) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function getConfig() {
    const existing = await EconomyConfig.findOne().lean();
    if (existing) return existing;
    const created = await EconomyConfig.create({});
    return created.toObject();
}

function mapGet(m, key) {
    if (!m) return undefined;
    if (typeof m.get === 'function') return m.get(key);
    return m[key];
}

async function tryEmitAiba(amount, { arena = '' } = {}) {
    const cfg = await getConfig();
    const day = utcDayKey();

    const capAll = Number(cfg.dailyCapAiba ?? 0);
    const capArenaRaw = mapGet(cfg.dailyCapAibaByArena, arena);
    const capArena = capArenaRaw === undefined ? null : Number(capArenaRaw);

    const update = { $inc: { emittedAiba: amount } };
    const query = { day, emittedAiba: { $lte: capAll - amount } };

    if (arena && capArena !== null && Number.isFinite(capArena)) {
        const path = `emittedAibaByArena.${arena}`;
        update.$inc[path] = amount;
        query.$and = [
            {
                $or: [{ [path]: { $exists: false } }, { [path]: { $lte: capArena - amount } }],
            },
        ];
    }

    // Atomic cap check: update only if day totals are within caps
    const updated = await EconomyDay.findOneAndUpdate(query, update, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
    }).lean();

    return { ok: Boolean(updated), cfg, day };
}

async function tryEmitNeur(amount, { arena = '' } = {}) {
    const cfg = await getConfig();
    const day = utcDayKey();

    const capAll = Number(cfg.dailyCapNeur ?? 0);
    const capArenaRaw = mapGet(cfg.dailyCapNeurByArena, arena);
    const capArena = capArenaRaw === undefined ? null : Number(capArenaRaw);

    const update = { $inc: { emittedNeur: amount } };
    const query = { day, emittedNeur: { $lte: capAll - amount } };

    if (arena && capArena !== null && Number.isFinite(capArena)) {
        const path = `emittedNeurByArena.${arena}`;
        update.$inc[path] = amount;
        query.$and = [
            {
                $or: [{ [path]: { $exists: false } }, { [path]: { $lte: capArena - amount } }],
            },
        ];
    }

    const updated = await EconomyDay.findOneAndUpdate(query, update, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
    }).lean();

    return { ok: Boolean(updated), cfg, day };
}

async function recordSpendNeur(amount, { reason = 'unknown', arena = '' } = {}) {
    const day = utcDayKey();
    const inc = { spentNeur: amount };
    if (reason) inc[`spentNeurByReason.${reason}`] = amount;
    if (arena) inc[`spentNeurByArena.${arena}`] = amount;
    await EconomyDay.findOneAndUpdate({ day }, { $inc: inc }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    return { ok: true, day };
}

async function recordBurnAiba(amount, { reason = 'unknown', arena = '' } = {}) {
    const day = utcDayKey();
    const inc = { burnedAiba: amount };
    if (reason) inc[`burnedAibaByReason.${reason}`] = amount;
    if (arena) inc[`burnedAibaByArena.${arena}`] = amount;
    await EconomyDay.findOneAndUpdate({ day }, { $inc: inc }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    return { ok: true, day };
}

module.exports = { utcDayKey, getConfig, tryEmitAiba, tryEmitNeur, recordSpendNeur, recordBurnAiba };

