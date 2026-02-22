const router = require('express').Router();
const Task = require('../models/Task');
const User = require('../models/User');
const Broker = require('../models/Broker');
const Battle = require('../models/Battle');
const Listing = require('../models/Listing');
const RacingCar = require('../models/RacingCar');
const RacingMotorcycle = require('../models/RacingMotorcycle');
const CarListing = require('../models/CarListing');
const BikeListing = require('../models/BikeListing');
const Guild = require('../models/Guild');
const Referral = require('../models/Referral');
const UniversityProgress = require('../models/UniversityProgress');
const { requireTelegram } = require('../middleware/requireTelegram');

function isSameUtcDay(a, b = new Date()) {
    if (!a) return false;
    const x = new Date(a);
    return (
        x.getUTCFullYear() === b.getUTCFullYear() &&
        x.getUTCMonth() === b.getUTCMonth() &&
        x.getUTCDate() === b.getUTCDate()
    );
}

function normalizeKinds(raw) {
    if (!Array.isArray(raw) || !raw.length) return ['all'];
    const out = raw.map((v) => String(v || '').trim()).filter(Boolean);
    return out.length ? out : ['all'];
}

function taskVisibleForKinds(taskKinds, userKinds) {
    const tKinds = normalizeKinds(taskKinds);
    if (tKinds.includes('all')) return true;
    return tKinds.some((k) => userKinds.includes(k));
}

function deriveUserKinds(profile) {
    const kinds = new Set(['all']);

    if (profile.brokers <= 1 || profile.battles === 0) kinds.add('newcomer');
    if (profile.battles >= 3) kinds.add('fighter');
    if (profile.listings + profile.carListings + profile.bikeListings > 0 || profile.aibaBalance >= 100)
        kinds.add('trader');
    if (profile.cars + profile.bikes > 0) kinds.add('racer');
    if (profile.inGuild || profile.hasReferral) kinds.add('social');
    if (profile.universityCompleted > 0) kinds.add('scholar');
    if (profile.walletConnected || profile.aibaBalance >= 250 || profile.starsBalance >= 1) kinds.add('investor');

    return Array.from(kinds);
}

function makeSystemTasks(profile, userKinds) {
    const tasks = [
        {
            id: 'starter-broker',
            title: 'Create your first broker',
            description: 'Start on Home with "New broker" to unlock battles and rewards.',
            category: 'onboarding',
            userKinds: ['newcomer'],
            completed: profile.brokers > 0,
            ctaTab: 'home',
            ctaLabel: 'Go Home',
            rewardAiba: 0,
            rewardNeur: 0,
            sortOrder: 10,
        },
        {
            id: 'first-battle',
            title: 'Run your first battle',
            description: 'Choose arena and run battle to earn AIBA, NEUR, and Stars.',
            category: 'onboarding',
            userKinds: ['newcomer', 'fighter'],
            completed: profile.battles > 0,
            ctaTab: 'home',
            ctaLabel: 'Run battle',
            rewardAiba: 0,
            rewardNeur: 0,
            sortOrder: 20,
        },
        {
            id: 'daily-claim',
            title: 'Claim daily reward',
            description: 'Open Wallet and claim your daily NEUR reward.',
            category: 'core',
            userKinds: ['all'],
            completed: isSameUtcDay(profile.lastDailyClaimAt),
            ctaTab: 'wallet',
            ctaLabel: 'Open Wallet',
            rewardAiba: 0,
            rewardNeur: 0,
            sortOrder: 30,
        },
        {
            id: 'create-referral',
            title: 'Create and share referral code',
            description: 'Use the Referrals card in Market to share your link on socials.',
            category: 'social',
            userKinds: ['newcomer', 'social'],
            completed: profile.hasReferral,
            ctaTab: 'market',
            ctaLabel: 'Open Market',
            rewardAiba: 0,
            rewardNeur: 0,
            sortOrder: 40,
        },
        {
            id: 'connect-wallet',
            title: 'Connect TON wallet',
            description: 'Connect wallet to claim AIBA on-chain and access premium actions.',
            category: 'economy',
            userKinds: ['all'],
            completed: profile.walletConnected,
            ctaTab: 'wallet',
            ctaLabel: 'Connect wallet',
            rewardAiba: 0,
            rewardNeur: 0,
            sortOrder: 50,
        },
        {
            id: 'market-listing',
            title: 'Create a market listing',
            description: 'List a broker (or car/bike) for AIBA to start trading.',
            category: 'advanced',
            userKinds: ['trader', 'fighter'],
            completed: profile.listings + profile.carListings + profile.bikeListings > 0,
            ctaTab: 'market',
            ctaLabel: 'Open Market',
            rewardAiba: 0,
            rewardNeur: 0,
            sortOrder: 60,
        },
        {
            id: 'car-racing-entry',
            title: 'Join car racing',
            description: 'Buy or create a car, then enter races to earn AIBA by position.',
            category: 'racing',
            userKinds: ['racer', 'fighter'],
            completed: profile.cars > 0,
            ctaTab: 'carRacing',
            ctaLabel: 'Open Car Racing',
            rewardAiba: 0,
            rewardNeur: 0,
            sortOrder: 70,
        },
        {
            id: 'bike-racing-entry',
            title: 'Join bike racing',
            description: 'Buy or create a bike, then enter races and compete for rewards.',
            category: 'racing',
            userKinds: ['racer', 'fighter'],
            completed: profile.bikes > 0,
            ctaTab: 'bikeRacing',
            ctaLabel: 'Open Bike Racing',
            rewardAiba: 0,
            rewardNeur: 0,
            sortOrder: 80,
        },
        {
            id: 'guild-social',
            title: 'Create or join a guild',
            description: 'Team up, deposit brokers into guild pool, and run Guild Wars.',
            category: 'social',
            userKinds: ['social', 'fighter'],
            completed: profile.inGuild,
            ctaTab: 'guilds',
            ctaLabel: 'Open Guilds',
            rewardAiba: 0,
            rewardNeur: 0,
            sortOrder: 90,
        },
        {
            id: 'university-learn',
            title: 'Complete 1 University module',
            description: 'Use the User Guide (University) to complete at least one module.',
            category: 'learning',
            userKinds: ['newcomer', 'scholar'],
            completed: profile.universityCompleted > 0,
            ctaTab: 'university',
            ctaLabel: 'Open University',
            rewardAiba: 0,
            rewardNeur: 0,
            sortOrder: 100,
        },
        {
            id: 'university-pro',
            title: 'Complete 5 University modules',
            description: 'Build deep game mastery and unlock advanced strategies.',
            category: 'learning',
            userKinds: ['scholar', 'fighter', 'trader', 'racer'],
            completed: profile.universityCompleted >= 5,
            ctaTab: 'university',
            ctaLabel: 'Keep learning',
            rewardAiba: 0,
            rewardNeur: 0,
            sortOrder: 110,
        },
        {
            id: 'economy-growth',
            title: 'Reach 100 AIBA balance',
            description: 'Battle, race, trade, and referrals all contribute to your AIBA growth.',
            category: 'economy',
            userKinds: ['investor', 'trader', 'fighter'],
            completed: profile.aibaBalance >= 100,
            ctaTab: 'home',
            ctaLabel: 'Grow balance',
            rewardAiba: 0,
            rewardNeur: 0,
            sortOrder: 120,
        },
    ];

    return tasks.filter((t) => taskVisibleForKinds(t.userKinds, userKinds)).map((t) => ({ ...t, source: 'system' }));
}

