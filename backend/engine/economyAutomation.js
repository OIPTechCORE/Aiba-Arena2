/**
 * AIBA Self-Automation: dynamic daily caps, anti-inflation, allocation awareness.
 * Call from cron or admin trigger. When automationEnabled, adjusts dailyCapAiba
 * based on target emission %, burn rate, and min/max bounds.
 */
const EconomyConfig = require('../models/EconomyConfig');
const EconomyDay = require('../models/EconomyDay');

function utcDayKey(date = new Date()) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Compute suggested dailyCapAiba based on:
 * - automationTargetEmissionPercentPerYear: target % of supply to emit per year
 * - Burn rate: if burns high, can allow slightly more emission
 * - Min/max bounds
 */
async function computeDynamicCap() {
    const cfg = await EconomyConfig.findOne().lean();
    if (!cfg?.automationEnabled) return null;
    const targetPct = Number(cfg.automationTargetEmissionPercentPerYear ?? 10) / 100;
    const minCap = Number(cfg.automationMinCapAiba ?? 500_000);
    const maxCap = Number(cfg.automationMaxCapAiba ?? 5_000_000);
    const totalSupply = 1_000_000_000_000; // 1T
    const targetDaily = Math.floor((totalSupply * targetPct) / 365);
    const suggested = Math.max(minCap, Math.min(maxCap, targetDaily));
    return suggested;
}

/**
 * Apply dynamic cap if automation enabled.
 * Call daily (e.g. 00:05 UTC).
 */
async function maybeAdjustDailyCap() {
    const suggested = await computeDynamicCap();
    if (suggested == null) return { adjusted: false };
    const cfg = await EconomyConfig.findOne();
    if (!cfg) return { adjusted: false };
    const current = Number(cfg.dailyCapAiba ?? 1_000_000);
    if (Math.abs(suggested - current) < 0.01 * current) return { adjusted: false, cap: current };
    cfg.dailyCapAiba = suggested;
    await cfg.save();
    return { adjusted: true, cap: suggested, previous: current };
}

/**
 * Get allocation strategy (from config). Used for minting guidance.
 */
async function getAllocationStrategy() {
    const cfg = await EconomyConfig.findOne().lean();
    return {
        vaultPct: cfg?.allocationVaultPct ?? 40,
        treasuryPct: cfg?.allocationTreasuryPct ?? 15,
        stakingPct: cfg?.allocationStakingPct ?? 20,
        teamPct: cfg?.allocationTeamPct ?? 10,
        ecosystemPct: cfg?.allocationEcosystemPct ?? 10,
        communityPct: cfg?.allocationCommunityPct ?? 5,
        vaultAmount: Math.floor(400_000_000_000),
        treasuryAmount: Math.floor(150_000_000_000),
        stakingAmount: Math.floor(200_000_000_000),
        teamAmount: Math.floor(100_000_000_000),
        ecosystemAmount: Math.floor(100_000_000_000),
        communityAmount: Math.floor(50_000_000_000),
    };
}

module.exports = {
    computeDynamicCap,
    maybeAdjustDailyCap,
    getAllocationStrategy,
};
