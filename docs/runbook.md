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

## Key rotation

- Rotate `BATTLE_SEED_SECRET` (note: changes deterministic seeds going forward)
- Rotate `ADMIN_JWT_SECRET`
- Rotate `TELEGRAM_BOT_TOKEN` (Telegram bot)
- Review `TELEGRAM_INITDATA_MAX_AGE_SECONDS` (default 900s; set explicitly for mainnet)
- Rotate `ORACLE_PRIVATE_KEY_HEX` (reward claim signer)
    - Requires updating the vault oracle key on-chain (`set_oracle`) and backend env

## Data migrations

- Prefer additive schema changes (new fields with defaults)
- Add indexes explicitly when introducing new lookup paths
- Backfill jobs should be idempotent and batched
