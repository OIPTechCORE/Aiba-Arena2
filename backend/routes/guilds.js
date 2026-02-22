const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Guild = require('../models/Guild');
const Broker = require('../models/Broker');
const Battle = require('../models/Battle');
const { getConfig } = require('../engine/economy');
const { getLimit } = require('../util/pagination');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');

router.use(requireTelegram);

function isMember(guild, telegramId) {
    return Boolean(guild?.members?.some((m) => String(m.telegramId) === String(telegramId)));
}

function isOwner(guild, telegramId) {
    return String(guild?.ownerTelegramId || '') === String(telegramId);
}

// Verify TON payment: tx sent to toWallet with value >= minNano. Returns true if verified.
async function verifyTonPayment(txHash, toWallet, minNano) {
    if (!txHash || !toWallet || !minNano) return false;
    const base = (process.env.TON_PROVIDER_URL || process.env.TON_API_URL || 'https://toncenter.com/api/v2').replace(
        /\/+$/,
        '',
    );
    const url = `${base}/getTransactionByHash?hash=${encodeURIComponent(txHash)}`;
    const opts = { headers: process.env.TON_API_KEY ? { 'X-API-Key': process.env.TON_API_KEY } : {} };
    try {
        const txRes = await fetch(url, opts);
        const txData = await txRes.json().catch(() => ({}));
        const tx = txData?.result || txData;
        const inMsg = tx?.in_msg;
        const value = inMsg?.value ? BigInt(inMsg.value) : 0n;
        const toAddr = (inMsg?.destination || '').toString();
        return value >= BigInt(minNano) && toAddr && toAddr === toWallet;
    } catch {
        return false;
    }
}

