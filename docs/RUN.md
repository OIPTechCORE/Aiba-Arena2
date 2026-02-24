# Quick run — Backend, Miniapp, Admin

Use **separate terminals** for each app. On **8 GB RAM**, running all three dev servers can cause out-of-memory (OOM). Run one at a time, or raise Node memory.

---

## Terminals

**Terminal 1 — Backend** (required for miniapp/admin):

```bash
cd backend
npm start
```

→ Backend: `http://localhost:5000`

---

**Terminal 2 — Miniapp**:

```bash
cd miniapp
npm run dev
```

→ Miniapp: `http://localhost:3000`

---

**Terminal 3 — Admin panel** (only if needed):

```bash
cd admin-panel
npm run dev
```

→ Admin: `http://localhost:3001`

---

## Low RAM (e.g. 8 GB)

Running all three in **dev** at once can OOM. Options:

1. **Run one at a time** — start backend, then miniapp (or admin) when you need it.
2. **Raise Node memory** before starting dev:
    ```bash
    set NODE_OPTIONS=--max-old-space-size=4096
    npm run dev
    ```
    (On macOS/Linux use `export NODE_OPTIONS=--max-old-space-size=4096`.)
3. **Use build + start instead of dev** for miniapp/admin (uses less memory than dev):
    ```bash
    cd miniapp
    npm run build
    npm run start
    ```
    Pre-built apps use less memory than `next dev` / dev servers.

---

## Build instead of dev (miniapp / admin)

If you only need to **run** the app (no hot reload):

```bash
cd miniapp
npm run build
npm run start
```

Same for admin-panel: `npm run build && npm run start`.

---

## Prerequisites

- **MongoDB** running (local or Atlas); set `MONGO_URI` in `backend/.env`.
- **backend/.env**: at least `MONGO_URI`, `APP_ENV=dev` (see [DEPLOYMENT-AND-ENV.md](DEPLOYMENT-AND-ENV.md)).
- **miniapp/.env.local**: `NEXT_PUBLIC_BACKEND_URL=http://localhost:5000`.

See [DEPLOYMENT-AND-ENV.md](DEPLOYMENT-AND-ENV.md) for full localhost setup and env checklist.
