const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Broker = require('../models/Broker');
const BrokerMintJob = require('../models/BrokerMintJob');
const Listing = require('../models/Listing');
const ActionRunKey = require('../models/ActionRunKey');
const { getIdempotencyKey } = require('../engine/idempotencyKey');
const { getConfig, debitNeurFromUser, debitAibaFromUser } = require('../engine/economy');
const { verifyTonPayment } = require('../util/tonVerify');

async function acquireActionLock({ scope, requestId, telegramId }) {
    const lockTtlMs = 15 * 60 * 1000;
    let runKey = null;
    let createdLock = false;

    try {
        runKey = await ActionRunKey.create({
            scope,
            requestId,
            ownerTelegramId: telegramId,
            status: 'in_progress',
            expiresAt: new Date(Date.now() + lockTtlMs),
        });
        createdLock = true;
    } catch (err) {
        if (String(err?.code) !== '11000') throw err;
        runKey = await ActionRunKey.findOne({ scope, requestId, ownerTelegramId: telegramId }).lean();
    }

    if (!runKey) {
        // Should be extremely rare; treat as busy and allow retry.
        return { ok: false, inProgress: true };
    }

    if (runKey.status === 'completed' && runKey.response) {
        return { ok: true, completed: true, response: runKey.response, lockId: String(runKey._id) };
    }

    if (!createdLock && runKey.status === 'in_progress') {
        return { ok: false, inProgress: true, lockId: String(runKey._id) };
    }

    if (!createdLock && runKey.status === 'failed') {
        await ActionRunKey.updateOne(
            { _id: runKey._id },
            {
                $set: {
                    status: 'in_progress',
                    errorCode: '',
                    errorMessage: '',
                    expiresAt: new Date(Date.now() + lockTtlMs),
                },
            },
        );
    }

    return { ok: true, completed: false, lockId: String(runKey._id) };
}

