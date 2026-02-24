/**
 * MemeFi daily reward pool distribution.
 * Top 10 → 40%, Boosters → 20%, Lottery → 10%, Mining pool → 30%.
 * Uses creditAibaNoCap / creditNeurNoCap with reason memefi_top_meme, memefi_booster, memefi_lottery, memefi_mining.
 * Idempotent: MemeFiDailyRun prevents double-credit if cron runs twice.
 */

const Meme = require('../models/Meme');
const MemeBoost = require('../models/MemeBoost');
const MemeFiDailyRun = require('../models/MemeFiDailyRun');
const LedgerEntry = require('../models/LedgerEntry');
const { getMemeFiConfig } = require('../engine/memefiScoring');
const { creditAibaNoCap, creditNeurNoCap } = require('../engine/economy');
const mongoose = require('mongoose');

function utcDayKey(date = new Date()) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function runDailyMemeFiRewards(dayKey = utcDayKey()) {
    const existing = await MemeFiDailyRun.findOne({ dayKey }).lean();
    if (existing && existing.status === 'completed') {
        return (
            existing.resultSummary || {
                dayKey,
                distributedAiba: 0,
                distributedNeur: 0,
                top10: [],
                boosters: [],
                lottery: [],
                mining: [],
            }
        );
    }
    await MemeFiDailyRun.findOneAndUpdate(
        { dayKey },
        { $set: { dayKey, status: 'running', completedAt: null, resultSummary: {}, errorMessage: '' } },
        { upsert: true },
    );

    try {
        const results = await runDailyMemeFiRewardsInner(dayKey);
        await MemeFiDailyRun.updateOne(
            { dayKey },
            { $set: { status: 'completed', completedAt: new Date(), resultSummary: results, errorMessage: '' } },
        );
        return results;
    } catch (err) {
        await MemeFiDailyRun.updateOne(
            { dayKey },
            { $set: { status: 'failed', completedAt: new Date(), errorMessage: (err && err.message) || 'unknown' } },
        );
        throw err;
    }
}

const MEMEFI_REASONS = ['memefi_top_meme', 'memefi_booster', 'memefi_lottery', 'memefi_mining'];

/** Resolve creator tier and multiplier from config (tiers sorted by minMemes desc so we pick highest applicable). */
function getCreatorTierAndMultiplier(creatorTiers, totalMemes, totalScore) {
    if (!Array.isArray(creatorTiers) || creatorTiers.length === 0) return { tier: 'bronze', multiplier: 1 };
    const sorted = [...creatorTiers].sort((a, b) => (b.minMemes || 0) - (a.minMemes || 0));
    for (const t of sorted) {
        const minM = Number(t.minMemes) || 0;
        const minS = Number(t.minTotalScore) || 0;
        if (totalMemes >= minM && totalScore >= minS)
            return { tier: t.tier || 'bronze', multiplier: Math.max(0.1, Number(t.rewardMultiplier) || 1) };
    }
    return { tier: 'bronze', multiplier: 1 };
}

async function getCreatorTierMultiplierForTelegram(telegramId, cfg) {
    const { multiplier } = await getCreatorTierForTelegram(telegramId, cfg);
    return multiplier;
}

/** Get creator tier and multiplier for a user (for earn-summary / UI). */
async function getCreatorTierForTelegram(telegramId, cfg) {
    const tiers = cfg?.creatorTiers;
    if (!Array.isArray(tiers) || tiers.length === 0) return { tier: 'bronze', multiplier: 1 };
    const agg = await Meme.aggregate([
        {
            $match: {
                ownerTelegramId: telegramId,
                hidden: { $ne: true },
                $or: [{ status: 'published' }, { status: { $exists: false } }],
            },
        },
        { $group: { _id: null, count: { $sum: 1 }, totalScore: { $sum: '$engagementScore' } } },
    ]);
    const totalMemes = agg[0]?.count ?? 0;
    const totalScore = agg[0]?.totalScore ?? 0;
    return getCreatorTierAndMultiplier(tiers, totalMemes, totalScore);
}

async function getMemefiCreditedToday(telegramId, dayKey) {
    const startOfDay = new Date(dayKey + 'T00:00:00.000Z');
    const endOfDay = new Date(dayKey + 'T23:59:59.999Z');
    const agg = await LedgerEntry.aggregate([
        {
            $match: {
                telegramId,
                direction: 'credit',
                applied: true,
                reason: { $in: MEMEFI_REASONS },
                createdAt: { $gte: startOfDay, $lte: endOfDay },
            },
        },
        { $group: { _id: '$currency', total: { $sum: '$amount' } } },
    ]);
    const aiba = agg.find((e) => e._id === 'AIBA')?.total ?? 0;
    const neur = agg.find((e) => e._id === 'NEUR')?.total ?? 0;
    return { aiba, neur };
}

