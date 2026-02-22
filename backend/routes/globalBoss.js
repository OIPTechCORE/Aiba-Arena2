const router = require('express').Router();
const { requireTelegram } = require('../middleware/requireTelegram');
const GlobalBoss = require('../models/GlobalBoss');
const BossDamage = require('../models/BossDamage');
const { getConfig, tryEmitAiba, creditAibaNoCap } = require('../engine/economy');
const { getCreatorReferrerAndBps } = require('../engine/innovations');

// GET /api/global-boss — current active boss
router.get('/', async (req, res) => {
    try {
        const boss = await GlobalBoss.findOne({ status: 'active' }).sort({ createdAt: -1 }).lean();
        if (!boss) return res.json({ active: false });
        const topDamagers = await BossDamage.aggregate([
            { $match: { bossId: boss._id } },
            { $group: { _id: '$telegramId', totalDamage: { $sum: '$damage' } } },
            { $sort: { totalDamage: -1 } },
            { $limit: 100 },
        ]);
        res.json({
            active: true,
            ...boss,
            topDamagers,
        });
    } catch (err) {
        console.error('Global boss get error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// Boss damage is recorded from battle — when user runs a battle, if boss active, damage = score
// POST /api/global-boss/record-damage — called internally from battle (or separate endpoint)
router.post('/record-damage', requireTelegram, async (req, res) => {
    try {
        const telegramId = String(req.telegramId || '');
        const { battleId, score } = req.body || {};
        const boss = await GlobalBoss.findOne({ status: 'active' }).sort({ createdAt: -1 });
        if (!boss) return res.json({ ok: true, recorded: false });
        const damage = Math.max(0, Math.floor(Number(score) || 0));
        if (damage <= 0) return res.json({ ok: true, recorded: false });
        await BossDamage.create({
            bossId: boss._id,
            telegramId,
            battleId: battleId || null,
            damage,
            score: damage,
        });
        const newHp = Math.max(0, (boss.currentHp || boss.totalHp) - damage);
        await GlobalBoss.updateOne({ _id: boss._id }, { $set: { currentHp: newHp } });
        if (newHp <= 0) {
            await GlobalBoss.updateOne({ _id: boss._id }, { status: 'defeated', defeatedAt: new Date() });
            distributeBossRewards(boss._id).catch((e) => console.error('Boss reward dist error:', e));
        }
        res.json({ ok: true, recorded: true, currentHp: newHp, damage });
    } catch (err) {
        console.error('Boss record damage error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

async function distributeBossRewards(bossId) {
    const boss = await GlobalBoss.findById(bossId).lean();
    if (!boss || (boss.rewardPoolAiba || 0) <= 0) return;
    const cfg = await getConfig();
    const top = await BossDamage.aggregate([
        { $match: { bossId } },
        { $group: { _id: '$telegramId', totalDamage: { $sum: '$damage' } } },
        { $sort: { totalDamage: -1 } },
        { $limit: 1000 },
    ]);
    const totalDmg = top.reduce((s, t) => s + t.totalDamage, 0);
    if (totalDmg <= 0) return;
    const pool = boss.rewardPoolAiba;
    for (let i = 0; i < Math.min(1000, top.length); i++) {
        const share = Math.floor(pool * (top[i].totalDamage / totalDmg));
        if (share > 0) {
            const emit = await tryEmitAiba(share, { arena: 'global_boss', league: 'raid' });
            if (emit.ok) {
                await creditAibaNoCap(share, {
                    telegramId: top[i]._id,
                    reason: 'global_boss_reward',
                    arena: 'global_boss',
                    league: 'raid',
                    sourceType: 'global_boss',
                    sourceId: String(bossId),
                    meta: { position: i + 1, damage: top[i].totalDamage },
                });
                getCreatorReferrerAndBps(top[i]._id, cfg)
                    .then(async (creator) => {
                        if (!creator?.referrerTelegramId) return;
                        const creatorAiba = Math.floor((share * creator.bps) / 10000);
                        if (creatorAiba > 0) {
                            await creditAibaNoCap(creatorAiba, {
                                telegramId: creator.referrerTelegramId,
                                reason: 'creator_earnings',
                                arena: 'global_boss',
                                league: 'raid',
                                sourceType: 'creator_referee_boss',
                                sourceId: String(bossId),
                                meta: { refereeTelegramId: top[i]._id, bps: creator.bps, amountAiba: creatorAiba },
                            });
                        }
                    })
                    .catch(() => {});
            }
        }
    }
}

/** Call from battle route when score > 0 — records damage to active boss */
async function recordBossDamageFromBattle(telegramId, score, battleId) {
    const boss = await GlobalBoss.findOne({ status: 'active' }).sort({ createdAt: -1 });
    if (!boss || !score || score <= 0) return;
    const damage = Math.floor(Number(score));
    await BossDamage.create({
        bossId: boss._id,
        telegramId: String(telegramId),
        battleId: battleId || null,
        damage,
        score: damage,
    });
    const newHp = Math.max(0, (boss.currentHp || boss.totalHp) - damage);
    await GlobalBoss.updateOne({ _id: boss._id }, { $set: { currentHp: newHp } });
    if (newHp <= 0) {
        await GlobalBoss.updateOne({ _id: boss._id }, { status: 'defeated', defeatedAt: new Date() });
        distributeBossRewards(boss._id).catch((e) => console.error('Boss reward dist error:', e));
    }
}

module.exports = router;
module.exports.recordBossDamageFromBattle = recordBossDamageFromBattle;
