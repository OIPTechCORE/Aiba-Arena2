const router = require('express').Router();
const crypto = require('crypto');
const { requireTelegram } = require('../middleware/requireTelegram');
const RacingMotorcycle = require('../models/RacingMotorcycle');
const BikeTrack = require('../models/BikeTrack');
const BikeRace = require('../models/BikeRace');
const BikeRaceEntry = require('../models/BikeRaceEntry');
const BikeListing = require('../models/BikeListing');
const UsedTonTxHash = require('../models/UsedTonTxHash');
const { getConfig, debitAibaFromUser, creditAibaNoCap } = require('../engine/economy');
const { getIdempotencyKey } = require('../engine/idempotencyKey');
const { verifyTonPayment } = require('../util/tonVerify');
const { simulateRace } = require('../engine/raceEngine');

const LEAGUES = ['rookie', 'pro', 'elite'];

function getBikeRacingConfig(cfg) {
    return {
        createBikeCostTonNano: Math.max(0, Number(cfg.createBikeCostTonNano ?? 1e9)),
        createBikeCostAiba: Math.max(0, Math.floor(Number(cfg.createBikeCostAiba ?? 100))),
        entryFeeAiba: Math.max(0, Math.floor(Number(cfg.bikeEntryFeeAiba ?? 10))),
        feeBps: Math.max(0, Math.min(10000, Number(cfg.bikeRacingFeeBps ?? 300))),
    };
}

