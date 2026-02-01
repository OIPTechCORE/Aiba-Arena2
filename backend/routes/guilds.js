const router = require('express').Router();
const requireTelegram = require('../middleware/requireTelegram');
const Guild = require('../models/Guild');

router.use(requireTelegram);

// POST /api/guilds/create
router.post('/create', async (req, res) => {
    const telegramId = String(req.telegramId);
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
    const telegramId = String(req.telegramId);
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
    const telegramId = String(req.telegramId);
    const guildId = String(req.body?.guildId || '').trim();
    if (!guildId) return res.status(400).json({ error: 'guildId required' });

    const guild = await Guild.findById(guildId);
    if (!guild) return res.status(404).json({ error: 'not found' });

    guild.members = guild.members.filter((m) => String(m.telegramId) !== telegramId);
    await guild.save();
    res.json({ ok: true });
});

// GET /api/guilds/mine
router.get('/mine', async (req, res) => {
    const telegramId = String(req.telegramId);
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

