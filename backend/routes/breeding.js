const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Broker = require('../models/Broker');
const { getConfig, debitAibaFromUser, creditAibaNoCap, tryEmitAiba } = require('../engine/economy');
const { validateBody } = require('../middleware/validate');

// POST /api/breeding/breed — combine 2 brokers into 1 (burns both + AIBA cost)
router.post(
    '/breed',
    requireTelegram,
    validateBody({
        brokerIdA: { type: 'objectId', required: true },
        brokerIdB: { type: 'objectId', required: true },
    }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const [idA, idB] = [req.validatedBody?.brokerIdA, req.validatedBody?.brokerIdB];
            if (String(idA) === String(idB)) return res.status(400).json({ error: 'must use two different brokers' });
            const [brokerA, brokerB] = await Promise.all([Broker.findById(idA), Broker.findById(idB)]);
            if (!brokerA || !brokerB) return res.status(404).json({ error: 'broker not found' });
            if (String(brokerA.ownerTelegramId) !== telegramId || String(brokerB.ownerTelegramId) !== telegramId) {
                return res.status(403).json({ error: 'not your brokers' });
            }
            if (brokerA.guildId || brokerB.guildId) return res.status(400).json({ error: 'withdraw from guild first' });
            const cfg = await getConfig();
            const cost = Math.max(0, Number(cfg.breedCostAiba ?? 200));
            const debit = await debitAibaFromUser(cost, {
                telegramId,
                reason: 'breeding',
                arena: 'breeding',
                league: 'global',
                sourceType: 'breeding',
                sourceId: `${idA}-${idB}`,
                requestId: req.requestId || '',
                meta: { brokerIdA: String(idA), brokerIdB: String(idB) },
            });
            if (!debit.ok) return res.status(403).json({ error: 'insufficient AIBA' });
            const int = Math.round((brokerA.intelligence + brokerB.intelligence) / 2 + (Math.random() - 0.5) * 10);
            const spd = Math.round((brokerA.speed + brokerB.speed) / 2 + (Math.random() - 0.5) * 10);
            const rsk = Math.round((brokerA.risk + brokerB.risk) / 2 + (Math.random() - 0.5) * 10);
            const child = await Broker.create({
                ownerTelegramId: telegramId,
                intelligence: Math.max(0, Math.min(100, int)),
                speed: Math.max(0, Math.min(100, spd)),
                risk: Math.max(0, Math.min(100, rsk)),
                specialty: brokerA.specialty || 'crypto',
                level: 1,
                xp: 0,
                energy: 100,
                energyUpdatedAt: new Date(),
            });
            await Broker.deleteOne({ _id: idA });
            await Broker.deleteOne({ _id: idB });
            res.status(201).json({
                ok: true,
                child: {
                    _id: child._id,
                    intelligence: child.intelligence,
                    speed: child.speed,
                    risk: child.risk,
                },
            });
        } catch (err) {
            console.error('Breeding error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

module.exports = router;
