/**
 * Predict/Bet — "Battle of the hour". Users bet AIBA on which broker scores higher.
 * INNOVATIONS-100X-ADVISORY §4. Vig → treasury.
 */
const router = require('express').Router();
const mongoose = require('mongoose');
const { requireTelegram } = require('../middleware/requireTelegram');
const PredictEvent = require('../models/PredictEvent');
const PredictBet = require('../models/PredictBet');
const Broker = require('../models/Broker');
const { getConfig, debitAibaFromUser, creditAibaNoCap } = require('../engine/economy');
const { getIdempotencyKey } = require('../engine/idempotencyKey');
const { rateLimit } = require('../middleware/rateLimit');
const { validateBody, validateParams } = require('../middleware/validate');

// GET /api/predict/events — list open (and optionally resolved) events
router.get(
    '/events',
    rateLimit({ windowMs: 60_000, max: 60, keyFn: (req) => `predict_events:${req.ip || 'unknown'}` }),
    async (req, res) => {
        try {
            const status = String(req.query.status || 'open').toLowerCase();
            const query = status === 'all' ? {} : { status: status === 'resolved' ? 'resolved' : 'open' };
            const list = await PredictEvent.find(query)
                .populate('brokerAId', 'intelligence speed risk ownerTelegramId')
                .populate('brokerBId', 'intelligence speed risk ownerTelegramId')
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();
            res.json(list);
        } catch (err) {
            console.error('Predict events list error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// GET /api/predict/events/:id — single event with bets (aggregated)
router.get('/events/:id', validateParams({ id: { type: 'objectId', required: true } }), async (req, res) => {
    try {
        const ev = await PredictEvent.findById(req.params.id)
            .populate('brokerAId', 'intelligence speed risk ownerTelegramId')
            .populate('brokerBId', 'intelligence speed risk ownerTelegramId')
            .lean();
        if (!ev) return res.status(404).json({ error: 'event not found' });
        const betCount = await PredictBet.countDocuments({ eventId: ev._id });
        res.json({ ...ev, betCount });
    } catch (err) {
        console.error('Predict event get error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/predict/events/:id/bet — place bet (authenticated)
router.post(
    '/events/:id/bet',
    requireTelegram,
    rateLimit({ windowMs: 60_000, max: 10, keyFn: (req) => `predict_bet:${req.telegramId || 'unknown'}` }),
    validateParams({ id: { type: 'objectId', required: true } }),
    validateBody({
        brokerId: { type: 'objectId', required: true },
        amountAiba: { type: 'integer', min: 1, required: true },
        requestId: { type: 'string', trim: true, minLength: 1, maxLength: 128, required: true },
    }),
    async (req, res) => {
        try {
            const telegramId = String(req.telegramId || '');
            const eventId = req.params.id;
            const requestId = getIdempotencyKey(req);
            if (!requestId) return res.status(400).json({ error: 'requestId required' });
            const { brokerId, amountAiba } = req.validatedBody;

            // Idempotency: return existing bet if same requestId already processed
            const existing = await PredictBet.findOne({ requestId }).lean();
            if (existing) {
                return res
                    .status(201)
                    .json({ ok: true, amountAiba: existing.amountAiba, brokerId: String(existing.brokerId) });
            }

            const ev = await PredictEvent.findById(eventId);
            if (!ev) return res.status(404).json({ error: 'event not found' });
            if (ev.status !== 'open') return res.status(400).json({ error: 'event not open for betting' });

            const brokerAStr = String(ev.brokerAId);
            const brokerBStr = String(ev.brokerBId);
            const betBrokerStr = String(brokerId);
            if (betBrokerStr !== brokerAStr && betBrokerStr !== brokerBStr) {
                return res.status(400).json({ error: 'must bet on broker A or B' });
            }
            const pickedBroker = await Broker.findById(brokerId).lean();
            if (!pickedBroker) return res.status(404).json({ error: 'broker not found' });
            if (String(pickedBroker.ownerTelegramId || '') === telegramId) {
                return res.status(400).json({ error: 'cannot bet on your own broker' });
            }

            const cfg = await getConfig();
            const cfgMaxBet = Math.min(100000, Math.max(1, Number(cfg?.predictMaxBetAiba ?? 10_000)));
            const eventMaxBet = Math.min(100000, Math.max(1, Number(ev.maxBetAiba ?? cfgMaxBet)));
            const maxBet = Math.min(cfgMaxBet, eventMaxBet);
            const amt = Math.min(amountAiba, maxBet);
            if (amt < 1) return res.status(400).json({ error: 'amount too small' });

            const debit = await debitAibaFromUser(amt, {
                telegramId,
                reason: 'predict_bet',
                arena: 'predict',
                league: 'global',
                sourceType: 'predict_bet',
                sourceId: `${String(ev._id)}:${telegramId}`,
                requestId,
                meta: { eventId: String(ev._id), brokerId: betBrokerStr },
            });
            if (!debit.ok) {
                if (debit.duplicate) return res.status(201).json({ ok: true, amountAiba: amt, brokerId: betBrokerStr });
                return res.status(403).json({ error: debit.reason || 'insufficient AIBA' });
            }

            try {
                const session = await mongoose.startSession();
                try {
                    await session.withTransaction(async () => {
                        await PredictBet.create(
                            [{ eventId: ev._id, telegramId, brokerId, amountAiba: amt, requestId }],
                            { session },
                        );
                        const updated = await PredictEvent.updateOne(
                            {
                                _id: ev._id,
                                status: 'open',
                                $or: [{ brokerAId: brokerId }, { brokerBId: brokerId }],
                            },
                            {
                                $inc: {
                                    poolAiba: betBrokerStr === brokerAStr ? amt : 0,
                                    poolBiba: betBrokerStr === brokerBStr ? amt : 0,
                                },
                            },
                            { session },
                        );
                        if (!updated.modifiedCount) throw new Error('event_not_open');
                    });
                } finally {
                    await session.endSession();
                }
            } catch (e) {
                if (String(e?.code) === '11000') return res.status(409).json({ error: 'already bet on this event' });
                await creditAibaNoCap(amt, {
                    telegramId,
                    reason: 'predict_bet_refund',
                    arena: 'predict',
                    league: 'global',
                    sourceType: 'predict_bet_refund',
                    sourceId: `${String(ev._id)}:${telegramId}:${requestId}`,
                    requestId,
                    meta: { eventId: String(ev._id), brokerId: betBrokerStr, reason: 'bet_record_failed' },
                }).catch(() => {});
                throw e;
            }

            res.status(201).json({ ok: true, amountAiba: amt, brokerId: betBrokerStr });
        } catch (err) {
            console.error('Predict bet error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

module.exports = router;
