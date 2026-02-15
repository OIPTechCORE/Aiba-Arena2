# Deployment (Testnet baseline)

Legacy deployment overview. **See [DEPLOYMENT-AND-ENV.md](DEPLOYMENT-AND-ENV.md) for the current deployment and environment guide** (localhost, Vercel, Telegram, security, mainnet readiness).

---

## Components

- **Admin OS**: Next.js (`admin-panel/`) for operators

---

## Backend (Render/Railway)

**Minimum env for testnet**: `MONGO_URI`, `TELEGRAM_BOT_TOKEN`, Super Admin wallets, `TELEGRAM_INITDATA_MAX_AGE_SECONDS`, `BATTLE_SEED_SECRET`, `ADMIN_JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `CORS_ORIGIN` (required in prod).

**Monitoring**: `GET /health`, `GET /metrics` (Prometheus).

---

## Miniapp + Admin (Vercel)

See **DEPLOYMENT-AND-ENV.md** for full Vercel setup.
