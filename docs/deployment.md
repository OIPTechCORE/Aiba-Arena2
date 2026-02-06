# Deployment (Testnet baseline)

## Components

- **Contracts**: compiled/deployed via Blueprint (`npm run build`, `npm run bp run ...`)
- **Backend**: Express — local/Render/Railway use `backend/server.js`; Vercel uses `backend/api/index.js` (serverless).
- **Miniapp**: Next.js (`miniapp/`) for Telegram Mini App
- **Admin OS**: Next.js (`admin-panel/`) for operators

## Backend (Render/Railway)

- **Start command**: `npm install && npm run start`
- **Root directory**: `backend/`
- **Required env**: copy from `backend/.env.example`

### Minimum env for testnet end-to-end

- `MONGO_URI` (local: `mongodb://localhost:27017/aiba_arena`; Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/aiba_arena?retryWrites=true&w=majority`)
- `TELEGRAM_BOT_TOKEN` (production Telegram auth and push notifications, e.g. battle win)
- `BOOST_TON_WALLET` (TON wallet address that receives boost payments; boost cost: Admin → Economy `boostCostTonNano`)
- `LEADER_BOARD_WALLET` (Super Admin: receives TON when users pay to create a group; cost: Admin → Economy `createGroupCostTonNano`, 1–10 TON)
- `BOOST_GROUP_WALLET` (Super Admin: receives TON when users boost a group; cost: Admin → Economy `boostGroupCostTonNano`, 1–10 TON)
- `CREATED_BROKERS_WALLET` (Super Admin: receives TON when users pay to create a broker; cost: Admin → Economy `createBrokerCostTonNano`, 1–10 TON; broker is auto-listed on marketplace)
- `BOOST_PROFILE_WALLET` (Super Admin: receives TON when users pay to boost their profile; cost: Admin → Economy `boostProfileCostTonNano`, 1–10 TON)
- `GIFTS_WALLET` (Super Admin: receives TON when users send a gift; cost: Admin → Economy `giftCostTonNano`, 1–10 TON)
- `STARS_STORE_WALLET` (Super Admin: receives TON when users buy Stars with TON; cost: Admin → Economy `starsStorePackPriceTonNano`)
- `CAR_RACING_WALLET` (Super Admin: receives TON when users create a car with TON; cost: Admin → Economy `createCarCostTonNano`, 1–10 TON)
- `MOTORCYCLE_RACING_WALLET` (Super Admin: receives TON when users create a bike with TON; cost: Admin → Economy `createBikeCostTonNano`, 1–10 TON)
- `TELEGRAM_INITDATA_MAX_AGE_SECONDS` (recommended 300–900; set explicitly for mainnet)
- `BATTLE_SEED_SECRET`
- `ADMIN_JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (required for production readiness checks; do not use plaintext password)
- Vault/claim reads:
    - `TON_PROVIDER_URL`
    - `TON_API_KEY`
    - `ARENA_VAULT_ADDRESS`
    - `AIBA_JETTON_MASTER`
    - `ORACLE_PRIVATE_KEY_HEX`

### Monitoring hooks

- Uptime: `GET /health`
- Metrics (Prometheus): `GET /metrics`

## Miniapp + Admin panel (Vercel)

- **Build**: `npm install && npm run build`
- **Output**: Next.js (Vercel handles)

### Env

- `NEXT_PUBLIC_BACKEND_URL` (both miniapp + admin-panel)
- Optional: `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` (miniapp; defaults to `/api/tonconnect-manifest`)
