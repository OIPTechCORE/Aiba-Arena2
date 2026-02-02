# Ops Runbook

## Incident response (quick checklist)

- Verify backend health: `GET /health`
- Check Mongo connectivity (backend logs + connection status)
- Confirm TON provider is reachable (`TON_PROVIDER_URL` / `TON_API_KEY`)
- If claims fail:
    - Check vault TON balance and jetton inventory (`GET /api/vault/inventory`)
    - Check seqno tracking (`GET /api/vault/last-seqno?to=<addr>`)
- If battles are rate-limited or failing:
    - Inspect broker energy/cooldowns
    - Inspect `anomalyFlags` and bans

## Production safety checks (startup)

When `APP_ENV=prod` or `NODE_ENV=production`, the backend will **refuse to start** if critical security settings are missing or unsafe (see `backend/security/productionReadiness.js`). If a prod deploy is crashing at boot, check the logs for “Production readiness checks failed”.

## Key rotation

- Rotate `BATTLE_SEED_SECRET` (note: changes deterministic seeds going forward)
- Rotate `ADMIN_JWT_SECRET`
- Rotate `TELEGRAM_BOT_TOKEN` (Telegram bot)
- Review `TELEGRAM_INITDATA_MAX_AGE_SECONDS` (recommended 300–900s; must be set explicitly for mainnet)
- Rotate `ORACLE_PRIVATE_KEY_HEX` (reward claim signer)
    - Requires updating the vault oracle key on-chain (`set_oracle`) and backend env

### Rotation: reward-claim oracle key (`ORACLE_PRIVATE_KEY_HEX`)

- **Before rotation**
    - Ensure you can sign claims in an isolated environment (KMS/HSM or dedicated signer host)
    - Prepare a rollback key plan (time-boxed)
- **Rotate**
    - Update the on-chain oracle key (`set_oracle`) on the vault
    - Update backend secret (`ORACLE_PRIVATE_KEY_HEX`) in the secret manager
    - Restart backend and verify `GET /api/vault/last-seqno` works (TON provider healthy)
- **After rotation**
    - Monitor claim failures, seqno drift reports, and TON provider error rates
    - Audit access to the secret and rotate any operator credentials involved

## Security incidents (common playbooks)

### Suspected oracle key compromise

- **Immediate containment**
    - Rotate `ORACLE_PRIVATE_KEY_HEX` and update vault oracle key on-chain ASAP
    - Consider pausing or rate-limiting claims at the application layer (do not sign new claims)
    - Check logs for unusual claim amounts, bursty claims, or abnormal recipients
- **Follow-up**
    - Re-issue credentials for any operators/hosts that had access
    - Add allow-lists (vault address + jetton master + max amount + max claims/user/day) in the signing layer

### Suspected admin auth compromise

- Rotate `ADMIN_JWT_SECRET`
- Rotate admin password (update `ADMIN_PASSWORD_HASH`, remove plaintext `ADMIN_PASSWORD` in production)
- Audit admin actions via logs and ledger diffs

### Telegram token compromise

- Rotate `TELEGRAM_BOT_TOKEN`
- Review `TELEGRAM_INITDATA_MAX_AGE_SECONDS` and ensure it remains conservative

## Data migrations

- Prefer additive schema changes (new fields with defaults)
- Add indexes explicitly when introducing new lookup paths
- Backfill jobs should be idempotent and batched
