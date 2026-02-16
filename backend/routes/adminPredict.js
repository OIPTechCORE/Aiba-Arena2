/**
 * Admin Predict — create events, resolve (run battle, pay winners, vig to treasury).
 */
const router = require('express').Router();
const mongoose = require('mongoose');
const { requireAdmin } = require('../middleware/requireAdmin');
const { adminAudit } = require('../middleware/adminAudit');
const PredictEvent = require('../models/PredictEvent');
const PredictBet = require('../models/PredictBet');
const Broker = require('../models/Broker');
const { getConfig, creditAibaNoCap } = require('../engine/economy');
const crypto = require('crypto');
const { simulateBattle } = require('../engine/battleEngine');
const { seedFromHex } = require('../engine/deterministicRandom');
const TreasuryOp = require('../models/TreasuryOp');
const { validateBody, validateParams } = require('../middleware/validate');

router.use(requireAdmin(), adminAudit());

// POST /api/admin/predict/events — create event (broker A vs broker B)
router.post(
    '/events',
    validateBody({
        brokerAId: { type: 'objectId', required: true },
        brokerBId: { type: 'objectId', required: true },
        arena: { type: 'string', trim: true, minLength: 1, maxLength: 64 },
        league: { type: 'string', trim: true, minLength: 1, maxLength: 64 },
    }),
    async (req, res) => {
    try {
        const { brokerAId, brokerBId, arena = 'prediction', league = 'rookie' } = req.validatedBody || {};
        if (!brokerAId || !brokerBId || String(brokerAId) === String(brokerBId)) {
            return res.status(400).json({ error: 'brokerAId and brokerBId required, must differ' });
        }
        const [a, b] = await Promise.all([Broker.findById(brokerAId), Broker.findById(brokerBId)]);
        if (!a || !b) return res.status(404).json({ error: 'broker not found' });

        const cfg = await getConfig();
        const ev = await PredictEvent.create({
            brokerAId: a._id,
            brokerBId: b._id,
            arena: arena || 'prediction',
            league: league || 'rookie',
            vigBps: Math.min(1000, Math.max(0, Number(cfg?.predictVigBps ?? 300))),
            maxBetAiba: Math.min(100000, Math.max(100, Number(cfg?.predictMaxBetAiba ?? 10_000))),
        });

        res.status(201).json(ev);
    } catch (err) {
        console.error('Admin predict create error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

// POST /api/admin/predict/events/:id/resolve — run battle, pay winners, vig → treasury
router.post('/events/:id/resolve', validateParams({ id: { type: 'objectId', required: true } }), async (req, res) => {
    try {
        const eventId = String(req.validatedParams.id || '');
        const ev = await PredictEvent.findById(eventId);
        if (!ev) return res.status(404).json({ error: 'event not found' });
        if (ev.status !== 'open') return res.status(400).json({ error: 'already resolved' });

        const [brokerA, brokerB] = await Promise.all([
            Broker.findById(ev.brokerAId).lean(),
            Broker.findById(ev.brokerBId).lean(),
        ]);
        if (!brokerA || !brokerB) return res.status(400).json({ error: 'broker missing' });

        const seedHex = crypto.randomBytes(8).toString('hex');
        const seed = seedFromHex(seedHex);
        const resultA = simulateBattle({ broker: brokerA, seed, arena: ev.arena || 'prediction', league: ev.league || 'rookie' });
        const resultB = simulateBattle({ broker: brokerB, seed, arena: ev.arena || 'prediction', league: ev.league || 'rookie' });

        const scoreA = resultA.score;
        const scoreB = resultB.score;
        const winnerId = scoreA >= scoreB ? ev.brokerAId : ev.brokerBId;
        const winnerPool = String(winnerId) === String(ev.brokerAId) ? (ev.poolAiba || 0) : (ev.poolBiba || 0);
        const totalPool = (ev.poolAiba || 0) + (ev.poolBiba || 0);
        if (!Number.isFinite(totalPool) || totalPool < 0) return res.status(400).json({ error: 'invalid pool totals' });
        const vigBps = Math.min(1000, Math.max(0, ev.vigBps ?? 300));
        const vigAiba = Math.floor((totalPool * vigBps) / 10000);
        const toWinners = Math.max(0, totalPool - vigAiba);

        // Atomic: status transition + treasury op in one transaction first; then payouts (idempotent by sourceId).
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const updated = await PredictEvent.updateOne(
                    { _id: ev._id, status: 'open' },
                    {
                        $set: {
                            status: 'resolved',
                            resultBrokerId: winnerId,
                            scoreA,
                            scoreB,
                            resolvedAt: new Date(),
                        },
                    },
                    { session },
                );
                if (!updated.modifiedCount) throw new Error('already_resolved');

                if (vigAiba > 0) {
                    try {
                        await TreasuryOp.create(
                            [{ type: 'predict_vig', amountAiba: vigAiba, source: 'predict', refId: String(ev._id) }],
                            { session },
                        );
                    } catch (treasuryErr) {
                        console.error('Admin predict resolve: treasury op failed', { eventId: String(ev._id), vigAiba, err: treasuryErr });
                        throw treasuryErr;
                    }
                }
            });
        } finally {
            await session.endSession();
        }

        // Payout winners (idempotent by sourceId; log failures, do not swallow)
        if (toWinners > 0 && winnerPool > 0) {
            const bets = await PredictBet.find({ eventId: ev._id, brokerId: winnerId }).lean();
            const totalWinnerBets = bets.reduce((s, b) => s + (b.amountAiba || 0), 0);
            if (totalWinnerBets > 0) {
                for (const b of bets) {
                    const share = Math.floor((toWinners * b.amountAiba) / totalWinnerBets);
                    if (share > 0) {
                        const credited = await creditAibaNoCap(share, {
                            telegramId: b.telegramId,
                            reason: 'predict_win',
                            arena: 'predict',
                            league: 'global',
                            sourceType: 'predict_win',
                            sourceId: `${String(ev._id)}:${String(b._id)}`,
                            requestId: `predict_resolve:${String(ev._id)}`,
                            meta: { eventId: String(ev._id), amountAiba: share },
                        });
                        if (!credited?.ok) {
                            console.error('Admin predict resolve payout failed', { eventId: String(ev._id), betId: String(b._id), share, telegramId: b.telegramId });
                            throw new Error(`payout_failed:${String(b._id)}`);
                        }
                    }
                }
            }
        }

        res.json({
            ok: true,
            scoreA,
            scoreB,
            winnerId,
            vigAiba,
            toWinners,
        });
    } catch (err) {
        console.error('Admin predict resolve error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
