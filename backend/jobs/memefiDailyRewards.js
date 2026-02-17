/**
 * MemeFi daily reward pool distribution.
 * Top 10 → 40%, Boosters → 20%, Lottery → 10%, Mining pool → 30%.
 * Uses creditAibaNoCap / creditNeurNoCap with reason memefi_top_meme, memefi_booster, memefi_lottery, memefi_mining.
 */

const Meme = require('../models/Meme');
const MemeBoost = require('../models/MemeBoost');
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
    const cfg = await getMemeFiConfig();
    const poolAiba = Math.max(0, Number(cfg.dailyPoolAiba) || 0);
    const poolNeur = Math.max(0, Number(cfg.dailyPoolNeur) || 0);
    const pctTop10 = Math.max(0, Math.min(100, Number(cfg.poolPctTop10) || 40));
    const pctBoosters = Math.max(0, Math.min(100, Number(cfg.poolPctBoosters) || 20));
    const pctLottery = Math.max(0, Math.min(100, Number(cfg.poolPctLottery) || 10));
    const pctMining = Math.max(0, Math.min(100, Number(cfg.poolPctMining) || 30));
    const topN = Math.max(1, Math.min(100, Number(cfg.topN) || 10));
    const lotteryCount = Math.max(1, Math.min(100, Number(cfg.lotteryWinnersCount) || 20));

    const results = { dayKey, distributedAiba: 0, distributedNeur: 0, top10: [], boosters: [], lottery: [], mining: [] };

    const startOfDay = new Date(dayKey + 'T00:00:00.000Z');
    const endOfDay = new Date(dayKey + 'T23:59:59.999Z');
    if (isNaN(startOfDay.getTime())) return results;

    const memeMatch = { hidden: { $ne: true }, createdAt: { $gte: startOfDay, $lte: endOfDay } };

    // Top N memes by engagement score (created today)
    const topMemes = await Meme.find(memeMatch).sort({ engagementScore: -1 }).limit(topN).lean();
    const aibaTop = Math.floor((poolAiba * pctTop10) / 100);
    const neurTop = Math.floor((poolNeur * pctTop10) / 100);
    const shareAiba = topMemes.length ? Math.floor(aibaTop / topMemes.length) : 0;
    const shareNeur = topMemes.length ? Math.floor(neurTop / topMemes.length) : 0;

    for (const m of topMemes) {
        if (shareAiba > 0) {
            await creditAibaNoCap(shareAiba, {
                telegramId: m.ownerTelegramId,
                reason: 'memefi_top_meme',
                sourceType: 'memefi_daily',
                sourceId: dayKey,
                meta: { memeId: String(m._id), rank: results.top10.length + 1 },
            });
            results.distributedAiba += shareAiba;
        }
        if (shareNeur > 0) {
            await creditNeurNoCap(shareNeur, {
                telegramId: m.ownerTelegramId,
                reason: 'memefi_top_meme',
                sourceType: 'memefi_daily',
                sourceId: dayKey,
                meta: { memeId: String(m._id), rank: results.top10.length + 1 },
            });
            results.distributedNeur += shareNeur;
        }
        results.top10.push({ memeId: m._id, ownerTelegramId: m.ownerTelegramId, engagementScore: m.engagementScore });
    }

    // Boosters: users who boosted today (unlockedAt in past = already unlocked; we reward by boost activity in period)
    const boostMatch = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    const boostAgg = await MemeBoost.aggregate([
        { $match: boostMatch },
        { $group: { _id: '$telegramId', totalAiba: { $sum: '$amountAiba' }, totalNeur: { $sum: '$amountNeur' }, count: { $sum: 1 } } },
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
        if (aibaShare > 0) {
            await creditAibaNoCap(aibaShare, {
                telegramId: b._id,
                reason: 'memefi_booster',
                sourceType: 'memefi_daily',
                sourceId: dayKey,
                meta: { boostCount: b.count },
            });
            results.distributedAiba += aibaShare;
        }
        if (neurShare > 0) {
            await creditNeurNoCap(neurShare, {
                telegramId: b._id,
                reason: 'memefi_booster',
                sourceType: 'memefi_daily',
                sourceId: dayKey,
                meta: { boostCount: b.count },
            });
            results.distributedNeur += neurShare;
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
        if (lotteryAibaShare > 0) {
            await creditAibaNoCap(lotteryAibaShare, {
                telegramId: l._id,
                reason: 'memefi_lottery',
                sourceType: 'memefi_daily',
                sourceId: dayKey,
                meta: {},
            });
            results.distributedAiba += lotteryAibaShare;
        }
        if (lotteryNeurShare > 0) {
            await creditNeurNoCap(lotteryNeurShare, {
                telegramId: l._id,
                reason: 'memefi_lottery',
                sourceType: 'memefi_daily',
                sourceId: dayKey,
                meta: {},
            });
            results.distributedNeur += lotteryNeurShare;
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
    const miningAibaShare = creatorsToday.length ? Math.floor(aibaMining / creatorsToday.length) : 0;
    const miningNeurShare = creatorsToday.length ? Math.floor(neurMining / creatorsToday.length) : 0;
    for (const c of creatorsToday) {
        if (miningAibaShare > 0) {
            await creditAibaNoCap(miningAibaShare, {
                telegramId: c._id,
                reason: 'memefi_mining',
                sourceType: 'memefi_daily',
                sourceId: dayKey,
                meta: { memeCount: c.count },
            });
            results.distributedAiba += miningAibaShare;
        }
        if (miningNeurShare > 0) {
            await creditNeurNoCap(miningNeurShare, {
                telegramId: c._id,
                reason: 'memefi_mining',
                sourceType: 'memefi_daily',
                sourceId: dayKey,
                meta: { memeCount: c.count },
            });
            results.distributedNeur += miningNeurShare;
        }
        results.mining.push({ telegramId: c._id, memeCount: c.count });
    }

    return results;
}

module.exports = { runDailyMemeFiRewards, utcDayKey };
