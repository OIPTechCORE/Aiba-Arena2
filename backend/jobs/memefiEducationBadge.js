/**
 * P5 — Education creator badge: set User.educationCreatorBadge for users who
 * have at least N memes in education categories with total engagement score >= threshold.
 */

const Meme = require('../models/Meme');
const User = require('../models/User');
const { getMemeFiConfig } = require('../engine/memefiScoring');

async function runEducationCreatorBadge() {
    const cfg = await getMemeFiConfig();
    const minCount = Math.max(1, Number(cfg.educationCreatorBadgeMinMemeCount) || 5);
    const minScore = Math.max(0, Number(cfg.educationCreatorBadgeMinScore) || 100);

    const agg = await Meme.aggregate([
        { $match: { hidden: { $ne: true }, educationCategory: { $exists: true, $ne: '', $not: { $regex: /^\s*$/ } } } },
        { $group: { _id: '$ownerTelegramId', count: { $sum: 1 }, totalScore: { $sum: '$engagementScore' } } },
        { $match: { count: { $gte: minCount }, totalScore: { $gte: minScore } } },
    ]);

    const telegramIds = agg.map((a) => a._id);
    const updated = await User.updateMany(
        { telegramId: { $in: telegramIds } },
        { $set: { educationCreatorBadge: true } },
    );

    const removed = await User.updateMany(
        { telegramId: { $nin: telegramIds }, educationCreatorBadge: true },
        { $set: { educationCreatorBadge: false } },
    );

    return { granted: telegramIds.length, updated: updated.modifiedCount, removed: removed.modifiedCount };
}

module.exports = { runEducationCreatorBadge };
