const EconomyDay = require('../models/EconomyDay');
const EconomyConfig = require('../models/EconomyConfig');
const User = require('../models/User');
const LedgerEntry = require('../models/LedgerEntry');
const { metrics } = require('../metrics');

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

function clampHour(n, fallback) {
    const x = Number(n);
    if (!Number.isFinite(x)) return fallback;
    return Math.max(0, Math.min(24, Math.floor(x)));
}

function getEmissionWindow(cfg, { arena = '', league = '' } = {}) {
    const map = cfg?.emissionWindowsUtc && typeof cfg.emissionWindowsUtc === 'object' ? cfg.emissionWindowsUtc : {};
    const keyArenaLeague = arena && league ? `${arena}:${league}` : '';

    const fromMap = (keyArenaLeague && map[keyArenaLeague]) || (arena && map[arena]) || map['*'] || null;

    if (fromMap && typeof fromMap === 'object') {
        return {
            startHourUtc: clampHour(fromMap.startHourUtc, 0),
            endHourUtc: clampHour(fromMap.endHourUtc, 24),
        };
    }

    return {
        startHourUtc: clampHour(cfg?.emissionStartHourUtc, 0),
        endHourUtc: clampHour(cfg?.emissionEndHourUtc, 24),
    };
}

function isEmissionOpenAt(cfg, { arena = '', league = '' } = {}, now = new Date()) {
    const hour = now.getUTCHours(); // 0..23
    const w = getEmissionWindow(cfg, { arena, league });
    const start = w.startHourUtc;
    const end = w.endHourUtc;

    // Treat 0..24 as inclusive-exclusive [start, end).
    // If end === 24, it means "until end-of-day".
    if (start === 0 && end === 24) return true;
    if (start === end) return false;
    if (start < end) return hour >= start && hour < end;
    // wraps midnight (e.g. 22 -> 6)
    return hour >= start || hour < end;
}

function isEmissionOpen(cfg, { arena = '', league = '' } = {}) {
    return isEmissionOpenAt(cfg, { arena, league }, new Date());
}

function isNonEmptyString(x) {
    return typeof x === 'string' && x.trim().length > 0;
}

function ledgerIdentityQuery({ telegramId, currency, direction, reason, sourceType, sourceId }) {
    if (!isNonEmptyString(telegramId)) return null;
    if (!isNonEmptyString(currency)) return null;
    if (!isNonEmptyString(direction)) return null;
    if (!isNonEmptyString(reason)) return null;
    if (!isNonEmptyString(sourceType) || !isNonEmptyString(sourceId)) return null;

    return {
        telegramId: String(telegramId),
        currency: String(currency),
        direction: String(direction),
        reason: String(reason),
        sourceType: String(sourceType),
        sourceId: String(sourceId),
    };
}

async function safeCreateLedgerEntry(entry) {
    try {
        const created = await LedgerEntry.create(entry);
        return { ok: true, created: created.toObject() };
    } catch (err) {
        // Duplicate key => idempotent replay; treat as success
        if (String(err?.code) === '11000') return { ok: true, duplicate: true };
        return { ok: false, error: err };
    }
}

async function tryEmitAiba(amount, { arena = '', league = '' } = {}) {
    const cfg = await getConfig();
    if (!isEmissionOpen(cfg, { arena, league })) {
        metrics?.economyEmissionsTotal?.inc?.({ currency: 'AIBA', arena, league, result: 'outside_window' });
        return { ok: false, reason: 'outside_emission_window', cfg, day: utcDayKey() };
    }
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

    const ok = Boolean(updated);
    metrics?.economyEmissionsTotal?.inc?.({ currency: 'AIBA', arena, league, result: ok ? 'ok' : 'cap_exceeded' });
    return { ok, reason: ok ? 'ok' : 'cap_exceeded', cfg, day };
}

