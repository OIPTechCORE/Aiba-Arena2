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
const { getLimit } = require('../util/pagination');
const { validateBody, validateQuery } = require('../middleware/validate');
const { adminAudit } = require('../middleware/adminAudit');

router.use(requireAdmin(), adminAudit());

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
router.patch(
    '/config',
    validateBody({
        dailyCapAiba: { type: 'number', min: 0 },
        dailyCapNeur: { type: 'number', min: 0 },
        baseRewardAibaPerScore: { type: 'number', min: 0 },
        baseRewardNeurPerScore: { type: 'number', min: 0 },
        emissionStartHourUtc: { type: 'number', min: 0 },
        emissionEndHourUtc: { type: 'number', min: 0 },
        upgradeAibaCost: { type: 'number', min: 0 },
        trainNeurCost: { type: 'number', min: 0 },
        repairNeurCost: { type: 'number', min: 0 },
        marketplaceFeeBps: { type: 'number', min: 0 },
        marketplaceBurnBps: { type: 'number', min: 0 },
        referralRewardNeurReferrer: { type: 'number', min: 0 },
        referralRewardNeurReferee: { type: 'number', min: 0 },
        battleMaxEnergy: { type: 'number', min: 0 },
        battleEnergyRegenSecondsPerEnergy: { type: 'number', min: 0 },
        battleAnomalyScoreMax: { type: 'number', min: 0 },
        battleAutoBanBrokerAnomalyFlags: { type: 'number', min: 0 },
        battleAutoBanUserAnomalyFlags: { type: 'number', min: 0 },
        battleAutoBanUserMinutes: { type: 'number', min: 0 },
        boostCostNeur: { type: 'number', min: 0 },
        boostDurationHours: { type: 'number', min: 0 },
        boostMultiplier: { type: 'number', min: 0 },
        stakingApyPercent: { type: 'number', min: 0 },
        stakingMinAiba: { type: 'number', min: 1 },
        combineNeurCost: { type: 'number', min: 0 },
        referralRewardAibaReferrer: { type: 'number', min: 0 },
        referralRewardAibaReferee: { type: 'number', min: 0 },
        dailyRewardNeur: { type: 'number', min: 0 },
        mintAibaCost: { type: 'number', min: 0 },
        boostCostTonNano: { type: 'number', min: 0 },
        createGroupCostTonNano: { type: 'number', min: 0 },
        boostGroupCostTonNano: { type: 'number', min: 0 },
        leaderboardTopFreeCreate: { type: 'number', min: 0 },
        createBrokerCostTonNano: { type: 'number', min: 0 },
        boostProfileCostTonNano: { type: 'number', min: 0 },
        giftCostTonNano: { type: 'number', min: 0 },
        marketplaceDefaultNewBrokerPriceAIBA: { type: 'number', min: 0 },
        boostProfileDurationDays: { type: 'number', min: 0 },
        oracleAibaPerTon: { type: 'number', min: 0 },
        oracleNeurPerAiba: { type: 'number', min: 0 },
        oracleAutoUpdateEnabled: { type: 'boolean' },
        oracleAibaUsd: { type: 'number', min: 0 },
        oracleMinAibaPerTon: { type: 'number', min: 0 },
        oracleMaxAibaPerTon: { type: 'number', min: 0 },
        oracleFallbackAibaPerTon: { type: 'number', min: 0 },
        oracleUpdateIntervalMinutes: { type: 'number', min: 1, max: 1440 },
        starRewardPerBattle: { type: 'number', min: 0 },
        diamondRewardFirstWin: { type: 'number', min: 0 },
        topLeaderBadgeTopN: { type: 'number', min: 0 },
        courseCompletionBadgeMintCostTonNano: { type: 'number', min: 0 },
        fullCourseCompletionCertificateMintCostTonNano: { type: 'number', min: 0 },
        nftStakingApyPercent: { type: 'number', min: 0 },
        nftStakingRewardPerDayAiba: { type: 'number', min: 0 },
        arenaLegendMintCostAiba: { type: 'number', min: 0 },
        arenaLegendUnlockWins: { type: 'number', min: 0 },
        starsStorePackStars: { type: 'number', min: 0 },
        starsStorePackPriceAiba: { type: 'number', min: 0 },
        starsStorePackPriceTonNano: { type: 'number', min: 0 },
        createCarCostTonNano: { type: 'number', min: 0 },
        createCarCostAiba: { type: 'number', min: 0 },
        carEntryFeeAiba: { type: 'number', min: 0 },
        carRacingFeeBps: { type: 'number', min: 0 },
        createBikeCostTonNano: { type: 'number', min: 0 },
        createBikeCostAiba: { type: 'number', min: 0 },
        bikeEntryFeeAiba: { type: 'number', min: 0 },
        bikeRacingFeeBps: { type: 'number', min: 0 },
        dailyCapAibaByArena: { type: 'object' },
        dailyCapNeurByArena: { type: 'object' },
        emissionWindowsUtc: { type: 'object' },
        supportLink: { type: 'string', trim: true, maxLength: 500 },
        supportTelegramGroup: { type: 'string', trim: true, maxLength: 100 },
    }),
    async (req, res) => {
    const update = {};
    const body = req.validatedBody || {};

    const maybeNum = (k) => {
        if (body[k] === undefined) return;
        const v = Number(body[k]);
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
        'stakingMinAiba',
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
        'oracleAutoUpdateEnabled',
        'oracleAibaUsd',
        'oracleMinAibaPerTon',
        'oracleMaxAibaPerTon',
        'oracleFallbackAibaPerTon',
        'oracleUpdateIntervalMinutes',
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
        'starsStorePackStars',
        'starsStorePackPriceAiba',
        'starsStorePackPriceTonNano',
        'createCarCostTonNano',
        'createCarCostAiba',
        'carEntryFeeAiba',
        'carRacingFeeBps',
        'createBikeCostTonNano',
        'createBikeCostAiba',
        'bikeEntryFeeAiba',
        'bikeRacingFeeBps',
        'referralUnlock3BonusBps',
        'trainerRewardAibaPerUser',
        'trainerRewardAibaPerRecruitedTrainer',
        'p2pAibaSendFeeTonNano',
        'aibaInGiftsFeeTonNano',
        'buyAibaWithTonFeeBps',
        'donateBrokerFeeTonNano',
        'donateCarFeeTonNano',
        'donateBikeFeeTonNano',
        'donateGiftsFeeTonNano',
        'creatorPercentBps',
        'creatorTier100RefsBps',
        'creatorTier1000RefsBps',
        'creatorTier10000RefsBps',
        'predictVigBps',
        'predictMaxBetAiba',
        'supportLink',
        'supportTelegramGroup',
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
    maybeNum('stakingMinAiba');
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
    if (body.oracleAutoUpdateEnabled !== undefined) update.oracleAutoUpdateEnabled = Boolean(body.oracleAutoUpdateEnabled);
    maybeNum('oracleAibaUsd');
    maybeNum('oracleMinAibaPerTon');
    maybeNum('oracleMaxAibaPerTon');
    maybeNum('oracleFallbackAibaPerTon');
    if (body.oracleUpdateIntervalMinutes !== undefined) {
        const v = Number(body.oracleUpdateIntervalMinutes);
        if (Number.isFinite(v) && v >= 1 && v <= 1440) update.oracleUpdateIntervalMinutes = Math.floor(v);
    }
    maybeNum('starRewardPerBattle');
    maybeNum('diamondRewardFirstWin');
    maybeNum('topLeaderBadgeTopN');
    maybeNum('courseCompletionBadgeMintCostTonNano');
    maybeNum('fullCourseCompletionCertificateMintCostTonNano');
    maybeNum('nftStakingApyPercent');
    maybeNum('nftStakingRewardPerDayAiba');
    maybeNum('arenaLegendMintCostAiba');
    maybeNum('arenaLegendUnlockWins');
    maybeNum('starsStorePackStars');
    maybeNum('starsStorePackPriceAiba');
    // Stars Store TON: 1–10 TON (1e9–10e9 nano) → STARS_STORE_WALLET
    if (req.body?.starsStorePackPriceTonNano !== undefined) {
        const v = Number(req.body.starsStorePackPriceTonNano);
        if (Number.isFinite(v) && v >= 0)
            update.starsStorePackPriceTonNano = Math.max(1_000_000_000, Math.min(10_000_000_000, Math.round(v)));
    }
    maybeNum('createCarCostAiba');
    maybeNum('carEntryFeeAiba');
    maybeNum('carRacingFeeBps');
    if (req.body?.createCarCostTonNano !== undefined) {
        const v = Number(req.body.createCarCostTonNano);
        if (Number.isFinite(v) && v >= 0)
            update.createCarCostTonNano = Math.max(1_000_000_000, Math.min(10_000_000_000, Math.round(v)));
    }
    maybeNum('createBikeCostAiba');
    maybeNum('bikeEntryFeeAiba');
    maybeNum('bikeRacingFeeBps');
    maybeNum('referralUnlock3BonusBps');
    maybeNum('trainerRewardAibaPerUser');
    maybeNum('trainerRewardAibaPerRecruitedTrainer');
    maybeNum('p2pAibaSendFeeTonNano');
    maybeNum('aibaInGiftsFeeTonNano');
    maybeNum('buyAibaWithTonFeeBps');
    maybeNum('donateBrokerFeeTonNano');
    maybeNum('donateCarFeeTonNano');
    maybeNum('donateBikeFeeTonNano');
    maybeNum('donateGiftsFeeTonNano');
    maybeNum('creatorPercentBps');
    maybeNum('creatorTier100RefsBps');
    maybeNum('creatorTier1000RefsBps');
    maybeNum('creatorTier10000RefsBps');
    maybeNum('predictVigBps');
    maybeNum('predictMaxBetAiba');
    if (req.body?.supportLink !== undefined) update.supportLink = String(req.body.supportLink || '').trim();
    if (req.body?.supportTelegramGroup !== undefined) update.supportTelegramGroup = String(req.body.supportTelegramGroup || '').trim();
    if (req.body?.createBikeCostTonNano !== undefined) {
        const v = Number(req.body.createBikeCostTonNano);
        if (Number.isFinite(v) && v >= 0)
            update.createBikeCostTonNano = Math.max(1_000_000_000, Math.min(10_000_000_000, Math.round(v)));
    }

    const allowed = await getAllowedArenaKeys();

    if (body.dailyCapAibaByArena && typeof body.dailyCapAibaByArena === 'object') {
        for (const [k, v] of Object.entries(body.dailyCapAibaByArena)) {
            const num = Number(v);
            if (!Number.isFinite(num) || num < 0) {
                return res.status(400).json({ error: 'invalid dailyCapAibaByArena', field: String(k) });
            }
        }
        update.dailyCapAibaByArena = sanitizeCapMap(body.dailyCapAibaByArena, allowed.arenas);
    }
    if (body.dailyCapNeurByArena && typeof body.dailyCapNeurByArena === 'object') {
        for (const [k, v] of Object.entries(body.dailyCapNeurByArena)) {
            const num = Number(v);
            if (!Number.isFinite(num) || num < 0) {
                return res.status(400).json({ error: 'invalid dailyCapNeurByArena', field: String(k) });
            }
        }
        update.dailyCapNeurByArena = sanitizeCapMap(body.dailyCapNeurByArena, allowed.arenas);
    }
    if (body.emissionWindowsUtc && typeof body.emissionWindowsUtc === 'object') {
        for (const [k, v] of Object.entries(body.emissionWindowsUtc)) {
            if (!v || typeof v !== 'object') {
                return res.status(400).json({ error: 'invalid emissionWindowsUtc', field: String(k) });
            }
            const startHourUtc = Number(v.startHourUtc);
            const endHourUtc = Number(v.endHourUtc);
            if (!Number.isFinite(startHourUtc) || !Number.isFinite(endHourUtc)) {
                return res.status(400).json({ error: 'invalid emissionWindowsUtc', field: String(k) });
            }
        }
        update.emissionWindowsUtc = sanitizeEmissionWindowsUtc(body.emissionWindowsUtc, allowed);
    }

    const cfg = await EconomyConfig.findOneAndUpdate(
        {},
        { $set: update },
        { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    res.json(cfg);
    },
);

// GET /api/admin/economy/day?day=YYYY-MM-DD
router.get(
    '/day',
    validateQuery({
        day: { type: 'string', trim: true, minLength: 1, maxLength: 20, required: true },
    }),
    async (req, res) => {
    const day = String(req.validatedQuery?.day || '').trim();
    if (!day) return res.status(400).json({ error: 'day required (YYYY-MM-DD)' });

    const doc = await EconomyDay.findOne({ day }).lean();
    res.json(doc || { day, emittedAiba: 0, emittedNeur: 0, burnedAiba: 0, spentNeur: 0 });
    },
);

// POST /api/admin/economy/credit-user
// Body: { requestId, telegramId, aibaDelta?, neurDelta?, reason? }
router.post(
    '/credit-user',
    validateBody({
        requestId: { type: 'string', trim: true, minLength: 1, maxLength: 128 },
        telegramId: { type: 'string', trim: true, minLength: 1, maxLength: 50, required: true },
        aibaDelta: { type: 'number' },
        neurDelta: { type: 'number' },
        reason: { type: 'string', trim: true, maxLength: 200 },
    }),
    async (req, res) => {
    const requestId = req.validatedBody?.requestId ? String(req.validatedBody.requestId).trim() : '';
    const headerRequestId = req.headers['x-request-id'] ? String(req.headers['x-request-id']).trim() : '';
    const idempotencyKey = requestId || headerRequestId;
    if (!idempotencyKey) return res.status(400).json({ error: 'requestId required' });

    const telegramId = String(req.validatedBody?.telegramId || '').trim();
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

    const aibaDelta = req.validatedBody?.aibaDelta === undefined ? 0 : Number(req.validatedBody.aibaDelta);
    const neurDelta = req.validatedBody?.neurDelta === undefined ? 0 : Number(req.validatedBody.neurDelta);
    const reason = String(req.validatedBody?.reason || 'admin_adjustment').trim();

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
    },
);

// GET /api/admin/economy/ledger?telegramId=...&limit=100
router.get(
    '/ledger',
    validateQuery({
        telegramId: { type: 'string', trim: true, maxLength: 50 },
        limit: { type: 'integer', min: 1, max: 500 },
    }),
    async (req, res) => {
    try {
        const telegramId = req.validatedQuery?.telegramId ? String(req.validatedQuery.telegramId).trim() : '';
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 100, maxLimit: 500 },
        );

        const q = {};
        if (telegramId) q.telegramId = telegramId;

        const rows = await LedgerEntry.find(q).sort({ createdAt: -1 }).limit(limit).lean();
        res.json(rows);
    } catch (err) {
        console.error('Error in /api/admin/economy/ledger:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// GET /api/admin/economy/simulate?days=30 — token economy simulator
router.get(
    '/simulate',
    validateQuery({ days: { type: 'integer', min: 1, max: 365 } }),
    async (req, res) => {
    try {
        const days = getLimit(
            { query: { limit: req.validatedQuery?.days } },
            { defaultLimit: 30, maxLimit: 365 },
        );
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
    },
);

module.exports = router;
