/**
 * MemeFi weekly reward pool: top N memes by engagement in the week get a share of weeklyPoolAiba/Neur.
 * Idempotent via MemeFiWeeklyRun.
 */

const Meme = require('../models/Meme');
const MemeFiWeeklyRun = require('../models/MemeFiWeeklyRun');
const { getMemeFiConfig } = require('../engine/memefiScoring');
const { creditAibaNoCap, creditNeurNoCap } = require('../engine/economy');

function isoWeekKey(date = new Date()) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const y = d.getUTCFullYear();
    const start = new Date(d);
    start.setUTCDate(start.getUTCDate() - 3);
    const week = Math.ceil((d - start) / 604800000);
    return `${y}-W${String(week).padStart(2, '0')}`;
}

async function runWeeklyMemeFiRewards(weekKey = isoWeekKey()) {
    const existing = await MemeFiWeeklyRun.findOne({ weekKey }).lean();
    if (existing && existing.status === 'completed') {
        return existing.resultSummary || { weekKey, distributedAiba: 0, distributedNeur: 0, top: [] };
    }
    await MemeFiWeeklyRun.findOneAndUpdate(
        { weekKey },
        { $set: { weekKey, status: 'running', completedAt: null, resultSummary: {}, errorMessage: '' } },
        { upsert: true },
    );

    try {
        const cfg = await getMemeFiConfig();
        const poolAiba = Math.max(0, Number(cfg.weeklyPoolAiba) || 0);
        const poolNeur = Math.max(0, Number(cfg.weeklyPoolNeur) || 0);
        const topN = Math.max(1, Math.min(50, Number(cfg.weeklyTopN) || 5));
        const results = { weekKey, distributedAiba: 0, distributedNeur: 0, top: [] };

        const [y, w] = weekKey.split('-W').map((s) => s.trim());
        const weekNum = parseInt(w, 10);
        if (!y || isNaN(weekNum)) {
            await MemeFiWeeklyRun.updateOne(
                { weekKey },
                { $set: { status: 'completed', completedAt: new Date(), resultSummary: results } },
            );
            return results;
        }
        const jan4 = new Date(Date.UTC(parseInt(y, 10), 0, 4));
        const startOfWeek = new Date(jan4);
        startOfWeek.setUTCDate(jan4.getUTCDate() - (jan4.getUTCDay() || 7) + 1 + (weekNum - 1) * 7);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 6);
        endOfWeek.setUTCHours(23, 59, 59, 999);

        const memeMatch = {
            hidden: { $ne: true },
            createdAt: { $gte: startOfWeek, $lte: endOfWeek },
            $or: [{ status: 'published' }, { status: { $exists: false } }],
        };
        const topMemes = await Meme.find(memeMatch).sort({ engagementScore: -1 }).limit(topN).lean();
        const shareAiba = topMemes.length ? Math.floor(poolAiba / topMemes.length) : 0;
        const shareNeur = topMemes.length ? Math.floor(poolNeur / topMemes.length) : 0;

        for (const m of topMemes) {
            if (shareAiba > 0) {
                await creditAibaNoCap(shareAiba, {
                    telegramId: m.ownerTelegramId,
                    reason: 'memefi_weekly_top',
                    sourceType: 'memefi_weekly',
                    sourceId: weekKey,
                    meta: { memeId: String(m._id) },
                });
                results.distributedAiba += shareAiba;
            }
            if (shareNeur > 0) {
                await creditNeurNoCap(shareNeur, {
                    telegramId: m.ownerTelegramId,
                    reason: 'memefi_weekly_top',
                    sourceType: 'memefi_weekly',
                    sourceId: weekKey,
                    meta: { memeId: String(m._id) },
                });
                results.distributedNeur += shareNeur;
            }
            results.top.push({ memeId: m._id, ownerTelegramId: m.ownerTelegramId, engagementScore: m.engagementScore });
        }

        await MemeFiWeeklyRun.updateOne(
            { weekKey },
            { $set: { status: 'completed', completedAt: new Date(), resultSummary: results, errorMessage: '' } },
        );
        return results;
    } catch (err) {
        await MemeFiWeeklyRun.updateOne(
            { weekKey },
            { $set: { status: 'failed', completedAt: new Date(), errorMessage: (err && err.message) || 'unknown' } },
        );
        throw err;
    }
}

module.exports = { runWeeklyMemeFiRewards, isoWeekKey };
