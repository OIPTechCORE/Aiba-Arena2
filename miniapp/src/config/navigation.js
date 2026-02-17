/**
 * AIBA Arena — Navigation & extensibility config
 *
 * RULE: When implementing a new feature, add a "NEW" badge to it in the UI.
 *
 * To add a new feature:
 * 1. Add id to HOME_GRID_IDS and/or TAB_IDS (below)
 * 2. Add icon in page.js (reuse existing Icon components)
 * 3. Add tab panel in page.js (tab === 'yourId')
 * 4. Add backend route/model if needed
 *
 * EXTERNAL_APPS: Other games/apps in the ecosystem (LoveBank-/Hamster-style hub).
 * Add entries to show in the "More games" tab. URL can be Telegram Mini App or web.
 */
export const HOME_GRID_IDS = [
    'brokers', 'arenas', 'memes', 'earn', 'market', 'tasks',
    'leaderboard', 'tournaments', 'globalBoss', 'predict', 'referrals',
    'carRacing', 'bikeRacing', 'guilds', 'trainers',
    'multiverse', 'nftGallery', 'coe', 'university', 'staking', 'wallet', 'profile',
    'charity', 'realms', 'assets', 'dao', 'governance', 'updates', 'settings', 'games',
];
export const TAB_IDS = [
    'home', 'brokers', 'arenas', 'memes', 'earn', 'market', 'tasks', 'leaderboard',
    'tournaments', 'globalBoss', 'predict', 'carRacing', 'bikeRacing',
    'referrals', 'trainers', 'guilds', 'multiverse', 'nftGallery', 'coe', 'university', 'staking', 'wallet',
    'profile', 'charity', 'realms', 'assets', 'dao', 'governance', 'updates', 'settings', 'games',
];

/** Other apps/games in the ecosystem — extensible hub (like LoveBank, Hamster Kombat). */
export const EXTERNAL_APPS = [
    // Example entries; add your other games/mini-apps here.
    // { id: 'other-game', name: 'Other Game', description: 'Short description.', url: 'https://t.me/YourBot/app' },
];
