const CarTrack = require('../models/CarTrack');
const BikeTrack = require('../models/BikeTrack');
const CarRace = require('../models/CarRace');
const BikeRace = require('../models/BikeRace');

const DEFAULT_CAR_TRACKS = [
    { trackId: 'circuit-rookie', name: 'Rookie Circuit', length: 1, difficulty: 30, league: 'rookie' },
    { trackId: 'circuit-pro', name: 'Pro Circuit', length: 1.5, difficulty: 50, league: 'pro' },
    { trackId: 'circuit-elite', name: 'Elite Circuit', length: 2, difficulty: 70, league: 'elite' },
];

const DEFAULT_BIKE_TRACKS = [
    { trackId: 'moto-rookie', name: 'Rookie Moto', length: 1, difficulty: 35, league: 'rookie' },
    { trackId: 'moto-pro', name: 'Pro Moto', length: 1.2, difficulty: 55, league: 'pro' },
    { trackId: 'moto-elite', name: 'Elite Moto', length: 1.8, difficulty: 75, league: 'elite' },
];

async function seedRacingTracks() {
    const carCount = await CarTrack.countDocuments();
    if (carCount === 0) {
        await CarTrack.insertMany(DEFAULT_CAR_TRACKS);
        console.log('Seed: created default car tracks');
    }
    const bikeCount = await BikeTrack.countDocuments();
    if (bikeCount === 0) {
        await BikeTrack.insertMany(DEFAULT_BIKE_TRACKS);
        console.log('Seed: created default bike tracks');
    }
    const openCarRaces = await CarRace.countDocuments({ status: 'open' });
    if (openCarRaces === 0 && carCount > 0) {
        const tracks = await CarTrack.find({}).lean();
        for (const t of tracks) {
            await CarRace.create({
                trackId: t.trackId,
                league: t.league,
                status: 'open',
                entryFeeAiba: 10,
                rewardPool: 0,
                maxEntries: 16,
            });
        }
        console.log('Seed: created default open car races');
    }
    const openBikeRaces = await BikeRace.countDocuments({ status: 'open' });
    if (openBikeRaces === 0 && bikeCount > 0) {
        const tracks = await BikeTrack.find({}).lean();
        for (const t of tracks) {
            await BikeRace.create({
                trackId: t.trackId,
                league: t.league,
                status: 'open',
                entryFeeAiba: 10,
                rewardPool: 0,
                maxEntries: 16,
            });
        }
        console.log('Seed: created default open bike races');
    }
}

module.exports = { seedRacingTracks };
