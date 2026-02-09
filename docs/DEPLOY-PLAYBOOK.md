## Deploy Playbook (Vercel + MongoDB + Telegram + Localhost)

This playbook covers production deployment on Vercel, with MongoDB Atlas and Telegram bot setup, plus localhost development.

## 1) Security First (Required)

- Rotate all leaked secrets immediately (MongoDB user, Telegram bot token, TON keys, JWT secrets).
- Never commit `.env` files. Use `.env.example` templates only.
- Remove any committed `.env` file from git history (example commands below).

History cleanup (run from repo root):
```
git filter-repo --path backend/.env --invert-paths
git push --force --all
git push --force --tags
```
If `git filter-repo` is not available, use `git filter-branch` or BFG.

## 2) MongoDB Atlas (Production)

1. Create a MongoDB Atlas cluster.
2. Create a database user with strong password.
3. Add IP allowlist (Vercel IPs or 0.0.0.0/0 with TLS).
4. Copy the connection string to `MONGO_URI`.
5. Enable backups and verify restore.

## 3) Telegram Bot Setup

1. Create a bot via @BotFather.
2. Save `TELEGRAM_BOT_TOKEN`.
3. Configure the WebApp domain to match the miniapp domain.
4. Set `TELEGRAM_INITDATA_MAX_AGE_SECONDS` (recommended 300–900).

## 4) Vercel Deployment

### 4.1 Backend (Vercel Serverless)

Project root: `backend/`  
Entry point: `backend/api/index.js`  
Config: `backend/vercel.json`

Required env vars (prod):
- `APP_ENV=prod`
- `MONGO_URI`
- `CORS_ORIGIN` (comma-separated frontend URLs)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_INITDATA_MAX_AGE_SECONDS`
- `ADMIN_JWT_SECRET` (>=32 chars)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH` (bcrypt)
- `BATTLE_SEED_SECRET` (>=32 chars)

Optional wallets (features):
- `BOOST_TON_WALLET`, `LEADER_BOARD_WALLET`, `BOOST_GROUP_WALLET`, `CREATED_BROKERS_WALLET`, `BOOST_PROFILE_WALLET`
- `GIFTS_WALLET`, `STARS_STORE_WALLET`, `CAR_RACING_WALLET`, `MOTORCYCLE_RACING_WALLET`

Vault/claims (all-or-nothing):
- `ARENA_VAULT_ADDRESS`, `AIBA_JETTON_MASTER`, `ORACLE_PRIVATE_KEY_HEX` (or `ORACLE_SIGNER_URL` + `ORACLE_SIGNER_TOKEN`), `TON_PROVIDER_URL`, `TON_API_KEY`

Run predeploy checks:
```
npm run predeploy:check
```

### 4.2 Miniapp (Next.js)

Project root: `miniapp/`

Required env vars:
- `NEXT_PUBLIC_BACKEND_URL`

Optional:
- `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL`

### 4.3 Admin Panel (Next.js)

Project root: `admin-panel/`

Required env vars:
- `NEXT_PUBLIC_BACKEND_URL`

## 5) Localhost Development

1. Copy env templates:
   - `backend/.env.example` -> `backend/.env`
   - `miniapp/.env.example` -> `miniapp/.env.local` (if present)
   - `admin-panel/.env.example` -> `admin-panel/.env.local` (if present)
2. Update local variables (MongoDB, Telegram bot, etc.).
3. Run:
```
npm install
npm run dev
```
4. For HTTPS/Tunnel:
```
npm run tunnel
```

## 6) Hardening Checklist

- Use `APP_ENV=prod` in production.
- Keep `ADMIN_PASSWORD_HASH` only; remove `ADMIN_PASSWORD`.
- Verify production readiness checks at startup.
- Configure monitoring and uptime checks.
- Enable MongoDB backups.

## 7) Incident Checklist (Quick)

- Rotate any compromised tokens immediately.
- Re-deploy with new secrets.
- Audit logs and revoke old access.
