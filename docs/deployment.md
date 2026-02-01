# Deployment (Testnet baseline)

## Components

- **Contracts**: compiled/deployed via Blueprint (`npm run build`, `npm run bp run ...`)
- **Backend**: Express (`backend/server.js`)
- **Miniapp**: Next.js (`miniapp/`) for Telegram Mini App
- **Admin OS**: Next.js (`admin-panel/`) for operators

## Backend (Render/Railway)

- **Start command**: `npm install && npm run start`
- **Root directory**: `backend/`
- **Required env**: copy from `backend/.env.example`

### Minimum env for testnet end-to-end

- `MONGO_URI`
- `TELEGRAM_BOT_TOKEN` (production Telegram auth)
- `BATTLE_SEED_SECRET`
- `ADMIN_JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`
- Vault/claim reads:
  - `TON_PROVIDER_URL`
  - `TON_API_KEY`
  - `ARENA_VAULT_ADDRESS`
  - `AIBA_JETTON_MASTER`
  - `ORACLE_PRIVATE_KEY_HEX`

## Miniapp + Admin panel (Vercel)

- **Build**: `npm install && npm run build`
- **Output**: Next.js (Vercel handles)

### Env

- `NEXT_PUBLIC_BACKEND_URL` (both miniapp + admin-panel)
- Optional: `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` (miniapp; defaults to `/api/tonconnect-manifest`)