async function runDailyMemeFiRewardsInner(dayKey) {
    const cfg = await getMemeFiConfig();
    const poolAiba = Math.max(0, Number(cfg.dailyPoolAiba) || 0);
    const poolNeur = Math.max(0, Number(cfg.dailyPoolNeur) || 0);
    const pctTop10 = Math.max(0, Math.min(100, Number(cfg.poolPctTop10) || 40));
    const pctBoosters = Math.max(0, Math.min(100, Number(cfg.poolPctBoosters) || 20));
    const pctLottery = Math.max(0, Math.min(100, Number(cfg.poolPctLottery) || 10));
    const pctMining = Math.max(0, Math.min(100, Number(cfg.poolPctMining) || 30));
    const topN = Math.max(1, Math.min(100, Number(cfg.topN) || 10));
    const lotteryCount = Math.max(1, Math.min(100, Number(cfg.lotteryWinnersCount) || 20));
    const maxAibaPerUser = Math.max(0, Number(cfg.maxAibaPerUserPerDay) || 0);
    const maxNeurPerUser = Math.max(0, Number(cfg.maxNeurPerUserPerDay) || 0);

    const results = {
        dayKey,
        distributedAiba: 0,
        distributedNeur: 0,
        top10: [],
        boosters: [],
        lottery: [],
        mining: [],
        categoryRuns: [],
    };

    const startOfDay = new Date(dayKey + 'T00:00:00.000Z');
    const endOfDay = new Date(dayKey + 'T23:59:59.999Z');
    if (isNaN(startOfDay.getTime())) return results;

    const memeMatch = {
        hidden: { $ne: true },
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        $or: [{ status: 'published' }, { status: { $exists: false } }],
    };

    async function creditWithCap(
        tgId,
        aibaAmount,
        neurAmount,
        meta,
        reasonTop,
        reasonBoost,
        reasonLottery,
        reasonMining,
    ) {
        let toAiba = aibaAmount;
        let toNeur = neurAmount;
        if (maxAibaPerUser > 0 || maxNeurPerUser > 0) {
            const already = await getMemefiCreditedToday(tgId, dayKey);
            if (maxAibaPerUser > 0 && toAiba > 0) toAiba = Math.min(toAiba, Math.max(0, maxAibaPerUser - already.aiba));
            if (maxNeurPerUser > 0 && toNeur > 0) toNeur = Math.min(toNeur, Math.max(0, maxNeurPerUser - already.neur));
        }
        if (toAiba > 0) {
            await creditAibaNoCap(toAiba, {
                telegramId: tgId,
                reason: meta.reason,
                sourceType: 'memefi_daily',
                sourceId: dayKey,
                meta: meta.meta,
            });
            results.distributedAiba += toAiba;
        }
        if (toNeur > 0) {
            await creditNeurNoCap(toNeur, {
                telegramId: tgId,
                reason: meta.reason,
                sourceType: 'memefi_daily',
                sourceId: dayKey,
                meta: meta.meta,
            });
            results.distributedNeur += toNeur;
        }
    }

    // Top N memes by engagement score (created today); creator tier multiplies share
    const topMemes = await Meme.find(memeMatch).sort({ engagementScore: -1 }).limit(topN).lean();
    const aibaTop = Math.floor((poolAiba * pctTop10) / 100);
    const neurTop = Math.floor((poolNeur * pctTop10) / 100);
    const topTierMults = await Promise.all(
        topMemes.map((m) => getCreatorTierMultiplierForTelegram(m.ownerTelegramId, cfg)),
    );
    const topTotalMult = topTierMults.reduce((s, x) => s + x, 0) || 1;
    for (let i = 0; i < topMemes.length; i++) {
        const m = topMemes[i];
        const mult = topTierMults[i];
        const aibaAmt = Math.floor((aibaTop * mult) / topTotalMult);
        const neurAmt = Math.floor((neurTop * mult) / topTotalMult);
        if (aibaAmt > 0 || neurAmt > 0) {
            await creditWithCap(m.ownerTelegramId, aibaAmt, neurAmt, {
                reason: 'memefi_top_meme',
                meta: { memeId: String(m._id), rank: results.top10.length + 1, creatorTierMultiplier: mult },
            });
        }
        results.top10.push({ memeId: m._id, ownerTelegramId: m.ownerTelegramId, engagementScore: m.engagementScore });
    }

    // Boosters: users who boosted today (unlockedAt in past = already unlocked; we reward by boost activity in period)
    const boostMatch = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    const boostAgg = await MemeBoost.aggregate([
        { $match: boostMatch },
        {
            $group: {
                _id: '$telegramId',
                totalAiba: { $sum: '$amountAiba' },
                totalNeur: { $sum: '$amountNeur' },
                count: { $sum: 1 },
            },
        },
        { $sort: { totalAiba: -1, totalNeur: -1 } },
        { $limit: 50 },
    ]);
    const aibaBoost = Math.floor((poolAiba * pctBoosters) / 100);
    const neurBoost = Math.floor((poolNeur * pctBoosters) / 100);
    const totalBoostUnits = boostAgg.reduce((s, b) => s + (b.totalAiba || 0) + (b.totalNeur || 0), 0) || 1;
    for (const b of boostAgg) {
        const units = (b.totalAiba || 0) + (b.totalNeur || 0);
        const share = units / totalBoostUnits;
        const aibaShare = Math.floor(aibaBoost * share);
        const neurShare = Math.floor(neurBoost * share);
        if (aibaShare > 0 || neurShare > 0) {
            await creditWithCap(b._id, aibaShare, neurShare, {
                reason: 'memefi_booster',
                meta: { boostCount: b.count },
            });
        }
        results.boosters.push({ telegramId: b._id, totalAiba: b.totalAiba, totalNeur: b.totalNeur });
    }

    // Lottery: random engagement (users who liked/commented/shared today - use LedgerEntry or MemeLike/MemeComment created today)
    const MemeLike = require('../models/MemeLike');
    const likesToday = await MemeLike.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: '$telegramId' } },
        { $sample: { size: lotteryCount } },
    ]);
    const aibaLottery = Math.floor((poolAiba * pctLottery) / 100);
    const neurLottery = Math.floor((poolNeur * pctLottery) / 100);
    const lotteryAibaShare = likesToday.length ? Math.floor(aibaLottery / likesToday.length) : 0;
    const lotteryNeurShare = likesToday.length ? Math.floor(neurLottery / likesToday.length) : 0;
    for (const l of likesToday) {
        if (lotteryAibaShare > 0 || lotteryNeurShare > 0) {
            await creditWithCap(l._id, lotteryAibaShare, lotteryNeurShare, { reason: 'memefi_lottery', meta: {} });
        }
        results.lottery.push({ telegramId: l._id });
    }

    // Mining: creators who posted today (equal share of mining pool)
    const creatorsToday = await Meme.aggregate([
        { $match: memeMatch },
        { $group: { _id: '$ownerTelegramId', count: { $sum: 1 } } },
    ]);
    const aibaMining = Math.floor((poolAiba * pctMining) / 100);
    const neurMining = Math.floor((poolNeur * pctMining) / 100);
    const miningMults = await Promise.all(creatorsToday.map((c) => getCreatorTierMultiplierForTelegram(c._id, cfg)));
    const miningTotalMult = miningMults.reduce((s, x) => s + x, 0) || 1;
    for (let i = 0; i < creatorsToday.length; i++) {
        const c = creatorsToday[i];
        const mult = miningMults[i];
        const aibaAmt = Math.floor((aibaMining * mult) / miningTotalMult);
        const neurAmt = Math.floor((neurMining * mult) / miningTotalMult);
        if (aibaAmt > 0 || neurAmt > 0) {
            await creditWithCap(c._id, aibaAmt, neurAmt, {
                reason: 'memefi_mining',
                meta: { memeCount: c.count, creatorTierMultiplier: mult },
            });
        }
        results.mining.push({ telegramId: c._id, memeCount: c.count });
    }

    // Per-educationCategory pools (categoryPools: { study_humor: { dailyPoolAiba, dailyPoolNeur, topN }, ... })
    const categoryPools = cfg.categoryPools && typeof cfg.categoryPools === 'object' ? cfg.categoryPools : {};
    for (const [eduCat, catCfg] of Object.entries(categoryPools)) {
        if (!catCfg || (Number(catCfg.dailyPoolAiba) || 0) + (Number(catCfg.dailyPoolNeur) || 0) === 0) continue;
        const catPoolAiba = Math.max(0, Number(catCfg.dailyPoolAiba) || 0);
        const catPoolNeur = Math.max(0, Number(catCfg.dailyPoolNeur) || 0);
        const catTopN = Math.max(1, Math.min(50, Number(catCfg.topN) || 5));
        const catMemeMatch = { ...memeMatch, educationCategory: eduCat };
        const catTopMemes = await Meme.find(catMemeMatch).sort({ engagementScore: -1 }).limit(catTopN).lean();
        const catShareAiba = catTopMemes.length ? Math.floor(catPoolAiba / catTopMemes.length) : 0;
        const catShareNeur = catTopMemes.length ? Math.floor(catPoolNeur / catTopMemes.length) : 0;
        for (const m of catTopMemes) {
            if (catShareAiba > 0 || catShareNeur > 0) {
                await creditWithCap(m.ownerTelegramId, catShareAiba, catShareNeur, {
                    reason: 'memefi_top_meme',
                    meta: { memeId: String(m._id), category: eduCat },
                });
            }
        }
        results.categoryRuns.push({ educationCategory: eduCat, memeCount: catTopMemes.length });
    }

    return results;
}

module.exports = {
    runDailyMemeFiRewards,
    runDailyMemeFiRewardsInner,
    utcDayKey,
    getCreatorTierForTelegram,
    getCreatorTierMultiplierForTelegram,
};