function mapAdminTask(task) {
    return {
        id: `admin-${String(task._id)}`,
        source: 'admin',
        title: task.title,
        description: task.description || '',
        category: task.category || 'core',
        userKinds: normalizeKinds(task.userKinds),
        completed: false,
        ctaLabel: task.ctaLabel || 'Open',
        ctaTab: task.ctaTab || '',
        rewardAiba: Math.max(0, Number(task.rewardAiba || 0)),
        rewardNeur: Math.max(0, Number(task.rewardNeur || 0)),
        sortOrder: Number.isFinite(Number(task.sortOrder)) ? Number(task.sortOrder) : 100,
    };
}

// Personalized tasks feed for the miniapp (requires Telegram auth).
router.get('/', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const user =
            (req.user && typeof req.user === 'object' ? req.user : null) || (await User.findOne({ telegramId }).lean());

        const [
            brokers,
            battles,
            listings,
            cars,
            bikes,
            carListings,
            bikeListings,
            inGuild,
            referral,
            uniProgress,
            adminTasks,
        ] = await Promise.all([
            Broker.countDocuments({ ownerTelegramId: telegramId }),
            Battle.countDocuments({ ownerTelegramId: telegramId }),
            Listing.countDocuments({ sellerTelegramId: telegramId }),
            RacingCar.countDocuments({ ownerTelegramId: telegramId }),
            RacingMotorcycle.countDocuments({ ownerTelegramId: telegramId }),
            CarListing.countDocuments({ sellerTelegramId: telegramId }),
            BikeListing.countDocuments({ sellerTelegramId: telegramId }),
            Guild.exists({ active: true, 'members.telegramId': telegramId }),
            Referral.exists({ ownerTelegramId: telegramId, active: true }),
            UniversityProgress.findOne({ telegramId }).lean(),
            Task.find({ enabled: true }).sort({ sortOrder: 1, createdAt: -1 }).lean(),
        ]);

        const profile = {
            telegramId,
            walletConnected: Boolean(String(user?.wallet || '').trim()),
            brokers: Number(brokers || 0),
            battles: Number(battles || 0),
            listings: Number(listings || 0),
            cars: Number(cars || 0),
            bikes: Number(bikes || 0),
            carListings: Number(carListings || 0),
            bikeListings: Number(bikeListings || 0),
            inGuild: Boolean(inGuild),
            hasReferral: Boolean(referral),
            universityCompleted: Array.isArray(uniProgress?.completedKeys) ? uniProgress.completedKeys.length : 0,
            aibaBalance: Number(user?.aibaBalance || 0),
            neurBalance: Number(user?.neurBalance || 0),
            starsBalance: Number(user?.starsBalance || 0),
            lastDailyClaimAt: user?.lastDailyClaimAt || null,
        };

        const userKinds = deriveUserKinds(profile);
        const systemTasks = makeSystemTasks(profile, userKinds);
        const filteredAdminTasks = adminTasks
            .map(mapAdminTask)
            .filter((t) => taskVisibleForKinds(t.userKinds, userKinds));

        const tasks = [...systemTasks, ...filteredAdminTasks].sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1; // incomplete first
            if ((a.sortOrder || 0) !== (b.sortOrder || 0)) return (a.sortOrder || 0) - (b.sortOrder || 0);
            return String(a.title || '').localeCompare(String(b.title || ''));
        });

        res.json({
            profile: {
                userKinds,
                walletConnected: profile.walletConnected,
                brokers: profile.brokers,
                battles: profile.battles,
                cars: profile.cars,
                bikes: profile.bikes,
                inGuild: profile.inGuild,
                hasReferral: profile.hasReferral,
                universityCompleted: profile.universityCompleted,
                aibaBalance: profile.aibaBalance,
                neurBalance: profile.neurBalance,
                starsBalance: profile.starsBalance,
                dailyClaimedToday: isSameUtcDay(profile.lastDailyClaimAt),
            },
            tasks,
        });
    } catch (err) {
        console.error('Error fetching public tasks:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
