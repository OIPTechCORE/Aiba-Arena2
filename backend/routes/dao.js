const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const { requireAdmin } = require('../middleware/requireAdmin');
const Proposal = require('../models/Proposal');
const Vote = require('../models/Vote');
const Treasury = require('../models/Treasury');
const User = require('../models/User');
const Staking = require('../models/Staking');
const StakingLock = require('../models/StakingLock');
const { getLimit } = require('../util/pagination');
const { creditAibaNoCap, creditNeurNoCap, getConfig } = require('../engine/economy');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');

const ADVISORY_TOTAL_AIBA_SUPPLY = 1_000_000_000_000;
const ADVISORY_PROPOSAL_MIN_BPS = 1; // 0.01% of 1T = 100,000,000 AIBA
const ADVISORY_PROPOSAL_MIN_DAYS = 90;

function getDaoProposalThresholds(cfg) {
    const advisoryFloorAiba = Math.floor((ADVISORY_TOTAL_AIBA_SUPPLY * ADVISORY_PROPOSAL_MIN_BPS) / 10000);
    const configuredMinAiba = Math.max(0, Number(cfg?.daoProposalMinStakedAiba ?? 0));
    const configuredMinDays = Math.max(1, Number(cfg?.daoProposalMinStakeDays ?? 1));
    return {
        minAiba: Math.max(advisoryFloorAiba, configuredMinAiba || 10_000),
        minDays: Math.max(ADVISORY_PROPOSAL_MIN_DAYS, configuredMinDays || 30),
    };
}

async function getQualifyingStake(telegramId, minDays) {
    const now = new Date();
    const minLockedAt = new Date(now.getTime() - minDays * 24 * 60 * 60 * 1000);
    let qualifyingStake = 0;

    const flexibleStake = await Staking.findOne({ telegramId }).lean();
    if (flexibleStake && flexibleStake.lockedAt && new Date(flexibleStake.lockedAt) <= minLockedAt) {
        qualifyingStake += Number(flexibleStake.amount ?? 0);
    }

    const lockedStakes = await StakingLock.find({
        telegramId,
        status: 'active',
        lockedAt: { $lte: minLockedAt },
    }).lean();
    for (const s of lockedStakes) qualifyingStake += Number(s.amount ?? 0);
    return qualifyingStake;
}

