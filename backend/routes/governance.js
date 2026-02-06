const express = require('express');
const GovernanceProposal = require('../models/GovernanceProposal');
const User = require('../models/User');
const { requireTelegram } = require('../middleware/requireTelegram');

const router = express.Router();

router.get('/proposals', async (_req, res) => {
    const proposals = await GovernanceProposal.find({}).sort({ createdAt: -1 }).lean();
    res.json({ proposals });
});

router.post('/propose', requireTelegram, async (req, res) => {
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
});

router.post('/vote', requireTelegram, async (req, res) => {
    const { proposalId, vote } = req.body || {};
    const proposal = await GovernanceProposal.findById(proposalId);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.status !== 'voting') return res.status(400).json({ error: 'Voting closed' });

    if (vote === 'for') proposal.votesFor += 1;
    else proposal.votesAgainst += 1;
    await proposal.save();
    res.json({ ok: true });
});

module.exports = router;
