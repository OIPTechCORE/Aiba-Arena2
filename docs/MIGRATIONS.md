# Database Migrations

This project uses MongoDB. There is no migration runner by default, so schema changes must be coordinated explicitly.

## Recommended approach

1. Add new fields with **backward‑compatible defaults**.
2. Deploy code that can read both old + new shapes.
3. Run a one‑time migration script (below).
4. Remove legacy fallbacks in a later release.

## Suggested tooling

- **migrate-mongo** (recommended)
- **Custom Node script** in `scripts/` for one‑off migrations

## Example one‑off migration script

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

Run:
```
node scripts/migrate-add-battle-index.js
```

## Operational notes

- Always back up before running migrations.
- Prefer small, idempotent steps.
- Document migration IDs and execution timestamps.
