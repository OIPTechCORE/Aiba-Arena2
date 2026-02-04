# Ops Runbook

## Key management summary

| Purpose | Env / asset | Notes |
|--------|-------------|--------|
| Contract deploy | (wallet/mnemonic used by Blueprint) | Separate from runtime; never in backend env |
| Reward-claim signer | `ORACLE_PRIVATE_KEY_HEX` | 32-byte seed (64 hex chars); rotate via vault `set_oracle` + backend secret |
| Admin JWT | `ADMIN_JWT_SECRET` | ≥ 32 chars; rotate invalidates existing tokens |
| Admin login | `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` | Prefer bcrypt hash; no plaintext in prod |
| Telegram bot | `TELEGRAM_BOT_TOKEN` | Rotate in BotFather; update backend secret |
| Battle determinism | `BATTLE_SEED_SECRET` | ≥ 32 chars; changing changes battle seeds |
| Super Admin TON wallets | `CREATED_BROKERS_WALLET`, `BOOST_PROFILE_WALLET`, `GIFTS_WALLET`, `LEADER_BOARD_WALLET`, `BOOST_GROUP_WALLET`, `BOOST_TON_WALLET` | Receive TON for create broker, profile boost, gifts, guild create/boost, battle boost; see MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md |

**Validation defaults:** When env vars are unset, backend uses defaults (e.g. Telegram initData age 900s, CORS allow-all). Production readiness checks **require** explicit values for CORS, Telegram age, admin hash, battle seed, and (when vault/claims are used) vault env and TON provider. See `docs/mainnet-readiness.md` (“Validation defaults” and “Checklist enforcement”).

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

When `APP_ENV=prod` or `NODE_ENV=production`, the backend will **refuse to start** if critical security settings are missing or unsafe (see `backend/security/productionReadiness.js`). If a prod deploy is crashing at boot, check the logs for “Production readiness checks failed” or “PROD_READINESS_FAILED”. Enforced items include: CORS, Telegram token and initData max age, admin JWT/password hash, battle seed, vault/claim env (all-or-nothing + non-testnet TON URL), and no legacy pending-AIBA dispatch. When `APP_ENV=dev` or `APP_ENV=test`, these checks are skipped.

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

## Security checklist (pre-mainnet)

- [ ] All keys separated by purpose (see Key management summary); no secrets in repo
- [ ] Production readiness enforced: `APP_ENV=prod` or `NODE_ENV=production` with full env (see `docs/mainnet-readiness.md`)
- [ ] CORS, Telegram initData age, admin hash, battle seed, vault/TON env set explicitly
- [ ] `ENABLE_LEGACY_PENDING_AIBA_DISPATCH` not set to `true` in production
- [ ] Monitoring and backups configured per `docs/monitoring.md` and runbook
