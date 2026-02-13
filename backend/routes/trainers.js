const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const Trainer = require('../models/Trainer');
const TrainerUse = require('../models/TrainerUse');
const User = require('../models/User');
const Battle = require('../models/Battle');
const { getConfig, creditAibaNoCap, creditNeurNoCap } = require('../engine/economy');
function randomCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// GET /api/trainers/network — global trainers network (public, approved only)
router.get('/network', async (req, res) => {
    try {
        const sort = String(req.query.sort || 'impact').toLowerCase();
        const limit = Math.min(100, Math.max(10, parseInt(req.query.limit, 10) || 50));
        const sortField = sort === 'referred' ? 'referredUserCount' : sort === 'rewards' ? 'rewardsEarnedAiba' : sort === 'recruited' ? 'recruitedTrainerCount' : 'totalImpactScore';
        const list = await Trainer.find({ status: 'approved' })
            .sort({ [sortField]: -1 })
            .limit(limit)
            .select('code username displayName bio specialty region referredUserCount recruitedTrainerCount rewardsEarnedAiba totalImpactScore createdAt')
            .lean();
        res.json(list);
    } catch (err) {
        console.error('Trainers network error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/trainers/leaderboard — global trainers leaderboard (public)
router.get('/leaderboard', async (req, res) => {
    try {
        const by = String(req.query.by || 'impact').toLowerCase();
        const limit = Math.min(100, Math.max(10, parseInt(req.query.limit, 10) || 50));
        const sortField = by === 'referred' ? 'referredUserCount' : by === 'rewards' ? 'rewardsEarnedAiba' : by === 'recruited' ? 'recruitedTrainerCount' : 'totalImpactScore';
        const list = await Trainer.find({ status: 'approved' })
            .sort({ [sortField]: -1 })
            .limit(limit)
            .select('code telegramId username displayName specialty region referredUserCount recruitedTrainerCount rewardsEarnedAiba totalImpactScore')
            .lean();
        const ranked = list.map((t, i) => ({ ...t, rank: i + 1 }));
        res.json(ranked);
    } catch (err) {
        console.error('Trainers leaderboard error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// PATCH /api/trainers/profile — update my trainer profile (bio, displayName, specialty, region)
router.patch('/profile', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const trainer = await Trainer.findOne({ telegramId, status: 'approved' });
        if (!trainer) return res.status(403).json({ error: 'not an approved trainer' });
        const updates = {};
        if (req.body?.displayName != null) updates.displayName = String(req.body.displayName).trim().slice(0, 48);
        if (req.body?.bio != null) updates.bio = String(req.body.bio).trim().slice(0, 500);
        if (req.body?.specialty != null) updates.specialty = String(req.body.specialty).trim().slice(0, 32) || 'general';
        if (req.body?.region != null) updates.region = String(req.body.region).trim().slice(0, 48);
        if (Object.keys(updates).length > 0) {
            await Trainer.updateOne({ _id: trainer._id }, { $set: updates });
        }
        const updated = await Trainer.findOne({ telegramId }).lean();
        res.json(updated);
    } catch (err) {
        console.error('Trainer profile update error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/trainers/recruit-link — get viral trainer signup link (public or with ref)
router.get('/recruit-link', async (req, res) => {
    try {
        const ref = String(req.query.ref || '').trim().toUpperCase();
        const base = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://aiba-arena2-miniapp.vercel.app';
        const path = '/trainer';
        const url = ref ? `${base}${path}?ref=${encodeURIComponent(ref)}` : `${base}${path}`;
        res.json({ url, ref: ref || null });
    } catch (err) {
        console.error('Trainer recruit link error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/trainers/apply — apply to become trainer (telegram auth). Optional ref=inviter trainer code.
router.post('/apply', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const ref = String(req.body?.ref || req.query?.ref || '').trim().toUpperCase();
        const existing = await Trainer.findOne({ telegramId });
        if (existing) {
            return res.json({
                ok: true,
                alreadyTrainer: true,
                code: existing.code,
                status: existing.status,
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://aiba-arena2-miniapp.vercel.app'}/trainer?ref=${existing.code}`,
            });
        }
        let code = randomCode();
        while (await Trainer.findOne({ code })) code = randomCode();
        let invitedBy = null;
        if (ref) {
            const inviter = await Trainer.findOne({ code: ref, status: 'approved' });
            if (inviter) invitedBy = inviter._id;
        }
        const user = await User.findOne({ telegramId }).lean();
        const trainer = await Trainer.create({
            telegramId,
            username: user?.username || user?.telegram?.username || '',
            code,
            invitedByTrainerId: invitedBy,
            status: 'pending',
        });
        if (invitedBy) {
            await Trainer.updateOne({ _id: invitedBy }, { $inc: { recruitedTrainerCount: 1 } });
        }
        res.status(201).json({
            ok: true,
            code: trainer.code,
            status: trainer.status,
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://aiba-arena2-miniapp.vercel.app'}/trainer?ref=${trainer.code}`,
        });
    } catch (err) {
        console.error('Trainer apply error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/trainers/me — my trainer stats
router.get('/me', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const trainer = await Trainer.findOne({ telegramId }).lean();
        if (!trainer) return res.json({ isTrainer: false });
        const base = process.env.NEXT_PUBLIC_APP_URL || 'https://aiba-arena2-miniapp.vercel.app';
        res.json({
            isTrainer: true,
            ...trainer,
            recruitUrl: `${base}/trainer?ref=${trainer.code}`,
        });
    } catch (err) {
        console.error('Trainer me error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/trainers/register-use — record a user who signed up via trainer link (called when user completes first action with ?trainer=CODE)
router.post('/register-use', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const code = String(req.body?.code || '').trim().toUpperCase();
        if (!code) return res.status(400).json({ error: 'code required' });
        const trainer = await Trainer.findOne({ code, status: 'approved' });
        if (!trainer) return res.status(404).json({ error: 'trainer not found' });
        const existing = await TrainerUse.findOne({ trainerId: trainer._id, refereeTelegramId: telegramId });
        if (existing) return res.json({ ok: true, recorded: false });
        await TrainerUse.create({
            trainerId: trainer._id,
            refereeTelegramId: telegramId,
        });
        await Trainer.updateOne({ _id: trainer._id }, { $inc: { referredUserCount: 1 } });
        res.json({ ok: true, recorded: true });
    } catch (err) {
        console.error('Trainer register-use error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/trainers/claim-rewards — claim pending trainer rewards
router.post('/claim-rewards', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const trainer = await Trainer.findOne({ telegramId, status: 'approved' });
        if (!trainer) return res.status(403).json({ error: 'not an approved trainer' });
        const cfg = await getConfig();
        const aibaPerUser = Math.max(0, Number(cfg.trainerRewardAibaPerUser ?? 5));
        const aibaPerRecruitedTrainer = Math.max(0, Number(cfg.trainerRewardAibaPerRecruitedTrainer ?? 20));
        const uses = await TrainerUse.find({ trainerId: trainer._id }).lean();
        const battleCounts = await Battle.aggregate([
            { $match: { ownerTelegramId: { $in: uses.map((u) => u.refereeTelegramId) } } },
            { $group: { _id: '$ownerTelegramId', count: { $sum: 1 } } },
        ]);
        const qualified = battleCounts.filter((b) => b.count >= 3).length;
        const newQualified = Math.max(0, qualified - (trainer.referredUsersWithBattles || 0));
        const pendingAiba = Math.floor(newQualified * aibaPerUser);
        if (pendingAiba <= 0) return res.json({ ok: true, claimedAiba: 0, message: 'No pending rewards.' });
        await creditAibaNoCap(pendingAiba, {
            telegramId,
            reason: 'trainer_reward',
            arena: 'trainer',
            league: 'global',
            sourceType: 'trainer',
            sourceId: String(trainer._id),
            meta: { qualified, recruited: trainer.recruitedTrainerCount },
        });
        await Trainer.updateOne(
            { _id: trainer._id },
            {
                $inc: { rewardsEarnedAiba: pendingAiba },
                $set: {
                    referredUsersWithBattles: qualified,
                    lastRewardClaimedAt: new Date(),
                    totalImpactScore: qualified * 10 + (trainer.recruitedTrainerCount || 0) * 50,
                },
            },
        );
        res.json({ ok: true, claimedAiba: pendingAiba });
    } catch (err) {
        console.error('Trainer claim error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
