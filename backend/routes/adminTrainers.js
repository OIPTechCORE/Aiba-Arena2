const router = require('express').Router();
const { requireAdmin } = require('../middleware/requireAdmin');
const { adminAudit } = require('../middleware/adminAudit');
const Trainer = require('../models/Trainer');

router.use(requireAdmin(), adminAudit());

// GET /api/admin/trainers — list all trainers
router.get('/', async (req, res) => {
    try {
        const list = await Trainer.find({}).sort({ referredUserCount: -1 }).limit(200).lean();
        res.json(list);
    } catch (err) {
        console.error('Admin trainers list error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// PATCH /api/admin/trainers/:id — approve/suspend
router.patch('/:id', async (req, res) => {
    try {
        const status = String(req.body?.status || 'approved');
        if (!['pending', 'approved', 'suspended'].includes(status)) {
            return res.status(400).json({ error: 'invalid status' });
        }
        const trainer = await Trainer.findById(req.params.id);
        if (!trainer) return res.status(404).json({ error: 'trainer not found' });
        const wasApproved = trainer.status === 'approved';
        await Trainer.updateOne({ _id: req.params.id }, { $set: { status } });
        if (status === 'approved' && !wasApproved && trainer.invitedByTrainerId) {
            const { getConfig, creditAibaNoCap } = require('../engine/economy');
            const cfg = await getConfig();
            const aiba = Math.max(0, Number(cfg.trainerRewardAibaPerRecruitedTrainer ?? 20));
            if (aiba > 0) {
                const inviter = await Trainer.findById(trainer.invitedByTrainerId);
                if (inviter) {
                    await creditAibaNoCap(aiba, {
                        telegramId: inviter.telegramId,
                        reason: 'trainer_recruit_bonus',
                        arena: 'trainer',
                        league: 'global',
                        sourceType: 'trainer',
                        sourceId: String(trainer._id),
                        meta: { recruitedTelegramId: trainer.telegramId },
                    });
                    await Trainer.updateOne(
                        { _id: inviter._id },
                        { $inc: { rewardsEarnedAiba: aiba } },
                    );
                }
            }
        }
        res.json({ ok: true });
    } catch (err) {
        console.error('Admin trainer update error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
