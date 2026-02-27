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

function startOfWeekUTC(d) {
    const date = new Date(d);
    const day = date.getUTCDay();
    const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff, 0, 0, 0, 0));
    return monday;
}
function startOfMonthUTC(d) {
    const date = new Date(d);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

function getTierMultiplierBps(referredCount, cfg) {
    const map =
        cfg?.trainerTierBpsByReferred && typeof cfg.trainerTierBpsByReferred.get === 'function'
            ? cfg.trainerTierBpsByReferred
            : cfg?.trainerTierBpsByReferred && typeof cfg.trainerTierBpsByReferred === 'object'
              ? new Map(Object.entries(cfg.trainerTierBpsByReferred).map(([k, v]) => [Number(k), Number(v)]))
              : new Map([
                    [0, 100],
                    [10, 110],
                    [50, 150],
                    [100, 200],
                    [500, 250],
                ]);
    const thresholds = [...map.keys()].filter((k) => Number.isFinite(k)).sort((a, b) => a - b);
    let bps = 100;
    for (const t of thresholds) {
        if (referredCount >= t) bps = map.get(t) ?? bps;
    }
    return bps;
}

function computeMilestonesUnlocked(
    referred,
    recruited,
    milestoneReferred = [5, 10, 25, 50, 100, 250, 500],
    milestoneRecruited = [1, 3, 5, 10],
) {
    const unlocked = [];
    for (const m of milestoneReferred) if (referred >= m) unlocked.push(`ref_${m}`);
    for (const m of milestoneRecruited) if (recruited >= m) unlocked.push(`rec_${m}`);
    return unlocked;
}

// GET /api/trainers/network — global trainers network (public, approved only)
router.get('/network', async (req, res) => {
    try {
        const sort = String(req.query.sort || 'impact').toLowerCase();
        const limit = Math.min(100, Math.max(10, parseInt(req.query.limit, 10) || 50));
        const sortField =
            sort === 'referred'
                ? 'referredUserCount'
                : sort === 'rewards'
                  ? 'rewardsEarnedAiba'
                  : sort === 'recruited'
                    ? 'recruitedTrainerCount'
                    : 'totalImpactScore';
        const list = await Trainer.find({ status: 'approved' })
            .sort({ [sortField]: -1 })
            .limit(limit)
            .select(
                'code username displayName bio specialty region referredUserCount recruitedTrainerCount rewardsEarnedAiba totalImpactScore createdAt',
            )
            .lean();
        res.json(list);
    } catch (err) {
        console.error('Trainers network error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/trainers/leaderboard — global trainers leaderboard (public). period=alltime|monthly|weekly
router.get('/leaderboard', async (req, res) => {
    try {
        const by = String(req.query.by || 'impact').toLowerCase();
        const period = String(req.query.period || 'alltime').toLowerCase();
        const limit = Math.min(100, Math.max(10, parseInt(req.query.limit, 10) || 50));

        let sortField;
        let list;
        if (period === 'weekly') {
            sortField = by === 'referred' ? 'periodWeekReferred' : by === 'recruited' ? 'periodWeekRecruited' : null;
            if (!sortField) sortField = 'periodWeekReferred'; // impact = week referred as proxy
            list = await Trainer.find({ status: 'approved' })
                .sort({ [sortField]: -1 })
                .limit(limit)
                .select(
                    'code telegramId username displayName specialty region referredUserCount recruitedTrainerCount rewardsEarnedAiba totalImpactScore periodWeekReferred periodWeekRecruited',
                )
                .lean();
            list = list.map((t) => ({
                ...t,
                periodReferred: t.periodWeekReferred ?? 0,
                periodRecruited: t.periodWeekRecruited ?? 0,
                periodImpact: (t.periodWeekReferred ?? 0) * 10 + (t.periodWeekRecruited ?? 0) * 50,
            }));
            list.sort((a, b) => (b.periodImpact || 0) - (a.periodImpact || 0));
        } else if (period === 'monthly') {
            sortField = by === 'referred' ? 'periodMonthReferred' : by === 'recruited' ? 'periodMonthRecruited' : null;
            if (!sortField) sortField = 'periodMonthReferred';
            list = await Trainer.find({ status: 'approved' })
                .sort({ [sortField]: -1 })
                .limit(limit)
                .select(
                    'code telegramId username displayName specialty region referredUserCount recruitedTrainerCount rewardsEarnedAiba totalImpactScore periodMonthReferred periodMonthRecruited',
                )
                .lean();
            list = list.map((t) => ({
                ...t,
                periodReferred: t.periodMonthReferred ?? 0,
                periodRecruited: t.periodMonthRecruited ?? 0,
                periodImpact: (t.periodMonthReferred ?? 0) * 10 + (t.periodMonthRecruited ?? 0) * 50,
            }));
            list.sort((a, b) => (b.periodImpact || 0) - (a.periodImpact || 0));
        } else {
            sortField =
                by === 'referred'
                    ? 'referredUserCount'
                    : by === 'rewards'
                      ? 'rewardsEarnedAiba'
                      : by === 'recruited'
                        ? 'recruitedTrainerCount'
                        : 'totalImpactScore';
            list = await Trainer.find({ status: 'approved' })
                .sort({ [sortField]: -1 })
                .limit(limit)
                .select(
                    'code telegramId username displayName specialty region referredUserCount recruitedTrainerCount rewardsEarnedAiba totalImpactScore',
                )
                .lean();
        }
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
        if (req.body?.specialty != null)
            updates.specialty = String(req.body.specialty).trim().slice(0, 32) || 'general';
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
        const ref = String(req.query.ref || '')
            .trim()
            .toUpperCase();
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
        console.log('[TRAINER APPLY] Request received:', {
            telegramId: req.telegramId,
            body: req.body,
            query: req.query,
            timestamp: new Date().toISOString()
        });
        
        const telegramId = String(req.telegramId || '');
        if (!telegramId) {
            console.error('[TRAINER APPLY] Missing telegramId');
            return res.status(400).json({ error: 'telegramId required' });
        }
        
        const ref = String(req.body?.ref || req.query?.ref || '')
            .trim()
            .toUpperCase();
            
        console.log('[TRAINER APPLY] Processing application:', { telegramId, ref });
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
            const inviter = await Trainer.findById(invitedBy).lean();
            const now = new Date();
            const weekStart = startOfWeekUTC(now);
            const monthStart = startOfMonthUTC(now);
            const updates = { $inc: { recruitedTrainerCount: 1, periodWeekRecruited: 1, periodMonthRecruited: 1 } };
            const set = {};
            if (!inviter?.periodWeekStart || new Date(inviter.periodWeekStart).getTime() !== weekStart.getTime()) {
                set.periodWeekStart = weekStart;
                set.periodWeekReferred = inviter?.periodWeekReferred ?? 0;
                set.periodWeekRecruited = 0;
            }
            if (!inviter?.periodMonthStart || new Date(inviter.periodMonthStart).getTime() !== monthStart.getTime()) {
                set.periodMonthStart = monthStart;
                set.periodMonthReferred = inviter?.periodMonthReferred ?? 0;
                set.periodMonthRecruited = 0;
            }
            if (Object.keys(set).length) updates.$set = set;
            await Trainer.updateOne({ _id: invitedBy }, updates);
        }
        res.status(201).json({
            ok: true,
            code: trainer.code,
            status: trainer.status,
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://aiba-arena2-miniapp.vercel.app'}/trainer?ref=${trainer.code}`,
        });
    } catch (err) {
        console.error('[TRAINER APPLY] Error details:', {
            error: err.message,
            stack: err.stack,
            name: err.name,
            telegramId: req.telegramId,
            body: req.body,
            timestamp: new Date().toISOString()
        });
        
        // Send more specific error if possible
        const errorMessage = err.name === 'ValidationError' 
            ? 'Validation failed: ' + Object.values(err.errors).map(e => e.message).join(', ')
            : err.message || 'internal server error';
            
        res.status(500).json({ 
            error: errorMessage,
            requestId: req.requestId || 'unknown'
        });
    }
});

// GET /api/trainers/me — my trainer stats (with tier, milestones, season rank)
router.get('/me', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const trainer = await Trainer.findOne({ telegramId }).lean();
        if (!trainer) return res.json({ isTrainer: false });
        const base = process.env.NEXT_PUBLIC_APP_URL || 'https://aiba-arena2-miniapp.vercel.app';
        const cfg = await getConfig();
        const referred = trainer.referredUserCount ?? 0;
        const recruited = trainer.recruitedTrainerCount ?? 0;
        const tierBps = getTierMultiplierBps(referred, cfg);
        const milestonesRef = Array.isArray(cfg?.trainerMilestonesReferred)
            ? cfg.trainerMilestonesReferred
            : [5, 10, 25, 50, 100, 250, 500];
        const milestonesRec = Array.isArray(cfg?.trainerMilestonesRecruited)
            ? cfg.trainerMilestonesRecruited
            : [1, 3, 5, 10];
        const milestonesUnlocked = computeMilestonesUnlocked(referred, recruited, milestonesRef, milestonesRec);
        const nextRef = milestonesRef.find((m) => m > referred);
        const nextRec = milestonesRec.find((m) => m > recruited);
        const nextMilestone =
            nextRef != null || nextRec != null ? { referred: nextRef ?? null, recruited: nextRec ?? null } : null;
        let seasonRank = null;
        if (trainer.status === 'approved') {
            const period = 'monthly';
            const sortField = period === 'weekly' ? 'periodWeekReferred' : 'periodMonthReferred';
            const list = await Trainer.find({ status: 'approved' })
                .sort({ [sortField]: -1 })
                .select('telegramId')
                .lean();
            const idx = list.findIndex((t) => String(t.telegramId) === String(telegramId));
            if (idx >= 0) seasonRank = idx + 1;
        }
        res.json({
            isTrainer: true,
            ...trainer,
            recruitUrl: `${base}/trainer?ref=${trainer.code}`,
            tierMultiplierBps: tierBps,
            tierMultiplierPercent: (tierBps / 100).toFixed(1),
            milestonesUnlocked,
            nextMilestone,
            seasonRank,
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
        const code = String(req.body?.code || '')
            .trim()
            .toUpperCase();
        if (!code) return res.status(400).json({ error: 'code required' });
        const trainer = await Trainer.findOne({ code, status: 'approved' });
        if (!trainer) return res.status(404).json({ error: 'trainer not found' });
        const existing = await TrainerUse.findOne({ trainerId: trainer._id, refereeTelegramId: telegramId });
        if (existing) return res.json({ ok: true, recorded: false });
        await TrainerUse.create({
            trainerId: trainer._id,
            refereeTelegramId: telegramId,
        });
        const now = new Date();
        const weekStart = startOfWeekUTC(now);
        const monthStart = startOfMonthUTC(now);
        const t = await Trainer.findById(trainer._id).lean();
        const updates = { $inc: { referredUserCount: 1, periodWeekReferred: 1, periodMonthReferred: 1 } };
        const set = {};
        if (!t?.periodWeekStart || new Date(t.periodWeekStart).getTime() !== weekStart.getTime()) {
            set.periodWeekStart = weekStart;
            set.periodWeekReferred = 0;
            set.periodWeekRecruited = t?.periodWeekRecruited ?? 0;
        }
        if (!t?.periodMonthStart || new Date(t.periodMonthStart).getTime() !== monthStart.getTime()) {
            set.periodMonthStart = monthStart;
            set.periodMonthReferred = 0;
            set.periodMonthRecruited = t?.periodMonthRecruited ?? 0;
        }
        if (Object.keys(set).length) updates.$set = set;
        await Trainer.updateOne({ _id: trainer._id }, updates);
        res.json({ ok: true, recorded: true });
    } catch (err) {
        console.error('Trainer register-use error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/trainers/claim-rewards — claim pending trainer rewards (with tier multiplier)
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
        let pendingAiba = Math.floor(newQualified * aibaPerUser);
        const tierBps = getTierMultiplierBps(trainer.referredUserCount ?? 0, cfg);
        pendingAiba = Math.floor((pendingAiba * tierBps) / 100);
        if (pendingAiba <= 0)
            return res.json({ ok: true, claimedAiba: 0, message: 'No pending rewards.', tierMultiplierBps: tierBps });
        await creditAibaNoCap(pendingAiba, {
            telegramId,
            reason: 'trainer_reward',
            arena: 'trainer',
            league: 'global',
            sourceType: 'trainer',
            sourceId: String(trainer._id),
            meta: { qualified, recruited: trainer.recruitedTrainerCount, tierBps },
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
        res.json({ ok: true, claimedAiba: pendingAiba, tierMultiplierBps: tierBps });
    } catch (err) {
        console.error('Trainer claim error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/trainers/milestones — milestone definitions + caller's unlocked (auth optional)
router.get('/milestones', async (req, res) => {
    try {
        const cfg = await getConfig();
        const referred = Array.isArray(cfg?.trainerMilestonesReferred)
            ? cfg.trainerMilestonesReferred
            : [5, 10, 25, 50, 100, 250, 500];
        const recruited = Array.isArray(cfg?.trainerMilestonesRecruited)
            ? cfg.trainerMilestonesRecruited
            : [1, 3, 5, 10];
        res.json({
            referred,
            recruited,
            labels: {
                referred: referred.map((n) => ({ value: n, label: `${n} referred` })),
                recruited: recruited.map((n) => ({ value: n, label: `${n} trainers recruited` })),
            },
        });
    } catch (err) {
        console.error('Trainers milestones error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /api/trainers/share-event — viral: record share (increment shareCount, update milestones)
router.post('/share-event', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const trainer = await Trainer.findOne({ telegramId, status: 'approved' });
        if (!trainer) return res.status(403).json({ error: 'not an approved trainer' });
        const referred = trainer.referredUserCount ?? 0;
        const recruited = trainer.recruitedTrainerCount ?? 0;
        const cfg = await getConfig();
        const milestonesRef = Array.isArray(cfg?.trainerMilestonesReferred)
            ? cfg.trainerMilestonesReferred
            : [5, 10, 25, 50, 100, 250, 500];
        const milestonesRec = Array.isArray(cfg?.trainerMilestonesRecruited)
            ? cfg.trainerMilestonesRecruited
            : [1, 3, 5, 10];
        const newUnlocked = computeMilestonesUnlocked(referred, recruited, milestonesRef, milestonesRec);
        const existing = trainer.milestonesUnlocked || [];
        const added = newUnlocked.filter((m) => !existing.includes(m));
        await Trainer.updateOne(
            { _id: trainer._id },
            {
                $inc: { shareCount: 1 },
                $set: {
                    lastSharedAt: new Date(),
                    ...(added.length ? { milestonesUnlocked: newUnlocked } : {}),
                },
            },
        );
        res.json({
            ok: true,
            shareCount: (trainer.shareCount ?? 0) + 1,
            milestonesUnlocked: newUnlocked,
            newlyUnlocked: added,
        });
    } catch (err) {
        console.error('Trainer share-event error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/trainers/analytics — last 7/30 days referred (from TrainerUse)
router.get('/analytics', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const trainer = await Trainer.findOne({ telegramId, status: 'approved' }).select('_id').lean();
        if (!trainer) return res.status(403).json({ error: 'not an approved trainer' });
        const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 30));
        const since = new Date();
        since.setUTCDate(since.getUTCDate() - days);
        const uses = await TrainerUse.find({ trainerId: trainer._id, createdAt: { $gte: since } })
            .select('refereeTelegramId createdAt')
            .sort({ createdAt: 1 })
            .lean();
        const byDay = {};
        for (const u of uses) {
            const d = new Date(u.createdAt).toISOString().slice(0, 10);
            byDay[d] = (byDay[d] || 0) + 1;
        }
        const series = Object.entries(byDay)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
        res.json({ periodDays: days, totalReferred: uses.length, byDay: series });
    } catch (err) {
        console.error('Trainer analytics error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /api/trainers/seasons — list period options for leaderboard
router.get('/seasons', async (_req, res) => {
    try {
        const now = new Date();
        const weekStart = startOfWeekUTC(now);
        const monthStart = startOfMonthUTC(now);
        res.json({
            currentWeek: weekStart.toISOString().slice(0, 10),
            currentMonth: monthStart.toISOString().slice(0, 7),
            periods: [
                { id: 'alltime', label: 'All time' },
                { id: 'monthly', label: 'This month' },
                { id: 'weekly', label: 'This week' },
            ],
        });
    } catch (err) {
        console.error('Trainers seasons error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
