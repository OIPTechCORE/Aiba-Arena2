# Mainnet Readiness Checklist

This checklist is the minimum bar before deploying Aiba Arena contracts and backend to mainnet.

## Key management

- **Separate keys by purpose**
    - Contract deployer key
    - Reward-claim signer/oracle key (`ORACLE_PRIVATE_KEY_HEX`)
    - Admin JWT signing secret (`ADMIN_JWT_SECRET`)
    - Telegram bot token (`TELEGRAM_BOT_TOKEN`)
- **Never store secrets in the repo**
    - Use a secret manager (Vercel/Render/Railway secrets, Vault, AWS/GCP secrets manager)
    - Rotate any keys that ever touched a developer machine
- **Signing isolation**
    - Move reward-claim signing behind a dedicated signing service or KMS/HSM
    - Enforce strict allow-lists (vault address, jetton master, max amount per claim, max claims per user/day)
- **Rotation plan**
    - Document and rehearse rotation for `ORACLE_PRIVATE_KEY_HEX` (requires updating oracle key on-chain)
    - Keep old key available for rollback only, time-boxed

## Stricter validations (backend)

- **Telegram auth**
    - Enforce `initData` verification on all user routes
    - Set `TELEGRAM_INITDATA_MAX_AGE_SECONDS` to a conservative value (recommended 300–900 seconds)
    - Default is **900 seconds** if not set (see `backend/security/telegramPolicy.js`)
    - Disable any dev shortcuts on production (`APP_ENV` must not be `dev`/`test`)
- **Input validation**
    - Validate all route inputs (types, bounds, enums) server-side
    - Reject unknown fields on admin PATCH/POST endpoints (avoid “silent config drift”)
        - Implemented for `PATCH /api/admin/economy/config` when `APP_ENV=prod` or `NODE_ENV=production`
- **Idempotency & replay protection**
    - Require idempotency keys for battle settlement and economy mutations
    - Ensure retries cannot double-charge or double-credit
        - Implemented for economy credits/debits by creating the ledger row first (duplicate-safe) and only applying balance/counter changes once
- **Rate limiting**
    - Replace in-memory rate limiting with a shared store (Redis) for multi-instance deployments

## Secrets & required production env (backend)

- `MONGO_URI`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_INITDATA_MAX_AGE_SECONDS` (set explicitly; do not rely on defaults)
- `BATTLE_SEED_SECRET` (must be a strong secret; never use dev defaults)
- `ADMIN_JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`
- Vault/claims:
    - `ARENA_VAULT_ADDRESS`
    - `AIBA_JETTON_MASTER`
    - `ORACLE_PRIVATE_KEY_HEX`
    - TON reads: `TON_PROVIDER_URL`, `TON_API_KEY`

## Security review steps

- **Contract review**
    - Vault claim verification invariants (recipient binding, seqno, expiry)
    - Marketplace escrow invariants (sender validation, refund paths, fee correctness)
    - NFT transfer callbacks and bounce handling
- **Backend review**
    - No secrets in logs
    - Strict CORS allow-list (`CORS_ORIGIN`) and `trust proxy` correctness
    - Admin auth hardening (password hashing parameters, token expiry, refresh strategy)
    - Database indexes for all high-volume queries
- **Operational readiness**
    - Monitoring and alerting configured (uptime `/health`, scraping `/metrics`, vault inventory checks)
    - Backups enabled (MongoDB Atlas snapshots) and restore tested
    - Runbook updated (`docs/runbook.md`)
