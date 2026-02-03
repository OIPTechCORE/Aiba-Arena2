# Run Aiba-Arena2 on Localhost

This guide gets the **backend**, **miniapp**, and **admin panel** running on your machine. Nothing is omitted.

---

## Prerequisites

- **Node.js** 18+ (20 recommended). Check: `node -v`
- **npm** (comes with Node). Check: `npm -v`
- **MongoDB** running locally **or** a MongoDB Atlas connection string.
  - Local: install [MongoDB Community](https://www.mongodb.com/try/download/community) and start the service, or run `mongod` so it listens on `localhost:27017`.
  - Atlas: create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and copy the connection string.

---

## 1. Backend (API)

The backend serves the API at **http://localhost:5000**. The miniapp and admin panel call this URL when running locally.

### 1.1 Install and configure

```bash
cd backend
npm install
```

Create `backend/.env` from the example:

```bash
# From repo root:
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set at least:

| Variable | Value for localhost |
|----------|---------------------|
| **MONGO_URI** | `mongodb://localhost:27017/aiba_arena` (local) or your Atlas URI (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/aiba_arena`) |
| **APP_ENV** | `dev` (required for local: skips Telegram initData verification and production checks) |
| **CORS_ORIGIN** | Leave **empty** to allow all origins (localhost:3000, localhost:3001), or set `http://localhost:3000,http://localhost:3001` |
| **ADMIN_EMAIL** | Any email you use to log in to the admin panel (e.g. `admin@test.local`) |
| **ADMIN_PASSWORD** | Any password (only in dev; backend accepts plaintext when APP_ENV=dev and ADMIN_PASSWORD_HASH is empty) |

Optional for local: `ADMIN_JWT_SECRET`, `BATTLE_SEED_SECRET` — if unset, the example defaults may be used in dev (production readiness is skipped when APP_ENV=dev).

### 1.2 Start the backend

```bash
cd backend
npm start
```

You should see:

- `MongoDB Connected`
- `Server listening`

Check: open **http://localhost:5000/health** in a browser; you should get `{"ok":true}`.

Leave this terminal open. Use a **second terminal** for the miniapp.

---

## 2. Miniapp (Telegram Mini App)

The miniapp runs at **http://localhost:3000** and talks to the backend at http://localhost:5000.

### 2.1 Install and configure

```bash
cd miniapp
npm install
```

Optional: create `miniapp/.env.local` so the miniapp explicitly uses the local backend (it already defaults to `http://localhost:5000`):

```bash
# From repo root:
cp miniapp/.env.local.example miniapp/.env.local
```

`miniapp/.env.local` should contain:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

### 2.2 Start the miniapp

```bash
cd miniapp
npm run dev
```

Open **http://localhost:3000** in your browser.

**Local dev auth:** With `APP_ENV=dev`, the backend accepts the header `x-telegram-id` instead of Telegram initData. The miniapp sends this when running in the browser (see `miniapp/src/lib/api.js` and backend `requireTelegram`). You can use a test id (e.g. the app may send `local-dev` if no Telegram user is present).

---

## 3. Admin Panel

The admin panel runs at **http://localhost:3001** and uses the same backend.

### 3.1 Install and configure

```bash
cd admin-panel
npm install
```

Optional: create `admin-panel/.env.local`:

```bash
cp admin-panel/.env.local.example admin-panel/.env.local
```

Content:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

### 3.2 Start the admin panel

```bash
cd admin-panel
npm run dev
```

Open **http://localhost:3001**. Log in with the **ADMIN_EMAIL** and **ADMIN_PASSWORD** you set in `backend/.env`.

---

## 4. Summary: What runs where

| Service      | URL                     | Command (from its directory)   |
|-------------|-------------------------|---------------------------------|
| Backend     | http://localhost:5000   | `npm start`                     |
| Miniapp     | http://localhost:3000   | `npm run dev`                   |
| Admin panel | http://localhost:3001   | `npm run dev`                   |

Order: start **backend first**, then miniapp and admin (in any order).

---

## 5. Run everything from the repo root (optional)

From the project root you can start all three with one command (requires `concurrently`):

```bash
npm install
npm run dev
```

This runs:

- Backend on port 5000
- Miniapp on port 3000
- Admin panel on port 3001

You must still create `backend/.env` (and optionally `miniapp/.env.local`, `admin-panel/.env.local`) before running.

---

## 6. Troubleshooting

| Problem | What to do |
|--------|------------|
| Backend fails with "MONGO_URI not configured" | Create `backend/.env` from `backend/.env.example` and set `MONGO_URI`. |
| Backend fails with production readiness errors | Set `APP_ENV=dev` in `backend/.env`. |
| Miniapp/Admin shows "Backend unreachable" or CORS errors | Ensure backend is running on port 5000; with `APP_ENV=dev`, CORS allows all origins if `CORS_ORIGIN` is empty. |
| Admin login fails | Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` and use those to log in. |
| Port already in use | Change port: backend `PORT=5001` in `.env` (and set `NEXT_PUBLIC_BACKEND_URL=http://localhost:5001` in frontends); miniapp `npm run dev -- -p 3010`; admin `npm run dev -- -p 3011`. |

---

## 7. Optional: TonConnect and Telegram on localhost

- **TonConnect:** Works from localhost; the miniapp’s manifest is served at http://localhost:3000/api/tonconnect-manifest. Some wallets may require HTTPS in production; for local testing, HTTP is usually fine.
- **Telegram Mini App:** To test inside the real Telegram Mini App, use a tunnel (e.g. ngrok, localtunnel) to expose http://localhost:3000 via HTTPS and point your Telegram bot’s Mini App URL to that. With `APP_ENV=dev`, you can still test the app in a normal browser without Telegram.

You now have everything needed to run the project on localhost.
