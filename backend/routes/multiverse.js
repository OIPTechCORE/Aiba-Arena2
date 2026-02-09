const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const NftUniverse = require('../models/NftUniverse');
const NftStake = require('../models/NftStake');
const Broker = require('../models/Broker');
const { getConfig, creditAibaNoCap } = require('../engine/economy');
const { getIdempotencyKey } = require('../engine/idempotencyKey');
const { validateBody } = require('../middleware/validate');

// Ensure default "broker" universe exists
async function ensureBrokerUniverse() {
    let u = await NftUniverse.findOne({ slug: 'broker' }).lean();
    if (u) return u;
    const cfg = await getConfig();
    await NftUniverse.findOneAndUpdate(
        { slug: 'broker' },
        {
            $setOnInsert: {
                slug: 'broker',
                name: 'Broker NFT',
                description: 'Mint your AI Broker as an on-chain NFT. Trade or stake to earn AIBA.',
                type: 'broker',
                mintCostAiba: cfg.mintAibaCost ?? 100,
                mintCostTonNano: 0,
                tonWalletEnvVar: '',
                feeBps: cfg.marketplaceFeeBps ?? 300,
                burnBps: cfg.marketplaceBurnBps ?? 0,
                stakingEnabled: true,
                active: true,
                order: 0,
            },
        },
        { upsert: true, new: true },
    );
    return NftUniverse.findOne({ slug: 'broker' }).lean();
}

