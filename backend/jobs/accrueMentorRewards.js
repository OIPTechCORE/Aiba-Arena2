const EconomyConfig = require('../models/EconomyConfig');
const MentorStake = require('../models/MentorStake');

async function accrueMentorRewards() {
    const cfg = (await EconomyConfig.findOne().sort({ createdAt: -1 })) || new EconomyConfig();
    const apy = Number(cfg.stakingApyPercent || 0);
    if (!apy) return;

    const hourlyRate = apy / 100 / 365 / 24;
    const stakes = await MentorStake.find({ status: 'active' });
    for (const stake of stakes) {
        const reward = Number(stake.amountAiba || 0) * hourlyRate;
        if (reward > 0) {
            stake.rewardAccruedAiba += reward;
            await stake.save();
        }
    }
}

module.exports = { accrueMentorRewards };
