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

async function tryEmitAiba(amount) {
    const cfg = await getConfig();
    const day = utcDayKey();

    // Atomic cap check: only update if emittedAiba <= cap-amount
    const updated = await EconomyDay.findOneAndUpdate(
        { day, emittedAiba: { $lte: cfg.dailyCapAiba - amount } },
        { $inc: { emittedAiba: amount } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return { ok: Boolean(updated), cfg, day };
}

async function emitNeur(amount) {
    const cfg = await getConfig();
    const day = utcDayKey();
    await EconomyDay.findOneAndUpdate(
        { day },
        { $inc: { emittedNeur: amount } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    return { ok: true, cfg, day };
}

module.exports = { utcDayKey, getConfig, tryEmitAiba, emitNeur };