// Create a starter broker (server-side)
router.post('/starter', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const broker = await Broker.create({
            ownerTelegramId: telegramId,
            risk: 50,
            intelligence: 50,
            speed: 50,
            specialty: 'crypto',
            energy: 10,
        });

        // Set metadata URI post-create so we can include the broker id.
        if (process.env.PUBLIC_BASE_URL) {
            broker.metadataUri = `${String(process.env.PUBLIC_BASE_URL).replace(/\/+$/, '')}/api/metadata/brokers/${broker._id}`;
            await broker.save();
        }

        res.status(201).json(broker);
    } catch (err) {
        console.error('Error creating starter broker:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/brokers/create-with-ton — Pay TON to create a new broker; auto-listed on marketplace (global recognition).
// Body: { txHash }. Cost 1–10 TON (createBrokerCostTonNano); payment → CREATED_BROKERS_WALLET.
router.post('/create-with-ton', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const txHash = String(req.body?.txHash || '').trim();
        if (!txHash) return res.status(400).json({ error: 'txHash required' });

        const cfg = await getConfig();
        const costNano = Math.max(0, Number(cfg.createBrokerCostTonNano ?? 1_000_000_000));
        const createdBrokersWallet = (process.env.CREATED_BROKERS_WALLET || '').trim();
        if (costNano <= 0 || !createdBrokersWallet)
            return res.status(503).json({ error: 'Create broker with TON not configured' });

        const verified = await verifyTonPayment(txHash, createdBrokersWallet, costNano);
        if (!verified) return res.status(400).json({ error: 'TON payment verification failed' });

        const existing = await Broker.findOne({ createdWithTonTxHash: txHash }).lean();
        if (existing) return res.status(409).json({ error: 'txHash already used', broker: existing });

        const broker = await Broker.create({
            ownerTelegramId: telegramId,
            createdWithTonTxHash: txHash,
            risk: 50,
            intelligence: 50,
            speed: 50,
            specialty: 'crypto',
            energy: 10,
        });

        if (process.env.PUBLIC_BASE_URL) {
            broker.metadataUri = `${String(process.env.PUBLIC_BASE_URL).replace(/\/+$/, '')}/api/metadata/brokers/${broker._id}`;
            await broker.save();
        }

        const defaultPriceAIBA = Math.max(0, Number(cfg.marketplaceDefaultNewBrokerPriceAIBA ?? 10));
        await Listing.create({
            brokerId: broker._id,
            sellerTelegramId: telegramId,
            priceAIBA: defaultPriceAIBA,
            priceNEUR: 0,
            status: 'active',
        });

        res.status(201).json({
            broker: broker.toObject(),
            listed: true,
            defaultPriceAIBA,
            message: 'Broker created and listed on marketplace (visible globally).',
        });
    } catch (err) {
        console.error('Error create-with-ton broker:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// List my brokers
router.get('/mine', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const brokers = await Broker.find({ ownerTelegramId: telegramId }).sort({ createdAt: -1 }).lean();
        res.json(brokers);
    } catch (err) {
        console.error('Error listing brokers:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// Train a broker (NEUR sink)
// POST /api/brokers/train { requestId?, brokerId, stat: "intelligence"|"speed"|"risk" }
router.post('/train', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });

        const lock = await acquireActionLock({ scope: 'broker_train', requestId, telegramId });
        if (!lock.ok && lock.inProgress) return res.status(409).json({ error: 'in_progress', retryAfterMs: 1500 });
        if (lock.ok && lock.completed) return res.json(lock.response);

        const brokerId = String(req.body?.brokerId || '').trim();
        const stat = String(req.body?.stat || '').trim();
        if (!brokerId) return res.status(400).json({ error: 'brokerId required' });
        if (!['intelligence', 'speed', 'risk'].includes(stat)) return res.status(400).json({ error: 'invalid stat' });

        const broker = await Broker.findById(brokerId);
        if (!broker) return res.status(404).json({ error: 'broker not found' });
        if (String(broker.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your broker' });

        const cfg = await getConfig();
        const cost = Math.max(0, Math.floor(Number(cfg.trainNeurCost ?? 0)));
        if (cost <= 0) return res.status(500).json({ error: 'trainNeurCost not configured' });

        const spend = await debitNeurFromUser(cost, {
            telegramId,
            reason: 'train',
            arena: 'training',
            league: 'global',
            sourceType: 'broker_train',
            sourceId: requestId,
            requestId,
            meta: { brokerId: String(broker._id), stat },
        });
        if (!spend.ok) {
            if (lock.lockId) {
                await ActionRunKey.updateOne(
                    { _id: lock.lockId },
                    {
                        $set: {
                            status: 'failed',
                            errorCode: 'insufficient_neur',
                            errorMessage: 'insufficient NEUR',
                            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                        },
                    },
                );
            }
            return res.status(403).json({ error: 'insufficient NEUR' });
        }

        // Apply training effect
        broker[stat] = Math.max(0, Math.min(100, Number(broker[stat] ?? 0) + 1));
        broker.xp = Number(broker.xp ?? 0) + 5;
        await broker.save();

        const response = { ok: true, broker: broker.toObject(), neurBalance: spend.user?.neurBalance ?? 0, requestId };
        if (lock.lockId) {
            await ActionRunKey.updateOne(
                { _id: lock.lockId },
                {
                    $set: {
                        status: 'completed',
                        response,
                        errorCode: '',
                        errorMessage: '',
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                },
            );
        }
        res.json(response);
    } catch (err) {
        console.error('Error training broker:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// Repair a broker (NEUR sink) - restores energy and clears cooldowns
// POST /api/brokers/repair { requestId?, brokerId }
router.post('/repair', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });

        const lock = await acquireActionLock({ scope: 'broker_repair', requestId, telegramId });
        if (!lock.ok && lock.inProgress) return res.status(409).json({ error: 'in_progress', retryAfterMs: 1500 });
        if (lock.ok && lock.completed) return res.json(lock.response);

        const brokerId = String(req.body?.brokerId || '').trim();
        if (!brokerId) return res.status(400).json({ error: 'brokerId required' });

        const broker = await Broker.findById(brokerId);
        if (!broker) return res.status(404).json({ error: 'broker not found' });
        if (String(broker.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your broker' });

        const cfg = await getConfig();
        const cost = Math.max(0, Math.floor(Number(cfg.repairNeurCost ?? 0)));
        if (cost <= 0) return res.status(500).json({ error: 'repairNeurCost not configured' });

        const spend = await debitNeurFromUser(cost, {
            telegramId,
            reason: 'repair',
            arena: 'repairs',
            league: 'global',
            sourceType: 'broker_repair',
            sourceId: requestId,
            requestId,
            meta: { brokerId: String(broker._id) },
        });
        if (!spend.ok) {
            if (lock.lockId) {
                await ActionRunKey.updateOne(
                    { _id: lock.lockId },
                    {
                        $set: {
                            status: 'failed',
                            errorCode: 'insufficient_neur',
                            errorMessage: 'insufficient NEUR',
                            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                        },
                    },
                );
            }
            return res.status(403).json({ error: 'insufficient NEUR' });
        }

        broker.energy = 100;
        broker.cooldowns = new Map();
        broker.energyUpdatedAt = new Date();
        await broker.save();

        const response = { ok: true, broker: broker.toObject(), neurBalance: spend.user?.neurBalance ?? 0, requestId };
        if (lock.lockId) {
            await ActionRunKey.updateOne(
                { _id: lock.lockId },
                {
                    $set: {
                        status: 'completed',
                        response,
                        errorCode: '',
                        errorMessage: '',
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                },
            );
        }
        res.json(response);
    } catch (err) {
        console.error('Error repairing broker:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// Upgrade a broker (AIBA sink) - permanent improvement
// POST /api/brokers/upgrade { requestId?, brokerId, stat }
router.post('/upgrade', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });

        const lock = await acquireActionLock({ scope: 'broker_upgrade', requestId, telegramId });
        if (!lock.ok && lock.inProgress) return res.status(409).json({ error: 'in_progress', retryAfterMs: 1500 });
        if (lock.ok && lock.completed) return res.json(lock.response);

        const brokerId = String(req.body?.brokerId || '').trim();
        const stat = String(req.body?.stat || '').trim();
        if (!brokerId) return res.status(400).json({ error: 'brokerId required' });
        if (!['intelligence', 'speed', 'risk'].includes(stat)) return res.status(400).json({ error: 'invalid stat' });

        const broker = await Broker.findById(brokerId);
        if (!broker) return res.status(404).json({ error: 'broker not found' });
        if (String(broker.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your broker' });

        const cfg = await getConfig();
        const cost = Math.max(0, Math.floor(Number(cfg.upgradeAibaCost ?? 0)));
        if (cost <= 0) return res.status(500).json({ error: 'upgradeAibaCost not configured' });

        const burn = await debitAibaFromUser(cost, {
            telegramId,
            reason: 'upgrade',
            arena: 'upgrades',
            league: 'global',
            sourceType: 'broker_upgrade',
            sourceId: requestId,
            requestId,
            meta: { brokerId: String(broker._id), stat },
        });
        if (!burn.ok) {
            if (lock.lockId) {
                await ActionRunKey.updateOne(
                    { _id: lock.lockId },
                    {
                        $set: {
                            status: 'failed',
                            errorCode: 'insufficient_aiba',
                            errorMessage: 'insufficient AIBA',
                            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                        },
                    },
                );
            }
            return res.status(403).json({ error: 'insufficient AIBA' });
        }

        broker[stat] = Math.max(0, Math.min(100, Number(broker[stat] ?? 0) + 2));
        broker.level = Math.max(1, Number(broker.level ?? 1) + 1);
        broker.xp = Number(broker.xp ?? 0) + 10;
        await broker.save();

        const response = { ok: true, broker: broker.toObject(), aibaBalance: burn.user?.aibaBalance ?? 0, requestId };
        if (lock.lockId) {
            await ActionRunKey.updateOne(
                { _id: lock.lockId },
                {
                    $set: {
                        status: 'completed',
                        response,
                        errorCode: '',
                        errorMessage: '',
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                },
            );
        }
        res.json(response);
    } catch (err) {
        console.error('Error upgrading broker:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// Combine two brokers: base absorbs sacrifice (blended stats + XP), sacrifice is deleted. Costs NEUR.
// POST /api/brokers/combine { requestId?, baseBrokerId, sacrificeBrokerId }
router.post('/combine', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });

        const lock = await acquireActionLock({ scope: 'broker_combine', requestId, telegramId });
        if (!lock.ok && lock.inProgress) return res.status(409).json({ error: 'in_progress', retryAfterMs: 1500 });
        if (lock.ok && lock.completed) return res.json(lock.response);

        const baseId = String(req.body?.baseBrokerId || '').trim();
        const sacrificeId = String(req.body?.sacrificeBrokerId || '').trim();
        if (!baseId || !sacrificeId) return res.status(400).json({ error: 'baseBrokerId and sacrificeBrokerId required' });
        if (baseId === sacrificeId) return res.status(400).json({ error: 'base and sacrifice must be different brokers' });

        const [base, sacrifice] = await Promise.all([
            Broker.findById(baseId),
            Broker.findById(sacrificeId),
        ]);
        if (!base) return res.status(404).json({ error: 'base broker not found' });
        if (!sacrifice) return res.status(404).json({ error: 'sacrifice broker not found' });
        if (String(base.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your broker' });
        if (String(sacrifice.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your broker' });

        const cfg = await getConfig();
        const cost = Math.max(0, Math.floor(Number(cfg.combineNeurCost ?? 50)));
        if (cost <= 0) return res.status(500).json({ error: 'combineNeurCost not configured' });

        const spend = await debitNeurFromUser(cost, {
            telegramId,
            reason: 'combine',
            arena: 'combine',
            league: 'global',
            sourceType: 'broker_combine',
            sourceId: requestId,
            requestId,
            meta: { baseBrokerId: baseId, sacrificeBrokerId: sacrificeId },
        });
        if (!spend.ok) {
            if (lock.lockId) {
                await ActionRunKey.updateOne(
                    { _id: lock.lockId },
                    {
                        $set: {
                            status: 'failed',
                            errorCode: 'insufficient_neur',
                            errorMessage: 'insufficient NEUR',
                            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                        },
                    },
                );
            }
            return res.status(403).json({ error: 'insufficient NEUR' });
        }

        const blend = (a, b) => Math.max(0, Math.min(100, Math.round((Number(a ?? 50) + Number(b ?? 50)) / 2)));
        base.risk = blend(base.risk, sacrifice.risk);
        base.intelligence = blend(base.intelligence, sacrifice.intelligence);
        base.speed = blend(base.speed, sacrifice.speed);
        base.xp = Number(base.xp ?? 0) + Number(sacrifice.xp ?? 0) + 20;
        base.level = Math.max(1, Math.floor(Number(base.level ?? 1)));
        await base.save();
        await Broker.deleteOne({ _id: sacrificeId });

        const response = {
            ok: true,
            broker: base.toObject(),
            neurBalance: spend.user?.neurBalance ?? 0,
            requestId,
        };
        if (lock.lockId) {
            await ActionRunKey.updateOne(
                { _id: lock.lockId },
                {
                    $set: {
                        status: 'completed',
                        response,
                        errorCode: '',
                        errorMessage: '',
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                },
            );
        }
        res.json(response);
    } catch (err) {
        console.error('Error combining brokers:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// In-app NFT mint: pay AIBA, create pending mint job (admin or worker completes actual mint and links broker).
// POST /api/brokers/mint-nft { requestId?, brokerId }
router.post('/mint-nft', requireTelegram, async (req, res) => {
    try {
        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

        const requestId = getIdempotencyKey(req);
        if (!requestId) return res.status(400).json({ error: 'requestId required' });

        const brokerId = String(req.body?.brokerId || '').trim();
        if (!brokerId) return res.status(400).json({ error: 'brokerId required' });

        const broker = await Broker.findById(brokerId);
        if (!broker) return res.status(404).json({ error: 'broker not found' });
        if (String(broker.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'not your broker' });
        if (broker.nftItemAddress) return res.status(400).json({ error: 'broker already has NFT' });

        const existingJob = await BrokerMintJob.findOne({ brokerId, status: { $in: ['pending', 'minting'] } });
        if (existingJob) return res.status(409).json({ error: 'mint already in progress' });

        const cfg = await getConfig();
        const cost = Math.max(0, Math.floor(Number(cfg.mintAibaCost ?? 100)));
        if (cost <= 0) return res.status(500).json({ error: 'mintAibaCost not configured' });

        const burn = await debitAibaFromUser(cost, {
            telegramId,
            reason: 'broker_mint_nft',
            arena: 'mint',
            league: 'global',
            sourceType: 'broker_mint_nft',
            sourceId: requestId,
            requestId,
            meta: { brokerId },
        });
        if (!burn.ok) return res.status(403).json({ error: 'insufficient AIBA' });

        const job = await BrokerMintJob.create({
            brokerId: broker._id,
            telegramId,
            status: 'pending',
            aibaPaid: cost,
        });
        res.status(201).json({
            ok: true,
            jobId: job._id,
            brokerId,
            aibaPaid: cost,
            aibaBalance: burn.user?.aibaBalance ?? 0,
            message: 'Mint job created. NFT will be minted and linked to your broker soon.',
        });
    } catch (err) {
        console.error('Broker mint-nft error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
