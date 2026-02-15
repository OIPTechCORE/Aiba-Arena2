/**
 * Admin DAO: list proposals (admin only; no telegram auth required)
 */
const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const Proposal = require('../models/Proposal');
const Vote = require('../models/Vote');
const { getLimit } = require('../util/pagination');
const { validateQuery } = require('../middleware/validate');
const { adminAudit } = require('../middleware/adminAudit');

router.use(requireAdmin(), adminAudit());

// GET /api/admin/dao/proposals — list proposals with vote counts (admin)
router.get(
    '/proposals',
    validateQuery({
        limit: { type: 'integer', min: 1, max: 50 },
        status: { type: 'string', trim: true, maxLength: 20 },
    }),
    async (req, res) => {
        try {
            const limit = getLimit(
                { query: { limit: req.validatedQuery?.limit } },
                { defaultLimit: 20, maxLimit: 50 },
            );
            const status = String(req.validatedQuery?.status ?? '').trim().toLowerCase();
            const match = status === 'active' ? { status: 'active' } : status === 'closed' ? { status: 'closed' } : status === 'executed' ? { status: 'executed' } : {};

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
            console.error('Admin DAO proposals error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

module.exports = router;
