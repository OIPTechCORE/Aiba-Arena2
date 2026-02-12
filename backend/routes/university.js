const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const UniversityProgress = require('../models/UniversityProgress');
const CourseBadgeMint = require('../models/CourseBadgeMint');
const FullCertificateMint = require('../models/FullCertificateMint');
const User = require('../models/User');
const { validateBody } = require('../middleware/validate');
const { getConfig } = require('../engine/economy');

/**
 * Static course data for AIBA ARENA UNIVERSITY.
 * GET /api/university/courses — returns list of courses with modules (no auth required for learning).
 */
const COURSES = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        shortDescription: 'What is AIBA Arena, brokers, and your first battle.',
        order: 1,
        modules: [
            { id: 'what-is', title: 'What is AIBA Arena?', body: 'AIBA Arena is a Telegram Mini App where you own AI brokers (trading agents with stats), enter arenas and leagues, run battles, and earn NEUR and AIBA. Play with brokers in arenas → get score → earn rewards → optionally withdraw AIBA to your TON wallet.' },
            { id: 'brokers', title: 'Brokers', body: 'A broker is your in-game agent. Each has Intelligence, Speed, and Risk (0–100), plus level, energy, and cooldowns. You can have multiple brokers. Create a starter broker from the Brokers tab, then pick one for each battle.' },
            { id: 'first-battle', title: 'Your first battle', body: 'On Home: select a broker and an arena (e.g. prediction). Hit Run battle. The server runs a deterministic simulation and returns a score. You earn NEUR and AIBA credits based on score (within daily caps and emission windows).' },
            { id: 'wallet-claim', title: 'Connect wallet & claim', body: 'Connect your TON wallet (TonConnect). AIBA credits can be withdrawn on-chain: after a battle, use Create claim or enable Auto-claim, then send the signed transaction to the ArenaRewardVault to receive AIBA jettons.' },
        ],
    },
    {
        id: 'arenas-modes',
        title: 'Arenas & Modes',
        shortDescription: 'Prediction, Simulation, Strategy Wars, leagues, Guild Wars.',
        order: 2,
        modules: [
            { id: 'arenas', title: 'Arenas', body: 'Prediction (intelligence-weighted), Simulation (balanced), Strategy Wars (risk matters more), Guild Wars (requires a guild; rewards split with guild treasury). Each arena has different stat weights and meta.' },
            { id: 'leagues', title: 'Leagues', body: 'Rookie, Pro, Elite. Higher league usually means higher score multiplier and may require a minimum broker level. Energy and cooldown costs can vary by mode.' },
            { id: 'guild-wars', title: 'Guild Wars', body: 'Requires guild membership. You can deposit a broker into the guild pool. Rewards are split (e.g. 80% to you, 20% to guild treasury). Join or create a group from the Guilds tab.' },
        ],
    },
    {
        id: 'economy',
        title: 'Economy',
        shortDescription: 'NEUR, AIBA, Stars, Diamonds, staking.',
        order: 3,
        modules: [
            { id: 'neur', title: 'NEUR', body: 'Off-chain currency. Earned from battles and referrals. Spent on entry fees, upgrades, training, repairs. Stored in the backend; no on-chain withdrawal.' },
            { id: 'aiba', title: 'AIBA credits & on-chain claim', body: 'AIBA balance = off-chain credits. Earned from battles. Withdraw: create a signed claim (after battle or from Wallet), then send one TonConnect tx to the ArenaRewardVault to receive AIBA jettons on TON.' },
            { id: 'stars-diamonds', title: 'Stars & Diamonds', body: 'Stars: Telegram Stars–style in-app currency. Earn from every battle win. Diamonds: rare TON ecosystem asset; earned on your first battle win. Both shown in Wallet and balance strip.' },
            { id: 'staking', title: 'Staking', body: 'Lock AIBA in the Yield Vault, earn APY. Unstake or claim rewards anytime from the Wallet tab. Configurable APY in economy config.' },
        ],
    },
    {
        id: 'guilds-social',
        title: 'Guilds & Social',
        shortDescription: 'Create or join a guild, Guild Wars, groups leaderboard.',
        order: 4,
        modules: [
            { id: 'guilds', title: 'Create or join a guild', body: 'Guilds are groups. Create one (name, bio) or join by Guild ID. Top leaders by score can create a group for free; others may pay TON. Deposit brokers into the guild pool for guild wars.' },
            { id: 'guild-rewards', title: 'Guild Wars rewards', body: 'When you run a battle in Guild Wars, a share of NEUR goes to the guild treasury. The guild vault grows from member activity.' },
            { id: 'groups-leaderboard', title: 'Groups leaderboard', body: 'All groups are visible. Your leaderboard rank (by total score) determines whether you can create a group for free. Check the Guilds tab for your rank and discover groups.' },
        ],
    },
    {
        id: 'pro-tips',
        title: 'Pro Tips',
        shortDescription: 'Best practices, energy, staking, mint, Wall of Fame.',
        order: 5,
        modules: [
            { id: 'best-practices', title: 'Best practices', body: 'Keep brokers energized; pick the right arena for your broker stats (e.g. high INT for Prediction). Use referrals to earn bonus NEUR. Connect wallet early so you can claim AIBA on-chain when ready.' },
            { id: 'energy-cooldowns', title: 'Energy & cooldowns', body: 'Each battle consumes energy; it regenerates over time (e.g. 1 per minute, cap 100). Cooldowns prevent spamming the same arena. Plan battles around energy and cooldown.' },
            { id: 'stake-mint', title: 'When to stake, mint NFT', body: 'Stake AIBA to earn APY with no lock period. Mint a broker as NFT (costs AIBA) to get an on-chain collectible; useful for ownership proof or future marketplace.' },
            { id: 'wall-of-fame', title: 'Wall of Fame', body: 'Leaderboards rank players by score, AIBA, NEUR, or battles. Badges (e.g. verified, top leader) appear on profiles and leaderboards. Climb the ranks and earn recognition.' },
        ],
    },
    {
        id: 'referrals-racing-market',
        title: 'Referrals, Racing & Market',
        shortDescription: 'Referral codes, car/bike racing, broker market, guild withdrawal.',
        order: 6,
        modules: [
            { id: 'referrals', title: 'Referrals', body: 'Go to the Referrals tab: create your code (My code), share it. When someone applies your code at signup or in-app, you both get bonuses (NEUR or AIBA if configured). Top referrers appear on the leaderboard.' },
            { id: 'car-bike-racing', title: 'Car & Bike Racing', body: 'Create or buy a car or bike with AIBA or TON. Enter open races from the Car Racing or Bike Racing tabs. Earn AIBA by finish position. The system shop sells cars/bikes for AIBA.' },
            { id: 'market', title: 'Market', body: 'Sell a broker for AIBA or buy one from players or from the system. Withdraw your broker from the guild pool first if it is deposited there—only brokers not in a guild pool can be listed.' },
            { id: 'guild-withdrawal', title: 'Guild deposit & withdrawal', body: 'Deposit brokers into the guild pool for Guild Wars. To sell a deposited broker on the Market, withdraw it from the guild first from the Guilds tab.' },
        ],
    },
];