router.get('/tracks', async (req, res) => {
    try {
        const league = req.query.league && LEAGUES.includes(req.query.league) ? req.query.league : null;
        const q = { active: true };
        if (league) q.league = league;
        const tracks = await BikeTrack.find(q).lean();
        res.json(tracks);
    } catch (err) {
        console.error('Bike racing tracks error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.get('/races', async (req, res) => {
    try {
        const status = 'open';
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const races = await BikeRace.find({ status }).sort({ createdAt: -1 }).limit(limit).lean();
        const withCount = await Promise.all(
            races.map(async (r) => {
                const count = await BikeRaceEntry.countDocuments({ raceId: r._id });
                return { ...r, entryCount: count };
            })
        );
        res.json(withCount);
    } catch (err) {
        console.error('Bike racing races error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.get('/bikes', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const bikes = await RacingMotorcycle.find({ ownerTelegramId: telegramId }).sort({ createdAt: -1 }).lean();
        res.json(bikes);
    } catch (err) {
        console.error('Bike racing bikes error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.post('/create', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });
        const cfg = await getConfig();
        const { createBikeCostAiba } = getBikeRacingConfig(cfg);
        if (createBikeCostAiba <= 0) return res.status(400).json({ error: 'create with AIBA not configured' });
        const debit = await debitAibaFromUser(createBikeCostAiba, {
            telegramId,
            reason: 'bike_racing_create',
            arena: 'bike_racing',
            league: 'global',
            sourceType: 'bike_racing',
            sourceId: requestId,
            requestId,
            meta: {},
        });
        if (!debit.ok) return res.status(403).json({ error: debit.reason === 'insufficient' ? 'insufficient AIBA' : 'debit failed' });
        const bike = await RacingMotorcycle.create({
            ownerTelegramId: telegramId,
            topSpeed: 50,
            acceleration: 50,
            handling: 50,
            durability: 50,
        });
        res.status(201).json({ ok: true, bike, aibaBalance: debit.user?.aibaBalance ?? 0 });
    } catch (err) {
        console.error('Bike racing create error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.post('/create-with-ton', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const txHash = String(req.body?.txHash ?? '').trim();
        if (!txHash) return res.status(400).json({ error: 'txHash required' });
        const wallet = (process.env.MOTORCYCLE_RACING_WALLET || '').trim();
        if (!wallet) return res.status(503).json({ error: 'MOTORCYCLE_RACING_WALLET not configured' });
        const cfg = await getConfig();
        const costNano = getBikeRacingConfig(cfg).createBikeCostTonNano;
        if (costNano <= 0) return res.status(400).json({ error: 'create with TON not configured' });
        const existing = await UsedTonTxHash.findOne({ txHash, purpose: 'create_bike' }).lean();
        if (existing) return res.status(409).json({ error: 'txHash already used' });
        const verified = await verifyTonPayment(txHash, wallet, costNano);
        if (!verified) return res.status(400).json({ error: 'invalid or insufficient TON payment' });
        await UsedTonTxHash.create({ txHash, purpose: 'create_bike', ownerTelegramId: telegramId });
        const bike = await RacingMotorcycle.create({
            ownerTelegramId: telegramId,
            topSpeed: 50,
            acceleration: 50,
            handling: 50,
            durability: 50,
            createdWithTonTxHash: txHash,
        });
        res.status(201).json({ ok: true, bike });
    } catch (err) {
        console.error('Bike racing create-with-ton error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

async function runBikeRaceIfFull(raceId) {
    const race = await BikeRace.findById(raceId);
    if (!race || race.status !== 'open') return;
    const count = await BikeRaceEntry.countDocuments({ raceId });
    if (count < race.maxEntries || count < 2) return;
    const track = await BikeTrack.findOne({ trackId: race.trackId }).lean();
    const entries = await BikeRaceEntry.find({ raceId }).populate('bikeId').lean();
    const valid = entries.filter((e) => e.bikeId);
    if (valid.length < 2) return;
    const seed = race.seed || crypto.randomBytes(16).toString('hex');
    if (!race.seed) {
        race.seed = seed;
        await race.save();
    }
    const vehicles = valid.map((e) => ({
        entryId: String(e._id),
        topSpeed: e.bikeId.topSpeed,
        acceleration: e.bikeId.acceleration,
        handling: e.bikeId.handling,
        durability: e.bikeId.durability,
        level: e.bikeId.level,
    }));
    const results = simulateRace({
        vehicles,
        trackLength: track?.length ?? 1,
        trackDifficulty: track?.difficulty ?? 50,
        seed,
    });
    const feeBps = Math.max(0, Math.min(10000, Number((await getConfig()).bikeRacingFeeBps ?? 300)));
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
        await BikeRaceEntry.updateOne(
            { _id: r.entryId },
            { $set: { position: r.position, finishTime: r.finishTime, points: r.points, aibaReward } }
        );
        if (entry && aibaReward > 0) {
            await creditAibaNoCap(aibaReward, {
                telegramId: entry.telegramId,
                reason: 'bike_racing_reward',
                arena: 'bike_racing',
                league: race.league,
                sourceType: 'bike_racing',
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

router.post('/enter', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });
        const raceId = String(req.body?.raceId ?? '').trim();
        const bikeId = String(req.body?.bikeId ?? '').trim();
        if (!raceId || !bikeId) return res.status(400).json({ error: 'raceId and bikeId required' });
        const race = await BikeRace.findById(raceId);
        if (!race) return res.status(404).json({ error: 'race not found' });
        if (race.status !== 'open') return res.status(400).json({ error: 'race not open' });
        const bike = await RacingMotorcycle.findById(bikeId);
        if (!bike) return res.status(404).json({ error: 'bike not found' });
        if (String(bike.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your bike' });
        const existing = await BikeRaceEntry.findOne({ raceId, telegramId }).lean();
        if (existing) return res.status(409).json({ error: 'already entered this race' });
        const entryCount = await BikeRaceEntry.countDocuments({ raceId });
        if (entryCount >= race.maxEntries) return res.status(400).json({ error: 'race full' });
        const cfg = await getConfig();
        const fee = Math.max(0, Math.floor(Number(cfg.bikeEntryFeeAiba ?? 10)));
        if (fee > 0) {
            const debit = await debitAibaFromUser(fee, {
                telegramId,
                reason: 'bike_racing_entry',
                arena: 'bike_racing',
                league: race.league,
                sourceType: 'bike_racing',
                sourceId: requestId,
                requestId,
                meta: { raceId, bikeId },
            });
            if (!debit.ok) return res.status(403).json({ error: debit.reason === 'insufficient' ? 'insufficient AIBA' : 'debit failed' });
        }
        const newPool = (race.rewardPool || 0) + fee;
        await BikeRace.updateOne({ _id: raceId }, { $set: { rewardPool: newPool } });
        await BikeRaceEntry.create({ raceId, bikeId, telegramId });
        const updatedRace = await BikeRace.findById(raceId).lean();
        const newCount = entryCount + 1;
        if (newCount >= updatedRace.maxEntries) {
            await runBikeRaceIfFull(raceId);
        }
        res.status(201).json({ ok: true, race: await BikeRace.findById(raceId).lean() });
    } catch (err) {
        console.error('Bike racing enter error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.get('/race/:id', async (req, res) => {
    try {
        const race = await BikeRace.findById(req.params.id).lean();
        if (!race) return res.status(404).json({ error: 'race not found' });
        const entries = await BikeRaceEntry.find({ raceId: race._id }).populate('bikeId').sort({ position: 1 }).lean();
        res.json({ race, entries });
    } catch (err) {
        console.error('Bike racing race get error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.get('/leaderboard', async (req, res) => {
    try {
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const agg = await BikeRaceEntry.aggregate([
            { $match: { position: { $gte: 1 } } },
            { $group: { _id: '$telegramId', totalPoints: { $sum: '$points' }, wins: { $sum: { $cond: [{ $eq: ['$position', 1] }, 1, 0] } }, aibaEarned: { $sum: '$aibaReward' } } },
            { $sort: { totalPoints: -1 } },
            { $limit: limit },
        ]);
        res.json(agg.map((r, i) => ({ rank: i + 1, telegramId: r._id, totalPoints: r.totalPoints, wins: r.wins, aibaEarned: r.aibaEarned })));
    } catch (err) {
        console.error('Bike racing leaderboard error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.get('/config', async (req, res) => {
    try {
        const cfg = await getConfig();
        const c = getBikeRacingConfig(cfg);
        res.json({
            ...c,
            walletForTon: (process.env.MOTORCYCLE_RACING_WALLET || '').trim() || null,
        });
    } catch (err) {
        console.error('Bike racing config error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.get('/listings', requireTelegram, async (req, res) => {
    try {
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const list = await BikeListing.find({ status: 'active' }).sort({ createdAt: -1 }).limit(limit).populate('bikeId').lean();
        res.json(list.filter((l) => l.bikeId).map((l) => ({ _id: l._id, bikeId: l.bikeId._id, bike: l.bikeId, sellerTelegramId: l.sellerTelegramId, priceAIBA: l.priceAIBA })));
    } catch (err) {
        console.error('Bike listings error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.post('/list', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const bikeId = String(req.body?.bikeId ?? '').trim();
        const priceAIBA = Math.floor(Number(req.body?.priceAIBA ?? 0));
        if (!bikeId || !Number.isFinite(priceAIBA) || priceAIBA < 0) return res.status(400).json({ error: 'bikeId and priceAIBA required' });
        const bike = await RacingMotorcycle.findById(bikeId);
        if (!bike) return res.status(404).json({ error: 'bike not found' });
        if (String(bike.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your bike' });
        const existing = await BikeListing.findOne({ bikeId, status: 'active' });
        if (existing) return res.status(409).json({ error: 'bike already listed' });
        await BikeListing.create({ bikeId, sellerTelegramId: telegramId, priceAIBA, status: 'active' });
        res.status(201).json({ ok: true });
    } catch (err) {
        console.error('Bike list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

router.post('/buy-bike', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });
        const listingId = String(req.body?.listingId ?? '').trim();
        if (!listingId) return res.status(400).json({ error: 'listingId required' });
        const listing = await BikeListing.findOne({ _id: listingId, status: 'active' }).populate('bikeId');
        if (!listing || !listing.bikeId) return res.status(404).json({ error: 'listing not found' });
        if (String(listing.sellerTelegramId) === telegramId) return res.status(400).json({ error: 'cannot buy your own listing' });
        const cfg = await getConfig();
        const feeBps = Math.max(0, Math.min(10000, Number(cfg.marketplaceFeeBps ?? 300)));
        const fee = Math.floor((listing.priceAIBA * feeBps) / 10000);
        const sellerReceives = Math.max(0, listing.priceAIBA - fee);
        const debit = await debitAibaFromUser(listing.priceAIBA, {
            telegramId,
            reason: 'bike_marketplace_buy',
            arena: 'bike_racing',
            league: 'global',
            sourceType: 'bike_listing',
            sourceId: requestId,
            requestId,
            meta: { listingId, bikeId: String(listing.bikeId._id), sellerTelegramId: listing.sellerTelegramId },
        });
        if (!debit.ok) return res.status(403).json({ error: debit.reason === 'insufficient' ? 'insufficient AIBA' : 'debit failed' });
        if (sellerReceives > 0) {
            await creditAibaNoCap(sellerReceives, {
                telegramId: listing.sellerTelegramId,
                reason: 'bike_marketplace_sell',
                arena: 'bike_racing',
                league: 'global',
                sourceType: 'bike_listing',
                sourceId: requestId,
                requestId,
                meta: { listingId, bikeId: String(listing.bikeId._id), buyerTelegramId: telegramId, fee },
            });
        }
        listing.bikeId.ownerTelegramId = telegramId;
        await listing.bikeId.save();
        listing.status = 'sold';
        await listing.save();
        res.json({ ok: true, bike: listing.bikeId.toObject() });
    } catch (err) {
        console.error('Bike buy error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
