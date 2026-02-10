const router = require('express').Router();
const crypto = require('crypto');
const { requireTelegram } = require('../middleware/requireTelegram');
const RacingCar = require('../models/RacingCar');
const { CAR_CLASSES } = require('../models/RacingCar');
const CarTrack = require('../models/CarTrack');
const CarRace = require('../models/CarRace');
const CarRaceEntry = require('../models/CarRaceEntry');
const CarListing = require('../models/CarListing');
const UsedTonTxHash = require('../models/UsedTonTxHash');
const { getConfig, debitAibaFromUser, creditAibaNoCap } = require('../engine/economy');
const { getIdempotencyKey } = require('../engine/idempotencyKey');
const { verifyTonPayment } = require('../util/tonVerify');
const { simulateRace } = require('../engine/raceEngine');
const { getLimit } = require('../util/pagination');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');
const { SYSTEM_CARS, getSystemCar } = require('../config/systemShop');

const LEAGUES = ['rookie', 'pro', 'elite'];

const CAR_CLASS_LABELS = {
    formula1: 'Formula 1 (Turbo/Hybrid/Modern)',
    lemans: 'Le Mans Prototypes / Hypercars',
    canam: 'Can-Am (Unrestricted Power)',
    indycar: 'IndyCar / CART',
    groupB: 'Group B Rally Monsters',
    gt1: 'GT1 / GT Racing',
    electric: 'Electric Racing',
    drag: 'Drag Racing (Top Fuel / Funny Car)',
    touring: 'Touring / DTM / Supercars',
    hillclimb: 'Hillclimb / Time Attack / Unlimited',
    nascar: 'NASCAR / Stock Car',
    historic: 'Historic Monsters',
    hypercar: 'Modern Hypercar Race Variants',
    extreme: 'Extreme Track/Prototype Specials',
};

function pickRandomCarClass() {
    return CAR_CLASSES[Math.floor(Math.random() * CAR_CLASSES.length)];
}

function getCarRacingConfig(cfg) {
    return {
        createCarCostTonNano: Math.max(0, Number(cfg.createCarCostTonNano ?? 1e9)),
        createCarCostAiba: Math.max(0, Math.floor(Number(cfg.createCarCostAiba ?? 100))),
        entryFeeAiba: Math.max(0, Math.floor(Number(cfg.carEntryFeeAiba ?? 10))),
        feeBps: Math.max(0, Math.min(10000, Number(cfg.carRacingFeeBps ?? 300))),
    };
}

