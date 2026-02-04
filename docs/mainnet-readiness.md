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

## Validation defaults (backend)

These defaults apply when env vars are unset; **production should set them explicitly** (enforced by production readiness checks where noted).

- **Telegram initData age** (`backend/security/telegramPolicy.js`)
    - When `TELEGRAM_INITDATA_MAX_AGE_SECONDS` is unset or invalid: **900 seconds** (15 minutes)
    - Production: **must be set explicitly** (fail-fast in `productionReadiness.js`); recommended 300–900 seconds
- **CORS**
    - When `CORS_ORIGIN` is unset: allow-all (insecure for prod)
    - Production: **must be set** to a comma-separated allow-list (fail-fast)
- **Admin auth**
    - Production: **ADMIN_PASSWORD_HASH** required; **ADMIN_PASSWORD** (plaintext) disallowed (fail-fast)
- **Battle seed**
    - Production: **BATTLE_SEED_SECRET** must be ≥ 32 chars, not dev placeholder (fail-fast)
- **Vault/claims**
    - When any of `ARENA_VAULT_ADDRESS`, `AIBA_JETTON_MASTER`, `ORACLE_PRIVATE_KEY_HEX` is set: all three required; **TON_PROVIDER_URL** required and must not be testnet (fail-fast)

## Stricter validations (backend)

- **Telegram auth**
    - Enforce `initData` verification on all user routes
    - Set `TELEGRAM_INITDATA_MAX_AGE_SECONDS` to a conservative value (recommended 300–900 seconds)
    - Default when unset is **900 seconds** (see `backend/security/telegramPolicy.js`); production must set explicitly
    - Disable any dev shortcuts on production (`APP_ENV` must not be `dev`/`test`; when `APP_ENV=dev`/`test`, prod checks are skipped)
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
- `TELEGRAM_BOT_TOKEN` (auth + push notifications)
- `BOOST_TON_WALLET` (optional; TON wallet for battle boost payments; cost set in Admin → Economy as `boostCostTonNano`)
- `CREATED_BROKERS_WALLET` (optional; TON wallet for create-broker-with-TON payments; cost `createBrokerCostTonNano`, 1–10 TON)
- `BOOST_PROFILE_WALLET` (optional; TON wallet for profile boost payments; cost `boostProfileCostTonNano`, 1–10 TON)
- `GIFTS_WALLET` (optional; TON wallet for gift payments; cost `giftCostTonNano`, 1–10 TON)
- `TELEGRAM_INITDATA_MAX_AGE_SECONDS` (set explicitly; do not rely on defaults)
- `BATTLE_SEED_SECRET` (must be a strong secret; never use dev defaults)
- `ADMIN_JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`
- Vault/claims:
    - `ARENA_VAULT_ADDRESS`
    - `AIBA_JETTON_MASTER`
    - `ORACLE_PRIVATE_KEY_HEX`
    - TON reads: `TON_PROVIDER_URL`, `TON_API_KEY`

## Checklist enforcement (fail-fast)

When `APP_ENV=prod` or `NODE_ENV=production`, the backend performs startup checks and **exits non-zero** if unsafe or missing configuration is detected (see `backend/security/productionReadiness.js`). When `APP_ENV=dev` or `APP_ENV=test`, production checks are **skipped** (allows staging/Vercel with incomplete prod env).

Enforced today:

- **Pinned CORS allow-list**
    - Requires `CORS_ORIGIN` (unset defaults to allow-all in code; prod fails without it)
- **Telegram replay/age protection**
    - Requires `TELEGRAM_INITDATA_MAX_AGE_SECONDS` to be set explicitly and \> 0
- **Admin auth hardening**
    - Requires `ADMIN_PASSWORD_HASH` (disallows relying on plaintext `ADMIN_PASSWORD`)
    - Blocks weak/placeholder `ADMIN_JWT_SECRET` (minimum 32 chars)
- **Deterministic battle secret**
    - Blocks dev/weak `BATTLE_SEED_SECRET` (minimum 32 chars)
- **Vault/claims config sanity**
    - Requires vault env to be “all-or-nothing” (`ARENA_VAULT_ADDRESS`, `AIBA_JETTON_MASTER`, `ORACLE_PRIVATE_KEY_HEX`)
    - Requires explicit `TON_PROVIDER_URL` and blocks obvious testnet endpoints when vault/claims are configured
    - Validates `ORACLE_PRIVATE_KEY_HEX` is 64 hex chars (32 bytes)
- **Legacy dispatch**
    - Blocks `ENABLE_LEGACY_PENDING_AIBA_DISPATCH=true` in production (signed claims only)

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
