/**
 * Create Express app for API tests. Set APP_ENV=test before requiring so production checks are skipped.
 * Does NOT connect to DB — use for routes that don't touch the database (health, catalogs, university/courses).
 */
function getApp() {
    if (process.env.APP_ENV !== 'test') process.env.APP_ENV = 'test';
    const { createApp } = require('../../app');
    return createApp();
}

module.exports = { getApp };
