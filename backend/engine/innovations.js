/**
 * Innovations: Streaks, Daily Combo, Premium multiplier, Invite-3 unlock bonus
 * Used by battle, daily, economy routes.
 */
const User = require('../models/User');
const EconomyConfig = require('../models/EconomyConfig');
const Referral = require('../models/Referral');

function utcDayKey(date = new Date()) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Compute login streak multiplier (1.0 to cfg.streakCapMultiplier) */
function getStreakMultiplier(loginStreakDays, cfg = {}) {
    const days = Number(loginStreakDays) || 0;
    if (days <= 0) return 1;
    const at7 = Number(cfg.streakMultiplierAt7Days) || 1.25;
    const at30 = Number(cfg.streakMultiplierAt30Days) || 1.5;
    const cap = Number(cfg.streakCapMultiplier) || 2;
    if (days >= 30) return Math.min(cap, at30);
    if (days >= 7) return at7;
    return 1 + (days - 1) * ((at7 - 1) / 6); // linear 1->1.25 from day 1 to 7
}

/** Compute battle win streak bonus (e.g. 1% per win, cap 5) */
function getBattleWinStreakBonusBps(battleWinStreak, cfg = {}) {
    const bps = Number(cfg.battleWinStreakBonusBps) || 100;
    const cap = 5;
    const wins = Math.min(Number(battleWinStreak) || 0, cap);
    return wins * bps;
}

/** Update login streak when user claims daily. Returns new streak count. */
async function updateLoginStreak(telegramId) {
    const today = utcDayKey();
    const user = await User.findOne({ telegramId }).lean();
    if (!user) return 0;
    const last = user.lastLoginStreakDate || '';
    let newStreak = 1;
    if (last === today) return user.loginStreakDays || 0;
    const yesterday = (() => {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - 1);
        return utcDayKey(d);
    })();
    if (last === yesterday) {
        newStreak = (user.loginStreakDays || 0) + 1;
    }
    await User.updateOne(
        { telegramId },
        { $set: { lastLoginStreakDate: today, loginStreakDays: newStreak } },
    );
    return newStreak;
}

/** Update battle win streak. Returns new streak. */
async function updateBattleWinStreak(telegramId) {
    const user = await User.findOne({ telegramId }).lean();
    if (!user) return 0;
    const now = new Date();
    const lastWin = user.lastBattleWinAt ? new Date(user.lastBattleWinAt) : null;
    let newStreak = 1;
    if (lastWin) {
        const diff = (now - lastWin) / 1000;
        if (diff < 86400) newStreak = (user.battleWinStreak || 0) + 1; // same day or within 24h
    }
    await User.updateOne(
        { telegramId },
        { $set: { battleWinStreak: newStreak, lastBattleWinAt: now } },
    );
    return newStreak;
}

/** Reset battle win streak on loss */
async function resetBattleWinStreak(telegramId) {
    await User.updateOne(
        { telegramId },
        { $set: { battleWinStreak: 0 } },
    );
}

/** Check if user has premium (2x rewards) */
async function hasPremium(telegramId) {
    const user = await User.findOne({ telegramId }).lean();
    if (!user?.premiumUntil) return false;
    return new Date(user.premiumUntil) > new Date();
}

/** Compute total reward multiplier: streak × premium × (1 + winStreakBps/10000) × invite-3 bonus */
async function getRewardMultiplier(telegramId, cfg = {}) {
    let mul = 1;
    const user = await User.findOne({ telegramId }).lean();
    if (user) {
        mul *= getStreakMultiplier(user.loginStreakDays, cfg);
        mul *= (1 + getBattleWinStreakBonusBps(user.battleWinStreak, cfg) / 10000);
        if (user.premiumUntil && new Date(user.premiumUntil) > new Date()) {
            mul *= (Number(cfg.premiumRewardMultiplier) || 2);
        }
        // Invite-3 unlock: 1% bonus (default) when user referred 3+ friends
        const refUnlockBps = Number(cfg.referralUnlock3BonusBps) || 100;
        if (refUnlockBps > 0) {
            const ref = await Referral.findOne({ ownerTelegramId: telegramId, active: true }).lean();
            if (ref && (ref.uses ?? 0) >= 3) {
                mul *= (1 + refUnlockBps / 10000);
            }
        }
    }
    return mul;
}

/** Record AIBA spend for daily combo (call from debitAibaFromUser) */
async function recordAibaSpendForDailyCombo(telegramId, amount) {
    if (!telegramId || !amount || amount <= 0) return;
    const day = utcDayKey();
    const user = await User.findOne({ telegramId }).lean();
    if (!user) return;
    const current = user.dailyComboSpentDate === day ? (user.dailyComboSpentTodayAiba || 0) : 0;
    await User.updateOne(
        { telegramId },
        { $set: { dailyComboSpentTodayAiba: current + amount, dailyComboSpentDate: day } },
    );
}

module.exports = {
    utcDayKey,
    getStreakMultiplier,
    getBattleWinStreakBonusBps,
    updateLoginStreak,
    updateBattleWinStreak,
    resetBattleWinStreak,
    hasPremium,
    getRewardMultiplier,
    recordAibaSpendForDailyCombo,
};