// GET /api/multiverse/universes — list active universes (mint costs, staking, etc.)
router.get('/universes', async (req, res) => {
    try {
        await ensureBrokerUniverse();
        const cfg = await getConfig();
        const list = await NftUniverse.find({ active: true }).sort({ order: 1 }).lean();
        const out = list.map((u) => ({
            slug: u.slug,
            name: u.name,
            description: u.description || '',
            type: u.type,
            mintCostAiba: u.mintCostAiba ?? 0,
            mintCostTonNano: u.mintCostTonNano ?? 0,
            stakingEnabled: !!u.stakingEnabled,
            feeBps: u.feeBps ?? 300,
        }));
        res.json({ universes: out, nftStakingRewardPerDayAiba: cfg.nftStakingRewardPerDayAiba ?? 5, nftStakingApyPercent: cfg.nftStakingApyPercent ?? 12 });
    } catch (err) {
        console.error('Multiverse universes error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/multiverse/me — my NFTs (brokers with NFT; staked flag)
router.get('/me', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const brokers = await Broker.find({ ownerTelegramId: telegramId, nftItemAddress: { $exists: true, $ne: '' } })
            .sort({ updatedAt: -1 })
            .lean();
        const brokerIds = brokers.map((b) => b._id);
        const stakes = await NftStake.find({ brokerId: { $in: brokerIds } }).lean();
        const stakedBrokerIds = new Set(stakes.map((s) => String(s.brokerId)));

        const nfts = brokers.map((b) => ({
            brokerId: b._id,
            universeSlug: 'broker',
            nftItemAddress: b.nftItemAddress,
            nftCollectionAddress: b.nftCollectionAddress,
            nftItemIndex: b.nftItemIndex,
            level: b.level,
            risk: b.risk,
            intelligence: b.intelligence,
            speed: b.speed,
            staked: stakedBrokerIds.has(String(b._id)),
            stakedAt: stakes.find((s) => String(s.brokerId) === String(b._id))?.stakedAt,
        }));
        res.json({ nfts });
    } catch (err) {
        console.error('Multiverse me error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/multiverse/stake — stake a broker NFT (broker must have nftItemAddress)
router.post(
    '/stake',
    requireTelegram,
    validateBody({
        universeId: { type: 'objectId', required: true },
        tokenId: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });

        const brokerId = String(req.body?.brokerId ?? '').trim();
        if (!brokerId) return res.status(400).json({ error: 'brokerId required' });

        const broker = await Broker.findById(brokerId);
        if (!broker) return res.status(404).json({ error: 'broker not found' });
        if (String(broker.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your broker' });
        if (!broker.nftItemAddress || !broker.nftItemAddress.trim()) return res.status(400).json({ error: 'broker has no NFT; mint NFT first' });

        const universe = await NftUniverse.findOne({ slug: 'broker', active: true }).lean();
        if (!universe || !universe.stakingEnabled) return res.status(400).json({ error: 'NFT staking not available for this universe' });

        const existing = await NftStake.findOne({ brokerId: broker._id });
        if (existing) return res.status(409).json({ error: 'this NFT is already staked' });

        await NftStake.create({
            telegramId,
            universeSlug: 'broker',
            brokerId: broker._id,
            stakedAt: new Date(),
            lastRewardAt: new Date(),
        });
        res.json({ ok: true, brokerId: broker._id, universeSlug: 'broker' });
    } catch (err) {
        console.error('Multiverse stake error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// POST /api/multiverse/unstake — unstake a broker NFT
router.post(
    '/unstake',
    requireTelegram,
    validateBody({
        stakeId: { type: 'objectId', required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const brokerId = String(req.body?.brokerId ?? '').trim();
        if (!brokerId) return res.status(400).json({ error: 'brokerId required' });

        const stake = await NftStake.findOne({ brokerId, telegramId });
        if (!stake) return res.status(404).json({ error: 'stake not found or not your stake' });

        await NftStake.deleteOne({ _id: stake._id });
        res.json({ ok: true, brokerId: stake.brokerId });
    } catch (err) {
        console.error('Multiverse unstake error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// Compute pending NFT staking reward for a single stake (fixed per-day reward)
function pendingRewardForStake(stake, rewardPerDayAiba) {
    const last = stake.lastRewardAt ? new Date(stake.lastRewardAt) : new Date(stake.stakedAt);
    const now = new Date();
    const daysElapsed = (now.getTime() - last.getTime()) / (24 * 60 * 60 * 1000);
    return Math.floor((rewardPerDayAiba || 0) * Math.max(0, daysElapsed));
}

// GET /api/multiverse/staking/rewards — pending staking rewards (and list of staked NFTs)
router.get('/staking/rewards', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const cfg = await getConfig();
        const rewardPerDay = Math.max(0, Number(cfg.nftStakingRewardPerDayAiba ?? 5));
        const stakes = await NftStake.find({ telegramId }).populate('brokerId', 'level risk intelligence speed nftItemAddress').lean();
        let totalPending = 0;
        const items = stakes.map((s) => {
            const pending = pendingRewardForStake(s, rewardPerDay);
            totalPending += pending;
            return {
                brokerId: s.brokerId?._id ?? s.brokerId,
                stakedAt: s.stakedAt,
                lastRewardAt: s.lastRewardAt,
                pendingRewardAiba: pending,
            };
        });
        res.json({ rewardPerDayAiba: rewardPerDay, stakedCount: stakes.length, pendingRewardAiba: totalPending, items });
    } catch (err) {
        console.error('Multiverse staking rewards error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/multiverse/staking/claim — claim all pending NFT staking rewards
router.post(
    '/staking/claim',
    requireTelegram,
    validateBody({
        requestId: { type: 'string', trim: true, minLength: 1, maxLength: 128, required: true },
    }),
    async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });
        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });

        const cfg = await getConfig();
        const rewardPerDay = Math.max(0, Number(cfg.nftStakingRewardPerDayAiba ?? 5));
        const stakes = await NftStake.find({ telegramId });
        let totalClaimed = 0;
        const now = new Date();
        for (const s of stakes) {
            const pending = pendingRewardForStake(s, rewardPerDay);
            if (pending > 0) {
                await creditAibaNoCap(pending, {
                    telegramId,
                    reason: 'nft_staking_reward',
                    arena: 'multiverse',
                    league: 'global',
                    sourceType: 'nft_stake',
                    sourceId: String(s._id),
                    requestId: `${requestId}-${s._id}`,
                    meta: { brokerId: String(s.brokerId), universeSlug: s.universeSlug },
                });
                s.lastRewardAt = now;
                await s.save();
                totalClaimed += pending;
            }
        }
        res.json({ ok: true, claimedAiba: totalClaimed });
    } catch (err) {
        console.error('Multiverse staking claim error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

module.exports = router;
