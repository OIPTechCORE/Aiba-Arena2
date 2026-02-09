const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const User = require('../models/User');
const Broker = require('../models/Broker');
const Battle = require('../models/Battle');
const { getLimit } = require('../util/pagination');
const { validateBody, validateQuery } = require('../middleware/validate');

router.use(requireAdmin());

function clampInt(n, min, max) {
    const x = Number(n);
    if (!Number.isFinite(x)) return min;
    return Math.max(min, Math.min(max, Math.floor(x)));
}

// GET /api/admin/mod/flagged-brokers?minFlags=1&limit=100
router.get(
    '/flagged-brokers',
    validateQuery({
        minFlags: { type: 'integer', min: 0, max: 1000000 },
        limit: { type: 'integer', min: 1, max: 500 },
    }),
    async (req, res) => {
    try {
        const minFlags = clampInt(req.validatedQuery?.minFlags ?? 1, 0, 1_000_000);
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 100, maxLimit: 500 },
        );

        const brokers = await Broker.find({ anomalyFlags: { $gte: minFlags } })
            .sort({ anomalyFlags: -1, updatedAt: -1 })
            .limit(limit)
            .lean();

        res.json(brokers);
    } catch (err) {
        console.error('Error fetching flagged brokers:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// GET /api/admin/mod/recent-anomalies?limit=100
router.get(
    '/recent-anomalies',
    validateQuery({ limit: { type: 'integer', min: 1, max: 500 } }),
    async (req, res) => {
    try {
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 100, maxLimit: 500 },
        );
        const battles = await Battle.find({ anomaly: true }).sort({ createdAt: -1 }).limit(limit).lean();
        res.json(battles);
    } catch (err) {
        console.error('Error fetching anomalies:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// GET /api/admin/mod/flagged-users?minFlags=1&limit=100
router.get(
    '/flagged-users',
    validateQuery({
        minFlags: { type: 'integer', min: 0, max: 1000000 },
        limit: { type: 'integer', min: 1, max: 500 },
    }),
    async (req, res) => {
    try {
        const minFlags = clampInt(req.validatedQuery?.minFlags ?? 1, 0, 1_000_000);
        const limit = getLimit(
            { query: { limit: req.validatedQuery?.limit } },
            { defaultLimit: 100, maxLimit: 500 },
        );

        const users = await User.find({ anomalyFlags: { $gte: minFlags } })
            .sort({ anomalyFlags: -1, updatedAt: -1 })
            .limit(limit)
            .lean();

        res.json(users);
    } catch (err) {
        console.error('Error fetching flagged users:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// POST /api/admin/mod/ban-user
router.post(
    '/ban-user',
    validateBody({
        telegramId: { type: 'string', trim: true, minLength: 1, maxLength: 50, required: true },
        minutes: { type: 'number', min: 1 },
        reason: { type: 'string', trim: true, maxLength: 200 },
    }),
    async (req, res) => {
    const telegramId = String(req.validatedBody?.telegramId || '').trim();
    const minutes = Number(req.validatedBody?.minutes ?? 60 * 24);
    const reason = String(req.validatedBody?.reason || 'banned').trim();

    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });
    if (!Number.isFinite(minutes) || minutes <= 0) return res.status(400).json({ error: 'minutes must be > 0' });

    const bannedUntil = new Date(Date.now() + Math.floor(minutes * 60 * 1000));

    const user = await User.findOneAndUpdate(
        { telegramId },
        { $set: { bannedUntil, bannedReason: reason } },
        { new: true, upsert: true },
    ).lean();

    res.json(user);
    },
);

// POST /api/admin/mod/unban-user
router.post(
    '/unban-user',
    validateBody({
        telegramId: { type: 'string', trim: true, minLength: 1, maxLength: 50, required: true },
    }),
    async (req, res) => {
    const telegramId = String(req.validatedBody?.telegramId || '').trim();
    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });

    const user = await User.findOneAndUpdate(
        { telegramId },
        { $set: { bannedUntil: null, bannedReason: '' } },
        { new: true },
    ).lean();
    res.json(user || { ok: true });
    },
);

// POST /api/admin/mod/ban-broker
router.post(
    '/ban-broker',
    validateBody({
        brokerId: { type: 'objectId', required: true },
        reason: { type: 'string', trim: true, maxLength: 200 },
    }),
    async (req, res) => {
    const brokerId = String(req.validatedBody?.brokerId || '').trim();
    const reason = String(req.validatedBody?.reason || 'broker banned').trim();
    if (!brokerId) return res.status(400).json({ error: 'brokerId required' });

    const broker = await Broker.findByIdAndUpdate(
        brokerId,
        { $set: { banned: true, banReason: reason } },
        { new: true },
    ).lean();
    if (!broker) return res.status(404).json({ error: 'not found' });
    res.json(broker);
    },
);

// GET /api/admin/mod/user?telegramId= — fetch single user profile (stars, diamonds, badges)
router.get(
    '/user',
    validateQuery({ telegramId: { type: 'string', trim: true, minLength: 1, maxLength: 50, required: true } }),
    async (req, res) => {
    const telegramId = String(req.validatedQuery?.telegramId || '').trim();
    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });
    try {
        const user = await User.findOne({ telegramId })
            .select('telegramId username telegram starsBalance diamondsBalance badges firstWinDiamondAwardedAt bannedUntil bannedReason createdAt updatedAt')
            .lean();
        if (!user) return res.status(404).json({ error: 'user not found' });
        const username = user.username || (user.telegram && user.telegram.username) || '';
        res.json({
            telegramId: user.telegramId,
            username,
            starsBalance: user.starsBalance ?? 0,
            diamondsBalance: user.diamondsBalance ?? 0,
            badges: Array.isArray(user.badges) ? user.badges : [],
            firstWinDiamondAwardedAt: user.firstWinDiamondAwardedAt || null,
            bannedUntil: user.bannedUntil || null,
            bannedReason: user.bannedReason || '',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// POST /api/admin/mod/sync-top-leader-badges — run top_leader badge sync job once
router.post('/sync-top-leader-badges', async (req, res) => {
    try {
        const { syncTopLeaderBadges } = require('../jobs/syncTopLeaderBadges');
        const result = await syncTopLeaderBadges();
        res.json({ ok: true, ...result });
    } catch (err) {
        console.error('Error syncing top leader badges:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/admin/mod/user-badges
// Body: { telegramId: string, badges: string[] } — set user profile badges (X-style)
router.post(
    '/user-badges',
    validateBody({
        telegramId: { type: 'string', trim: true, minLength: 1, maxLength: 50, required: true },
        badges: { type: 'array', itemType: 'string' },
    }),
    async (req, res) => {
    const telegramId = String(req.validatedBody?.telegramId || '').trim();
    let badges = req.validatedBody?.badges;
    if (!telegramId) return res.status(400).json({ error: 'telegramId required' });
    if (!Array.isArray(badges)) badges = [];
    badges = badges.filter((b) => typeof b === 'string' && b.trim().length > 0).map((b) => String(b).trim());

    const user = await User.findOneAndUpdate(
        { telegramId },
        { $set: { badges } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
    res.json(user);
    },
);

// POST /api/admin/mod/unban-broker
router.post(
    '/unban-broker',
    validateBody({
        brokerId: { type: 'objectId', required: true },
    }),
    async (req, res) => {
    const brokerId = String(req.validatedBody?.brokerId || '').trim();
    if (!brokerId) return res.status(400).json({ error: 'brokerId required' });

    const broker = await Broker.findByIdAndUpdate(
        brokerId,
        { $set: { banned: false, banReason: '' } },
        { new: true },
    ).lean();
    if (!broker) return res.status(404).json({ error: 'not found' });
    res.json(broker);
    },
);

module.exports = router;