// GET /api/dao/config — staking requirements to create proposals (Advisory: 1T AIBA, ecosystem-aligned)
router.get('/config', requireTelegram, async (req, res) => {
    try {
        const cfg = await getConfig();
        const { minAiba, minDays } = getDaoProposalThresholds(cfg);
        let qualifyingStake = 0;

        const telegramId = req.telegramId ? String(req.telegramId) : '';
        if (telegramId) {
            qualifyingStake = await getQualifyingStake(telegramId, minDays);
        }

        res.json({
            daoProposalMinStakedAiba: minAiba,
            daoProposalMinStakeDays: minDays,
            yourQualifyingStake: qualifyingStake,
            canPropose: qualifyingStake >= minAiba,
        });
    } catch (err) {
        console.error('DAO config error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/dao/proposals — list proposals (active first, then closed)
router.get(
    '/proposals',
    requireTelegram,
    validateQuery({
        limit: { type: 'integer', min: 1, max: 50 },
        status: { type: 'string', trim: true, maxLength: 20 },
    }),
    async (req, res) => {
        try {
            const limit = getLimit({ query: { limit: req.validatedQuery?.limit } }, { defaultLimit: 20, maxLimit: 50 });
            const status = String(req.validatedQuery?.status ?? '')
                .trim()
                .toLowerCase();
            const match = status === 'active' ? { status: 'active' } : status === 'closed' ? { status: 'closed' } : {};

            const list = await Proposal.find(match).sort({ status: 1, createdAt: -1 }).limit(limit).lean();

            const withVotes = await Promise.all(
                list.map(async (p) => {
                    const votes = await Vote.find({ proposalId: p._id }).lean();
                    const votesFor = votes.filter((v) => v.support).length;
                    const votesAgainst = votes.filter((v) => !v.support).length;
                    return {
                        ...p,
                        votesFor,
                        votesAgainst,
                        totalVotes: votes.length,
                    };
                }),
            );

            res.json(withVotes);
        } catch (err) {
            console.error('DAO proposals error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// GET /api/dao/proposals/:id — single proposal with vote counts and user's vote
router.get(
    '/proposals/:id',
    requireTelegram,
    validateParams({ id: { type: 'objectId', required: true } }),
    async (req, res) => {
        try {
            const telegramId = req.telegramId ? String(req.telegramId) : '';
            const proposalId = req.validatedParams.id;

            const proposal = await Proposal.findById(proposalId).lean();
            if (!proposal) return res.status(404).json({ error: 'proposal not found' });

            const votes = await Vote.find({ proposalId }).lean();
            const votesFor = votes.filter((v) => v.support).length;
            const votesAgainst = votes.filter((v) => !v.support).length;
            const myVote = votes.find((v) => String(v.telegramId) === telegramId);

            res.json({
                ...proposal,
                votesFor,
                votesAgainst,
                totalVotes: votes.length,
                myVote: myVote ? (myVote.support ? 'for' : 'against') : null,
            });
        } catch (err) {
            console.error('DAO proposal detail error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// POST /api/dao/vote — vote on proposal (one vote per user per proposal)
router.post(
    '/vote',
    requireTelegram,
    validateBody({
        proposalId: { type: 'objectId', required: true },
        support: { type: 'boolean', required: true },
    }),
    async (req, res) => {
        try {
            const telegramId = req.telegramId ? String(req.telegramId) : '';
            if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

            const proposalId = req.validatedBody?.proposalId;
            const support = req.validatedBody?.support;

            const proposal = await Proposal.findById(proposalId);
            if (!proposal) return res.status(404).json({ error: 'proposal not found' });
            if (proposal.status !== 'active') return res.status(400).json({ error: 'proposal is closed' });

            const existing = await Vote.findOne({ proposalId, telegramId });
            if (existing) {
                existing.support = support;
                await existing.save();
                return res.json({ ok: true, updated: true, support });
            }

            await Vote.create({ proposalId, telegramId, support });
            res.status(201).json({ ok: true, support });
        } catch (err) {
            if (String(err?.code) === '11000') return res.status(409).json({ error: 'already voted' });
            console.error('DAO vote error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// Admin: create proposal (reuse admin middleware if available; for MVP allow any authenticated user to create)
router.post(
    '/proposals',
    requireTelegram,
    validateBody({
        title: { type: 'string', trim: true, minLength: 1, maxLength: 200, required: true },
        description: { type: 'string', trim: true, maxLength: 2000 },
        type: { type: 'string', trim: true, maxLength: 50 },
        recipientTelegramId: { type: 'string', trim: true, maxLength: 50 },
        payoutAiba: { type: 'integer', min: 0 },
        payoutNeur: { type: 'integer', min: 0 },
    }),
    async (req, res) => {
        try {
            const telegramId = req.telegramId ? String(req.telegramId) : '';
            if (!telegramId) return res.status(401).json({ error: 'telegram auth required' });

            const cfg = await getConfig();
            const { minAiba, minDays } = getDaoProposalThresholds(cfg);

            if (minAiba > 0 || minDays > 0) {
                const qualifyingStake = await getQualifyingStake(telegramId, minDays);

                if (qualifyingStake < minAiba) {
                    return res.status(403).json({
                        error: 'staking_required',
                        message: `Stake at least ${minAiba.toLocaleString()} AIBA for ${minDays} days to create proposals. You have ${qualifyingStake.toLocaleString()} qualifying.`,
                        minStakedAiba: minAiba,
                        minStakeDays: minDays,
                        yourQualifyingStake: qualifyingStake,
                    });
                }
            }

            const title = String(req.validatedBody?.title ?? '').trim();
            const description = String(req.validatedBody?.description ?? '').trim();
            const type = String(req.validatedBody?.type ?? 'general').trim();
            const recipientTelegramId = String(req.validatedBody?.recipientTelegramId ?? '').trim();
            const payoutAiba = Math.max(0, Math.floor(Number(req.validatedBody?.payoutAiba ?? 0)));
            const payoutNeur = Math.max(0, Math.floor(Number(req.validatedBody?.payoutNeur ?? 0)));

            if (!title) return res.status(400).json({ error: 'title required' });
            if (type === 'treasury_payout' && (!recipientTelegramId || (payoutAiba <= 0 && payoutNeur <= 0)))
                return res
                    .status(400)
                    .json({ error: 'treasury_payout requires recipientTelegramId and payoutAiba or payoutNeur' });

            const proposal = await Proposal.create({
                title,
                description,
                type,
                status: 'active',
                recipientTelegramId: type === 'treasury_payout' ? recipientTelegramId : '',
                payoutAiba: type === 'treasury_payout' ? payoutAiba : 0,
                payoutNeur: type === 'treasury_payout' ? payoutNeur : 0,
            });
            res.status(201).json(proposal);
        } catch (err) {
            console.error('DAO create proposal error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// PATCH /api/dao/proposals/:id/close — close proposal (admin)
router.patch('/proposals/:id/close', requireAdmin(), async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id);
        if (!proposal) return res.status(404).json({ error: 'proposal not found' });
        if (proposal.status !== 'active') return res.status(400).json({ error: 'proposal not active' });
        proposal.status = 'closed';
        proposal.closedAt = new Date();
        await proposal.save();
        res.json(proposal);
    } catch (err) {
        console.error('DAO close proposal error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/dao/proposals/:id/execute — execute treasury_payout (admin): pay from Treasury to recipient
router.post('/proposals/:id/execute', requireAdmin(), async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id);
        if (!proposal) return res.status(404).json({ error: 'proposal not found' });
        if (proposal.status === 'executed') return res.status(400).json({ error: 'already executed' });
        if (proposal.type !== 'treasury_payout')
            return res.status(400).json({ error: 'not a treasury_payout proposal' });
        const payoutAiba = Math.max(0, Math.floor(Number(proposal.payoutAiba ?? 0)));
        const payoutNeur = Math.max(0, Math.floor(Number(proposal.payoutNeur ?? 0)));
        if (payoutAiba <= 0 && payoutNeur <= 0) return res.status(400).json({ error: 'no payout amount' });

        let treasury = await Treasury.findOne();
        if (!treasury) treasury = await Treasury.create({});
        if ((treasury.balanceAiba ?? 0) < payoutAiba || (treasury.balanceNeur ?? 0) < payoutNeur)
            return res.status(403).json({ error: 'insufficient treasury balance' });

        await Treasury.updateOne(
            {},
            {
                $inc: {
                    balanceAiba: -payoutAiba,
                    balanceNeur: -payoutNeur,
                    totalPaidOutAiba: payoutAiba,
                    totalPaidOutNeur: payoutNeur,
                },
            },
        );
        const recipientTelegramId = String(proposal.recipientTelegramId ?? '').trim();
        if (payoutAiba > 0) {
            await creditAibaNoCap(payoutAiba, {
                telegramId: recipientTelegramId,
                reason: 'dao_treasury_payout',
                arena: 'dao',
                league: 'global',
                sourceType: 'dao_execute',
                sourceId: String(proposal._id),
                requestId: String(proposal._id),
                meta: { proposalId: String(proposal._id) },
            });
        }
        if (payoutNeur > 0) {
            await creditNeurNoCap(payoutNeur, {
                telegramId: recipientTelegramId,
                reason: 'dao_treasury_payout',
                arena: 'dao',
                league: 'global',
                sourceType: 'dao_execute',
                sourceId: String(proposal._id),
                requestId: String(proposal._id),
                meta: { proposalId: String(proposal._id) },
            });
        }
        proposal.status = 'executed';
        proposal.executedAt = new Date();
        await proposal.save();
        res.json({ ok: true, proposal: proposal.toObject() });
    } catch (err) {
        console.error('DAO execute proposal error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