// POST /api/guilds/create — Top leaders (by score) create free; others pay TON (1–10, configurable in Super Admin). Paid TON → LEADER_BOARD_WALLET.
router.post(
    '/create',
    validateBody({
        name: { type: 'string', trim: true, minLength: 3, maxLength: 24, required: true },
        bio: { type: 'string', trim: true, maxLength: 500 },
        txHash: { type: 'string', trim: true, maxLength: 200 },
    }),
    async (req, res) => {
        const telegramId = String(req.telegramId || '');
        const name = String(req.validatedBody?.name || '').trim();
        const bio = String(req.validatedBody?.bio || '').trim();
        const txHash = String(req.validatedBody?.txHash || '').trim();

        if (!name) return res.status(400).json({ error: 'name required' });
        if (name.length < 3 || name.length > 24) return res.status(400).json({ error: 'name must be 3-24 chars' });

        try {
            const cfg = await getConfig();
            const topFree = Math.max(1, Number(cfg.leaderboardTopFreeCreate ?? 50));
            const costNano = Math.max(0, Number(cfg.createGroupCostTonNano ?? 1_000_000_000));
            const leaderBoardWallet = (process.env.LEADER_BOARD_WALLET || '').trim();

            let canCreateFree = false;
            const userScore = await Battle.aggregate([
                { $match: { ownerTelegramId: telegramId } },
                { $group: { _id: null, totalScore: { $sum: '$score' } } },
            ]);
            const totalScore = userScore[0]?.totalScore ?? 0;
            const betterCount = await Battle.aggregate([
                { $group: { _id: '$ownerTelegramId', totalScore: { $sum: '$score' } } },
                { $match: { totalScore: { $gt: totalScore } } },
                { $count: 'n' },
            ]);
            const rank = (betterCount[0]?.n ?? 0) + 1;
            if (rank > 0 && rank <= topFree) canCreateFree = true;

            if (!canCreateFree) {
                if (costNano <= 0 || !leaderBoardWallet)
                    return res
                        .status(400)
                        .json({
                            error:
                                'Creating a group requires being in top ' + topFree + ' or paying TON (not configured)',
                        });
                if (!txHash)
                    return res
                        .status(400)
                        .json({ error: 'txHash required — pay ' + costNano / 1e9 + ' TON to create a group' });
                const verified = await verifyTonPayment(txHash, leaderBoardWallet, costNano);
                if (!verified) return res.status(400).json({ error: 'TON payment verification failed' });
            }

            const guild = await Guild.create({
                name,
                bio,
                ownerTelegramId: telegramId,
                members: [{ telegramId, role: 'owner' }],
                paidCreateTxHash: canCreateFree ? '' : txHash,
            });
            res.status(201).json(guild);
        } catch (err) {
            if (String(err?.code) === '11000') return res.status(409).json({ error: 'name already taken' });
            console.error('Error creating guild:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// POST /api/guilds/join
router.post(
    '/join',
    validateBody({
        guildId: { type: 'objectId', required: true },
    }),
    async (req, res) => {
        const telegramId = String(req.telegramId || '');
        const guildId = String(req.validatedBody?.guildId || '').trim();
        if (!guildId) return res.status(400).json({ error: 'guildId required' });

        const guild = await Guild.findById(guildId);
        if (!guild || !guild.active) return res.status(404).json({ error: 'not found' });

        const already = guild.members.some((m) => String(m.telegramId) === telegramId);
        if (already) return res.json(guild);

        guild.members.push({ telegramId, role: 'member', joinedAt: new Date() });
        await guild.save();
        res.json(guild.toObject());
    },
);

// POST /api/guilds/leave
router.post(
    '/leave',
    validateBody({
        guildId: { type: 'objectId', required: true },
    }),
    async (req, res) => {
        const telegramId = String(req.telegramId || '');
        const guildId = String(req.validatedBody?.guildId || '').trim();
        if (!guildId) return res.status(400).json({ error: 'guildId required' });

        const guild = await Guild.findById(guildId);
        if (!guild) return res.status(404).json({ error: 'not found' });

        guild.members = guild.members.filter((m) => String(m.telegramId) !== telegramId);
        await guild.save();
        res.json({ ok: true });
    },
);

// POST /api/guilds/deposit-broker
// Body: { guildId, brokerId }
router.post(
    '/deposit-broker',
    validateBody({
        guildId: { type: 'objectId', required: true },
        brokerId: { type: 'objectId', required: true },
    }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const guildId = String(req.validatedBody?.guildId || '').trim();
            const brokerId = String(req.validatedBody?.brokerId || '').trim();
            if (!guildId) return res.status(400).json({ error: 'guildId required' });
            if (!brokerId) return res.status(400).json({ error: 'brokerId required' });

            const guild = await Guild.findById(guildId);
            if (!guild || !guild.active) return res.status(404).json({ error: 'not found' });
            if (!isMember(guild, telegramId)) return res.status(403).json({ error: 'not a member' });

            const broker = await Broker.findById(brokerId);
            if (!broker) return res.status(404).json({ error: 'broker not found' });
            if (String(broker.ownerTelegramId) !== telegramId)
                return res.status(403).json({ error: 'not your broker' });
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
    },
);

// POST /api/guilds/withdraw-broker
// Body: { guildId, brokerId }
router.post(
    '/withdraw-broker',
    validateBody({
        guildId: { type: 'objectId', required: true },
        brokerId: { type: 'objectId', required: true },
    }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const guildId = String(req.validatedBody?.guildId || '').trim();
            const brokerId = String(req.validatedBody?.brokerId || '').trim();
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
    },
);

// GET /api/guilds/list — All groups globally. Must be before /:guildId so "list" is not matched as guildId.
router.get('/list', validateQuery({ limit: { type: 'integer', min: 1, max: 300 } }), async (req, res) => {
    const limit = getLimit({ query: { limit: req.validatedQuery?.limit } }, { defaultLimit: 200, maxLimit: 300 });
    const guilds = await Guild.find({ active: true }).sort({ boostCount: -1, createdAt: -1 }).limit(limit).lean();
    res.json(guilds);
});

// GET /api/guilds/mine
router.get('/mine', async (req, res) => {
    const telegramId = String(req.telegramId || '');
    const guilds = await Guild.find({ 'members.telegramId': telegramId, active: true }).sort({ createdAt: -1 }).lean();
    res.json(guilds);
});

// GET /api/guilds/top — alias for list (backward compat)
router.get('/top', async (_req, res) => {
    const guilds = await Guild.find({ active: true }).sort({ boostCount: -1, createdAt: -1 }).limit(50).lean();
    res.json(guilds);
});

// GET /api/guilds/:guildId/pool — Auth. Guild's pooled brokers. Must be after static /list, /mine, /top.
router.get('/:guildId/pool', validateParams({ guildId: { type: 'objectId', required: true } }), async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const guildId = String(req.validatedParams.guildId || '').trim();
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

// POST /api/guilds/:guildId/boost — Any user can pay TON to boost a group. Paid TON → BOOST_GROUP_WALLET. Cost 1–10 TON (Super Admin config).
router.post(
    '/:guildId/boost',
    validateParams({ guildId: { type: 'objectId', required: true } }),
    validateBody({ txHash: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true } }),
    async (req, res) => {
        const guildId = String(req.validatedParams.guildId || '').trim();
        const txHash = String(req.validatedBody?.txHash || '').trim();
        if (!guildId) return res.status(400).json({ error: 'guildId required' });
        if (!txHash) return res.status(400).json({ error: 'txHash required' });

        try {
            const cfg = await getConfig();
            const costNano = Math.max(0, Number(cfg.boostGroupCostTonNano ?? 1_000_000_000));
            const boostWallet = (process.env.BOOST_GROUP_WALLET || '').trim();
            if (costNano <= 0 || !boostWallet)
                return res.status(503).json({ error: 'Group boost TON payment not configured' });

            const guild = await Guild.findById(guildId);
            if (!guild || !guild.active) return res.status(404).json({ error: 'group not found' });

            const boostTxHashes = guild.boostTxHashes || [];
            if (boostTxHashes.includes(txHash))
                return res.status(409).json({ error: 'txHash already used for this group' });

            const verified = await verifyTonPayment(txHash, boostWallet, costNano);
            if (!verified) return res.status(400).json({ error: 'TON payment verification failed' });

            guild.boostTxHashes = [...boostTxHashes, txHash];
            guild.boostCount = (guild.boostCount || 0) + 1;
            const boostDays = 7;
            const newBoostedUntil = new Date(Date.now() + boostDays * 24 * 60 * 60 * 1000);
            if (!guild.boostedUntil || guild.boostedUntil < new Date()) guild.boostedUntil = newBoostedUntil;
            else guild.boostedUntil = new Date(guild.boostedUntil.getTime() + boostDays * 24 * 60 * 60 * 1000);
            await guild.save();

            res.json({ ok: true, guild: guild.toObject(), boostedUntil: guild.boostedUntil });
        } catch (err) {
            console.error('Guild boost error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

module.exports = router;
