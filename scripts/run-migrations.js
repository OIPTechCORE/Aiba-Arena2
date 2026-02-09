#!/usr/bin/env node
/**
 * Migration runner: runs backend/migrations/*.js in filename order.
 * Tracks completed migrations in MongoDB collection "migration_runs".
 * Usage: node scripts/run-migrations.js
 * Requires: MONGO_URI in env (or .env in backend/).
 */

const path = require('path');
const fs = require('fs');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'backend', 'migrations');
const COLLECTION = 'migration_runs';

async function main() {
    if (!(process.env.MONGO_URI || process.env.MONGODB_URI)) {
        try {
            require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
        } catch (_) {}
        if (!(process.env.MONGO_URI || process.env.MONGODB_URI)) {
            console.error('Set MONGO_URI or MONGODB_URI');
            process.exit(1);
        }
    }

    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

    const db = mongoose.connection.db;
    const runs = db.collection(COLLECTION);

    if (!fs.existsSync(MIGRATIONS_DIR)) {
        console.log('No migrations dir at', MIGRATIONS_DIR);
        await mongoose.disconnect();
        return;
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.js'))
        .sort();

    for (const file of files) {
        const migrationId = file.replace(/\.js$/, '');
        const existing = await runs.findOne({ migrationId });
        if (existing) {
            console.log('Skip (already run):', migrationId);
            continue;
        }

        console.log('Run:', migrationId);
        const mod = require(path.join(MIGRATIONS_DIR, file));
        const run = mod.run || mod.default;
        if (typeof run !== 'function') {
            console.error('Migration must export run(mongoose):', file);
            process.exit(1);
        }

        try {
            await run(mongoose);
            await runs.insertOne({
                migrationId,
                runAt: new Date(),
            });
            console.log('Done:', migrationId);
        } catch (err) {
            console.error('Migration failed:', migrationId, err);
            process.exit(1);
        }
    }

    await mongoose.disconnect();
    console.log('Migrations finished.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
