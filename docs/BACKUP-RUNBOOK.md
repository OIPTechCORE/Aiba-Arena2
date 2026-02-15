# Backup Runbook — AIBA Arena

Procedures for backing up and restoring AIBA Arena data. Run these regularly and before major changes.

---

## 1. MongoDB

**Scope:** User data, brokers, battles, economy, guilds, referrals, trainers, staking, marketplace, etc.

### Backup (mongodump)

```bash
# Full dump to timestamped archive
mongodump \
  --uri="$MONGODB_URI" \
  --out=backups/mongodb-$(date +%Y%m%d-%H%M) \
  --gzip

# Or via env file
source .env
mongodump --uri="$MONGODB_URI" --out=backups/mongodb-$(date +%Y%m%d) --gzip
```

**Suggested schedule:** Daily (cron) or before deploys.

**Cron example (daily at 2:00 AM):**
```bash
0 2 * * * cd /path/to/aiba-arena && source .env 2>/dev/null; mongodump --uri="$MONGODB_URI" --out=backups/mongodb-$(date +\%Y\%m\%d) --gzip 2>/dev/null || true
```

### Restore

```bash
# Restore from specific dump
mongorestore \
  --uri="$MONGODB_URI" \
  --drop \
  --gzip \
  backups/mongodb-20250115-1200
```

**Note:** `--drop` drops existing collections first. Use without `--drop` for additive restore if needed.

---

## 2. Secrets & Keys

**Never commit secrets.** Store backups in a secure, encrypted location.

| Asset | Location | Backup |
|-------|----------|--------|
| `ORACLE_PRIVATE_KEY_HEX` | Secret manager / env | Export to encrypted vault; rotate if exposed |
| `ADMIN_JWT_SECRET` | Secret manager / env | Same |
| `ADMIN_PASSWORD_HASH` | Secret manager / env | Same |
| `TELEGRAM_BOT_TOKEN` | Secret manager / env | Same |
| `BATTLE_SEED_SECRET` | Secret manager / env | Same |
| TON wallet mnemonics | Secure storage | Encrypted backup; separate from runtime |

**Procedure:**
1. Export secrets from your secret manager (e.g. AWS Secrets Manager, HashiCorp Vault).
2. Store in encrypted archive (e.g. `gpg -c secrets-backup.env`).
3. Store archive in secure, off-site location.
4. Document restore process and key rotation (see KEY-ROTATION.md).

---

## 3. TON Contracts & Addresses

**Scope:** Deployed contract addresses, operator keys, vault config.

**What to back up:**
- `.env` or deployment config with contract addresses (AIBA token, vault, marketplace, etc.)
- Blueprint/deploy scripts output (addresses)
- Oracle/operator public keys

**Procedure:**
1. Export `*.env` (without secrets) or deployment manifest with addresses.
2. Version in private repo or secure doc.
3. After any redeploy, update and re-backup.

---

## 4. Application Code & Config

**Scope:** Backend, miniapp, admin, contracts source.

**Procedure:**
- Use Git. Tag releases (`v1.2.3`).
- Backup private repos to secondary provider or archive.
- Keep `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` in repo for reproducible installs.

---

## 5. Restore Priority

If disaster recovery is needed:

1. **MongoDB restore** — Restore from latest valid dump.
2. **Secrets restore** — Restore from encrypted backup; update secret manager.
3. **Code deploy** — Deploy from tagged release.
4. **Contracts** — If contracts unchanged, skip. If redeployed, update env and re-run migrations if any.

---

## 6. Verification

After restore:

- `GET /health` returns `{ ok: true }`
- `GET /metrics` returns Prometheus output
- Admin login works
- One battle run succeeds
- One claim/inventory check succeeds

Run: `node scripts/monitoring-check.js --vault` to validate.

---

## 7. References

- [OPERATIONS.md](OPERATIONS.md) — Ops overview, incident response
- [KEY-ROTATION.md](KEY-ROTATION.md) — Key rotation procedures
- [DEPLOYMENT-AND-ENV.md](DEPLOYMENT-AND-ENV.md) — Env and deployment
