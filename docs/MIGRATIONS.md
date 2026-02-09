# Database Migrations

This project uses MongoDB. A migration runner is provided to run ordered migrations and record completion in the database.

## Migration runner

- **Script:** `scripts/run-migrations.js`
- **Migrations dir:** `backend/migrations/`
- **Tracking:** Completed migrations are stored in the `migration_runs` collection (field `migrationId`, `runAt`).

### Running migrations

From the **project root** with `MONGO_URI` (or `MONGODB_URI`) set:

```bash
node scripts/run-migrations.js
```

Or use the npm script (from project root):

```bash
npm run migrate
```

(Add to root `package.json`: `"migrate": "node scripts/run-migrations.js"` if desired.)

### Adding a migration

1. Add a new file in `backend/migrations/` with a **sorted filename** (e.g. `002_add_foo_index.js`).
2. Export a `run(mongoose)` function. The runner passes the same `mongoose` instance used to connect.

Example:

```js
// backend/migrations/002_add_foo_index.js
const SomeModel = require('../models/SomeModel');

async function run(mongoose) {
    await SomeModel.collection.createIndex({ foo: 1 });
}

module.exports = { run };
```

Migrations run in **filename order**. Already-run migrations (present in `migration_runs`) are skipped.

## Recommended approach

1. Add new fields with **backward‑compatible defaults**.
2. Deploy code that can read both old + new shapes.
3. Run the migration runner or a one‑off script.
4. Remove legacy fallbacks in a later release.

## One‑off scripts

For ad‑hoc changes you can still run a standalone script (e.g. from `scripts/`), then document it. Example:

```js
// scripts/migrate-add-battle-index.js
const mongoose = require('mongoose');
const Battle = require('../backend/models/Battle');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    await Battle.collection.createIndex({ ownerTelegramId: 1, createdAt: -1 });
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

Run: `node scripts/migrate-add-battle-index.js`

## Operational notes

- Always back up before running migrations.
- Prefer small, idempotent steps.
- Migration runner records migration IDs and execution timestamps in `migration_runs`.
