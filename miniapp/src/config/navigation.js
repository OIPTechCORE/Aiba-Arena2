/**
 * AIBA Arena — Navigation & extensibility config
 *
 * RULE: When implementing a new feature, add a "NEW" badge to it in the UI.
 *
 * To add a new feature:
 * 1. Add id to HOME_GRID_IDS and/or TAB_IDS (below)
 * 2. Add icon in page.js ICON_MAP if new (reuse existing for known types)
 * 3. Add tab panel in page.js (tab === 'yourId')
 * 4. Add backend route/model if needed
 */
export const HOME_GRID_IDS = [
    'brokers', 'referrals', 'market', 'tournaments', 'globalBoss', 'arenas',
    'carRacing', 'bikeRacing', 'tasks', 'leaderboard',
    'multiverse', 'university', 'wallet', 'profile',
    'charity', 'realms', 'updates', 'settings',
];
export const TAB_IDS = [
    'home', 'referrals', 'profile', 'settings', 'tasks', 'leaderboard',
    'tournaments', 'globalBoss', 'brokers', 'market', 'carRacing', 'bikeRacing', 'multiverse', 'arenas',
    'guilds', 'charity', 'university', 'realms', 'assets', 'governance',
    'updates', 'wallet',
];
