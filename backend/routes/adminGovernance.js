const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const GovernanceProposal = require('../models/GovernanceProposal');
const { applyAction } = require('../util/governanceActions');
const { validateBody } = require('../middleware/validate');
const { adminAudit } = require('../middleware/adminAudit');

router.use(requireAdmin(), adminAudit());

router.get('/proposals', async (_req, res) => {
    const proposals = await GovernanceProposal.find({}).sort({ createdAt: -1 }).lean();
    res.json({ proposals });
});

router.post(
    '/execute',
    validateBody({
        proposalId: { type: 'objectId', required: true },
    }),
    async (req, res) => {
    const { proposalId } = req.validatedBody || {};
    const proposal = await GovernanceProposal.findById(proposalId);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    const results = [];
    for (const action of proposal.actions || []) {
        // eslint-disable-next-line no-await-in-loop
        const r = await applyAction(action);
        results.push(r);
    }
    proposal.status = 'executed';
    await proposal.save();

    res.json({ ok: true, results });
    },
);

module.exports = router;
