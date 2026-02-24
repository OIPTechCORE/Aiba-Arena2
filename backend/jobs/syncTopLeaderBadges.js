const Battle = require('../models/Battle');
const User = require('../models/User');
const { getConfig } = require('../engine/economy');

const BADGE_ID = 'top_leader';

async function syncTopLeaderBadges() {
    const cfg = await getConfig();
    const topN = Math.max(0, Math.min(1000, Number(cfg?.topLeaderBadgeTopN) ?? 10));
    if (topN === 0) {
        const result = await User.updateMany({ badges: BADGE_ID }, { $pull: { badges: BADGE_ID } });
        console.log('syncTopLeaderBadges: topN=0, removed badge from', result.modifiedCount, 'users');
        return { removed: result.modifiedCount, granted: 0 };
    }

    const topUsers = await Battle.aggregate([
        { $group: { _id: '$ownerTelegramId', totalScore: { $sum: '$score' } } },
        { $sort: { totalScore: -1 } },
        { $limit: topN },
        { $project: { telegramId: '$_id' } },
    ]);

    const topTelegramIds = new Set(topUsers.map((r) => String(r.telegramId)).filter(Boolean));

    const removeResult = await User.updateMany({ badges: BADGE_ID }, { $pull: { badges: BADGE_ID } });

    let granted = 0;
    for (const telegramId of topTelegramIds) {
        const update = await User.updateOne({ telegramId }, { $addToSet: { badges: BADGE_ID } });
        if (update.modifiedCount) granted++;
    }

    console.log('syncTopLeaderBadges: topN=', topN, 'removed=', removeResult.modifiedCount, 'granted=', granted);
    return { removed: removeResult.modifiedCount, granted };
}

module.exports = { syncTopLeaderBadges };
