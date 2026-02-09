/**
 * Ensures required indexes exist (idempotent).
 * Safe to run multiple times.
 */
const User = require('../models/User');
const Battle = require('../models/Battle');

async function run() {
    await User.collection.createIndex({ wallet: 1 }, { sparse: true });
    await Battle.collection.createIndex({ ownerTelegramId: 1, createdAt: -1 });
}

module.exports = { run };
