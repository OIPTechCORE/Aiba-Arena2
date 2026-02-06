function computeTokenSplits(amount, config = {}) {
    const burnBps = Number(config.tokenSplitBurnBps || 0);
    const treasuryBps = Number(config.tokenSplitTreasuryBps || 0);
    const rewardsBps = Number(config.tokenSplitRewardsBps || 0);
    const stakingBps = Number(config.tokenSplitStakingBps || 0);
    const totalBps = burnBps + treasuryBps + rewardsBps + stakingBps || 1;

    const burn = Math.floor((amount * burnBps) / totalBps);
    const treasury = Math.floor((amount * treasuryBps) / totalBps);
    const rewards = Math.floor((amount * rewardsBps) / totalBps);
    const staking = Math.max(0, amount - burn - treasury - rewards);

    return { burn, treasury, rewards, staking };
}

module.exports = { computeTokenSplits };