async function tryEmitNeur(amount, { arena = '', league = '' } = {}) {
    const cfg = await getConfig();
    if (!isEmissionOpen(cfg, { arena, league })) {
        metrics?.economyEmissionsTotal?.inc?.({ currency: 'NEUR', arena, league, result: 'outside_window' });
        return { ok: false, reason: 'outside_emission_window', cfg, day: utcDayKey() };
    }
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

    const ok = Boolean(updated);
    metrics?.economyEmissionsTotal?.inc?.({ currency: 'NEUR', arena, league, result: ok ? 'ok' : 'cap_exceeded' });
    return { ok, reason: ok ? 'ok' : 'cap_exceeded', cfg, day };
}

async function recordSpendNeur(
    amount,
    {
        reason = 'unknown',
        arena = '',
        league = '',
        telegramId = '',
        sourceType = null,
        sourceId = null,
        requestId = null,
        battleId = null,
        meta = {},
    } = {},
) {
    const day = utcDayKey();

    const ident = ledgerIdentityQuery({
        telegramId,
        currency: 'NEUR',
        direction: 'debit',
        reason,
        sourceType,
        sourceId,
    });
    if (ident) {
        const created = await safeCreateLedgerEntry({
            telegramId,
            currency: 'NEUR',
            direction: 'debit',
            amount,
            reason,
            arena,
            league,
            sourceType,
            sourceId,
            requestId,
            battleId,
            applied: false,
            meta,
        });
        if (created?.duplicate) {
            return { ok: true, day, duplicate: true };
        }
        if (!created?.ok) return created;

        const inc = { spentNeur: amount };
        if (reason) inc[`spentNeurByReason.${reason}`] = amount;
        if (arena) inc[`spentNeurByArena.${arena}`] = amount;
        await EconomyDay.findOneAndUpdate(
            { day },
            { $inc: inc },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        ).lean();

        await LedgerEntry.updateOne({ _id: created.created?._id }, { $set: { applied: true } }).catch(() => {});
        metrics?.economySinksTotal?.inc?.({ currency: 'NEUR', reason, arena, league }, Number(amount) || 0);
        return { ok: true, day };
    }

    const inc = { spentNeur: amount };
    if (reason) inc[`spentNeurByReason.${reason}`] = amount;
    if (arena) inc[`spentNeurByArena.${arena}`] = amount;
    await EconomyDay.findOneAndUpdate(
        { day },
        { $inc: inc },
        { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    if (telegramId) {
        await safeCreateLedgerEntry({
            telegramId,
            currency: 'NEUR',
            direction: 'debit',
            amount,
            reason,
            arena,
            league,
            sourceType,
            sourceId,
            requestId,
            battleId,
            applied: true,
            meta,
        });
    }

    metrics?.economySinksTotal?.inc?.({ currency: 'NEUR', reason, arena, league }, Number(amount) || 0);
    return { ok: true, day };
}

async function recordBurnAiba(
    amount,
    {
        reason = 'unknown',
        arena = '',
        league = '',
        telegramId = '',
        sourceType = null,
        sourceId = null,
        requestId = null,
        battleId = null,
        meta = {},
    } = {},
) {
    const day = utcDayKey();

    const ident = ledgerIdentityQuery({
        telegramId,
        currency: 'AIBA',
        direction: 'debit',
        reason,
        sourceType,
        sourceId,
    });
    if (ident) {
        const created = await safeCreateLedgerEntry({
            telegramId,
            currency: 'AIBA',
            direction: 'debit',
            amount,
            reason,
            arena,
            league,
            sourceType,
            sourceId,
            requestId,
            battleId,
            applied: false,
            meta,
        });
        if (created?.duplicate) {
            return { ok: true, day, duplicate: true };
        }
        if (!created?.ok) return created;

        const inc = { burnedAiba: amount };
        if (reason) inc[`burnedAibaByReason.${reason}`] = amount;
        if (arena) inc[`burnedAibaByArena.${arena}`] = amount;
        await EconomyDay.findOneAndUpdate(
            { day },
            { $inc: inc },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        ).lean();

        await LedgerEntry.updateOne({ _id: created.created?._id }, { $set: { applied: true } }).catch(() => {});
        metrics?.economySinksTotal?.inc?.({ currency: 'AIBA', reason, arena, league }, Number(amount) || 0);
        return { ok: true, day };
    }

    const inc = { burnedAiba: amount };
    if (reason) inc[`burnedAibaByReason.${reason}`] = amount;
    if (arena) inc[`burnedAibaByArena.${arena}`] = amount;
    await EconomyDay.findOneAndUpdate(
        { day },
        { $inc: inc },
        { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    if (telegramId) {
        await safeCreateLedgerEntry({
            telegramId,
            currency: 'AIBA',
            direction: 'debit',
            amount,
            reason,
            arena,
            league,
            sourceType,
            sourceId,
            requestId,
            battleId,
            applied: true,
            meta,
        });
    }

    metrics?.economySinksTotal?.inc?.({ currency: 'AIBA', reason, arena, league }, Number(amount) || 0);
    return { ok: true, day };
}

async function creditNeurNoCap(
    amount,
    {
        telegramId,
        reason = 'unknown',
        arena = '',
        league = '',
        sourceType = null,
        sourceId = null,
        requestId = null,
        battleId = null,
        meta = {},
    } = {},
) {
    if (!telegramId) return { ok: false, error: 'telegramId required' };
    if (!Number.isFinite(amount) || amount <= 0) return { ok: true, skipped: true };

    const amt = Math.floor(amount);
    const ident = ledgerIdentityQuery({
        telegramId,
        currency: 'NEUR',
        direction: 'credit',
        reason,
        sourceType,
        sourceId,
    });
    if (ident) {
        const created = await safeCreateLedgerEntry({
            telegramId,
            currency: 'NEUR',
            direction: 'credit',
            amount: amt,
            reason,
            arena,
            league,
            sourceType,
            sourceId,
            requestId,
            battleId,
            applied: false,
            meta,
        });
        if (created?.duplicate) return { ok: true, duplicate: true };
        if (!created?.ok) return created;

        await User.updateOne(
            { telegramId },
            { $inc: { neurBalance: amt }, $setOnInsert: { telegramId } },
            { upsert: true, setDefaultsOnInsert: true },
        );
        await LedgerEntry.updateOne({ _id: created.created?._id }, { $set: { applied: true } }).catch(() => {});
        return { ok: true };
    }

    await User.updateOne(
        { telegramId },
        { $inc: { neurBalance: amt }, $setOnInsert: { telegramId } },
        { upsert: true, setDefaultsOnInsert: true },
    );

    await safeCreateLedgerEntry({
        telegramId,
        currency: 'NEUR',
        direction: 'credit',
        amount: amt,
        reason,
        arena,
        league,
        sourceType,
        sourceId,
        requestId,
        battleId,
        applied: true,
        meta,
    });

    return { ok: true };
}

async function creditAibaNoCap(
    amount,
    {
        telegramId,
        reason = 'unknown',
        arena = '',
        league = '',
        sourceType = null,
        sourceId = null,
        requestId = null,
        battleId = null,
        meta = {},
    } = {},
) {
    if (!telegramId) return { ok: false, error: 'telegramId required' };
    if (!Number.isFinite(amount) || amount <= 0) return { ok: true, skipped: true };

    const amt = Math.floor(amount);
    const ident = ledgerIdentityQuery({
        telegramId,
        currency: 'AIBA',
        direction: 'credit',
        reason,
        sourceType,
        sourceId,
    });
    if (ident) {
        const created = await safeCreateLedgerEntry({
            telegramId,
            currency: 'AIBA',
            direction: 'credit',
            amount: amt,
            reason,
            arena,
            league,
            sourceType,
            sourceId,
            requestId,
            battleId,
            applied: false,
            meta,
        });
        if (created?.duplicate) return { ok: true, duplicate: true };
        if (!created?.ok) return created;

        await User.updateOne(
            { telegramId },
            { $inc: { aibaBalance: amt }, $setOnInsert: { telegramId } },
            { upsert: true, setDefaultsOnInsert: true },
        );
        await LedgerEntry.updateOne({ _id: created.created?._id }, { $set: { applied: true } }).catch(() => {});
        return { ok: true };
    }

    await User.updateOne(
        { telegramId },
        { $inc: { aibaBalance: amt }, $setOnInsert: { telegramId } },
        { upsert: true, setDefaultsOnInsert: true },
    );

    await safeCreateLedgerEntry({
        telegramId,
        currency: 'AIBA',
        direction: 'credit',
        amount: amt,
        reason,
        arena,
        league,
        sourceType,
        sourceId,
        requestId,
        battleId,
        applied: true,
        meta,
    });

    return { ok: true };
}

async function debitNeurFromUser(
    amount,
    {
        telegramId,
        reason = 'unknown',
        arena = '',
        league = '',
        sourceType = null,
        sourceId = null,
        requestId = null,
        battleId = null,
        meta = {},
    } = {},
) {
    if (!telegramId) return { ok: false, error: 'telegramId required' };
    const amt = Math.floor(Number(amount));
    if (!Number.isFinite(amt) || amt <= 0) return { ok: true, skipped: true };

    const ident = ledgerIdentityQuery({
        telegramId,
        currency: 'NEUR',
        direction: 'debit',
        reason,
        sourceType,
        sourceId,
    });
    if (ident) {
        const created = await safeCreateLedgerEntry({
            telegramId,
            currency: 'NEUR',
            direction: 'debit',
            amount: amt,
            reason,
            arena,
            league,
            sourceType,
            sourceId,
            requestId,
            battleId,
            applied: false,
            meta,
        });
        if (created?.duplicate) {
            const user = await User.findOne({ telegramId }).lean();
            return { ok: true, duplicate: true, user };
        }
        if (!created?.ok) return created;

        const user = await User.findOneAndUpdate(
            { telegramId, neurBalance: { $gte: amt } },
            { $inc: { neurBalance: -amt }, $setOnInsert: { telegramId } },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        ).lean();
        if (!user) {
            await LedgerEntry.deleteOne({ _id: created.created?._id, applied: false }).catch(() => {});
            return { ok: false, reason: 'insufficient' };
        }

        // Count spend once.
        const day = utcDayKey();
        const inc = { spentNeur: amt };
        if (reason) inc[`spentNeurByReason.${reason}`] = amt;
        if (arena) inc[`spentNeurByArena.${arena}`] = amt;
        await EconomyDay.findOneAndUpdate(
            { day },
            { $inc: inc },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        ).lean();
        metrics?.economySinksTotal?.inc?.({ currency: 'NEUR', reason, arena, league }, Number(amt) || 0);

        await LedgerEntry.updateOne({ _id: created.created?._id }, { $set: { applied: true } }).catch(() => {});
        return { ok: true, user };
    }

    // Legacy/non-idempotent path (should not be used in production).
    const user = await User.findOneAndUpdate(
        { telegramId, neurBalance: { $gte: amt } },
        { $inc: { neurBalance: -amt }, $setOnInsert: { telegramId } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
    if (!user) return { ok: false, reason: 'insufficient' };

    await recordSpendNeur(amt, { reason, arena, league, telegramId, sourceType, sourceId, requestId, battleId, meta });
    return { ok: true, user };
}

async function debitAibaFromUser(
    amount,
    {
        telegramId,
        reason = 'unknown',
        arena = '',
        league = '',
        sourceType = null,
        sourceId = null,
        requestId = null,
        battleId = null,
        meta = {},
    } = {},
) {
    if (!telegramId) return { ok: false, error: 'telegramId required' };
    const amt = Math.floor(Number(amount));
    if (!Number.isFinite(amt) || amt <= 0) return { ok: true, skipped: true };

    const ident = ledgerIdentityQuery({
        telegramId,
        currency: 'AIBA',
        direction: 'debit',
        reason,
        sourceType,
        sourceId,
    });
    if (ident) {
        const created = await safeCreateLedgerEntry({
            telegramId,
            currency: 'AIBA',
            direction: 'debit',
            amount: amt,
            reason,
            arena,
            league,
            sourceType,
            sourceId,
            requestId,
            battleId,
            applied: false,
            meta,
        });
        if (created?.duplicate) {
            const user = await User.findOne({ telegramId }).lean();
            return { ok: true, duplicate: true, user };
        }
        if (!created?.ok) return created;

        const user = await User.findOneAndUpdate(
            { telegramId, aibaBalance: { $gte: amt } },
            { $inc: { aibaBalance: -amt }, $setOnInsert: { telegramId } },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        ).lean();
        if (!user) {
            await LedgerEntry.deleteOne({ _id: created.created?._id, applied: false }).catch(() => {});
            return { ok: false, reason: 'insufficient' };
        }

        const day = utcDayKey();
        const inc = { burnedAiba: amt };
        if (reason) inc[`burnedAibaByReason.${reason}`] = amt;
        if (arena) inc[`burnedAibaByArena.${arena}`] = amt;
        await EconomyDay.findOneAndUpdate(
            { day },
            { $inc: inc },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        ).lean();
        metrics?.economySinksTotal?.inc?.({ currency: 'AIBA', reason, arena, league }, Number(amt) || 0);

        await LedgerEntry.updateOne({ _id: created.created?._id }, { $set: { applied: true } }).catch(() => {});
        return { ok: true, user };
    }

    const user = await User.findOneAndUpdate(
        { telegramId, aibaBalance: { $gte: amt } },
        { $inc: { aibaBalance: -amt }, $setOnInsert: { telegramId } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
    if (!user) return { ok: false, reason: 'insufficient' };

    await recordBurnAiba(amt, { reason, arena, league, telegramId, sourceType, sourceId, requestId, battleId, meta });
    return { ok: true, user };
}

// For withdrawals/settlement flows where we should NOT count this as a sink/burn.
async function debitAibaFromUserNoBurn(
    amount,
    {
        telegramId,
        reason = 'unknown',
        arena = '',
        league = '',
        sourceType = null,
        sourceId = null,
        requestId = null,
        battleId = null,
        meta = {},
    } = {},
) {
    if (!telegramId) return { ok: false, error: 'telegramId required' };
    const amt = Math.floor(Number(amount));
    if (!Number.isFinite(amt) || amt <= 0) return { ok: true, skipped: true };

    const ident = ledgerIdentityQuery({
        telegramId,
        currency: 'AIBA',
        direction: 'debit',
        reason,
        sourceType,
        sourceId,
    });
    if (ident) {
        const created = await safeCreateLedgerEntry({
            telegramId,
            currency: 'AIBA',
            direction: 'debit',
            amount: amt,
            reason,
            arena,
            league,
            sourceType,
            sourceId,
            requestId,
            battleId,
            applied: false,
            meta,
        });
        if (created?.duplicate) {
            const user = await User.findOne({ telegramId }).lean();
            return { ok: true, duplicate: true, user };
        }
        if (!created?.ok) return created;

        const user = await User.findOneAndUpdate(
            { telegramId, aibaBalance: { $gte: amt } },
            { $inc: { aibaBalance: -amt }, $setOnInsert: { telegramId } },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        ).lean();
        if (!user) {
            await LedgerEntry.deleteOne({ _id: created.created?._id, applied: false }).catch(() => {});
            return { ok: false, reason: 'insufficient' };
        }

        await LedgerEntry.updateOne({ _id: created.created?._id }, { $set: { applied: true } }).catch(() => {});
        return { ok: true, user };
    }

    const user = await User.findOneAndUpdate(
        { telegramId, aibaBalance: { $gte: amt } },
        { $inc: { aibaBalance: -amt }, $setOnInsert: { telegramId } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
    if (!user) return { ok: false, reason: 'insufficient' };

    await safeCreateLedgerEntry({
        telegramId,
        currency: 'AIBA',
        direction: 'debit',
        amount: amt,
        reason,
        arena,
        league,
        sourceType,
        sourceId,
        requestId,
        battleId,
        applied: true,
        meta,
    });

    return { ok: true, user };
}

module.exports = {
    utcDayKey,
    getConfig,
    tryEmitAiba,
    tryEmitNeur,
    recordSpendNeur,
    recordBurnAiba,
    creditNeurNoCap,
    creditAibaNoCap,
    debitNeurFromUser,
    debitAibaFromUser,
    debitAibaFromUserNoBurn,
    safeCreateLedgerEntry,
    isEmissionOpenAt,
};
