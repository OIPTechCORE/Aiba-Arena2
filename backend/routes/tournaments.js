const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Tournament = require('../models/Tournament');
const TournamentEntry = require('../models/TournamentEntry');
const Broker = require('../models/Broker');
const { getConfig, tryEmitAiba, creditAibaNoCap, debitAibaFromUser } = require('../engine/economy');
const { getCreatorReferrerAndBps } = require('../engine/innovations');
const { simulateBattle } = require('../engine/battleEngine');
const { hmacSha256Hex } = require('../engine/deterministicRandom');
const { validateBody, validateParams } = require('../middleware/validate');

// GET /api/tournaments — list open/completed tournaments
router.get('/', async (req, res) => {
    try {
        const status = String(req.query.status || 'open').toLowerCase();
        const list = await Tournament.find(
            status === 'all' ? {} : { status: status === 'completed' ? 'completed' : 'open' },
        )
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.json(list);
    } catch (err) {
        console.error('Tournaments list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/tournaments/:id — single tournament with entries
router.get('/:id', async (req, res) => {
    try {
        const t = await Tournament.findById(req.params.id).lean();
        if (!t) return res.status(404).json({ error: 'tournament not found' });
        const entries = await TournamentEntry.find({ tournamentId: t._id }).populate('brokerId').lean();
        res.json({ ...t, entries });
    } catch (err) {
        console.error('Tournament get error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/tournaments/:id/enter — enter tournament (pay AIBA or TON)
router.post(
    '/:id/enter',
    requireTelegram,
    validateBody({
        brokerId: { type: 'objectId', required: true },
        txHash: { type: 'string', trim: true, maxLength: 128 },
    }),
    async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ error: 'tournament not found' });
        if (tournament.status !== 'open') return res.status(400).json({ error: 'tournament not open' });
        const count = await TournamentEntry.countDocuments({ tournamentId: tournament._id });
        if (count >= tournament.maxEntries) return res.status(400).json({ error: 'tournament full' });
        const existing = await TournamentEntry.findOne({ tournamentId: tournament._id, telegramId });
        if (existing) return res.status(409).json({ error: 'already entered' });
        const broker = await Broker.findById(req.validatedBody?.brokerId);
        if (!broker || String(broker.ownerTelegramId) !== telegramId) return res.status(403).json({ error: 'invalid broker' });
        if (broker.guildId) return res.status(400).json({ error: 'withdraw broker from guild first' });
        const cfg = await getConfig();
        const feeBps = Math.min(10000, Number(cfg.tournamentFeeBps ?? 2000));
        if (tournament.entryCostAiba > 0) {
            const debit = await debitAibaFromUser(tournament.entryCostAiba, {
                telegramId,
                reason: 'tournament_entry',
                arena: 'tournament',
                league: tournament.league,
                sourceType: 'tournament',
                sourceId: String(tournament._id),
                requestId: req.requestId || '',
                meta: { tournamentId: String(tournament._id) },
            });
            if (!debit.ok) return res.status(403).json({ error: debit.reason || 'insufficient AIBA' });
            const treasuryCut = Math.floor((tournament.entryCostAiba * feeBps) / 10000);
            const toPool = tournament.entryCostAiba - treasuryCut;
            await Tournament.updateOne(
                { _id: tournament._id },
                { $inc: { prizePoolAiba: toPool, treasuryCutAiba: treasuryCut } },
            );
        }
        await TournamentEntry.create({
            tournamentId: tournament._id,
            telegramId,
            brokerId: broker._id,
            paidAiba: tournament.entryCostAiba,
            paidTonTxHash: req.validatedBody?.txHash || '',
        });
        const updated = await Tournament.findById(tournament._id).lean();
        const newCount = count + 1;
        if (newCount >= updated.maxEntries) {
            runTournamentBracket(tournament._id).catch((e) => console.error('Tournament run error:', e));
        }
        res.status(201).json({ ok: true, tournament: await Tournament.findById(tournament._id).lean() });
    } catch (err) {
        console.error('Tournament enter error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
    },
);

async function runTournamentBracket(tournamentId) {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament || tournament.status !== 'open') return;
    const entries = await TournamentEntry.find({ tournamentId }).populate('brokerId').lean();
    const valid = entries.filter((e) => e.brokerId);
    if (valid.length < 2) return;
    const seed = tournament.seed || require('crypto').randomBytes(16).toString('hex');
    const prizes = [0.4, 0.25, 0.15, 0.1];
    const pool = tournament.prizePoolAiba || 0;
    const wins = {};
    valid.forEach((_, idx) => { wins[idx] = 0; });
    for (let i = 0; i < valid.length; i++) {
        for (let j = i + 1; j < valid.length; j++) {
            const a = valid[i].brokerId;
            const b = valid[j].brokerId;
            const s1 = hmacSha256Hex(seed + i + '-' + j, 'tournament');
            const s2 = hmacSha256Hex(seed + j + '-' + i, 'tournament');
            const r1 = simulateBattle({ broker: a, seed: s1, arena: tournament.arena, league: tournament.league });
            const r2 = simulateBattle({ broker: b, seed: s2, arena: tournament.arena, league: tournament.league });
            if (r1.score >= r2.score) wins[i]++;
            else wins[j]++;
        }
    }
    const sorted = valid.map((e, idx) => ({ ...e, idx, wins: wins[idx] || 0 })).sort((a, b) => b.wins - a.wins);
    await Tournament.updateOne({ _id: tournamentId }, { status: 'running', seed, startedAt: new Date() });
    for (let p = 0; p < Math.min(4, sorted.length); p++) {
        const share = Math.floor(pool * (prizes[p] || 0));
        if (share > 0) {
            const emit = await tryEmitAiba(share, { arena: 'tournament', league: tournament.league });
            if (emit.ok) {
                const winnerId = sorted[p].telegramId;
                await creditAibaNoCap(share, {
                    telegramId: winnerId,
                    reason: 'tournament_prize',
                    arena: 'tournament',
                    league: tournament.league,
                    sourceType: 'tournament',
                    sourceId: String(tournamentId),
                    meta: { position: p + 1, tournamentId: String(tournamentId) },
                });
                await TournamentEntry.updateOne(
                    { tournamentId, telegramId: winnerId },
                    { position: p + 1, aibaReward: share },
                );
                getConfig().then((cfg) =>
                    getCreatorReferrerAndBps(winnerId, cfg).then(async (creator) => {
                        if (!creator?.referrerTelegramId) return;
                        const creatorAiba = Math.floor((share * creator.bps) / 10000);
                        if (creatorAiba > 0) {
                            await creditAibaNoCap(creatorAiba, {
                                telegramId: creator.referrerTelegramId,
                                reason: 'creator_earnings',
                                arena: 'tournament',
                                league: tournament.league,
                                sourceType: 'creator_referee_tournament',
                                sourceId: String(tournamentId),
                                meta: { refereeTelegramId: winnerId, bps: creator.bps, amountAiba: creatorAiba },
                            });
                        }
                    })
                ).catch(() => {});
            }
        }
    }
    await Tournament.updateOne(
        { _id: tournamentId },
        { status: 'completed', completedAt: new Date(), winnerTelegramId: sorted[0]?.telegramId || '' },
    );
}

module.exports = router;
