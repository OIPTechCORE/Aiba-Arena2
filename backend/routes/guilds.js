const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Guild = require('../models/Guild');
const Broker = require('../models/Broker');

router.use(requireTelegram);

function isMember(guild, telegramId) {
    return Boolean(guild?.members?.some((m) => String(m.telegramId) === String(telegramId)));
}

function isOwner(guild, telegramId) {
    return String(guild?.ownerTelegramId || '') === String(telegramId);
}

// POST /api/guilds/create
router.post('/create', async (req, res) => {
    const telegramId = String(req.telegramId || '');
    const name = String(req.body?.name || '').trim();
    const bio = String(req.body?.bio || '').trim();

    if (!name) return res.status(400).json({ error: 'name required' });
    if (name.length < 3 || name.length > 24) return res.status(400).json({ error: 'name must be 3-24 chars' });

    try {
        const guild = await Guild.create({
            name,
            bio,
            ownerTelegramId: telegramId,
            members: [{ telegramId, role: 'owner' }],
        });
        res.status(201).json(guild);
    } catch (err) {
        if (String(err?.code) === '11000') return res.status(409).json({ error: 'name already taken' });
        console.error('Error creating guild:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/guilds/join
router.post('/join', async (req, res) => {
    const telegramId = String(req.telegramId || '');
    const guildId = String(req.body?.guildId || '').trim();
    if (!guildId) return res.status(400).json({ error: 'guildId required' });

    const guild = await Guild.findById(guildId);
    if (!guild || !guild.active) return res.status(404).json({ error: 'not found' });

    const already = guild.members.some((m) => String(m.telegramId) === telegramId);
    if (already) return res.json(guild);

    guild.members.push({ telegramId, role: 'member', joinedAt: new Date() });
    await guild.save();
    res.json(guild.toObject());
});

// POST /api/guilds/leave
router.post('/leave', async (req, res) => {
    const telegramId = String(req.telegramId || '');
    const guildId = String(req.body?.guildId || '').trim();
    if (!guildId) return res.status(400).json({ error: 'guildId required' });

    const guild = await Guild.findById(guildId);
    if (!guild) return res.status(404).json({ error: 'not found' });

    guild.members = guild.members.filter((m) => String(m.telegramId) !== telegramId);
    await guild.save();
    res.json({ ok: true });
});

// POST /api/guilds/deposit-broker
// Body: { guildId, brokerId }
router.post('/deposit-broker', async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const guildId = String(req.body?.guildId || '').trim();
        const brokerId = String(req.body?.brokerId || '').trim();
        if (!guildId) return res.status(400).json({ error: 'guildId required' });
        if (!brokerId) return res.status(400).json({ error: 'brokerId required' });

        const guild = await Guild.findById(guildId);
        if (!guild || !guild.active) return res.status(404).json({ error: 'not found' });
        if (!isMember(guild, telegramId)) return res.status(403).json({ error: 'not a member' });

        const broker = await Broker.findById(brokerId);
        if (!broker) return res.status(404).json({ error: 'broker not found' });
        if (String(broker.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your broker' });
        if (broker.guildId && String(broker.guildId) !== String(guild._id))
            return res.status(409).json({ error: 'broker already in another guild pool' });

        const already = guild.pooledBrokers?.some((p) => String(p.brokerId) === String(broker._id));
        if (!already) {
            guild.pooledBrokers.push({ brokerId: broker._id, depositedByTelegramId: telegramId });
            await guild.save();
        }

        broker.guildId = guild._id;
        await broker.save();

        res.json({ ok: true, guild: guild.toObject(), broker: broker.toObject() });
    } catch (err) {
        console.error('Error depositing broker:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/guilds/withdraw-broker
// Body: { guildId, brokerId }
router.post('/withdraw-broker', async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const guildId = String(req.body?.guildId || '').trim();
        const brokerId = String(req.body?.brokerId || '').trim();
        if (!guildId) return res.status(400).json({ error: 'guildId required' });
        if (!brokerId) return res.status(400).json({ error: 'brokerId required' });

        const guild = await Guild.findById(guildId);
        if (!guild) return res.status(404).json({ error: 'not found' });
        if (!isMember(guild, telegramId)) return res.status(403).json({ error: 'not a member' });

        const broker = await Broker.findById(brokerId);
        if (!broker) return res.status(404).json({ error: 'broker not found' });
        if (String(broker.guildId || '') !== String(guild._id))
            return res.status(409).json({ error: 'broker not in this guild pool' });

        // Only guild owner or depositor can withdraw (simple role rule).
        const depositRow = guild.pooledBrokers?.find((p) => String(p.brokerId) === String(broker._id));
        const can =
            isOwner(guild, telegramId) ||
            (depositRow && String(depositRow.depositedByTelegramId) === String(telegramId)) ||
            String(broker.ownerTelegramId) === String(telegramId);
        if (!can) return res.status(403).json({ error: 'not allowed' });

        guild.pooledBrokers = (guild.pooledBrokers || []).filter((p) => String(p.brokerId) !== String(broker._id));
        await guild.save();

        broker.guildId = null;
        await broker.save();

        res.json({ ok: true, guild: guild.toObject(), broker: broker.toObject() });
    } catch (err) {
        console.error('Error withdrawing broker:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/guilds/:guildId/pool
router.get('/:guildId/pool', async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const guildId = String(req.params.guildId || '').trim();
        const guild = await Guild.findById(guildId).lean();
        if (!guild) return res.status(404).json({ error: 'not found' });
        if (!isMember(guild, telegramId)) return res.status(403).json({ error: 'not a member' });

        const brokerIds = (guild.pooledBrokers || []).map((p) => p.brokerId);
        const brokers = await Broker.find({ _id: { $in: brokerIds } }).lean();
        res.json({ guildId, brokers });
    } catch (err) {
        console.error('Error loading guild pool:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/guilds/mine
router.get('/mine', async (req, res) => {
    const telegramId = String(req.telegramId || '');
    const guilds = await Guild.find({ 'members.telegramId': telegramId, active: true }).sort({ createdAt: -1 }).lean();
    res.json(guilds);
});

// Public-ish leaderboard (still requires telegram auth to reduce scraping)
// GET /api/guilds/top
router.get('/top', async (_req, res) => {
    const guilds = await Guild.find({ active: true }).sort({ createdAt: -1 }).limit(50).lean();
    res.json(guilds);
});

module.exports = router;
