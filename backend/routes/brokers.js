const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Broker = require('../models/Broker');
const ActionRunKey = require('../models/ActionRunKey');
const { getIdempotencyKey } = require('../engine/idempotencyKey');
const { getConfig, debitNeurFromUser, debitAibaFromUser } = require('../engine/economy');

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

module.exports = router;
