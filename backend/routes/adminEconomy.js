const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const EconomyConfig = require('../models/EconomyConfig');
const EconomyDay = require('../models/EconomyDay');
const User = require('../models/User');
const LedgerEntry = require('../models/LedgerEntry');
const GameMode = require('../models/GameMode');
const { getConfig, safeCreateLedgerEntry } = require('../engine/economy');
const {
    getAllowedArenaKeysFromModes,
    sanitizeCapMap,
    sanitizeEmissionWindowsUtc,
} = require('../engine/adminEconomySanitize');

router.use(requireAdmin());

async function getAllowedArenaKeys() {
    const modes = await GameMode.find({}).select({ arena: 1, league: 1 }).lean();
    return getAllowedArenaKeysFromModes(modes);
}

// GET /api/admin/economy/config
router.get('/config', async (_req, res) => {
    const cfg = await getConfig();
    res.json(cfg);
});

// PATCH /api/admin/economy/config
router.patch('/config', async (req, res) => {
    const update = {};

    const maybeNum = (k) => {
        if (req.body?.[k] === undefined) return;
        const v = Number(req.body[k]);
        if (!Number.isFinite(v) || v < 0) return;
        update[k] = v;
    };

    // In production, reject unknown fields to avoid silent config drift.
    const allowedTopLevel = new Set([
        'dailyCapAiba',
        'dailyCapNeur',
        'baseRewardAibaPerScore',
        'baseRewardNeurPerScore',
        'emissionStartHourUtc',
        'emissionEndHourUtc',
        'upgradeAibaCost',
        'trainNeurCost',
        'repairNeurCost',
        'marketplaceFeeBps',
        'marketplaceBurnBps',
        'referralRewardNeurReferrer',
        'referralRewardNeurReferee',
        'battleMaxEnergy',
        'battleEnergyRegenSecondsPerEnergy',
        'battleAnomalyScoreMax',
        'battleAutoBanBrokerAnomalyFlags',
        'battleAutoBanUserAnomalyFlags',
        'battleAutoBanUserMinutes',
        'boostCostNeur',
        'boostDurationHours',
        'boostMultiplier',
        'stakingApyPercent',
        'combineNeurCost',
        'referralRewardAibaReferrer',
        'referralRewardAibaReferee',
        'dailyRewardNeur',
        'mintAibaCost',
        'boostCostTonNano',
        'createGroupCostTonNano',
        'boostGroupCostTonNano',
        'leaderboardTopFreeCreate',
        'createBrokerCostTonNano',
        'boostProfileCostTonNano',
        'giftCostTonNano',
        'marketplaceDefaultNewBrokerPriceAIBA',
        'boostProfileDurationDays',
        'oracleAibaPerTon',
        'oracleNeurPerAiba',
        'dailyCapAibaByArena',
        'dailyCapNeurByArena',
        'emissionWindowsUtc',
        'starRewardPerBattle',
        'diamondRewardFirstWin',
        'topLeaderBadgeTopN',
        'courseCompletionBadgeMintCostTonNano',
        'fullCourseCompletionCertificateMintCostTonNano',
        'nftStakingApyPercent',
        'nftStakingRewardPerDayAiba',
        'arenaLegendMintCostAiba',
        'arenaLegendUnlockWins',
    ]);
    const bodyKeys = req.body && typeof req.body === 'object' ? Object.keys(req.body) : [];
    const unknown = bodyKeys.filter((k) => !allowedTopLevel.has(k));
    const strict = process.env.APP_ENV === 'prod' || process.env.NODE_ENV === 'production';
    if (strict && unknown.length > 0) {
        return res.status(400).json({ error: 'unknown_fields', fields: unknown });
    }
    if (!strict && unknown.length > 0) {
        console.warn('adminEconomy/config ignored unknown fields:', unknown);
    }

    maybeNum('dailyCapAiba');
    maybeNum('dailyCapNeur');
    maybeNum('baseRewardAibaPerScore');
    maybeNum('baseRewardNeurPerScore');
    maybeNum('emissionStartHourUtc');
    maybeNum('emissionEndHourUtc');
    maybeNum('upgradeAibaCost');
    maybeNum('trainNeurCost');
    maybeNum('repairNeurCost');
    maybeNum('marketplaceFeeBps');
    maybeNum('marketplaceBurnBps');
    maybeNum('referralRewardNeurReferrer');
    maybeNum('referralRewardNeurReferee');
    maybeNum('battleMaxEnergy');
    maybeNum('battleEnergyRegenSecondsPerEnergy');
    maybeNum('battleAnomalyScoreMax');
    maybeNum('battleAutoBanBrokerAnomalyFlags');
    maybeNum('battleAutoBanUserAnomalyFlags');
    maybeNum('battleAutoBanUserMinutes');
    maybeNum('boostCostNeur');
    maybeNum('boostDurationHours');
    maybeNum('boostMultiplier');
    maybeNum('stakingApyPercent');
    maybeNum('combineNeurCost');
    maybeNum('referralRewardAibaReferrer');
    maybeNum('referralRewardAibaReferee');
    maybeNum('dailyRewardNeur');
    maybeNum('mintAibaCost');
    maybeNum('boostCostTonNano');
    // Groups: 1–10 TON (1e9–10e9 nano) for create/boost; clamp to range so Super Admin stays within spec.
    if (req.body?.createGroupCostTonNano !== undefined) {
        const v = Number(req.body.createGroupCostTonNano);
        if (Number.isFinite(v) && v >= 0)
            update.createGroupCostTonNano = Math.max(1_000_000_000, Math.min(10_000_000_000, Math.round(v)));
    }
    if (req.body?.boostGroupCostTonNano !== undefined) {
        const v = Number(req.body.boostGroupCostTonNano);
        if (Number.isFinite(v) && v >= 0)
            update.boostGroupCostTonNano = Math.max(1_000_000_000, Math.min(10_000_000_000, Math.round(v)));
    }
    maybeNum('leaderboardTopFreeCreate');
    if (req.body?.createBrokerCostTonNano !== undefined) {
        const v = Number(req.body.createBrokerCostTonNano);
        if (Number.isFinite(v) && v >= 0)
            update.createBrokerCostTonNano = Math.max(1_000_000_000, Math.min(10_000_000_000, Math.round(v)));
    }
    if (req.body?.boostProfileCostTonNano !== undefined) {
        const v = Number(req.body.boostProfileCostTonNano);
        if (Number.isFinite(v) && v >= 0)
            update.boostProfileCostTonNano = Math.max(1_000_000_000, Math.min(10_000_000_000, Math.round(v)));
    }
    if (req.body?.giftCostTonNano !== undefined) {
        const v = Number(req.body.giftCostTonNano);
        if (Number.isFinite(v) && v >= 0)
            update.giftCostTonNano = Math.max(1_000_000_000, Math.min(10_000_000_000, Math.round(v)));
    }
    maybeNum('marketplaceDefaultNewBrokerPriceAIBA');
    maybeNum('boostProfileDurationDays');
    maybeNum('oracleAibaPerTon');
    maybeNum('oracleNeurPerAiba');
    maybeNum('starRewardPerBattle');
    maybeNum('diamondRewardFirstWin');
    maybeNum('topLeaderBadgeTopN');
    maybeNum('courseCompletionBadgeMintCostTonNano');
    maybeNum('fullCourseCompletionCertificateMintCostTonNano');
    maybeNum('nftStakingApyPercent');
    maybeNum('nftStakingRewardPerDayAiba');
    maybeNum('arenaLegendMintCostAiba');
    maybeNum('arenaLegendUnlockWins');

    const allowed = await getAllowedArenaKeys();

    if (req.body?.dailyCapAibaByArena && typeof req.body.dailyCapAibaByArena === 'object') {
        update.dailyCapAibaByArena = sanitizeCapMap(req.body.dailyCapAibaByArena, allowed.arenas);
    }
    if (req.body?.dailyCapNeurByArena && typeof req.body.dailyCapNeurByArena === 'object') {
        update.dailyCapNeurByArena = sanitizeCapMap(req.body.dailyCapNeurByArena, allowed.arenas);
    }
    if (req.body?.emissionWindowsUtc && typeof req.body.emissionWindowsUtc === 'object') {
        update.emissionWindowsUtc = sanitizeEmissionWindowsUtc(req.body.emissionWindowsUtc, allowed);
    }

    const cfg = await EconomyConfig.findOneAndUpdate(
        {},
        { $set: update },
        { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    res.json(cfg);
});

// GET /api/admin/economy/day?day=YYYY-MM-DD
router.get('/day', async (req, res) => {
    const day = String(req.query?.day || '').trim();
    if (!day) return res.status(400).json({ error: 'day required (YYYY-MM-DD)' });

    const doc = await EconomyDay.findOne({ day }).lean();
    res.json(doc || { day, emittedAiba: 0, emittedNeur: 0, burnedAiba: 0, spentNeur: 0 });
});

// POST /api/admin/economy/credit-user
// Body: { requestId, telegramId, aibaDelta?, neurDelta?, reason? }
router.post('/credit-user', async (req, res) => {
    const requestId = req.body?.requestId ? String(req.body.requestId).trim() : '';
    const headerRequestId = req.headers['x-request-id'] ? String(req.headers['x-request-id']).trim() : '';
    const idempotencyKey = requestId || headerRequestId;
    if (!idempotencyKey) return res.status(400).json({ error: 'requestId required' });

    const telegramId = String(req.body?.telegramId || '').trim();
    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });

    // Idempotency: if we already applied this requestId, return current user.
    const existing = await LedgerEntry.findOne({
        telegramId,
        sourceType: 'admin_credit_user',
        sourceId: idempotencyKey,
    })
        .select({ _id: 1 })
        .lean();
    if (existing) {
        const user = await User.findOne({ telegramId }).lean();
        return res.json({ ok: true, user, requestId: idempotencyKey, duplicate: true });
    }

    const aibaDelta = req.body?.aibaDelta === undefined ? 0 : Number(req.body.aibaDelta);
    const neurDelta = req.body?.neurDelta === undefined ? 0 : Number(req.body.neurDelta);
    const reason = String(req.body?.reason || 'admin_adjustment').trim();

    if (!Number.isFinite(aibaDelta) || !Number.isFinite(neurDelta)) {
        return res.status(400).json({ error: 'aibaDelta/neurDelta must be numbers' });
    }

    const incAiba = Math.floor(aibaDelta);
    const incNeur = Math.floor(neurDelta);
    const user = await User.findOneAndUpdate(
        { telegramId },
        { $inc: { aibaBalance: incAiba, neurBalance: incNeur }, $setOnInsert: { telegramId } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    const sourceId = idempotencyKey;
    if (incNeur !== 0) {
        await safeCreateLedgerEntry({
            telegramId,
            currency: 'NEUR',
            direction: incNeur > 0 ? 'credit' : 'debit',
            amount: Math.abs(incNeur),
            reason,
            arena: 'admin',
            league: 'global',
            sourceType: 'admin_credit_user',
            sourceId,
            requestId: sourceId,
            meta: { raw: { aibaDelta, neurDelta } },
        });
    }
    if (incAiba !== 0) {
        await safeCreateLedgerEntry({
            telegramId,
            currency: 'AIBA',
            direction: incAiba > 0 ? 'credit' : 'debit',
            amount: Math.abs(incAiba),
            reason,
            arena: 'admin',
            league: 'global',
            sourceType: 'admin_credit_user',
            sourceId,
            requestId: sourceId,
            meta: { raw: { aibaDelta, neurDelta } },
        });
    }

    res.json({ ok: true, user, requestId: idempotencyKey });
});

// GET /api/admin/economy/ledger?telegramId=...&limit=100
router.get('/ledger', async (req, res) => {
    try {
        const telegramId = req.query?.telegramId ? String(req.query.telegramId).trim() : '';
        const limit = Math.max(1, Math.min(500, Number(req.query?.limit ?? 100) || 100));

        const q = {};
        if (telegramId) q.telegramId = telegramId;

        const rows = await LedgerEntry.find(q).sort({ createdAt: -1 }).limit(limit).lean();
        res.json(rows);
    } catch (err) {
        console.error('Error in /api/admin/economy/ledger:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/admin/economy/simulate?days=30 — token economy simulator
router.get('/simulate', async (req, res) => {
    try {
        const days = Math.max(1, Math.min(365, parseInt(req.query?.days, 10) || 30));
        const cfg = await getConfig();
        const baseAiba = Number(cfg.baseRewardAibaPerScore ?? 0);
        const baseNeur = Number(cfg.baseRewardNeurPerScore ?? 0);
        const capAiba = Number(cfg.dailyCapAiba ?? 0);
        const capNeur = Number(cfg.dailyCapNeur ?? 0);
        const avgScore = 80;
        const battlesPerDay = 5000;
        const dailyEmitAiba = Math.min(capAiba, battlesPerDay * avgScore * baseAiba);
        const dailyEmitNeur = Math.min(capNeur, battlesPerDay * avgScore * baseNeur);
        const projection = [];
        let totalAiba = 0;
        let totalNeur = 0;
        for (let d = 0; d < days; d++) {
            totalAiba += dailyEmitAiba;
            totalNeur += dailyEmitNeur;
            projection.push({
                day: d + 1,
                emittedAiba: dailyEmitAiba,
                emittedNeur: dailyEmitNeur,
                cumulativeAiba: totalAiba,
                cumulativeNeur: totalNeur,
            });
        }
        res.json({
            days,
            params: { avgScore, battlesPerDay, baseAiba, baseNeur, capAiba, capNeur },
            projection,
            summary: { totalEmittedAiba: totalAiba, totalEmittedNeur: totalNeur },
        });
    } catch (err) {
        console.error('Economy simulate error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