router.get(
    '/tracks',
    validateQuery({
        league: { type: 'string', trim: true, enum: LEAGUES },
    }),
    async (req, res) => {
    try {
        const league = req.validatedQuery?.league ? req.validatedQuery.league : null;
        const q = { active: true };
        if (league) q.league = league;
        const tracks = await CarTrack.find(q).lean();
        res.json(tracks);
    } catch (err) {
        console.error('Car racing tracks error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

router.get(
    '/races',
    validateQuery({
        status: { type: 'string', trim: true, maxLength: 20 },
        limit: { type: 'integer', min: 1, max: 50 },
    }),
    async (req, res) => {
    try {
        const status = req.validatedQuery?.status === 'open' ? 'open' : 'open';
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 20, maxLimit: 50 },
        );
        const races = await CarRace.find({ status }).sort({ createdAt: -1 }).limit(limit).lean();
        const withCount = await Promise.all(
            races.map(async (r) => {
                const count = await CarRaceEntry.countDocuments({ raceId: r._id });
                return { ...r, entryCount: count };
            })
        );
        res.json(withCount);
    } catch (err) {
        console.error('Car racing races error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

router.get('/cars', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const cars = await RacingCar.find({ ownerTelegramId: telegramId }).sort({ createdAt: -1 }).lean();
        res.json(cars);
    } catch (err) {
        console.error('Car racing cars error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.post(
    '/create',
    requireTelegram,
    validateBody({
        requestId: { type: 'string', trim: true, minLength: 1, maxLength: 128 },
    }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });
        const cfg = await getConfig();
        const { createCarCostAiba } = getCarRacingConfig(cfg);
        if (createCarCostAiba <= 0) return res.status(400).json({ error: 'create with AIBA not configured' });
        const debit = await debitAibaFromUser(createCarCostAiba, {
            telegramId,
            reason: 'car_racing_create',
            arena: 'car_racing',
            league: 'global',
            sourceType: 'car_racing',
            sourceId: requestId,
            requestId,
            meta: {},
        });
        if (!debit.ok) return res.status(403).json({ error: debit.reason === 'insufficient' ? 'insufficient AIBA' : 'debit failed' });
        const car = await RacingCar.create({
            ownerTelegramId: telegramId,
            carClass: pickRandomCarClass(),
            topSpeed: 50,
            acceleration: 50,
            handling: 50,
            durability: 50,
        });
        res.status(201).json({ ok: true, car, aibaBalance: debit.user?.aibaBalance ?? 0 });
    } catch (err) {
        console.error('Car racing create error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

router.post(
    '/create-with-ton',
    requireTelegram,
    validateBody({
        txHash: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const txHash = String(req.validatedBody?.txHash ?? '').trim();
        if (!txHash) return res.status(400).json({ error: 'txHash required' });
        const wallet = (process.env.CAR_RACING_WALLET || '').trim();
        if (!wallet) return res.status(503).json({ error: 'CAR_RACING_WALLET not configured' });
        const cfg = await getConfig();
        const costNano = getCarRacingConfig(cfg).createCarCostTonNano;
        if (costNano <= 0) return res.status(400).json({ error: 'create with TON not configured' });
        const existing = await UsedTonTxHash.findOne({ txHash, purpose: 'create_car' }).lean();
        if (existing) return res.status(409).json({ error: 'txHash already used' });
        const verified = await verifyTonPayment(txHash, wallet, costNano);
        if (!verified) return res.status(400).json({ error: 'invalid or insufficient TON payment' });
        await UsedTonTxHash.create({ txHash, purpose: 'create_car', ownerTelegramId: telegramId });
        const car = await RacingCar.create({
            ownerTelegramId: telegramId,
            carClass: pickRandomCarClass(),
            topSpeed: 50,
            acceleration: 50,
            handling: 50,
            durability: 50,
            createdWithTonTxHash: txHash,
        });
        res.status(201).json({ ok: true, car });
    } catch (err) {
        console.error('Car racing create-with-ton error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

async function runCarRaceIfFull(raceId) {
    const race = await CarRace.findById(raceId);
    if (!race || race.status !== 'open') return;
    const count = await CarRaceEntry.countDocuments({ raceId });
    if (count < race.maxEntries || count < 2) return;
    const track = await CarTrack.findOne({ trackId: race.trackId }).lean();
    const entries = await CarRaceEntry.find({ raceId }).populate('carId').lean();
    const valid = entries.filter((e) => e.carId);
    if (valid.length < 2) return;
    const seed = race.seed || crypto.randomBytes(16).toString('hex');
    if (!race.seed) {
        race.seed = seed;
        await race.save();
    }
    const vehicles = valid.map((e) => ({
        entryId: String(e._id),
        topSpeed: e.carId.topSpeed,
        acceleration: e.carId.acceleration,
        handling: e.carId.handling,
        durability: e.carId.durability,
        level: e.carId.level,
    }));
    const results = simulateRace({
        vehicles,
        trackLength: track?.length ?? 1,
        trackDifficulty: track?.difficulty ?? 50,
        seed,
    });
    const feeBps = Math.max(0, Math.min(10000, Number((await getConfig()).carRacingFeeBps ?? 300)));
    const pool = race.rewardPool || 0;
    const fee = Math.floor((pool * feeBps) / 10000);
    const toDistribute = pool - fee;
    const totalPositions = results.length;
    const positionShare = totalPositions > 0 ? toDistribute / totalPositions : 0;
    const positionBonus = [1.5, 1.2, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5];
    race.status = 'running';
    race.startedAt = new Date();
    await race.save();
    for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const bonus = positionBonus[i] ?? 0.5;
        const aibaReward = Math.floor(positionShare * bonus);
        const entry = valid.find((e) => String(e._id) === r.entryId);
        await CarRaceEntry.updateOne(
            { _id: r.entryId },
            { $set: { position: r.position, finishTime: r.finishTime, points: r.points, aibaReward } }
        );
        if (entry && aibaReward > 0) {
            await creditAibaNoCap(aibaReward, {
                telegramId: entry.telegramId,
                reason: 'car_racing_reward',
                arena: 'car_racing',
                league: race.league,
                sourceType: 'car_racing',
                sourceId: String(race._id),
                requestId: String(race._id),
                meta: { position: r.position, raceId: String(race._id) },
            });
        }
    }
    race.status = 'completed';
    race.completedAt = new Date();
    await race.save();
}

router.post(
    '/enter',
    requireTelegram,
    validateBody({
        requestId: { type: 'string', trim: true, minLength: 1, maxLength: 128 },
        raceId: { type: 'objectId', required: true },
        carId: { type: 'objectId', required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });
        const raceId = String(req.validatedBody?.raceId ?? '').trim();
        const carId = String(req.validatedBody?.carId ?? '').trim();
        if (!raceId || !carId) return res.status(400).json({ error: 'raceId and carId required' });
        const race = await CarRace.findById(raceId);
        if (!race) return res.status(404).json({ error: 'race not found' });
        if (race.status !== 'open') return res.status(400).json({ error: 'race not open' });
        const car = await RacingCar.findById(carId);
        if (!car) return res.status(404).json({ error: 'car not found' });
        if (String(car.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your car' });
        const existing = await CarRaceEntry.findOne({ raceId, telegramId }).lean();
        if (existing) return res.status(409).json({ error: 'already entered this race' });
        const entryCount = await CarRaceEntry.countDocuments({ raceId });
        if (entryCount >= race.maxEntries) return res.status(400).json({ error: 'race full' });
        const cfg = await getConfig();
        const fee = Math.max(0, Math.floor(Number(cfg.carEntryFeeAiba ?? 10)));
        if (fee > 0) {
            const debit = await debitAibaFromUser(fee, {
                telegramId,
                reason: 'car_racing_entry',
                arena: 'car_racing',
                league: race.league,
                sourceType: 'car_racing',
                sourceId: requestId,
                requestId,
                meta: { raceId, carId },
            });
            if (!debit.ok) return res.status(403).json({ error: debit.reason === 'insufficient' ? 'insufficient AIBA' : 'debit failed' });
        }
        const newPool = (race.rewardPool || 0) + fee;
        await CarRace.updateOne({ _id: raceId }, { $set: { rewardPool: newPool } });
        const entry = await CarRaceEntry.create({ raceId, carId, telegramId });
        const updatedRace = await CarRace.findById(raceId).lean();
        const newCount = entryCount + 1;
        if (newCount >= updatedRace.maxEntries) {
            await runCarRaceIfFull(raceId);
        }
        res.status(201).json({ ok: true, entry, race: await CarRace.findById(raceId).lean() });
    } catch (err) {
        console.error('Car racing enter error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

router.get(
    '/race/:id',
    validateParams({ id: { type: 'objectId', required: true } }),
    async (req, res) => {
    try {
        const race = await CarRace.findById(req.validatedParams.id).lean();
        if (!race) return res.status(404).json({ error: 'race not found' });
        const entries = await CarRaceEntry.find({ raceId: race._id }).populate('carId').sort({ position: 1 }).lean();
        res.json({ race, entries });
    } catch (err) {
        console.error('Car racing race get error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

router.get(
    '/leaderboard',
    validateQuery({ limit: { type: 'integer', min: 1, max: 100 } }),
    async (req, res) => {
    try {
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 20, maxLimit: 100 },
        );
        const agg = await CarRaceEntry.aggregate([
            { $match: { position: { $gte: 1 } } },
            { $group: { _id: '$telegramId', totalPoints: { $sum: '$points' }, wins: { $sum: { $cond: [{ $eq: ['$position', 1] }, 1, 0] } }, aibaEarned: { $sum: '$aibaReward' } } },
            { $sort: { totalPoints: -1 } },
            { $limit: limit },
        ]);
        res.json(agg.map((r, i) => ({ rank: i + 1, telegramId: r._id, totalPoints: r.totalPoints, wins: r.wins, aibaEarned: r.aibaEarned })));
    } catch (err) {
        console.error('Car racing leaderboard error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

router.get('/config', async (req, res) => {
    try {
        const cfg = await getConfig();
        const c = getCarRacingConfig(cfg);
        res.json({
            ...c,
            walletForTon: (process.env.CAR_RACING_WALLET || '').trim() || null,
            carClasses: CAR_CLASSES.map((id) => ({ id, label: CAR_CLASS_LABELS[id] || id })),
        });
    } catch (err) {
        console.error('Car racing config error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.get('/classes', async (_req, res) => {
    try {
        res.json(CAR_CLASSES.map((id) => ({ id, label: CAR_CLASS_LABELS[id] || id })));
    } catch (err) {
        console.error('Car racing classes error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.get('/system-cars', (_req, res) => {
    try {
        const withLabel = SYSTEM_CARS.map((c) => ({ ...c, classLabel: CAR_CLASS_LABELS[c.carClass] || c.carClass }));
        res.json(withLabel);
    } catch (err) {
        console.error('System cars catalog error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.post(
    '/buy-system-car',
    requireTelegram,
    validateBody({ catalogId: { type: 'string', trim: true, minLength: 1, maxLength: 64, required: true } }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const catalogId = String(req.validatedBody?.catalogId ?? '').trim();
        const entry = getSystemCar(catalogId);
        if (!entry) return res.status(404).json({ error: 'catalog entry not found' });
        const requestId = getIdempotencyKey(req) || `sys-car-${catalogId}-${Date.now()}`;
        const debit = await debitAibaFromUser(entry.priceAiba, {
            telegramId,
            reason: 'system_car_buy',
            arena: 'car_racing',
            league: 'global',
            sourceType: 'system_shop',
            sourceId: catalogId,
            requestId,
            meta: { catalogId },
        });
        if (!debit.ok) return res.status(403).json({ error: debit.reason === 'insufficient' ? 'insufficient AIBA' : 'debit failed' });
        const car = await RacingCar.create({
            ownerTelegramId: telegramId,
            carClass: entry.carClass,
            topSpeed: entry.topSpeed,
            acceleration: entry.acceleration,
            handling: entry.handling,
            durability: entry.durability,
        });
        res.status(201).json({ ok: true, car: car.toObject(), aibaBalance: debit.user?.aibaBalance ?? 0 });
    } catch (err) {
        console.error('Buy system car error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

router.get(
    '/listings',
    requireTelegram,
    validateQuery({ limit: { type: 'integer', min: 1, max: 50 } }),
    async (req, res) => {
    try {
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 20, maxLimit: 50 },
        );
        const list = await CarListing.find({ status: 'active' }).sort({ createdAt: -1 }).limit(limit).populate('carId').lean();
        res.json(list.filter((l) => l.carId).map((l) => ({ _id: l._id, carId: l.carId._id, car: l.carId, sellerTelegramId: l.sellerTelegramId, priceAIBA: l.priceAIBA })));
    } catch (err) {
        console.error('Car listings error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

router.post(
    '/list',
    requireTelegram,
    validateBody({
        carId: { type: 'objectId', required: true },
        priceAIBA: { type: 'integer', min: 0, required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const carId = String(req.validatedBody?.carId ?? '').trim();
        const priceAIBA = Math.floor(Number(req.validatedBody?.priceAIBA ?? 0));
        if (!carId || !Number.isFinite(priceAIBA) || priceAIBA < 0) return res.status(400).json({ error: 'carId and priceAIBA required' });
        const car = await RacingCar.findById(carId);
        if (!car) return res.status(404).json({ error: 'car not found' });
        if (String(car.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your car' });
        const existing = await CarListing.findOne({ carId, status: 'active' });
        if (existing) return res.status(409).json({ error: 'car already listed' });
        await CarListing.create({ carId, sellerTelegramId: telegramId, priceAIBA, status: 'active' });
        res.status(201).json({ ok: true });
    } catch (err) {
        console.error('Car list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

router.post(
    '/buy-car',
    requireTelegram,
    validateBody({
        requestId: { type: 'string', trim: true, minLength: 1, maxLength: 128 },
        listingId: { type: 'objectId', required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });
        const listingId = String(req.validatedBody?.listingId ?? '').trim();
        if (!listingId) return res.status(400).json({ error: 'listingId required' });
        const listing = await CarListing.findOne({ _id: listingId, status: 'active' }).populate('carId');
        if (!listing || !listing.carId) return res.status(404).json({ error: 'listing not found' });
        if (String(listing.sellerTelegramId) === telegramId) return res.status(400).json({ error: 'cannot buy your own listing' });
        const cfg = await getConfig();
        const feeBps = Math.max(0, Math.min(10000, Number(cfg.marketplaceFeeBps ?? 300)));
        const fee = Math.floor((listing.priceAIBA * feeBps) / 10000);
        const sellerReceives = Math.max(0, listing.priceAIBA - fee);
        const debit = await debitAibaFromUser(listing.priceAIBA, {
            telegramId,
            reason: 'car_marketplace_buy',
            arena: 'car_racing',
            league: 'global',
            sourceType: 'car_listing',
            sourceId: requestId,
            requestId,
            meta: { listingId, carId: String(listing.carId._id), sellerTelegramId: listing.sellerTelegramId },
        });
        if (!debit.ok) return res.status(403).json({ error: debit.reason === 'insufficient' ? 'insufficient AIBA' : 'debit failed' });
        if (sellerReceives > 0) {
            await creditAibaNoCap(sellerReceives, {
                telegramId: listing.sellerTelegramId,
                reason: 'car_marketplace_sell',
                arena: 'car_racing',
                league: 'global',
                sourceType: 'car_listing',
                sourceId: requestId,
                requestId,
                meta: { listingId, carId: String(listing.carId._id), buyerTelegramId: telegramId, fee },
            });
        }
        listing.carId.ownerTelegramId = telegramId;
        await listing.carId.save();
        listing.status = 'sold';
        await listing.save();
        res.json({ ok: true, car: listing.carId.toObject() });
    } catch (err) {
        console.error('Car buy error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
