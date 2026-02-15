# Operations — Runbook, monitoring, production readiness

Single doc for day-to-day ops: key management, incident response, monitoring, and production readiness status.

---

## 1. Production readiness status

**Summary:** Stack is **testnet/MVP-ready** with fail-fast checks. For **mainnet/production** you must: set all required env, use a secret manager, separate and rotate keys, and configure monitoring + backups.

| Area | Status | Action |
|------|--------|--------|
| Testnet / MVP | ✅ Ready | Backend, miniapp, admin; fail-fast in prod. |
| Prod env + CORS | 🔴 Required | Set in backend so it starts (see DEPLOYMENT-AND-ENV.md). |
| Keys & secrets | 🔴 Required | Separate keys; secret manager; rotate if exposed. |
| Ops (monitor/backup/runbook) | 🔴 Required | Monitoring, backups, runbook follow-through. |
| Rate limit (multi-instance) | 🟡 Recommended | Redis or shared store if multiple backend instances. |
| Signing isolation | 🟡 Recommended | Dedicated signer/KMS + allow-lists for claims. |

**What’s enforced at startup (`APP_ENV=prod`):** CORS, Telegram token + initData age, admin JWT + password hash, battle seed, vault/claim env (all-or-nothing, mainnet TON), no legacy pending-AIBA dispatch. See DEPLOYMENT-AND-ENV.md § Mainnet.

---

## 2. Key management

| Purpose | Env / asset | Notes |
|--------|-------------|--------|
| Contract deploy | (Blueprint wallet) | Separate from runtime; never in backend env |
| Reward-claim signer | `ORACLE_PRIVATE_KEY_HEX` | 64 hex chars; rotate via vault `set_oracle` + backend secret |
| Admin JWT | `ADMIN_JWT_SECRET` | ≥ 32 chars; rotate invalidates tokens |
| Admin login | `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` | Prefer bcrypt; no plaintext in prod |
| Telegram bot | `TELEGRAM_BOT_TOKEN` | Rotate in BotFather; update backend |
| Battle determinism | `BATTLE_SEED_SECRET` | ≥ 32 chars; changing changes seeds |
| TON wallets | `CREATED_BROKERS_WALLET`, `BOOST_*`, `GIFTS_WALLET`, etc. | Receive TON for features |

**Key rotation:** Rotate `BATTLE_SEED_SECRET`, `ADMIN_JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, `ORACLE_PRIVATE_KEY_HEX` (requires vault `set_oracle` + backend update). Document and rehearse oracle rotation.

**Oracle key rotation:** Update on-chain oracle key (`set_oracle`), update `ORACLE_PRIVATE_KEY_HEX` in secret manager, restart backend, verify `GET /api/vault/last-seqno`. Monitor claim failures and TON provider after.

---

## 3. Incident response

- **Health:** `GET /health`
- **Mongo:** Backend logs + connection status
- **TON:** `TON_PROVIDER_URL` / `TON_API_KEY` reachable
- **Claims failing:** `GET /api/vault/inventory`; `GET /api/vault/last-seqno?to=<addr>`
- **Battles failing:** Broker energy/cooldowns; `anomalyFlags` and bans

**Boot crash:** Check logs for “Production readiness checks failed” / “PROD_READINESS_FAILED”. Fix missing/unsafe env (see DEPLOYMENT-AND-ENV.md).

**Suspected oracle compromise:** Rotate `ORACLE_PRIVATE_KEY_HEX` and vault oracle on-chain ASAP; pause or rate-limit claims; audit logs; re-issue operator credentials.

**Admin auth compromise:** Rotate `ADMIN_JWT_SECRET` and admin password (`ADMIN_PASSWORD_HASH`).

**Telegram token compromise:** Rotate `TELEGRAM_BOT_TOKEN` in BotFather; update backend.

---

## 4. Monitoring and alerting

**Setup:** Log drain to a log platform; uptime checks for `GET /health`; Prometheus scraping for `GET /metrics`; TON provider error monitoring.

**Scripts:**

| Script | Purpose |
|--------|---------|
| `node scripts/health-check.js` | Basic health + metrics; exit 0/1 for CI/cron |
| `node scripts/health-check.js --vault` | Adds vault TON balance check |
| `node scripts/monitoring-check.js` | Full monitoring: health, expected metrics, optional vault |
| `node scripts/monitoring-check.js --vault --json` | JSON output for alerting pipelines |

**Cron example (every 5 min):**
```bash
*/5 * * * * cd /path/to/project && BACKEND_URL=https://api.example.com node scripts/monitoring-check.js --vault || echo "Monitoring check failed"
```

**Cron example (health-check, lighter weight):**
```bash
*/2 * * * * cd /path/to/project && BACKEND_URL=https://api.example.com node scripts/health-check.js || echo "Health check failed"
```

**Docs:** [BACKUP-RUNBOOK.md](BACKUP-RUNBOOK.md) — Backup and restore. [KEY-ROTATION.md](KEY-ROTATION.md) — Key rotation procedures.

**Metrics endpoint:** `GET /metrics` (Prometheus). Includes: `aiba_http_request_duration_seconds`, `aiba_battle_runs_total`, `aiba_battle_anomalies_total`, `aiba_auto_bans_total`, `aiba_economy_emissions_total`, `aiba_economy_sinks_total`, `aiba_economy_withdrawals_total`. Treasury: `GET /api/treasury/ops`.

**Suggested alerts:** Battle anomaly/auto-ban spikes; economy ledger anomalies; vault low TON/jettons; Mongo reconnects; API/battle error rate > threshold; rate limit 429 spikes.

**Thresholds (examples):** API error >5% over 10m; battle error >2%; vault TON below `MIN_VAULT_TON_NANO`; Mongo reconnects >3 in 5m.

---

## 5. Security checklist (pre-mainnet)

- [ ] Keys separated by purpose; no secrets in repo
- [ ] All prod env set; `APP_ENV=prod`; backend starts without PROD_READINESS_FAILED
- [ ] CORS set to production frontend URLs only
- [ ] Monitoring configured (scripts/health-check.js or scripts/monitoring-check.js via cron; see §4)
- [ ] Backups configured; restore tested (BACKUP-RUNBOOK.md)
- [ ] Runbook and security playbooks read and agreed
- [ ] `ENABLE_LEGACY_PENDING_AIBA_DISPATCH` not true in production

**Runbooks:** [BACKUP-RUNBOOK.md](BACKUP-RUNBOOK.md) (MongoDB, secrets, TON, code). [KEY-ROTATION.md](KEY-ROTATION.md) (Oracle, Admin JWT, Bot token, Battle seed).

**Data migrations:** Prefer additive schema changes; add indexes for new lookups; backfill idempotent and batched.
