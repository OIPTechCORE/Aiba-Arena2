const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const Referral = require('../models/Referral');
const ReferralUse = require('../models/ReferralUse');
const { validateQuery } = require('../middleware/validate');
const { adminAudit } = require('../middleware/adminAudit');

router.use(requireAdmin(), adminAudit());

// GET /api/admin/referrals — list all referral codes with stats
router.get(
    '/',
    validateQuery({
        limit: { type: 'string', trim: true, maxLength: 10 },
        ownerTelegramId: { type: 'string', trim: true, maxLength: 50 },
    }),
    async (req, res) => {
        try {
            const limit = Math.min(Number(req.validatedQuery?.limit) || 100, 200);
            const ownerTelegramId = req.validatedQuery?.ownerTelegramId?.trim();
            const q = {};
            if (ownerTelegramId) q.ownerTelegramId = ownerTelegramId;

            const referrals = await Referral.find(q).sort({ uses: -1, createdAt: -1 }).limit(limit).lean();
            res.json(referrals);
        } catch (err) {
            console.error('Admin referrals list error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

// GET /api/admin/referrals/stats — aggregate stats
router.get('/stats', async (_req, res) => {
    try {
        const [totalCodes, totalUses, topRefs] = await Promise.all([
            Referral.countDocuments({ active: true }),
            ReferralUse.countDocuments(),
            Referral.aggregate([
                { $match: { active: true, uses: { $gt: 0 } } },
                { $sort: { uses: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'ownerTelegramId',
                        foreignField: 'telegramId',
                        as: 'user',
                    },
                },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        ownerTelegramId: 1,
                        code: 1,
                        uses: 1,
                        username: '$user.username',
                    },
                },
            ]),
        ]);
        res.json({
            totalActiveCodes: totalCodes,
            totalReferralUses: totalUses,
            topReferrers: topRefs,
        });
    } catch (err) {
        console.error('Admin referrals stats error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// PATCH /api/admin/referrals/:id — deactivate or update a referral code
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { active, maxUses } = req.body || {};
        const update = {};
        if (typeof active === 'boolean') update.active = active;
        if (typeof maxUses === 'number' && maxUses >= 0) update.maxUses = maxUses;
        if (Object.keys(update).length === 0) return res.status(400).json({ error: 'no valid update fields' });

        const ref = await Referral.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
        if (!ref) return res.status(404).json({ error: 'not found' });
        res.json(ref);
    } catch (err) {
        console.error('Admin referrals patch error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/admin/referrals/uses — list recent referral uses
router.get(
    '/uses',
    validateQuery({
        limit: { type: 'string', trim: true, maxLength: 10 },
        code: { type: 'string', trim: true, maxLength: 32 },
    }),
    async (req, res) => {
        try {
            const limit = Math.min(Number(req.validatedQuery?.limit) || 50, 200);
            const code = req.validatedQuery?.code?.trim().toLowerCase();
            const q = {};
            if (code) q.code = code;

            const uses = await ReferralUse.find(q).sort({ createdAt: -1 }).limit(limit).lean();
            res.json(uses);
        } catch (err) {
            console.error('Admin referrals uses error:', err);
            res.status(500).json({ error: 'internal server error' });
        }
    },
);

module.exports = router;
