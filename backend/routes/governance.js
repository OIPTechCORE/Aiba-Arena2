const express = require('express');
const GovernanceProposal = require('../models/GovernanceProposal');
const User = require('../models/User');
const { requireTelegram } = require('../middleware/requireTelegram');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

router.get('/proposals', async (_req, res) => {
    const proposals = await GovernanceProposal.find({}).sort({ createdAt: -1 }).lean();
    res.json({ proposals });
});

router.post(
    '/propose',
    requireTelegram,
    validateBody({
        title: { type: 'string', trim: true, maxLength: 200 },
        description: { type: 'string', trim: true, maxLength: 2000 },
        actions: { type: 'array', itemType: 'string', maxLength: 50 },
    }),
    async (req, res) => {
    const { title, description, actions } = req.body || {};
    const user = await User.findOne({ telegramId: req.telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const proposal = await GovernanceProposal.create({
        title,
        description,
        actions: Array.isArray(actions) ? actions : [],
        createdBy: user._id,
        status: 'voting',
        startAt: new Date(),
        endAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    });
    res.json({ proposal });
    },
);

router.post(
    '/vote',
    requireTelegram,
    validateBody({
        proposalId: { type: 'objectId', required: true },
        vote: { type: 'string', trim: true, enum: ['for', 'against'] },
    }),
    async (req, res) => {
    const { proposalId, vote } = req.body || {};
    if (!proposalId) return res.status(400).json({ error: 'proposalId required' });
    if (vote !== 'for' && vote !== 'against') {
        return res.status(400).json({ error: "vote must be 'for' or 'against'" });
    }
    const proposal = await GovernanceProposal.findById(proposalId);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.status !== 'voting') return res.status(400).json({ error: 'Voting closed' });

    if (vote === 'for') proposal.votesFor += 1;
    else proposal.votesAgainst += 1;
    await proposal.save();
    res.json({ ok: true });
    },
);

module.exports = router;