function getTotalModuleCount() {
    return COURSES.reduce((n, c) => n + (c.modules?.length || 0), 0);
}
function getAllModuleKeys() {
    return COURSES.flatMap((c) => (c.modules || []).map((m) => `${c.id}-${m.id}`));
}
function getCompletedCourseIds(completedKeys) {
    const set = new Set(completedKeys || []);
    return COURSES.filter((c) => (c.modules || []).every((m) => set.has(`${c.id}-${m.id}`))).map((c) => c.id);
}

router.get('/courses', (_req, res) => {
    try {
        const totalModules = getTotalModuleCount();
        const list = COURSES.map((c) => ({
            id: c.id,
            title: c.title,
            shortDescription: c.shortDescription,
            order: c.order,
            modules: c.modules.map((m) => ({ id: m.id, title: m.title, body: m.body })),
        }));
        res.json({ courses: list, totalModules });
    } catch (err) {
        console.error('University courses error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

/** GET /api/university/progress — current user's progress (requires Telegram auth). */
router.get('/progress', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const totalModules = getTotalModuleCount();
        const doc = await UniversityProgress.findOne({ telegramId }).lean();
        const completedKeys = doc ? (doc.completedKeys || []) : [];
        const completedCount = completedKeys.length;
        const graduate = completedCount >= totalModules && totalModules > 0;
        const completedCourseIds = getCompletedCourseIds(completedKeys);
        const canMintCourseBadge = completedCourseIds.length >= 1;
        res.json({
            completedKeys,
            completedCount,
            totalModules,
            graduate: !!graduate,
            graduatedAt: doc?.graduatedAt || null,
            completedCourseIds,
            canMintCourseBadge: !!canMintCourseBadge,
        });
    } catch (err) {
        console.error('University progress error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

/** POST /api/university/progress — mark a module complete (courseId, moduleId). Awards university_graduate badge when all modules done. */
router.post(
    '/progress',
    requireTelegram,
    validateBody({
        courseId: { type: 'string', trim: true, minLength: 1, maxLength: 100, required: true },
        moduleId: { type: 'string', trim: true, minLength: 1, maxLength: 100, required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const courseId = String(req.validatedBody?.courseId || '').trim();
        const moduleId = String(req.validatedBody?.moduleId || '').trim();
        if (!courseId || !moduleId) return res.status(400).json({ error: 'courseId and moduleId required' });
        const key = `${courseId}-${moduleId}`;
        const allKeys = getAllModuleKeys();
        if (!allKeys.includes(key)) return res.status(400).json({ error: 'invalid course or module' });

        const totalModules = getTotalModuleCount();
        let doc = await UniversityProgress.findOne({ telegramId });
        if (!doc) doc = await UniversityProgress.create({ telegramId, completedKeys: [] });
        const completedKeys = doc.completedKeys || [];
        if (completedKeys.includes(key)) {
            const summary = { completedCount: completedKeys.length, totalModules, graduate: completedKeys.length >= totalModules };
            return res.json({ ok: true, alreadyCompleted: true, ...summary });
        }
        doc.completedKeys = [...completedKeys, key];
        const nowComplete = doc.completedKeys.length >= totalModules;
        if (nowComplete) doc.graduatedAt = doc.graduatedAt || new Date();
        await doc.save();

        if (nowComplete) {
            await User.updateOne(
                { telegramId },
                { $addToSet: { badges: 'university_graduate' } },
            ).catch(() => {});
        }

        res.json({
            ok: true,
            completedCount: doc.completedKeys.length,
            totalModules,
            graduate: !!nowComplete,
            graduatedAt: doc.graduatedAt || null,
        });
    } catch (err) {
        console.error('University progress POST error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

/** GET /api/university/mint-course-badge-info — cost (TON), wallet, canMint, alreadyMinted (requires Telegram). */
router.get('/mint-course-badge-info', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const cfg = await getConfig();
        const costNano = Math.max(0, Number(cfg.courseCompletionBadgeMintCostTonNano ?? 10_000_000_000));
        const wallet = (process.env.UNIVERSITY_BADGE_TON_WALLET || '').trim();
        const doc = await UniversityProgress.findOne({ telegramId }).lean();
        const completedKeys = doc ? (doc.completedKeys || []) : [];
        const completedCourseIds = getCompletedCourseIds(completedKeys);
        const canMint = completedCourseIds.length >= 1;
        const user = await User.findOne({ telegramId }).select('badges').lean();
        const alreadyMinted = Array.isArray(user?.badges) && user.badges.includes('course_completion');
        res.json({
            costTonNano: costNano,
            costTon: costNano / 1e9,
            walletAddress: wallet || null,
            canMint: !!canMint,
            alreadyMinted: !!alreadyMinted,
            completedCourseCount: completedCourseIds.length,
        });
    } catch (err) {
        console.error('University mint-course-badge-info error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

/** POST /api/university/mint-course-badge — verify TON payment and award course_completion badge (at least one course completed). */
router.post(
    '/mint-course-badge',
    requireTelegram,
    validateBody({
        txHash: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const txHash = String(req.validatedBody?.txHash || '').trim();
        if (!txHash) return res.status(400).json({ error: 'txHash required' });

        const cfg = await getConfig();
        const costNano = Math.max(0, Number(cfg.courseCompletionBadgeMintCostTonNano ?? 10_000_000_000));
        const wallet = (process.env.UNIVERSITY_BADGE_TON_WALLET || '').trim();
        if (!wallet) return res.status(503).json({ error: 'Course badge mint wallet not configured (UNIVERSITY_BADGE_TON_WALLET)' });

        const doc = await UniversityProgress.findOne({ telegramId }).lean();
        const completedKeys = doc ? (doc.completedKeys || []) : [];
        const completedCourseIds = getCompletedCourseIds(completedKeys);
        if (completedCourseIds.length < 1) return res.status(403).json({ error: 'Complete at least one course to mint the Course Completion badge' });

        const user = await User.findOne({ telegramId }).select('badges').lean();
        if (Array.isArray(user?.badges) && user.badges.includes('course_completion')) {
            return res.status(409).json({ error: 'You already have the Course Completion badge' });
        }

        const existing = await CourseBadgeMint.findOne({ txHash }).lean();
        if (existing) return res.status(409).json({ error: 'txHash already used' });

        let verified = false;
        const tonApiUrl = process.env.TON_PROVIDER_URL || process.env.TON_API_URL || '';
        const tonApiKey = process.env.TON_API_KEY || '';
        if (tonApiUrl || tonApiKey) {
            try {
                const base = (tonApiUrl || 'https://toncenter.com/api/v2').replace(/\/+$/, '');
                const url = `${base}/getTransactionByHash?hash=${encodeURIComponent(txHash)}`;
                const opts = tonApiKey ? { headers: { 'X-API-Key': tonApiKey } } : {};
                const txRes = await fetch(url, opts);
                const txData = await txRes.json().catch(() => ({}));
                const tx = txData?.result || txData;
                const inMsg = tx?.in_msg;
                const value = inMsg?.value ? BigInt(inMsg.value) : 0n;
                const toAddr = (inMsg?.destination || '').toString();
                if (value >= BigInt(costNano) && toAddr && wallet && toAddr === wallet) verified = true;
            } catch {
                // verification failed
            }
        }
        if (!verified) return res.status(400).json({ error: 'TON payment verification failed or not configured' });

        await CourseBadgeMint.create({ telegramId, txHash });
        await User.updateOne(
            { telegramId },
            { $addToSet: { badges: 'course_completion' } },
        );

        res.json({ ok: true, badge: 'course_completion' });
    } catch (err) {
        console.error('University mint-course-badge error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

/** GET /api/university/mint-full-certificate-info — cost (TON), wallet, canMint, alreadyMinted for whole course completion certificate (graduate only). */
router.get('/mint-full-certificate-info', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const cfg = await getConfig();
        const costNano = Math.max(0, Number(cfg.fullCourseCompletionCertificateMintCostTonNano ?? 15_000_000_000));
        const wallet = (process.env.UNIVERSITY_BADGE_TON_WALLET || '').trim();
        const doc = await UniversityProgress.findOne({ telegramId }).lean();
        const completedKeys = doc ? (doc.completedKeys || []) : [];
        const totalModules = getTotalModuleCount();
        const graduate = completedKeys.length >= totalModules && totalModules > 0;
        const user = await User.findOne({ telegramId }).select('badges').lean();
        const alreadyMinted = Array.isArray(user?.badges) && user.badges.includes('full_course_completion_certificate');
        res.json({
            costTonNano: costNano,
            costTon: costNano / 1e9,
            walletAddress: wallet || null,
            canMint: !!graduate,
            alreadyMinted: !!alreadyMinted,
        });
    } catch (err) {
        console.error('University mint-full-certificate-info error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

/** POST /api/university/mint-full-certificate — verify TON payment and award full_course_completion_certificate badge (all courses completed). */
router.post(
    '/mint-full-certificate',
    requireTelegram,
    validateBody({
        txHash: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const txHash = String(req.validatedBody?.txHash || '').trim();
        if (!txHash) return res.status(400).json({ error: 'txHash required' });

        const cfg = await getConfig();
        const costNano = Math.max(0, Number(cfg.fullCourseCompletionCertificateMintCostTonNano ?? 15_000_000_000));
        const wallet = (process.env.UNIVERSITY_BADGE_TON_WALLET || '').trim();
        if (!wallet) return res.status(503).json({ error: 'University certificate mint wallet not configured (UNIVERSITY_BADGE_TON_WALLET)' });

        const doc = await UniversityProgress.findOne({ telegramId }).lean();
        const completedKeys = doc ? (doc.completedKeys || []) : [];
        const totalModules = getTotalModuleCount();
        const graduate = completedKeys.length >= totalModules && totalModules > 0;
        if (!graduate) return res.status(403).json({ error: 'Complete all courses to mint the Full Course Completion Certificate' });

        const user = await User.findOne({ telegramId }).select('badges').lean();
        if (Array.isArray(user?.badges) && user.badges.includes('full_course_completion_certificate')) {
            return res.status(409).json({ error: 'You already have the Full Course Completion Certificate' });
        }

        const existing = await FullCertificateMint.findOne({ txHash }).lean();
        if (existing) return res.status(409).json({ error: 'txHash already used' });

        let verified = false;
        const tonApiUrl = process.env.TON_PROVIDER_URL || process.env.TON_API_URL || '';
        const tonApiKey = process.env.TON_API_KEY || '';
        if (tonApiUrl || tonApiKey) {
            try {
                const base = (tonApiUrl || 'https://toncenter.com/api/v2').replace(/\/+$/, '');
                const url = `${base}/getTransactionByHash?hash=${encodeURIComponent(txHash)}`;
                const opts = tonApiKey ? { headers: { 'X-API-Key': tonApiKey } } : {};
                const txRes = await fetch(url, opts);
                const txData = await txRes.json().catch(() => ({}));
                const tx = txData?.result || txData;
                const inMsg = tx?.in_msg;
                const value = inMsg?.value ? BigInt(inMsg.value) : 0n;
                const toAddr = (inMsg?.destination || '').toString();
                if (value >= BigInt(costNano) && toAddr && wallet && toAddr === wallet) verified = true;
            } catch {
                // verification failed
            }
        }
        if (!verified) return res.status(400).json({ error: 'TON payment verification failed or not configured' });

        await FullCertificateMint.create({ telegramId, txHash });
        await User.updateOne(
            { telegramId },
            { $addToSet: { badges: 'full_course_completion_certificate' } },
        );

        res.json({ ok: true, badge: 'full_course_completion_certificate' });
    } catch (err) {
        console.error('University mint-full-certificate error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
module.exports.COURSES = COURSES;
module.exports.getTotalModuleCount = getTotalModuleCount;
module.exports.getAllModuleKeys = getAllModuleKeys;
